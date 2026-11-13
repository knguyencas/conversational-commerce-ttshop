"""Nạp cua-hang/san-pham.csv vào dữ liệu sản phẩm của chatbot và danh mục train NLU."""
import csv
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "cua-hang" / "san-pham.csv"
NLU_CATALOG = ROOT / "nlu" / "data" / "catalog.csv"
TOOL_WF = ROOT / "n8n" / "workflows" / "m3-tool-san-pham-gia.json"

CATEGORY_ALIAS = {
    "laptop": ["laptop", "lap", "lap top", "may tinh xach tay", "may tinh", "macbook", "notebook"],
    "ban phim": ["ban phim", "ban phim co", "ban phim khong day", "phim", "keyboard"],
    "chuot": ["chuot", "chuot gaming", "chuot khong day", "mouse"],
    "tai nghe": ["tai nghe", "tai nghe gaming", "tai nghe bluetooth", "tai nghe chup tai", "headphone", "tai phone"],
    "man hinh": ["man hinh", "man hinh gaming", "man", "monitor"],
    "ssd": ["ssd", "o cung", "o ssd", "o cung ssd"],
    "hub": ["hub", "hub chuyen doi", "hub usb c", "cong chuyen", "bo chuyen", "dock"],
    "micro": ["micro", "mic", "micro thu am"],
    "webcam": ["webcam", "cam", "camera"],
    "lot chuot": ["lot chuot", "ban di chuot", "pad chuot", "mouse pad", "lot"],
    "balo laptop": ["balo laptop", "balo", "ba lo", "ba lo laptop", "balo may tinh"],
    "tui chong soc": ["tui chong soc", "tui laptop", "bao dung laptop", "tui dung laptop", "sleeve"],
    "de tan nhiet": ["de tan nhiet", "de tan nhiet laptop", "de quat laptop", "quat tan nhiet", "cooling pad"],
    "sac laptop": ["sac laptop", "cu sac", "cu sac laptop", "sac nhanh", "sac usb c", "sac may tinh"],
    "cap man hinh": ["cap man hinh", "cap hdmi", "day hdmi", "cap displayport", "day displayport", "cap dp"],
    "gia treo man hinh": ["gia treo man hinh", "arm man hinh", "tay treo man hinh", "gia do man hinh"],
    "ke tay": ["ke tay", "ke tay ban phim", "dem ke tay", "ke co tay", "wrist rest"],
}


def fold(s: str) -> str:
    """Bỏ dấu, chữ thường, giống hàm norm trong workflow."""
    s = unicodedata.normalize("NFD", str(s or "")).replace("đ", "d").replace("Đ", "D")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def split(v: str) -> list[str]:
    """Tách ô dạng a|b|c thành danh sách."""
    return [x.strip() for x in (v or "").split("|") if x.strip()]


def read_rows() -> list[dict]:
    """Đọc và kiểm tra san-pham.csv."""
    with open(SRC, encoding="utf-8-sig", newline="") as f:
        rows = [r for r in csv.DictReader(f) if (r.get("sku") or "").strip()]
    skus = [r["sku"].strip() for r in rows]
    dup = {s for s in skus if skus.count(s) > 1}
    if dup:
        sys.exit(f"SKU bị trùng: {sorted(dup)}")
    known = set(CATEGORY_ALIAS)
    for r in rows:
        if fold(r["category"]) not in known:
            sys.exit(f"{r['sku']}: loại hàng '{r['category']}' chưa có trong CATEGORY_ALIAS của scripts/nap-san-pham.py")
        int(r["price"])
    return rows


def to_product(r: dict) -> dict:
    """Một dòng CSV thành một sản phẩm theo hợp đồng contracts/internal/tool_san_pham.md."""
    stock = int(r.get("ton_dau_ky") or 0)
    colors = split(r.get("colors"))
    per = [stock // len(colors) + (1 if i < stock % len(colors) else 0) for i in range(len(colors))] if colors else []
    device = None
    if fold(r["category"]) == "laptop":
        device = "macbook" if "macbook" in fold(r["name"]) else "laptop"
    return {
        "sku": r["sku"].strip(), "name": r["name"].strip(), "brand": r["brand"].strip(),
        "category": r["category"].strip(), "price": int(r["price"]), "stock": stock,
        "colors": [{"color": c, "stock": n} for c, n in zip(colors, per)],
        "warranty_months": int(r.get("bao_hanh_thang") or 12),
        "specs": (r.get("thong_so") or r.get("mo_ta") or "").strip(),
        "compatible": split(r.get("tuong_thich")), "device": device, "aliases": split(r.get("aliases")),
    }


def write_nlu_catalog(rows: list[dict]) -> None:
    """Ghi danh mục cho gen_data.py (nlu/data/catalog.csv)."""
    cols = ["sku", "name", "brand", "category", "price", "colors", "capacity", "aliases"]
    with open(NLU_CATALOG, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(cols)
        for r in rows:
            w.writerow([(r.get(c) or "").strip() for c in cols])


def write_tool(products: list[dict]) -> None:
    """Thay mảng PRODUCTS và CATEGORY_ALIAS trong workflow M3 · Tool sản phẩm."""
    wf = json.loads(TOOL_WF.read_text(encoding="utf-8"))
    node = next(n for n in wf["nodes"] if n["name"] == "Tra dữ liệu giả")
    code = node["parameters"]["jsCode"]
    code, n1 = re.subn(r"^const PRODUCTS = .*$", lambda _m: "const PRODUCTS = " + json.dumps(products, ensure_ascii=False) + ";",
                       code, count=1, flags=re.M)
    alias = {a: k for k, names in CATEGORY_ALIAS.items() for a in names}
    body = ",\n".join(f"  '{a}': '{k}'" for a, k in alias.items())
    code, n2 = re.subn(r"^const CATEGORY_ALIAS = \{.*?^\};", lambda _m: "const CATEGORY_ALIAS = {\n" + body + ",\n};",
                       code, count=1, flags=re.M | re.S)
    if n1 != 1 or n2 != 1:
        sys.exit("Không tìm thấy PRODUCTS hoặc CATEGORY_ALIAS trong workflow, cần sửa tay")
    node["parameters"]["jsCode"] = code
    TOOL_WF.write_text(json.dumps(wf, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    """Đọc san-pham.csv, ghi ra 2 nơi dùng."""
    sys.stdout.reconfigure(encoding="utf-8")
    rows = read_rows()
    write_nlu_catalog(rows)
    write_tool([to_product(r) for r in rows])
    cats = sorted({r["category"].strip() for r in rows})
    print(f"Đã nạp {len(rows)} sản phẩm, {len(cats)} loại: {', '.join(cats)}")
    print("Tiếp theo: bash scripts/import-n8n.sh để nạp vào n8n; sinh lại dữ liệu NLU nếu đổi tên hoặc loại hàng.")


if __name__ == "__main__":
    main()
