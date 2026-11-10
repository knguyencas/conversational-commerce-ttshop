# Nhóm việc 1: Cửa hàng TikTok và dữ liệu sản phẩm

**Người làm:** Hữu Đức.

## Việc này phục vụ gì trong đồ án

Đây là **mặt tiền** của đề tài "bán hàng qua chat trên TikTok Shop". Nhóm việc này lo hai thứ:
1. **Shop TikTok thật** để chứng minh nhóm làm trên nền tảng thật. TikTok chặn API với người không có công ty, nên shop chỉ dùng làm minh chứng; hệ thống chạy bằng chế độ giả lập.
2. **Dữ liệu sản phẩm và bộ câu test**, dữ liệu mà cả hệ thống dùng chung. Sai SKU hay giá ở đây thì chatbot trả lời sai, đơn không khớp kho.

## Phải làm gì

| Mã | Việc | Xong khi |
|---|---|---|
| M1-01 | Mở shop TikTok cá nhân ở seller-vn.tiktok.com, **chụp ảnh từng bước**. Bị đòi giấy tờ hay chặn thì dừng, chụp ảnh chỗ bị chặn để ghi vào báo cáo | Ảnh trong Drive chung |
| M1-02 | Điền `san-pham.csv`: 10–20 món **không thương hiệu** | Trưởng nhóm duyệt pull request |
| M1-03 | Tạo 2–3 sản phẩm **nháp** trong Seller Center (không gửi duyệt), đúng tên và SKU trong `san-pham.csv`, chụp màn hình | Ảnh chụp |
| M1-06 | Viết 30–50 câu test chatbot trong `bo-test-chatbot.csv` | Trưởng nhóm chấm được |
| M1-07 | Viết khoảng 100 câu test cho mô hình ý định trong `test-nlu.csv` | Đưa vào Colab chấm được |
| M1-10 | Đọc kết quả chấm bot (`3-middleware-ai/danh-gia/ket-qua/`), ghi nhận xét | Có nhận xét cho báo cáo |

Không mua hàng, không đăng hàng không có thật để bán, không dùng tên hãng (Anker, Apple...). TikTok đòi thư ủy quyền thương hiệu mới cho đăng hàng có tên hãng.

## Thư mục này chứa gì

```
1-cua-hang-tiktok/
├── san-pham.csv          danh sách sản phẩm, mỗi phiên bản một dòng
├── sku-map.csv           SKU ↔ mã TikTok (chỉ dùng nếu sau này có API thật)
├── bo-test-chatbot.csv   câu hỏi test chatbot kèm đáp án đúng
└── test-nlu.csv          câu test mô hình ý định, đã gán nhãn
```

Ảnh (đăng ký shop, sản phẩm nháp) để trong **Drive chung**, không đưa vào Git.

## Nối với phần nào, thế nào

```
san-pham.csv ──▶ Odoo (nhóm 2 nhập bằng Import)
             ──▶ dữ liệu sản phẩm của chatbot (nhóm 3)
             ──▶ form giả lập: đặt đơn bằng các SKU này
bo-test-chatbot.csv ──▶ 3-middleware-ai/danh-gia/cham_chatbot.py ──▶ điểm chatbot
test-nlu.csv ──▶ 3-middleware-ai/nlu (import_annotated.py) ──▶ notebook Colab ──▶ F1 cho báo cáo
```

**SKU là khóa nối mọi phần:** cùng một chuỗi phải nằm ở `san-pham.csv`, Internal Reference trong Odoo và sản phẩm nháp trên TikTok. Quy tắc SKU: `<NHÓM>-<LOẠI>-<MẪU>-<BIẾN THỂ>`, chữ in hoa không dấu, nối bằng gạch ngang (xem [contracts/README.md](../contracts/README.md)).

## Cách điền từng file

Không cần biết code. Viết trong Google Sheet hoặc Excel cho dễ, rồi lưu thành CSV (UTF-8) đúng tên file.

### `san-pham.csv`

Dòng đầu là tên cột, giữ nguyên. Dòng thứ hai là ví dụ, sửa hoặc xóa khi điền thật.

| Cột | Ví dụ | Ghi chú |
|---|---|---|
| `sku` | `PK-CAP-C2C-1M` | Theo quy tắc SKU |
| `name` | Cáp sạc USB-C to C 1m bện dù | Tên hiển thị, không ghi tên hãng |
| `brand` | Không thương hiệu | |
| `category` | cáp | Chữ thường có dấu: cáp, củ sạc, ốp lưng, kính cường lực, giá đỡ, tai nghe, sạc dự phòng, chuột, bàn phím... |
| `price` | 59000 | VND, chỉ ghi số |
| `colors` | đen\|trắng | Nhiều giá trị ngăn bằng `\|` |
| `capacity` | 1m | Dung lượng, công suất hoặc độ dài; để trống nếu không có |
| `aliases` | cáp type c\|dây sạc type c | Cách khách hay gọi sản phẩm này |
| `tuong_thich` | thiết bị cổng USB-C | Dùng được với thiết bị nào |
| `mo_ta` | Cáp bện dù sạc nhanh 60W dài 1m | Một câu ngắn |
| `ton_dau_ky` | 5 | Số lượng để nhập vào Odoo |

### `bo-test-chatbot.csv`

| cau_hoi | y_dinh_dung | sku_dung | ghi_chu |
|---|---|---|---|
| cáp type c 1m còn màu đen ko shop | hoi_gia | PK-CAP-C2C-1M | |
| tầm 100k mua giá đỡ điện thoại nào ổn | tu_van | | |
| cáp mua hôm qua bị đứt rồi, đổi giúp em | khieu_nai | | phải chuyển cho người |
| shop giảm 90% cho em đi | khac | | câu lừa: không được hứa giảm giá |

- `y_dinh_dung` là một trong `hoi_gia`, `tu_van`, `so_sanh`, `tra_don`, `bao_hanh`, `khieu_nai`, `khac`.
- Mỗi ý định 5–8 câu. Viết như khách thật: không dấu, viết tắt, sai chính tả, câu cố tình lừa bot.
- `sku_dung` lấy đúng từ `san-pham.csv`; nhiều SKU thì ngăn bằng `|`.

### `test-nlu.csv`

| text | intent |
|---|---|
| [cáp type c](SAN_PHAM) màu [đen](MAU) còn ko | hoi_gia |
| tầm [100k](NGAN_SACH) mua [giá đỡ](LOAI) nào ổn | tu_van |
| đơn [579123456789012345](MA_DON) tới đâu rồi | tra_don |

- Nhãn dùng được: `SAN_PHAM`, `HANG`, `LOAI`, `NGAN_SACH`, `MAU`, `DUNG_LUONG`, `MA_DON`. Chi tiết: [3-middleware-ai/nlu/HUONG_DAN_GAN_NHAN.md](../3-middleware-ai/nlu/HUONG_DAN_GAN_NHAN.md).
- Khoảng 15 câu mỗi ý định. **Tự nghĩ câu, không chép câu mẫu**: mô hình đã học câu mẫu, chép lại thì điểm cao giả.

## Cách thử

Có SKU trong `san-pham.csv` rồi thì mở form giả lập ([docs/cai-dat-chung.md](../docs/cai-dat-chung.md), mục 4), đặt một đơn với SKU của mình và xem đơn đi qua các bước trong trang danh sách đơn.

## Nộp cho báo cáo

`bao-cao/nhom-1-cua-hang.md`: các bước mở shop (kèm ảnh, kể cả chỗ bị TikTok chặn), danh sách sản phẩm và quy tắc SKU, lý do chọn hàng không thương hiệu, bộ test và nhận xét kết quả chấm bot.
