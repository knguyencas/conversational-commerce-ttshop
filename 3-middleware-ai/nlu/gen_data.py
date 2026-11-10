"""Sinh dữ liệu NLU có gán nhãn sẵn từ mẫu câu (templates_vi.py) và catalog sản phẩm."""
from __future__ import annotations

import argparse
import json
import random
import re
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import nlu_lib as L
import templates_vi as T

SLOT_RE = re.compile(r"\{([A-Z_0-9]+)\}")
BUDGETS = [100_000, 150_000, 200_000, 300_000, 400_000, 500_000, 700_000, 800_000, 1_000_000,
           1_500_000, 2_000_000, 2_500_000, 3_000_000, 4_000_000, 5_000_000, 6_500_000,
           7_000_000, 10_000_000, 12_000_000, 15_000_000, 20_000_000]


def money_surfaces(v: int) -> list[str]:
    out = []
    if v < 1_000_000:
        k = v // 1000
        out += [f"{k}k", f"{k}k", f"{k} nghìn", f"{k} ngàn", f"{v:,}".replace(",", ".") + "đ", f"{k}K"]
    else:
        m, rem = divmod(v, 1_000_000)
        if rem == 0:
            out += [f"{m}tr", f"{m} triệu", f"{m} củ", f"{m}.000.000đ", f"{m} triệu", f"{m}m"]
        elif rem == 500_000:
            out += [f"{m}tr5", f"{m} triệu rưỡi", f"{m},5 triệu", f"{m}tr5", f"{v // 1000}k"]
        else:
            out += [f"{v:,}".replace(",", ".") + "đ"]
    return [s for s in out if L.parse_money(s) == v]


def apply_teencode(rng: random.Random, s: str) -> str:
    for key in sorted(T.TEENCODE, key=len, reverse=True):
        if rng.random() < 0.5:
            choices = T.TEENCODE[key]
            s = re.sub(r"(?<!\w)" + re.escape(key) + r"(?!\w)",
                       lambda _m: rng.choice(choices), s, flags=re.IGNORECASE)
    return s


class Generator:
    def __init__(self, products: list[L.Product], rng: random.Random):
        self.products = products
        self.rng = rng
        self.brands = sorted({p.brand for p in products} | set(T.EXTRA_BRANDS))
        self.categories = sorted({p.category for p in products} | set(T.EXTRA_CATEGORIES))
        self.colors = sorted({c for p in products for c in p.colors} | set(T.EXTRA_COLORS))
        self.capacities = sorted({p.capacity for p in products if p.capacity} | set(T.EXTRA_CAPACITIES))

    def product_name(self, p: L.Product) -> str:
        name = self.rng.choice([p.name, *p.aliases, *p.aliases])
        return name if self.rng.random() < 0.4 else name.lower()

    def fill(self, template: str, intent: str):
        rng = self.rng
        style = {
            "lower": rng.random() < 0.6,
            "nodiac": rng.random() < 0.25,
            "teen": rng.random() < 0.35,
        }
        used_products: list[L.Product] = []
        used_values: dict[str, set] = {}
        ctx: dict[str, L.Product | None] = {"product": None}

        def context_product() -> L.Product | None:
            return used_products[-1] if used_products else ctx["product"]

        def pick(slot: str) -> tuple[str, str | None, dict]:
            """Trả (chữ, nhãn hoặc None nếu là chữ thường, thông tin thêm)."""
            if slot in ("SAN_PHAM", "SAN_PHAM2"):
                pool = [p for p in self.products if p not in used_products] or self.products
                if slot == "SAN_PHAM2" and used_products:
                    same = [p for p in pool if p.category == used_products[0].category]
                    pool = same or pool
                p = rng.choice(pool)
                used_products.append(p)
                return self.product_name(p), "SAN_PHAM", {"sku": p.sku}
            if slot == "MAU":
                p = context_product()
                cols = p.colors if p and p.colors else self.colors
                return rng.choice(cols), "MAU", {}
            if slot == "DUNG_LUONG":
                p = context_product()
                if p and not p.capacity:
                    with_cap = [q for q in self.products if q.capacity and q.category == p.category]
                    p = rng.choice(with_cap) if with_cap else None
                cap = p.capacity if p and p.capacity else rng.choice(self.capacities)
                return (cap.lower() if rng.random() < 0.6 else cap), "DUNG_LUONG", {}
            if slot == "LOAI":
                if ctx["product"] is None and rng.random() < 0.75:
                    ctx["product"] = rng.choice(self.products)
                    return ctx["product"].category, "LOAI", {}
                return rng.choice(self.categories), "LOAI", {}
            if slot == "HANG":
                seen = used_values.setdefault("HANG", set())
                p = context_product()
                if p and p.brand not in seen and rng.random() < 0.7:
                    seen.add(p.brand)
                    return (p.brand.lower() if rng.random() < 0.6 else p.brand), "HANG", {}
                options = [b for b in self.brands if b not in seen] or self.brands
                b = rng.choice(options)
                seen.add(b)
                return (b.lower() if rng.random() < 0.6 else b), "HANG", {}
            if slot == "NGAN_SACH":
                v = rng.choice(BUDGETS)
                return rng.choice(money_surfaces(v)), "NGAN_SACH", {"value": v}
            if slot == "MA_DON":
                return str(rng.randint(576_000_000_000_000_000, 589_999_999_999_999_999)), "MA_DON", {}
            if slot == "THIET_BI":
                d = rng.choice(T.DEVICES)
                return (d if rng.random() < 0.7 else d.title()), "SAN_PHAM", {}
            if slot == "HANG_DT":
                b = rng.choice(T.PHONE_BRANDS)
                return (b if rng.random() < 0.7 else b.capitalize()), "HANG", {}
            if slot == "LOAI_AM":
                return rng.choice(T.AUDIO_CATEGORIES), "LOAI", {}
            if slot == "NOI":
                return rng.choice(T.PLACES), None, {}
            raise KeyError(f"ô lạ {{{slot}}} trong mẫu: {template}")

        def literal(s: str) -> str:
            if style["teen"]:
                s = apply_teencode(rng, s)
            if style["lower"]:
                s = s.lower()
            if style["nodiac"]:
                s = L.strip_diacritics(s)
            return s

        def entity(s: str) -> str:
            if style["lower"]:
                s = s.lower()
            if style["nodiac"]:
                s = L.strip_diacritics(s)
            return s

        pieces: list[tuple[str, dict | None]] = []
        first_word = template.split()[0].lower() if template.split() else ""
        if intent != "khac" and first_word not in ("shop", "ad", "chào", "cho", "dạ", "alo"):
            prefixes = T.PREFIXES
            if intent == "khieu_nai":
                prefixes = [p for p in prefixes if "hỏi" not in p]
            pieces.append((literal(rng.choice(prefixes)), None))
        cursor = 0
        for m in SLOT_RE.finditer(template):
            pieces.append((literal(template[cursor:m.start()]), None))
            value, label, extra = pick(m.group(1))
            if label is None:
                pieces.append((literal(value), None))
            else:
                if label == "MA_DON" and rng.random() < 0.2:
                    pieces.append(("#", None))
                pieces.append((entity(value), {"label": label, **extra}))
            cursor = m.end()
        pieces.append((literal(template[cursor:]), None))
        last_word = re.sub(r"[^\w]", "", template.split()[-1].lower()) if template.split() else ""
        if last_word in ("ạ", "shop", "nha", "với", "vậy", "ad", "ơi", "không", "đó", "đây") or template.endswith("?"):
            suffix = rng.choice(["", "", "?"]) if not template.endswith("?") else ""
        else:
            suffix = rng.choice(T.SUFFIXES)
            if intent in ("khac", "khieu_nai") and suffix.strip() in ("với", "?", "??", "ạ?"):
                suffix = ""
        pieces.append((literal(suffix), None))

        text, ents = "", []
        for s, meta in pieces:
            if meta is not None:
                ents.append({"start": len(text), "end": len(text) + len(s), **meta})
            text += s
        text, ents = _tidy(text, ents)
        if not style["lower"] and text and rng.random() < 0.5:
            text = text[0].upper() + text[1:]
        for e in ents:
            e["text"] = text[e["start"]:e["end"]]
        return text, ents


def _tidy(text: str, ents: list[dict]):
    keep = []
    for i, ch in enumerate(text):
        drop = ch == " " and (i == 0 or text[i - 1] == " " or i == len(text) - 1)
        keep.append(not drop)
    for i, ch in enumerate(text):
        if ch == " " and i + 1 < len(text) and text[i + 1] == "?":
            keep[i] = False
    new_index, j = [], 0
    for k in keep:
        new_index.append(j)
        j += 1 if k else 0
    new_index.append(j)
    out = "".join(ch for ch, k in zip(text, keep) if k)
    for e in ents:
        e["start"], e["end"] = new_index[e["start"]], new_index[e["end"]]
    return out.strip(), ents


def split_list(rng: random.Random, items: list, dev_frac: float, min_dev: int = 2):
    items = list(items)
    rng.shuffle(items)
    n_dev = max(min_dev, round(len(items) * dev_frac))
    return items[n_dev:], items[:n_dev]


def generate(gen: Generator, templates: list[tuple[int, str]], intent: str, n: int, split: str, seen: set):
    rows, tries = [], 0
    while len(rows) < n and tries < n * 30:
        tries += 1
        tid, tpl = gen.rng.choice(templates)
        text, ents = gen.fill(tpl, intent)
        if not text or text.lower() in seen:
            continue
        seen.add(text.lower())
        rows.append({
            "id": f"{split}-{intent}-{len(rows):04d}",
            "text": text,
            "intent": intent,
            "entities": ents,
            "markup": L.to_markup(text, ents),
            "source": "template",
            "template_id": f"{intent}#{tid}",
        })
    return rows


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--catalog", default=str(HERE / "data" / "catalog.csv"))
    ap.add_argument("--out", default=str(HERE / "data" / "generated"))
    ap.add_argument("--per-intent", type=int, default=300, help="số câu train mỗi ý định")
    ap.add_argument("--dev-per-intent", type=int, default=80, help="số câu dev mỗi ý định")
    ap.add_argument("--dev-template-frac", type=float, default=0.2)
    ap.add_argument("--dev-product-frac", type=float, default=0.2)
    ap.add_argument("--seed", type=int, default=13)
    args = ap.parse_args()
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")

    rng = random.Random(args.seed)
    products = L.load_catalog(args.catalog)
    train_products, dev_products = split_list(rng, products, args.dev_product_frac)

    train_rows, dev_rows, tpl_split, seen = [], [], {}, set()
    for intent in L.INTENTS:
        tpls = list(enumerate(T.TEMPLATES[intent]))
        tr_tpl, dv_tpl = split_list(rng, tpls, args.dev_template_frac)
        tpl_split[intent] = {"train": sorted(t for t, _ in tr_tpl), "dev": sorted(t for t, _ in dv_tpl)}
        train_rows += generate(Generator(train_products, rng), tr_tpl, intent, args.per_intent, "train", seen)
        dev_rows += generate(Generator(dev_products, rng), dv_tpl, intent, args.dev_per_intent, "dev", seen)

    rng.shuffle(train_rows)
    out = Path(args.out)
    L.write_jsonl(out / "train.jsonl", train_rows)
    L.write_jsonl(out / "dev.jsonl", dev_rows)
    meta = {
        "seed": args.seed,
        "catalog": Path(args.catalog).name,
        "train_products": [p.sku for p in train_products],
        "dev_products": [p.sku for p in dev_products],
        "templates": tpl_split,
        "counts": {
            "train": Counter(r["intent"] for r in train_rows),
            "dev": Counter(r["intent"] for r in dev_rows),
        },
        "entity_counts": {
            "train": Counter(e["label"] for r in train_rows for e in r["entities"]),
            "dev": Counter(e["label"] for r in dev_rows for e in r["entities"]),
        },
    }
    (out / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"train: {len(train_rows)} câu, dev: {len(dev_rows)} câu -> {out}")
    print("số câu mỗi ý định (train):", dict(meta["counts"]["train"]))
    print("số thực thể (train):", dict(meta["entity_counts"]["train"]))
    print(f"sản phẩm chỉ có ở dev: {', '.join(meta['dev_products'])}")


if __name__ == "__main__":
    main()
