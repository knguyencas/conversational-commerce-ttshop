"""Test nhanh cho nlu_lib. Chạy: python 3-middleware-ai/nlu/tests/test_nlu_lib.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import nlu_lib as L


def test_strip_diacritics_keeps_length():
    s = "Điện thoại màu trắng giá bao nhiêu đây ạ"
    out = L.strip_diacritics(s)
    assert out == "Dien thoai mau trang gia bao nhieu day a", out
    assert len(out) == len(s)


def test_markup_roundtrip():
    s = "[sạc anker 20w](SAN_PHAM) màu [trắng](MAU) còn không shop"
    text, ents = L.parse_markup(s)
    assert text == "sạc anker 20w màu trắng còn không shop"
    assert [(e["label"], e["text"]) for e in ents] == [("SAN_PHAM", "sạc anker 20w"), ("MAU", "trắng")]
    assert L.to_markup(text, ents) == s


def test_markup_errors():
    for bad in ["[abc](SANPHAM) x", "[abc(SAN_PHAM) x", "giá [500k](NGAN_SACH"]:
        try:
            L.parse_markup(bad)
        except ValueError:
            continue
        raise AssertionError(f"phải báo lỗi: {bad}")


def test_bio_roundtrip_with_segmenter():
    cases = [
        "[sạc anker 20w](SAN_PHAM) màu [trắng](MAU) còn không shop",
        "tầm [2tr5](NGAN_SACH) mua [điện thoại](LOAI) nào ạ",
        "đơn [579123456789012345](MA_DON) tới đâu rồi",
        "sac [anker](HANG) [20w](DUNG_LUONG) gia bn v shop",
        "cảm ơn shop nhiều nha",
    ]
    for s in cases:
        text, ents = L.parse_markup(s)
        for use_seg in (True, False):
            toks, labs, spans = L.to_bio(text, ents, use_seg)
            back = L.bio_to_entities(text, spans, labs)
            got = [(e["label"], e["text"]) for e in back]
            want = [(e["label"], e["text"]) for e in ents]
            assert got == want, (s, use_seg, toks, labs, got)


def test_segmenter_groups_compound_words():
    words = [w[0] for w in L.segment("điện thoại iphone giá bao nhiêu")]
    if L._get_segmenter():
        assert "điện_thoại" in words, words
    assert L.segmented_text("sac anker 20w gia bn") .count("20w") == 1


def test_parse_money():
    cases = {
        "2tr5": 2_500_000, "2 tr5": 2_500_000, "500k": 500_000, "1.990.000đ": 1_990_000,
        "2 triệu rưỡi": 2_500_000, "2,5 triệu": 2_500_000, "3 củ": 3_000_000,
        "990": 990_000, "1990000": 1_990_000, "800 nghìn": 800_000, "2 trieu": 2_000_000,
        "1tr2": 1_200_000, "15tr": 15_000_000,
    }
    for s, want in cases.items():
        assert L.parse_money(s) == want, (s, L.parse_money(s), want)


def test_gazetteer():
    p = L.Product("PK-SAC-ANKER20W-TRANG", "Củ sạc Anker 20W", "Anker", "củ sạc", 199000,
                  ["trắng", "đen"], "20W", ["sạc anker 20w", "anker 20w"])
    g = L.GazetteerNER([p])
    ents = g.predict("sac anker 20w mau trang gia bn, tam 500k")
    got = [(e["label"], e["text"]) for e in ents]
    assert ("SAN_PHAM", "sac anker 20w") in got, got
    assert ("MAU", "trang") in got, got
    assert ("NGAN_SACH", "500k") in got, got


if __name__ == "__main__":
    fns = [v for k, v in dict(globals()).items() if k.startswith("test_")]
    for fn in fns:
        fn()
        print("ok ", fn.__name__)
    print(f"{len(fns)} test đều qua")
