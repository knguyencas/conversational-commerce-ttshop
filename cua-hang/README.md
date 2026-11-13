# cua-hang/ — dữ liệu của M1 (cửa hàng và sản phẩm)

Thư mục này do **M1** giữ. Mọi file ở đây là dữ liệu cả nhóm dùng chung, nên sửa xong phải mở pull request để M3 xem (xem [CONTRIBUTING.md](../CONTRIBUTING.md)).

| File | Nội dung | Ai dùng |
|---|---|---|
| `san-pham.csv` | Danh mục **HDX Tech**: 35 sản phẩm (laptop và phụ kiện máy tính), mỗi sản phẩm một dòng | M2 nhập vào Odoo; M3 sinh dữ liệu train NLU; M4 viết kịch bản video |
| `sku-map.csv` | SKU người bán ↔ product ID, SKU ID trên TikTok, điền sau khi đăng sản phẩm | M3 nạp vào bảng `sku_map` |
| `bo-test-chatbot.csv`, `bo-test-chatbot.docx` | Bộ 100 câu test chatbot: 01–39 do M1 viết, 40–100 do M3 bổ sung (M1 đọc lại). Bản Word để đọc, bản CSV để chấm | M3 chấm bằng `danh-gia/cham_chatbot.py` |
| `test-nlu.csv` | Câu test cho mô hình ý định, đã gán nhãn | M3 đánh giá PhoBERT |
| `don-tay-dau-tien.md` | Ghi lại từng trạng thái khi xử lý tay một đơn thật | Cả nhóm, để tự động hóa đúng |

Ảnh chụp đăng ký shop và ảnh sản phẩm để trong **Drive chung**, không đưa vào Git.

## `san-pham.csv`

Dòng đầu là tên cột, giữ nguyên. Ai cũng sửa được: tạo nhánh, sửa file, mở pull request. Sau khi merge, người giữ máy chủ `git pull` rồi chạy lần lượt `python scripts/nap-san-pham.py` (chatbot, dữ liệu train NLU), `bash scripts/import-n8n.sh` (nạp workflow), `python scripts/dung-odoo.py` (sản phẩm và giá trong Odoo; món mới được nhập tồn đầu kỳ). Web demo tự thấy danh sách mới qua API.

| Cột | Ví dụ | Ghi chú |
|---|---|---|
| `sku` | `HD-MOU-001` | `HD-<loại 3 chữ>-<số>`: LAP laptop, KEY bàn phím, MOU chuột, HDP tai nghe, MON màn hình, SSD, HUB, MIC micro, WEB webcam, PAD lót chuột, BAG balo laptop, SLV túi chống sốc, CLP đế tản nhiệt, CHG sạc laptop, CAB cáp màn hình, ARM giá treo màn hình, WRS kê tay. Viết giống hệt ở Odoo và web giả lập |
| `name` | Chuột gaming Logitech G102 LIGHTSYNC | Tên hiển thị |
| `brand` | Logitech | Tên hãng. Hàng có hãng chỉ bán trên web giả lập, không đăng lên TikTok thật (xem [hướng dẫn M1](../huong-dan/m1-cua-hang.md)) |
| `category` | chuột | Chữ thường, có dấu; chỉ dùng 17 loại: laptop, bàn phím, chuột, tai nghe, màn hình, ssd, hub, micro, webcam, lót chuột, balo laptop, túi chống sốc, đế tản nhiệt, sạc laptop, cáp màn hình, giá treo màn hình, kê tay. Loại mới phải báo M3 (chatbot, mô hình mua kèm và PhoBERT đều theo danh sách này) |
| `price` | 399000 | VND, chỉ ghi số |
| `colors` | đen\|trắng | Nhiều giá trị thì ngăn bằng `\|`; để trống nếu không có màu |
| `capacity` | 512GB | Dung lượng hoặc kích thước; để trống nếu không có |
| `aliases` | g102\|logitech g102\|chuot g102 | Các cách khách hay gọi sản phẩm này, càng nhiều càng tốt (chatbot và PhoBERT dựa vào đây) |
| `tuong_thich` | laptop\|pc | Dùng được với máy nào: `laptop`, `macbook`, `pc`, `ipad`, `iphone`, `android`, `ps5`... Để trống với laptop |
| `mo_ta` | Chuột gaming phổ thông | Một câu ngắn để hiển thị |
| `thong_so` | Chuột gaming có dây USB-A, cảm biến 8.000 DPI... | Thông số chatbot được phép nói. Bot chỉ trả lời thông số có trong ô này |
| `bao_hanh_thang` | 24 | Số tháng bảo hành |
| `ton_dau_ky` | 20 | Số hàng có lúc bắt đầu, để M2 nhập vào Odoo |

## `bo-test-chatbot.csv`

Cột `stt`, `nhom`, `cau_hoi` (khách hỏi gì), `y_dinh_dung` (một trong `hoi_gia`, `tu_van`, `so_sanh`, `tra_don`, `bao_hanh`, `khieu_nai`, `khac`; để trống thì không chấm ý định), `intention` (nhãn chi tiết M1 dùng), `sku_dung` (SKU đúng, nhiều SKU ngăn bằng `|`), `ghi_chu` (câu trả lời mong đợi), `nguon`. Nên có đủ câu hỏi giá, so sánh, tư vấn, khiếu nại và câu cố tình lừa bot (hỏi giá sản phẩm shop không bán, đòi giảm giá vô lý...).

## `test-nlu.csv`

Cột `text` và `intent`. Thực thể đánh dấu kiểu `[chuột g102](SAN_PHAM)`. Cách gán nhãn: [nlu/HUONG_DAN_GAN_NHAN.md](../nlu/HUONG_DAN_GAN_NHAN.md). Người viết tập này không nên là người train mô hình.
