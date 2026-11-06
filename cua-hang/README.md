# cua-hang/ — dữ liệu của M1 (cửa hàng và sản phẩm)

Thư mục này do **M1** giữ. Mọi file ở đây là dữ liệu cả nhóm dùng chung, nên sửa xong phải mở pull request để M3 xem (xem [CONTRIBUTING.md](../CONTRIBUTING.md)).

| File | Nội dung | Ai dùng |
|---|---|---|
| `san-pham.csv` | Danh sách 20–30 sản phẩm, mỗi phiên bản (màu, dung lượng) một dòng | M2 nhập vào Odoo; M3 sinh dữ liệu train NLU; M4 viết kịch bản video |
| `sku-map.csv` | SKU người bán ↔ product ID, SKU ID trên TikTok, điền sau khi đăng sản phẩm | M3 nạp vào bảng `sku_map` |
| `bo-test-chatbot.csv` | Bộ 100 câu test chatbot (đang có 10 câu mẫu) | M3 chấm bằng `danh-gia/cham_chatbot.py` |
| `test-nlu.csv` | Câu test cho mô hình ý định, đã gán nhãn | M3 đánh giá PhoBERT |
| `don-tay-dau-tien.md` | Ghi lại từng trạng thái khi xử lý tay một đơn thật | Cả nhóm, để tự động hóa đúng |

Ảnh chụp đăng ký shop và ảnh sản phẩm để trong **Drive chung**, không đưa vào Git.

## `san-pham.csv`

Dòng đầu là tên cột, giữ nguyên. Dòng thứ hai là ví dụ, sửa hoặc xóa khi nhập thật.

| Cột | Ví dụ | Ghi chú |
|---|---|---|
| `sku` | `PK-SAC-ANKER20W-TRANG` | Theo quy tắc SKU trong [contracts/README.md](../contracts/README.md). Viết giống hệt ở Odoo và TikTok |
| `name` | Củ sạc Anker 20W | Tên hiển thị |
| `brand` | Anker | |
| `category` | củ sạc | Chữ thường, có dấu; dùng các nhóm: điện thoại, củ sạc, cáp, sạc dự phòng, tai nghe, ốp lưng, kính cường lực, loa bluetooth, đồng hồ thông minh, chuột, bàn phím |
| `price` | 199000 | VND, chỉ ghi số |
| `colors` | trắng\|đen | Nhiều giá trị thì ngăn bằng `\|` |
| `capacity` | 20W | Dung lượng, công suất hoặc độ dài; để trống nếu không có |
| `aliases` | sạc anker 20w\|anker 20w | Các cách khách hay gọi sản phẩm này |
| `tuong_thich` | iPhone 15\|Samsung S24 | Máy dùng được, để chatbot tư vấn phụ kiện |
| `mo_ta` | Sạc nhanh PD 20W một cổng USB-C | Một câu ngắn |
| `ton_dau_ky` | 10 | Số hàng có lúc bắt đầu, để M2 nhập vào Odoo |

## `bo-test-chatbot.csv`

Cột `cau_hoi` (khách hỏi gì), `y_dinh_dung` (một trong `hoi_gia`, `tu_van`, `so_sanh`, `tra_don`, `bao_hanh`, `khieu_nai`, `khac`), `sku_dung` (SKU khách hỏi, nếu có), `ghi_chu`. Nên có đủ câu hỏi giá, so sánh, tư vấn, khiếu nại và câu cố tình lừa bot (hỏi giá sản phẩm shop không bán, đòi giảm giá vô lý...).

## `test-nlu.csv`

Cột `text` và `intent`. Thực thể đánh dấu kiểu `[sạc anker 20w](SAN_PHAM)`. Cách gán nhãn: [nlu/HUONG_DAN_GAN_NHAN.md](../nlu/HUONG_DAN_GAN_NHAN.md). Người viết tập này không nên là người train mô hình.
