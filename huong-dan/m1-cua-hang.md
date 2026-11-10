# M1: cửa hàng TikTok và dữ liệu sản phẩm

Làm [cài đặt chung](00-cai-dat-chung.md) trước. Thư mục của M1 trong repo: [`cua-hang/`](../cua-hang/).

## Việc của M1 (không tốn tiền)

| Mã | Việc | Xong khi |
|---|---|---|
| M1-01 | **Mở shop TikTok cá nhân** ở seller-vn.tiktok.com: CCCD, tài khoản ngân hàng cùng họ tên, liên kết tài khoản TikTok, định danh VNeID nếu được hỏi. **Chụp ảnh từng bước** | Shop được duyệt, ảnh để trong Drive chung |
| M1-02 | **Làm danh sách 10–20 sản phẩm** trong `cua-hang/san-pham.csv` theo quy tắc SKU. Dữ liệu mẫu cũng được, dùng hàng **không thương hiệu** (xem dưới) | File đủ cột, M3 duyệt pull request |
| M1-03 | Trong Seller Center, tạo **2–3 sản phẩm ở dạng nháp** (không gửi duyệt) để chụp minh chứng cho báo cáo | Có ảnh chụp màn hình |
| M1-06 | **Viết 30–50 câu test chatbot** trong `cua-hang/bo-test-chatbot.csv`: hỏi giá, so sánh, tư vấn, khiếu nại, câu cố tình lừa bot | File xong, M3 chấm được |
| M1-07 | **Viết câu test cho mô hình ý định** trong `cua-hang/test-nlu.csv`, gán nhãn theo [nlu/HUONG_DAN_GAN_NHAN.md](../nlu/HUONG_DAN_GAN_NHAN.md) | Khoảng 100 câu đã gán nhãn |
| M1-08 | Khi M3 gửi link ủy quyền app (sau khi shop duyệt), **bấm đồng ý**. Chỉ chủ shop làm được | M3 xác nhận có token |
| M1-10 | Chấm bot bằng bộ test sau mỗi lần M3 sửa, ghi lại kết quả | Có bảng kết quả chấm |

Cách làm từng file: [cua-hang/README.md](../cua-hang/README.md).

## Hàng không thương hiệu

TikTok chỉ cho đăng hàng mang tên hãng (Anker, Apple, Samsung...) khi có thư ủy quyền của hãng hoặc nhà phân phối. Vì vậy:
- Ô Thương hiệu chọn **Không có thương hiệu**.
- Tên và SKU mô tả món hàng, không ghi tên hãng: `PK-CAP-C2C-1M` *Cáp sạc USB-C 1m*, `PK-OP-IP15-TRONG` *Ốp lưng trong suốt iPhone 15*, `PK-GIA-DO-DT` *Giá đỡ điện thoại để bàn*.
- Ảnh tự chụp, không lấy ảnh trên mạng, không để lộ logo hãng.
- Không đăng hàng không có thật để bán; sản phẩm để ở dạng **nháp**.

## Thử hệ thống với sản phẩm của mình

Khi `cua-hang/san-pham.csv` đã có SKU, mở form giả lập (mục 4 trong [cài đặt chung](00-cai-dat-chung.md)), đặt thử một đơn với SKU của mình và xem đơn đi qua các bước trong trang danh sách đơn. Thấy gì lạ thì ghi vào sheet và báo M3.

## Nộp cho báo cáo

Viết `bao-cao/m1-cua-hang.md`: các bước mở shop (kèm ảnh), danh sách sản phẩm và quy tắc SKU, lý do chọn hàng không thương hiệu, bộ test và kết quả chấm bot.
