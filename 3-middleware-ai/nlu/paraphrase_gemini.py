"""(Tùy chọn) Nhờ Gemini viết thêm cách nói khác cho dữ liệu train, giữ nguyên nhãn."""
from __future__ import annotations

import argparse
import json
import os
import random
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import nlu_lib as L

API = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

INTENT_VI = {
    "hoi_gia": "hỏi giá, còn hàng, thông số của một sản phẩm cụ thể",
    "tu_van": "nhờ tư vấn chọn sản phẩm theo nhu cầu, ngân sách hoặc máy đang dùng",
    "so_sanh": "so sánh hai sản phẩm trở lên",
    "tra_don": "hỏi đơn hàng đã đặt đang ở đâu, bao giờ giao",
    "bao_hanh": "hỏi chính sách bảo hành, đổi trả (chưa có sự cố)",
    "khieu_nai": "khiếu nại: hàng lỗi, giao sai, chậm, muốn hoàn tiền",
    "khac": "chào hỏi, cảm ơn, hỏi chung không thuộc các ý trên",
}

PROMPT = """Bạn giúp tạo dữ liệu huấn luyện cho chatbot của một shop đồ công nghệ trên TikTok Shop.

Câu gốc của khách (ý định: {intent} - {intent_vi}):
{markup}

Hãy viết {n} câu KHÁC mà khách có thể nhắn, cùng ý định trên. Yêu cầu:
- Giọng nhắn tin tự nhiên của người Việt; đa dạng độ dài và cách nói.
- Khoảng một nửa số câu viết kiểu nhắn nhanh: không dấu, viết tắt (k, ko, dc, bn, j, v, sp), thiếu dấu câu.
- Giữ thông tin trong câu gốc và bọc lại bằng đúng cú pháp [chữ](NHÃN). Có thể đổi cách viết
  của thông tin (vd 500k thành 500 nghìn, tên sản phẩm gọi tắt), nhưng không đổi loại nhãn.
- Chỉ dùng các nhãn: {labels}. Không bọc nhãn cho chữ không phải thông tin.
- Không thêm thông tin mới cần gắn nhãn nếu câu gốc không có.

Trả về đúng một mảng JSON các chuỗi, không giải thích gì thêm."""


def call_gemini(prompt: str, api_key: str, model: str, retries: int = 5) -> str:
    body = json.dumps({
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 1.0, "responseMimeType": "application/json"},
    }).encode("utf-8")
    req = urllib.request.Request(
        API.format(model=model), data=body, method="POST",
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
    )
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 503) and attempt < retries - 1:
                wait = 2 ** attempt * 5
                print(f"  Gemini báo {e.code}, chờ {wait}s rồi thử lại")
                time.sleep(wait)
                continue
            raise SystemExit(f"Gemini lỗi {e.code}: {e.read().decode('utf-8', 'ignore')[:300]}")
    raise SystemExit("Gemini không trả lời sau nhiều lần thử")


def parse_variants(raw: str, intent: str, allowed: set[str]) -> tuple[list[dict], list[str]]:
    """Đọc mảng JSON Gemini trả về, kiểm tra từng câu. Trả (câu hợp lệ, lý do loại)."""
    try:
        items = json.loads(raw)
    except json.JSONDecodeError:
        start, end = raw.find("["), raw.rfind("]")
        items = json.loads(raw[start:end + 1]) if start >= 0 < end else []
    good, rejected = [], []
    for s in items if isinstance(items, list) else []:
        if not isinstance(s, str) or not s.strip():
            continue
        try:
            text, ents = L.parse_markup(s)
        except ValueError as e:
            rejected.append(f"{s} ({e})")
            continue
        if any(e["label"] not in allowed for e in ents):
            rejected.append(f"{s} (nhãn không có trong câu gốc)")
            continue
        good.append({"text": text, "intent": intent, "entities": ents, "markup": L.to_markup(text, ents)})
    return good, rejected


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", default=str(HERE / "data" / "generated" / "train.jsonl"))
    ap.add_argument("--out", default=str(HERE / "data" / "generated" / "gemini.jsonl"))
    ap.add_argument("--per-intent", type=int, default=15, help="số câu gốc lấy mỗi ý định")
    ap.add_argument("--variants", type=int, default=5, help="số câu viết lại cho mỗi câu gốc")
    ap.add_argument("--model", default=os.environ.get("GEMINI_MODEL", "gemini-flash-latest"))
    ap.add_argument("--sleep", type=float, default=4.0, help="nghỉ giữa các lần gọi (gói miễn phí giới hạn lượt/phút)")
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        sys.exit("Chưa đặt biến môi trường GEMINI_API_KEY (lấy ở aistudio.google.com).")

    rng = random.Random(args.seed)
    src = L.read_jsonl(args.src)
    seen = {r["text"].lower() for r in src}
    out_path = Path(args.out)
    existing = L.read_jsonl(out_path) if out_path.exists() else []
    seen |= {r["text"].lower() for r in existing}

    new_rows = []
    for intent in L.INTENTS:
        pool = [r for r in src if r["intent"] == intent]
        for r in rng.sample(pool, min(args.per_intent, len(pool))):
            allowed = {e["label"] for e in r["entities"]}
            prompt = PROMPT.format(intent=intent, intent_vi=INTENT_VI[intent], markup=r["markup"],
                                   n=args.variants, labels=", ".join(sorted(allowed)) or "(không có nhãn nào)")
            good, rejected = parse_variants(call_gemini(prompt, api_key, args.model), intent, allowed)
            for g in good:
                if g["text"].lower() in seen:
                    continue
                seen.add(g["text"].lower())
                new_rows.append({"id": f"gemini-{len(existing) + len(new_rows):05d}", **g,
                                 "source": "gemini", "from_id": r["id"]})
            for x in rejected:
                print("  loại:", x)
            print(f"{intent}: +{len(good)} từ \"{r['text'][:50]}\"")
            time.sleep(args.sleep)

    L.write_jsonl(out_path, existing + new_rows)
    print(f"\nThêm {len(new_rows)} câu, tổng {len(existing) + len(new_rows)} câu trong {out_path}")
    print("Theo ý định:", dict(Counter(r["intent"] for r in new_rows)))


if __name__ == "__main__":
    main()
