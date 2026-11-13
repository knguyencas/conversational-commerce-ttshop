"""Gán sản phẩm Amazon vào loại hàng của shop HDX Tech (tiếng Việt) dựa trên cây danh mục Amazon."""
from __future__ import annotations

MAP_VERSION = "hdx-2"

SHOP_CATEGORIES = [
    "laptop", "bàn phím", "chuột", "tai nghe", "màn hình",
    "ssd", "hub", "micro", "webcam", "lót chuột",
]

LEAF_MAP = {
    "traditional laptops": "laptop",
    "2 in 1 laptops": "laptop",
    "laptops": "laptop",
    "keyboards": "bàn phím",
    "keyboard & mouse combos": "bàn phím",
    "mice": "chuột",
    "earbud headphones": "tai nghe",
    "over-ear headphones": "tai nghe",
    "on-ear headphones": "tai nghe",
    "headphones & earbuds": "tai nghe",
    "headphones": "tai nghe",
    "computer headsets": "tai nghe",
    "monitors": "màn hình",
    "internal solid state drives": "ssd",
    "external solid state drives": "ssd",
    "usb hubs": "hub",
    "docking stations": "hub",
    "computer microphones": "micro",
    "microphones": "micro",
    "webcams": "webcam",
    "mouse pads": "lót chuột",
}
SKIP_PATH_WORDS = ("networking products", "car ", "vehicle", "aviation", "two-way", "telephone", "security")
MOUSE_PAD_TITLE = ("mouse pad", "mousepad", "mouse mat", "desk mat", "desk pad")


def map_category(categories: list[str] | None, title: str | None = None) -> str | None:
    """Trả về loại hàng của shop, hoặc None nếu không thuộc loại nào shop bán."""
    nodes = [str(c).strip().lower() for c in (categories or []) if str(c).strip()]
    t = str(title or "").lower()
    if not nodes:
        return "lót chuột" if any(k in t for k in MOUSE_PAD_TITLE) else None
    path = " > ".join(nodes)
    if any(w in path for w in SKIP_PATH_WORDS):
        return None
    leaf = nodes[-1]
    if leaf == "monitors" and (len(nodes) < 2 or nodes[-2] != "computers & accessories"):
        return None
    if leaf in LEAF_MAP:
        return LEAF_MAP[leaf]
    if "mouse pad" in leaf:
        return "lót chuột"
    if "keyboards, mice & accessories" in path and any(k in t for k in MOUSE_PAD_TITLE):
        return "lót chuột"
    return None


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    cases = {
        ("Electronics", "Computers & Accessories", "Computers & Tablets", "Laptops", "Traditional Laptops"): "laptop",
        ("Electronics", "Computers & Accessories", "Computers & Tablets", "Laptops", "2 in 1 Laptops"): "laptop",
        ("Electronics", "Computers & Accessories", "Laptop Accessories", "Bags, Cases & Sleeves", "Backpacks"): None,
        ("Electronics", "Computers & Accessories", "Computer Accessories & Peripherals", "Keyboards, Mice & Accessories", "Keyboards"): "bàn phím",
        ("Electronics", "Computers & Accessories", "Computer Accessories & Peripherals", "Keyboards, Mice & Accessories", "Mice"): "chuột",
        ("Electronics", "Computers & Accessories", "Keyboards, Mice & Accessories", "Keyboard & Mice Accessories", "Keyboard Skins"): None,
        ("Electronics", "Headphones, Earbuds & Accessories", "Headphones & Earbuds", "Over-Ear Headphones"): "tai nghe",
        ("Electronics", "Headphones, Earbuds & Accessories", "Earpads"): None,
        ("Electronics", "Computers & Accessories", "Monitors"): "màn hình",
        ("Electronics", "Computers & Accessories", "Computer Accessories & Peripherals", "Monitor Accessories", "Monitor Stands"): None,
        ("Electronics", "Camera & Photo", "Lighting & Studio", "Video Studio", "Video Monitors"): None,
        ("Electronics", "Computers & Accessories", "Data Storage", "Internal Solid State Drives"): "ssd",
        ("Electronics", "Computers & Accessories", "Computer Accessories & Peripherals", "USB Hubs"): "hub",
        ("Electronics", "Computers & Accessories", "Laptop Accessories", "Docking Stations"): "hub",
        ("Electronics", "Computers & Accessories", "Networking Products", "Hubs"): None,
        ("Electronics", "Computers & Accessories", "Computer Accessories & Peripherals", "Audio & Video Accessories", "Computer Microphones"): "micro",
        ("Electronics", "Computers & Accessories", "Computer Accessories & Peripherals", "Audio & Video Accessories", "Webcams & VoIP Equipment", "Webcams"): "webcam",
        ("Electronics", "Computers & Accessories", "Computer Accessories & Peripherals", "Keyboards, Mice & Accessories", "Mouse Pads"): "lót chuột",
        ("Electronics", "Car & Vehicle Electronics", "Car Electronics", "Car Video", "Car Headphones"): None,
    }
    bad = 0
    titled = [((), "SteelSeries QcK Gaming Mouse Pad - Medium", "lót chuột"),
              ((), "Wireless Gaming Mouse 16000 DPI", None),
              (("Electronics", "Computers & Accessories", "Keyboards, Mice & Accessories", "Keyboard & Mice Accessories", "Keyboard Skins"),
               "Large Desk Mat Mouse Pad 31.5x11.8", "lót chuột")]
    for path, title, want in titled:
        got = map_category(list(path), title)
        bad += got != want
        print("ok " if got == want else "SAI", title[:40], "->", got)
    for path, want in cases.items():
        got = map_category(list(path))
        ok = got == want
        bad += not ok
        print("ok " if ok else "SAI", " > ".join(path[-2:]), "->", got, "" if ok else f"(cần {want})")
    print("tất cả đúng" if not bad else f"{bad} ca sai")
    sys.exit(1 if bad else 0)
