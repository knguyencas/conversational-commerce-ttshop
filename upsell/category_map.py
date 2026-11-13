"""Gán sản phẩm Amazon vào loại hàng của shop HDX Tech (tiếng Việt) dựa trên cây danh mục Amazon."""
from __future__ import annotations

MAP_VERSION = "hdx-5"

SHOP_CATEGORIES = [
    "laptop", "bàn phím", "chuột", "tai nghe", "màn hình",
    "ssd", "hub", "micro", "webcam", "lót chuột",
    "balo laptop", "túi chống sốc", "đế tản nhiệt", "sạc laptop",
    "cáp màn hình", "giá treo màn hình", "kê tay",
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
    "cooling pads": "đế tản nhiệt",
    "laptop cooling pads": "đế tản nhiệt",
    "hdmi cables": "cáp màn hình",
    "displayport cables": "cáp màn hình",
    "wrist rests": "kê tay",
}
SKIP_PATH_WORDS = ("networking products", "car ", "vehicle", "aviation", "two-way", "telephone", "security")
MOUSE_PAD_TITLE = ("mouse pad", "mousepad", "mouse mat", "desk mat", "desk pad")
WRIST_REST_TITLE = ("wrist rest", "palm rest", "wrist support", "wrist pad")

LAPTOP_TITLE = ("laptop", "notebook", "macbook", "chromebook")
TITLE_FILTERED_LEAF = {
    "backpacks": ("balo laptop", ("computers & accessories",), LAPTOP_TITLE + ("computer",)),
    "laptop backpacks": ("balo laptop", ("computers & accessories",), LAPTOP_TITLE + ("computer",)),
    "sleeves": ("túi chống sốc", ("laptop accessories",), LAPTOP_TITLE),
    "laptop sleeves": ("túi chống sốc", ("laptop accessories",), LAPTOP_TITLE),
    "chargers & adapters": ("sạc laptop", ("laptop accessories",),
                            LAPTOP_TITLE + ("usb-c", "usb c", "type-c", "type c", "65w", "90w", "100w")),
    "ac adapters": ("sạc laptop", ("laptop accessories",),
                    LAPTOP_TITLE + ("usb-c", "usb c", "type-c", "type c", "65w", "90w", "100w")),
    "monitor mounts": ("giá treo màn hình", ("computers & accessories",), ("monitor", "vesa", "screen")),
    "monitor arms": ("giá treo màn hình", ("computers & accessories",), ("monitor", "vesa", "screen")),
    "monitor stands": ("giá treo màn hình", ("computers & accessories",), ("monitor", "vesa", "screen")),
    "monitor risers": ("giá treo màn hình", ("computers & accessories",), ("monitor", "vesa", "screen")),
}


CONTAINS_LEAF = (
    ("cooling pad", "đế tản nhiệt"),
    ("hdmi cable", "cáp màn hình"),
    ("displayport cable", "cáp màn hình"),
    ("wrist rest", "kê tay"),
)


def map_title_filtered(leaf: str, path: str, title: str) -> str | None:
    """Node lá quá chung chỉ được gán khi đường dẫn đúng nhánh máy tính và tên có từ khóa của loại đó."""
    cat, need_path, need_title = TITLE_FILTERED_LEAF[leaf]
    if any(p in path for p in need_path) and any(k in title for k in need_title):
        return cat
    return None


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
    if leaf in TITLE_FILTERED_LEAF:
        return map_title_filtered(leaf, path, t)
    if "mouse pad" in leaf:
        return "kê tay" if any(k in t for k in WRIST_REST_TITLE) else "lót chuột"
    for key, cat in CONTAINS_LEAF:
        if key in leaf:
            return cat
    if "keyboards, mice & accessories" in path and any(k in t for k in WRIST_REST_TITLE):
        return "kê tay"
    if "keyboards, mice & accessories" in path and any(k in t for k in MOUSE_PAD_TITLE):
        return "lót chuột"
    return None


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    E, CA = "Electronics", "Computers & Accessories"
    LA = (E, CA, "Laptop Accessories")
    BCS = LA + ("Bags, Cases & Sleeves",)
    CAP = (E, CA, "Computer Accessories & Peripherals")
    KMA = CAP + ("Keyboards, Mice & Accessories",)
    MA = CAP + ("Monitor Accessories",)
    cases = {
        (E, CA, "Computers & Tablets", "Laptops", "Traditional Laptops"): "laptop",
        (E, CA, "Computers & Tablets", "Laptops", "2 in 1 Laptops"): "laptop",
        KMA + ("Keyboards",): "bàn phím",
        KMA + ("Mice",): "chuột",
        (E, CA, "Keyboards, Mice & Accessories", "Keyboard & Mice Accessories", "Keyboard Skins"): None,
        (E, "Headphones, Earbuds & Accessories", "Headphones & Earbuds", "Over-Ear Headphones"): "tai nghe",
        (E, "Headphones, Earbuds & Accessories", "Earpads"): None,
        (E, CA, "Monitors"): "màn hình",
        (E, "Camera & Photo", "Lighting & Studio", "Video Studio", "Video Monitors"): None,
        (E, CA, "Data Storage", "Internal Solid State Drives"): "ssd",
        CAP + ("USB Hubs",): "hub",
        LA + ("Docking Stations",): "hub",
        (E, CA, "Networking Products", "Hubs"): None,
        CAP + ("Audio & Video Accessories", "Computer Microphones"): "micro",
        CAP + ("Audio & Video Accessories", "Webcams & VoIP Equipment", "Webcams"): "webcam",
        KMA + ("Mouse Pads",): "lót chuột",
        (E, "Car & Vehicle Electronics", "Car Electronics", "Car Video", "Car Headphones"): None,
        LA + ("Cooling Pads",): "đế tản nhiệt",
        LA + ("Laptop Cooling Pads",): "đế tản nhiệt",
        LA + ("Cooling Pads & External Fans",): "đế tản nhiệt",
        LA + ("Cooling Pads & External Fans", "Cooling Pads"): "đế tản nhiệt",
        CAP + ("Cables & Accessories", "Cables & Interconnects", "HDMI Cables & Adapters"): "cáp màn hình",
        (E, CA, "Computer Components", "Fans & Cooling", "Case Fans"): None,
        CAP + ("Cables & Accessories", "Cables & Interconnects", "HDMI Cables"): "cáp màn hình",
        CAP + ("Cables & Accessories", "Cables & Interconnects", "DisplayPort Cables"): "cáp màn hình",
        CAP + ("Cables & Accessories", "Cables & Interconnects", "USB Cables"): None,
        KMA + ("Wrist Rests",): "kê tay",
        MA + ("Monitor Stands",): None,
        BCS + ("Backpacks",): None,
    }
    titled = [
        ((), "SteelSeries QcK Gaming Mouse Pad - Medium", "lót chuột"),
        ((), "Wireless Gaming Mouse 16000 DPI", None),
        ((E, CA, "Keyboards, Mice & Accessories", "Keyboard & Mice Accessories", "Keyboard Skins"),
         "Large Desk Mat Mouse Pad 31.5x11.8", "lót chuột"),
        (BCS + ("Backpacks",), "Slim Laptop Backpack 15.6 Inch Water Resistant", "balo laptop"),
        (BCS + ("Laptop Backpacks",), "Anti-Theft Business Computer Backpack", "balo laptop"),
        (BCS + ("Backpacks",), "Kids School Backpack for Boys", None),
        ((E, "Camera & Photo", "Bags & Cases", "Backpacks"), "DSLR Camera Backpack for Laptop", None),
        (BCS + ("Sleeves",), "MacBook Air 13 Inch Sleeve Case", "túi chống sốc"),
        (BCS + ("Sleeves",), "Laptop Sleeve 15.6 Inch Shockproof", "túi chống sốc"),
        ((E, CA, "Tablet Accessories", "Bags, Cases & Sleeves", "Sleeves"), "iPad Sleeve 11 Inch", None),
        (LA + ("Chargers & Adapters",), "65W USB-C Laptop Charger GaN", "sạc laptop"),
        (LA + ("Chargers & Adapters",), "Dell Laptop Charger 90W", "sạc laptop"),
        (LA + ("Chargers & Adapters",), "Camera Battery Charger Dual Slot", None),
        ((E, "Car & Vehicle Electronics", "Car Electronics", "Chargers & Adapters"), "Car Laptop Charger 12V 65W", None),
        (MA + ("Monitor Mounts",), "Dual Monitor Desk Mount Arm VESA", "giá treo màn hình"),
        (MA + ("Monitor Stands",), "Monitor Stand Riser with Drawer", "giá treo màn hình"),
        (MA + ("Monitor Mounts",), "Wall Bracket for 55 Inch TV", None),
        (KMA + ("Mouse Pads & Wrist Rests",), "Ergonomic Keyboard Wrist Rest Gel Pad", "kê tay"),
        (KMA + ("Mouse Pads & Wrist Rests",), "Gaming Mouse Pad XL Non-Slip", "lót chuột"),
    ]
    bad = 0
    for path, title, want in titled:
        got = map_category(list(path), title)
        bad += got != want
        print("ok " if got == want else "SAI", title[:40], "->", got, "" if got == want else f"(cần {want})")
    for path, want in cases.items():
        got = map_category(list(path))
        ok = got == want
        bad += not ok
        print("ok " if ok else "SAI", " > ".join(path[-2:]), "->", got, "" if ok else f"(cần {want})")
    print("tất cả đúng" if not bad else f"{bad} ca sai")
    sys.exit(1 if bad else 0)
