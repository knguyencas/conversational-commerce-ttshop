"""Gán sản phẩm Amazon vào loại hàng của shop (tiếng Việt) dựa trên cây danh mục Amazon."""
from __future__ import annotations

SHOP_CATEGORIES = [
    "điện thoại", "ốp lưng", "kính cường lực", "củ sạc", "cáp", "sạc dự phòng",
    "tai nghe", "loa bluetooth", "đồng hồ thông minh", "chuột", "bàn phím",
]

RULES: list[tuple[str, tuple[str, ...]]] = [
    ("kính cường lực", ("screen protector",)),
    ("sạc dự phòng", ("power bank",)),
    ("cáp", ("cable",)),
    ("củ sạc", ("charger", "power adapter")),
    ("tai nghe", ("headphone", "earbud", "earphone", "headset")),
    ("loa bluetooth", ("speaker",)),
    ("đồng hồ thông minh", ("smartwatch", "smart watch", "fitness tracker")),
    ("chuột", ("mice", "mouse")),
    ("bàn phím", ("keyboard",)),
    ("ốp lưng", ("cases", "case", "holster", "skins")),
]
PHONE_NODES = {"cell phones", "carrier cell phones", "unlocked cell phones"}
SKIP_WORDS = ("accessor", "replacement", "part", "band", "strap", "mount", "holder", "stand", "dock")


def map_category(categories: list[str] | None, title: str | None = None) -> str | None:
    """Trả về loại hàng của shop, hoặc None nếu không thuộc loại nào shop bán."""
    nodes = [str(c).strip().lower() for c in (categories or []) if str(c).strip()]
    if not nodes:
        return None
    leaf = nodes[-1]
    candidates = [leaf]
    if len(nodes) >= 2 and not any(w in leaf for w in SKIP_WORDS) and "accessor" not in nodes[-2]:
        candidates.append(nodes[-2])
    for node in candidates:
        if node in PHONE_NODES:
            return "điện thoại"
        if node == leaf and any(w in node for w in SKIP_WORDS):
            if not any(k in node for k in ("cases", "screen protector", "power bank", "cable", "charger")):
                return None
        for shop_cat, keys in RULES:
            if any(k in node for k in keys):
                if shop_cat == "ốp lưng" and ("charging case" in node or "headphone" in node):
                    continue
                return shop_cat
    return None


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    cases = {
        ("Cell Phones & Accessories", "Cases, Holsters & Sleeves", "Basic Cases"): "ốp lưng",
        ("Cell Phones & Accessories", "Accessories", "Screen Protectors"): "kính cường lực",
        ("Cell Phones & Accessories", "Accessories", "Chargers & Power Adapters", "Wall Chargers"): "củ sạc",
        ("Cell Phones & Accessories", "Accessories", "Chargers & Power Adapters", "Portable Power Banks"): "sạc dự phòng",
        ("Cell Phones & Accessories", "Accessories", "Cables", "Lightning Cables"): "cáp",
        ("Electronics", "Headphones, Earbuds & Accessories", "Headphones", "Earbud Headphones"): "tai nghe",
        ("Electronics", "Headphones, Earbuds & Accessories", "Earpads"): None,
        ("Electronics", "Portable Audio & Video", "Portable Speakers & Docks", "Portable Bluetooth Speakers"): "loa bluetooth",
        ("Cell Phones & Accessories", "Smartwatches"): "đồng hồ thông minh",
        ("Cell Phones & Accessories", "Smartwatch Accessories", "Smartwatch Bands"): None,
        ("Electronics", "Computers & Accessories", "Computer Accessories & Peripherals", "Keyboards, Mice & Accessories", "Mice"): "chuột",
        ("Electronics", "Computers & Accessories", "Computer Accessories & Peripherals", "Keyboards, Mice & Accessories", "Keyboards"): "bàn phím",
        ("Cell Phones & Accessories", "Cell Phones"): "điện thoại",
        ("Cell Phones & Accessories", "Accessories", "Car Accessories", "Car Cradles & Mounts"): None,
        ("Electronics", "Camera & Photo", "Lenses"): None,
    }
    bad = 0
    for path, want in cases.items():
        got = map_category(list(path))
        ok = got == want
        bad += not ok
        print("ok " if ok else "SAI", " > ".join(path[-2:]), "->", got, "" if ok else f"(cần {want})")
    print("tất cả đúng" if not bad else f"{bad} ca sai")
    sys.exit(1 if bad else 0)
