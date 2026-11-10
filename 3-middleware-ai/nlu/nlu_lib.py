"""Hàm dùng chung cho NLU: chuẩn hóa tiếng Việt, tách từ, nhãn BIO, đọc số tiền, baseline từ điển."""
from __future__ import annotations

import csv
import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

INTENTS = ["hoi_gia", "tu_van", "so_sanh", "tra_don", "bao_hanh", "khieu_nai", "khac"]
ENTITY_TYPES = ["SAN_PHAM", "HANG", "LOAI", "NGAN_SACH", "MAU", "DUNG_LUONG", "MA_DON"]
BIO_LABELS = ["O"] + [f"{p}-{t}" for t in ENTITY_TYPES for p in ("B", "I")]


def normalize(text: str) -> str:
    """NFC, gộp khoảng trắng. Không đổi chữ hoa/thường để giữ nguyên cách khách gõ."""
    text = unicodedata.normalize("NFC", text)
    return re.sub(r"\s+", " ", text).strip()


def _strip_char(ch: str) -> str:
    if ch == "đ":
        return "d"
    if ch == "Đ":
        return "D"
    base = "".join(c for c in unicodedata.normalize("NFD", ch) if not unicodedata.combining(c))
    return unicodedata.normalize("NFC", base) or ch


def strip_diacritics(text: str) -> str:
    """Bỏ dấu tiếng Việt, giữ nguyên độ dài chuỗi (mỗi ký tự đổi thành đúng một ký tự)."""
    return "".join(_strip_char(c) for c in text)


def fold(text: str) -> str:
    """Dạng so khớp: chữ thường, không dấu. Giữ nguyên độ dài để map vị trí."""
    return strip_diacritics(text).lower()


MARKUP_RE = re.compile(r"\[([^\[\]]+?)\]\(([A-Z_]+)\)")


def parse_markup(s: str) -> tuple[str, list[dict]]:
    """Tách cú pháp [chữ](NHÃN) thành câu thường và danh sách thực thể."""
    s = normalize(s)
    text_parts, entities, pos, cursor = [], [], 0, 0
    for m in MARKUP_RE.finditer(s):
        label = m.group(2)
        if label not in ENTITY_TYPES:
            raise ValueError(f"Nhãn lạ '{label}' (hợp lệ: {', '.join(ENTITY_TYPES)})")
        before = s[cursor:m.start()]
        if "[" in before or "]" in before:
            raise ValueError(f"Dấu ngoặc vuông không khớp gần: {before!r}")
        text_parts.append(before)
        pos += len(before)
        value = m.group(1).strip()
        if not value:
            raise ValueError("Thực thể rỗng")
        entities.append({"start": pos, "end": pos + len(value), "label": label, "text": value})
        text_parts.append(value)
        pos += len(value)
        cursor = m.end()
    tail = s[cursor:]
    if "[" in tail or "](" in tail:
        raise ValueError(f"Cú pháp [chữ](NHÃN) sai gần: {tail!r}")
    text_parts.append(tail)
    text = "".join(text_parts)
    for e in entities:
        assert text[e["start"]:e["end"]] == e["text"]
    return text, entities


def to_markup(text: str, entities: list[dict]) -> str:
    out, cursor = [], 0
    for e in sorted(entities, key=lambda x: x["start"]):
        out.append(text[cursor:e["start"]])
        out.append(f"[{text[e['start']:e['end']]}]({e['label']})")
        cursor = e["end"]
    out.append(text[cursor:])
    return "".join(out)


SYLLABLE_RE = re.compile(r"\w+(?:[.,]\w+)*|[^\w\s]")


def syllables(text: str) -> list[tuple[str, int, int]]:
    return [(m.group(), m.start(), m.end()) for m in SYLLABLE_RE.finditer(text)]


_word_tokenize = None


def _get_segmenter():
    global _word_tokenize
    if _word_tokenize is None:
        try:
            from underthesea import word_tokenize
            _word_tokenize = word_tokenize
        except Exception:
            _word_tokenize = False
    return _word_tokenize


def segment(text: str, use_segmenter: bool = True) -> list[tuple[str, int, int, list[tuple[str, int, int]]]]:
    """Tách từ tiếng Việt, giữ vị trí ký tự."""
    sylls = syllables(text)
    groups: list[list[tuple[str, int, int]]] = [[s] for s in sylls]
    seg = _get_segmenter() if use_segmenter else False
    if seg and sylls:
        try:
            groups = _group_by_words(text, sylls, seg(text))
        except Exception:
            pass
    return [("_".join(s[0] for s in g), g[0][1], g[-1][2], g) for g in groups]


def _group_by_words(text, sylls, words):
    """Gộp âm tiết theo từ của underthesea, gióng bằng vị trí ký tự."""
    spans, cursor = [], 0
    for w in words:
        pat = r"\s*".join(re.escape(p) for p in w.split())
        m = re.compile(pat).search(text, cursor)
        if not m:
            raise ValueError(f"không tìm thấy {w!r}")
        spans.append((m.start(), m.end()))
        cursor = m.end()

    def word_at(pos):
        for i, (s, e) in enumerate(spans):
            if s <= pos < e:
                return i
        raise ValueError(f"vị trí {pos} không thuộc từ nào")

    groups, last_word = [], -1
    for syl in sylls:
        first, last = word_at(syl[1]), word_at(syl[2] - 1)
        if groups and first <= last_word:
            groups[-1].append(syl)
        else:
            groups.append([syl])
        last_word = max(last_word, last)
    return groups


def to_bio(text: str, entities: list[dict], use_segmenter: bool = True):
    """Gán nhãn BIO theo từ. Từ ghép nào cắt ngang ranh giới thực thể thì tách lại thành âm tiết."""
    words = []
    for w in segment(text, use_segmenter):
        crosses = any(
            (w[1] < e["start"] < w[2]) or (w[1] < e["end"] < w[2]) for e in entities
        )
        if crosses:
            words.extend((s[0], s[1], s[2], [s]) for s in w[3])
        else:
            words.append(w)
    labels = []
    for _, ws, we, _ in words:
        lab = "O"
        for e in entities:
            if ws >= e["start"] and we <= e["end"]:
                lab = ("B-" if ws == e["start"] else "I-") + e["label"]
                break
        labels.append(lab)
    tokens = [w[0] for w in words]
    spans = [(w[1], w[2]) for w in words]
    return tokens, labels, spans


def spans_to_labels(spans: list[tuple[int, int]], entities: list[dict]) -> list[str]:
    """Nhãn BIO cho các từ có sẵn vị trí (vd từ của nhãn đúng), từ thực thể dự đoán."""
    labels = []
    for ws, we in spans:
        lab = "O"
        for e in entities:
            if ws >= e["start"] and we <= e["end"]:
                lab = ("B-" if ws == e["start"] else "I-") + e["label"]
                break
        labels.append(lab)
    return labels


def bio_to_entities(text: str, spans: list[tuple[int, int]], labels: list[str]) -> list[dict]:
    """Ghép nhãn BIO theo từ thành thực thể theo vị trí ký tự."""
    ents, cur = [], None
    for (s, e), lab in zip(spans, labels):
        if lab.startswith("B-") or (lab.startswith("I-") and (cur is None or cur["label"] != lab[2:])):
            if cur:
                ents.append(cur)
            cur = {"start": s, "end": e, "label": lab[2:]}
        elif lab.startswith("I-") and cur:
            cur["end"] = e
        else:
            if cur:
                ents.append(cur)
            cur = None
    if cur:
        ents.append(cur)
    for x in ents:
        x["text"] = text[x["start"]:x["end"]]
    return ents


def segmented_text(text: str, use_segmenter: bool = True) -> str:
    """Câu đã tách từ cho PhoBERT phân loại ý định, vd 'sạc anker giá bao_nhiêu ?'."""
    return " ".join(w[0] for w in segment(normalize(text), use_segmenter))


_MONEY_RE = re.compile(
    r"(?P<num>\d+(?:[.,]\d+)*)\s*"
    r"(?P<unit>triệu|trieu|tr|củ|cu|m|nghìn|nghin|ngàn|ngan|k|vnđ|vnd|đồng|dong|đ|d)?"
    r"\s*(?P<rest>\d+|rưỡi|ruoi)?",
    re.IGNORECASE,
)


def parse_money(s: str) -> int | None:
    """Đọc số tiền tiếng Việt ra VND, vd '2tr5' -> 2500000, '500k' -> 500000."""
    m = _MONEY_RE.search(fold(normalize(s)))
    if not m:
        return None
    num, unit, rest = m.group("num"), (m.group("unit") or "").lower(), (m.group("rest") or "").lower()
    unit = fold(unit)
    if unit in ("trieu", "tr", "cu", "m"):
        base = float(num.replace(",", "."))
        value = base * 1_000_000
        if rest in ("ruoi",):
            value += 500_000
        elif rest.isdigit():
            value += float("0." + rest) * 1_000_000
        return int(round(value))
    if unit in ("nghin", "ngan", "k"):
        return int(round(float(num.replace(",", ".")) * 1000))
    digits = re.sub(r"[.,]", "", num)
    if not digits:
        return None
    value = int(digits)
    if unit in ("vnd", "dong", "d") or value >= 10_000:
        return value
    return value * 1000


@dataclass
class Product:
    sku: str
    name: str
    brand: str
    category: str
    price: int
    colors: list[str]
    capacity: str
    aliases: list[str]


def load_catalog(path: str | Path) -> list[Product]:
    rows = []
    with open(path, encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            split = lambda v: [x.strip() for x in (v or "").split("|") if x.strip()]
            rows.append(Product(
                sku=r["sku"].strip(), name=r["name"].strip(), brand=r["brand"].strip(),
                category=r["category"].strip(), price=int(r["price"]), colors=split(r.get("colors")),
                capacity=(r.get("capacity") or "").strip(), aliases=split(r.get("aliases")),
            ))
    return rows


class GazetteerNER:
    """Baseline trích thực thể bằng từ điển (tên trong catalog) + biểu thức chính quy."""

    MONEY = re.compile(r"\b\d+(?:[.,]\d+)*\s*(?:trieu|tr|cu|k|nghin|ngan|vnd|dong|d)(?:\s*(?:\d+|ruoi)\b)?", re.I)
    ORDER = re.compile(r"\b\d{15,20}\b")
    CAPACITY = re.compile(r"\b\d+(?:[.,]\d+)?\s*(?:gb|tb|mah|w|m)\b", re.I)

    def __init__(self, products: list[Product], extra_categories=(), extra_colors=(), extra_brands=(),
                 extra_products=()):
        phrases: dict[str, str] = {}
        for name in extra_products:
            phrases[fold(normalize(name))] = "SAN_PHAM"
        for p in products:
            for name in [p.name, *p.aliases]:
                phrases[fold(normalize(name))] = "SAN_PHAM"
            phrases.setdefault(fold(p.brand), "HANG")
            phrases.setdefault(fold(p.category), "LOAI")
            for c in p.colors:
                phrases.setdefault(fold(c), "MAU")
        for c in extra_categories:
            phrases.setdefault(fold(c), "LOAI")
        for c in extra_colors:
            phrases.setdefault(fold(c), "MAU")
        for b in extra_brands:
            phrases.setdefault(fold(b), "HANG")
        self.phrases = sorted(phrases.items(), key=lambda kv: -len(kv[0]))

    def predict(self, text: str) -> list[dict]:
        t = fold(text)
        taken = [False] * len(t)
        ents = []

        def add(s, e, label):
            if any(taken[s:e]):
                return
            ents.append({"start": s, "end": e, "label": label, "text": text[s:e]})
            for i in range(s, e):
                taken[i] = True

        for m in self.ORDER.finditer(t):
            add(m.start(), m.end(), "MA_DON")
        for phrase, label in self.phrases:
            if not phrase:
                continue
            for m in re.finditer(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", t):
                add(m.start(), m.end(), label)
        for m in self.MONEY.finditer(t):
            add(m.start(), m.end(), "NGAN_SACH")
        for m in self.CAPACITY.finditer(t):
            add(m.start(), m.end(), "DUNG_LUONG")
        return sorted(ents, key=lambda e: e["start"])


def read_jsonl(path: str | Path) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def write_jsonl(path: str | Path, rows: list[dict]) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def encode_ner_example(tokenizer, tokens: list[str], labels: list[str] | None, label2id: dict, max_len: int = 128):
    """Mã hóa một câu cho token classification, tự gióng nhãn (tokenizer PhoBERT không có word_ids)."""
    ids, lab, word_index = [tokenizer.cls_token_id], [-100], [-1]
    for wi, tok in enumerate(tokens):
        pieces = tokenizer.tokenize(tok) or [tokenizer.unk_token]
        pids = tokenizer.convert_tokens_to_ids(pieces)
        if len(ids) + len(pids) >= max_len - 1:
            break
        ids.extend(pids)
        lab.extend([label2id[labels[wi]] if labels else -100] + [-100] * (len(pids) - 1))
        word_index.extend([wi] + [-1] * (len(pids) - 1))
    ids.append(tokenizer.sep_token_id)
    lab.append(-100)
    word_index.append(-1)
    out = {"input_ids": ids, "attention_mask": [1] * len(ids), "word_index": word_index}
    if labels is not None:
        out["labels"] = lab
    return out
