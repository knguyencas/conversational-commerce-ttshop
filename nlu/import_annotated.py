"""Đổi file CSV do người gán nhãn sang JSONL để train/đánh giá."""
from __future__ import annotations

import argparse
import csv
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import nlu_lib as L


def convert(rows, source: str):
    good, errors, seen = [], [], set()
    for line_no, r in rows:
        raw = (r.get("text") or "").strip()
        intent = (r.get("intent") or "").strip().lower()
        if not raw:
            continue
        if intent not in L.INTENTS:
            errors.append((line_no, raw, f"ý định '{intent}' không hợp lệ (hợp lệ: {', '.join(L.INTENTS)})"))
            continue
        try:
            text, ents = L.parse_markup(raw)
        except ValueError as e:
            errors.append((line_no, raw, str(e)))
            continue
        key = text.lower()
        if key in seen:
            errors.append((line_no, raw, "trùng câu đã có ở trên"))
            continue
        seen.add(key)
        good.append({
            "id": f"{source}-{len(good):04d}",
            "text": text,
            "intent": intent,
            "entities": ents,
            "markup": L.to_markup(text, ents),
            "source": source,
        })
    return good, errors


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("csv_path")
    ap.add_argument("out_jsonl")
    ap.add_argument("--source", default="human", help="ghi vào trường source, vd test, form")
    args = ap.parse_args()
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")

    with open(args.csv_path, encoding="utf-8-sig", newline="") as f:
        sample = f.read(4096)
        f.seek(0)
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t") if sample else csv.excel
        reader = csv.DictReader(f, dialect=dialect)
        reader.fieldnames = [h.strip().lower() for h in (reader.fieldnames or [])]
        if not {"text", "intent"} <= set(reader.fieldnames):
            sys.exit(f"CSV phải có cột 'text' và 'intent', đang có: {reader.fieldnames}")
        rows = [(i + 2, r) for i, r in enumerate(reader)]

    good, errors = convert(rows, args.source)
    L.write_jsonl(args.out_jsonl, good)

    print(f"Đã ghi {len(good)} câu vào {args.out_jsonl}")
    print("Theo ý định:", dict(Counter(r["intent"] for r in good)))
    print("Theo thực thể:", dict(Counter(e["label"] for r in good for e in r["entities"])))
    if errors:
        print(f"\n{len(errors)} dòng bị bỏ qua:")
        for line_no, raw, msg in errors:
            print(f"  dòng {line_no}: {msg}\n    {raw}")
        sys.exit(1)


if __name__ == "__main__":
    main()
