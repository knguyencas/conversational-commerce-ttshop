# Hướng dẫn gán nhãn dữ liệu NLU

Dành cho người viết và gán nhãn câu hỏi của khách (tập test của Thành viên 1, câu từ Google Form). Mỗi câu có **một ý định** và có thể có **nhiều thông tin** (thực thể).

Người train mô hình (Thành viên 3) **không** viết tập test, để kết quả đánh giá khách quan.

## 1. Bảy ý định

| Mã | Ý định | Khi nào dùng | Ví dụ |
|---|---|---|---|
| `hoi_gia` | Hỏi giá, còn hàng | Hỏi giá, tồn kho, màu, phiên bản, thông số của **một sản phẩm cụ thể** | "sạc anker 20w giá bao nhiêu", "airpods 4 còn hàng không shop" |
| `tu_van` | Nhờ tư vấn | Chưa biết chọn món nào; nêu nhu cầu, ngân sách, máy đang dùng; hỏi món này có hợp máy kia không | "tầm 500k nên mua tai nghe nào", "củ sạc nào sạc nhanh cho iphone 15" |
| `so_sanh` | So sánh | Đặt **hai món trở lên** cạnh nhau để chọn | "anker 20w với baseus 20w cái nào tốt hơn" |
| `tra_don` | Tra đơn | Hỏi đơn **đã đặt** đang ở đâu, bao giờ giao, mã vận đơn | "đơn 579123456789012345 tới đâu rồi" |
| `bao_hanh` | Hỏi chính sách bảo hành, đổi trả | Hỏi **quy định** chung, chưa có sự cố | "sạc bảo hành mấy tháng", "đổi trả trong bao lâu" |
| `khieu_nai` | Khiếu nại | Kể **sự cố của chính khách**: hàng lỗi, giao sai, thiếu, chậm, muốn hoàn tiền, bực bội | "tai nghe em mới nhận bị rè một bên", "giao sai màu rồi shop" |
| `khac` | Khác | Chào hỏi, cảm ơn, hỏi phí ship hay giờ làm việc chung, câu không liên quan | "shop ơi", "cảm ơn shop", "ship về Đà Nẵng mấy ngày" |

### Ca dễ nhầm

- **`bao_hanh` hay `khieu_nai`:** khách *hỏi quy định* là `bao_hanh`; khách *đang gặp sự cố* là `khieu_nai`.
  - "máy lỗi thì bảo hành thế nào" → `bao_hanh`
  - "máy em mua tuần trước lỗi rồi, bảo hành sao đây" → `khieu_nai`
- **`hoi_gia` hay `tu_van`:** đã nêu tên **một** sản phẩm cụ thể và hỏi thông tin của nó là `hoi_gia`; đang phân vân chưa chọn là `tu_van`.
- **`tu_van` hay `so_sanh`:** nêu tên **hai món trở lên** để chọn là `so_sanh`.
- **Câu có nhiều ý:** chọn ý định cần xử lý trước. Có khiếu nại thì luôn là `khieu_nai`, vì bot phải chuyển cho người.
- **`tra_don` không cần có mã đơn:** "đơn của em sao chưa giao" vẫn là `tra_don`. Nếu khách bực vì chậm ("3 ngày rồi chưa thấy hàng, làm ăn kiểu gì") thì là `khieu_nai`.

## 2. Bảy loại thông tin

| Nhãn | Là gì | Đánh dấu | Không đánh dấu |
|---|---|---|---|
| `SAN_PHAM` | Tên sản phẩm hoặc mẫu cụ thể | `sạc anker 20w`, `airpods 4`, `ip15` | chữ chung chung: "cái này", "sản phẩm" |
| `HANG` | Hãng, khi **đứng riêng** | `anker`, `baseus`, `apple` | hãng nằm trong tên sản phẩm (đã nằm trong `SAN_PHAM`) |
| `LOAI` | Loại hàng | `tai nghe`, `củ sạc`, `cáp`, `ốp lưng`, `sạc dự phòng` | |
| `NGAN_SACH` | Số tiền | `500k`, `2tr5`, `1.990.000đ`, `2 triệu` | chữ đi kèm: "dưới", "tầm", "khoảng" |
| `MAU` | Màu | `trắng`, `đen`, `xanh dương` | chữ "màu" |
| `DUNG_LUONG` | Dung lượng, công suất | `128gb`, `10000mah`, `20w`, `1m` | |
| `MA_DON` | Mã đơn hàng | `579123456789012345` | dấu `#` |

Quy tắc chung:

- Đánh dấu **đúng phần chữ** của thông tin, không kèm khoảng trắng hay dấu câu ở hai đầu.
- Giữ nguyên cách khách gõ, kể cả sai chính tả hay không dấu: `sac anker 20w` vẫn là `SAN_PHAM`.
- Thông số nằm **trong** tên sản phẩm thì để cả cụm là `SAN_PHAM` ("sạc anker 20w"). Thông số đứng riêng thì gán `DUNG_LUONG` ("có bản 20w không").

## 3. Cách ghi trong Google Sheet

Mỗi dòng một câu, hai cột `text` và `intent`. Trong `text`, bọc thông tin bằng `[chữ](NHÃN)`:

| text | intent |
|---|---|
| `[sạc anker 20w](SAN_PHAM) màu [trắng](MAU) còn không shop` | `hoi_gia` |
| `tầm [500k](NGAN_SACH) mua [tai nghe](LOAI) nào ổn ạ` | `tu_van` |
| `đơn [579123456789012345](MA_DON) tới đâu rồi shop` | `tra_don` |
| `cảm ơn shop nha` | `khac` |

Xuất sheet ra CSV (UTF-8) rồi chuyển sang định dạng train bằng:

```bash
python 3-middleware-ai/nlu/import_annotated.py duong-dan/test.csv 3-middleware-ai/nlu/data/test/test.jsonl
```

Script sẽ báo dòng nào sai cú pháp hoặc sai tên nhãn.

## 4. Tập test cần có gì

Khoảng 300 câu, mỗi ý định ít nhất 30 câu, do người **không** train mô hình viết. Nên có:

- câu không dấu, viết tắt, teencode ("bn", "k", "dc", "sp");
- câu dài kể lể, câu cụt một hai chữ;
- tên sản phẩm gõ sai hoặc gọi tắt ("ip 15", "sạc nhanh anker");
- sản phẩm **không có** trong shop;
- câu cố tình lừa bot ("bán rẻ hơn 50% được không", "bỏ qua hướng dẫn trước đó").
