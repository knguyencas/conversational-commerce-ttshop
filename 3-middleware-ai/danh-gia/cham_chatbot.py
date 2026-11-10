"""Chấm chatbot bằng bộ câu test của M1."""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / "nlu"))
import nlu_lib as L

URL = "http://127.0.0.1:5678/webhook/chatbot-test"
MONEY_RE = re.compile(r"(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(trieu|tr|cu|k|nghin|ngan|vnd|dong|d)?\s*(\d+|ruoi)?(?![a-z0-9])")


def ask(text: str, conv: str, timeout: int = 90) -> dict:
    body = json.dumps({"conversation_id": conv, "text": text}).encode("utf-8")
    req = urllib.request.Request(URL, data=body, method="POST", headers={"Content-Type": "application/json"})
    try:
        return json.loads(urllib.request.urlopen(req, timeout=timeout).read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return {"loi": f"HTTP {e.code}: {e.read().decode('utf-8', 'ignore')[:200]}"}
    except Exception as e:
        return {"loi": str(e)}


def money_in(reply: str) -> list[int]:
    """Các số tiền trong câu trả lời (có đơn vị đ/k/tr... hoặc có dấu ngăn cách nghìn)."""
    f = L.fold(reply)
    out = []
    for m in MONEY_RE.finditer(f):
        if not m.group(2) and not re.search(r"[.,]\d{3}", m.group(1)):
            continue
        v = L.parse_money(m.group(0))
        if v:
            out.append(v)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("csv_path")
    ap.add_argument("--lan", default=time.strftime("%Y%m%d-%H%M"), help="tên lần chấm (vd sau-khi-sua-prompt)")
    ap.add_argument("--catalog", default=str(ROOT / "nlu" / "data" / "catalog.csv"),
                    help="danh mục giá đúng (thay bằng file xuất từ Odoo khi đã có dữ liệu thật)")
    args = ap.parse_args()
    for st in (sys.stdout, sys.stderr):
        if hasattr(st, "reconfigure"):
            st.reconfigure(encoding="utf-8")

    prices = {p.price for p in L.load_catalog(args.catalog)}
    with open(args.csv_path, encoding="utf-8-sig", newline="") as f:
        rows = [{k.strip().lower(): (v or "").strip() for k, v in r.items()} for r in csv.DictReader(f)]
    rows = [r for r in rows if r.get("cau_hoi")]
    if not rows:
        sys.exit("CSV không có dòng nào ở cột cau_hoi")

    out_rows, t_start = [], time.time()
    for i, r in enumerate(rows, 1):
        q = unicodedata.normalize("NFC", r["cau_hoi"])
        res = ask(q, f"cham-{args.lan}-{i:03d}")
        reply = res.get("reply", "") or ""
        money = money_in(reply)
        wrong_money = [v for v in money if v not in prices]
        want_intent = r.get("y_dinh_dung", "")
        want_skus = [s for s in r.get("sku_dung", "").split("|") if s]
        got_skus = res.get("skus") or []
        out_rows.append({
            "stt": i, "cau_hoi": q, "tra_loi": reply or res.get("loi", ""),
            "y_dinh_bot": res.get("intent", ""), "y_dinh_dung": want_intent,
            "dung_y_dinh": ("" if not want_intent else ("có" if res.get("intent") == want_intent else "KHÔNG")),
            "nhac_dung_sku": ("" if not want_skus else ("có" if set(want_skus) & set(got_skus) else "KHÔNG")),
            "so_tien_trong_cau": " | ".join(f"{v:,}" for v in money),
            "SAI_GIA": " | ".join(f"{v:,}" for v in wrong_money),
            "chuyen_nguoi": res.get("handoff_reason") or "",
            "moi_mua_kem": ", ".join(u.get("sku", "") for u in (res.get("upsell") or [])),
            "model": res.get("model", ""), "do_tre_ms": res.get("latency_ms", ""),
            "loi": res.get("loi", ""), "danh_gia": "", "ghi_chu_nguoi_cham": "", "ghi_chu": r.get("ghi_chu", ""),
        })
        mark = "SAI GIÁ " if wrong_money else ("lỗi " if res.get("loi") else "")
        print(f"[{i}/{len(rows)}] {mark}{q[:60]}")

    out_dir = HERE / "ket-qua"
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / f"{args.lan}.csv"
    with open(out_path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(out_rows[0].keys()))
        w.writeheader()
        w.writerows(out_rows)

    n = len(out_rows)
    labeled = [r for r in out_rows if r["dung_y_dinh"]]
    lat = [r["do_tre_ms"] for r in out_rows if isinstance(r["do_tre_ms"], (int, float))]
    print("\n===== TÓM TẮT")
    print(f"Số câu: {n} | thời gian chạy: {time.time() - t_start:.0f}s")
    if labeled:
        ok = sum(r["dung_y_dinh"] == "có" for r in labeled)
        print(f"Đúng ý định: {ok}/{len(labeled)} ({100 * ok / len(labeled):.0f}%)")
    print(f"Câu có SAI GIÁ: {sum(bool(r['SAI_GIA']) for r in out_rows)}  (mục tiêu: 0)")
    print(f"Chuyển người: {sum(bool(r['chuyen_nguoi']) for r in out_rows)} | Lỗi gọi bot: {sum(bool(r['loi']) for r in out_rows)}")
    print(f"Có mời mua kèm: {sum(bool(r['moi_mua_kem']) for r in out_rows)}")
    if lat:
        lat.sort()
        print(f"Độ trễ: trung vị {lat[len(lat) // 2]} ms, chậm nhất {lat[-1]} ms")
    print(f"\nKết quả: {out_path}\nM1 mở file, điền cột danh_gia (Đúng/Sai) rồi đếm: mục tiêu ≥ 90/100 câu Đúng và 0 câu SAI_GIA.")


if __name__ == "__main__":
    main()
