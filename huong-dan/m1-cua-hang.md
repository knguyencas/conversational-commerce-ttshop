# M1: cửa hàng TikTok và dữ liệu sản phẩm

Làm [cài đặt chung](00-cai-dat-chung.md) trước. Thư mục của M1 trong repo: [`cua-hang/`](../cua-hang/).

## Việc của M1 (không tốn tiền)

| Mã | Việc | Xong khi |
|---|---|---|
| M1-01 | **Mở shop TikTok cá nhân** ở seller-vn.tiktok.com: CCCD, tài khoản ngân hàng cùng họ tên, liên kết tài khoản TikTok, định danh VNeID nếu được hỏi. **Chụp ảnh từng bước** | Shop được duyệt, ảnh để trong Drive chung |
| M1-02 | **Danh sách sản phẩm HDX Tech** trong `cua-hang/san-pham.csv` (đã có 25 sản phẩm theo web giả lập). Kiểm tra giá, thông số trong cột `thong_so`, thêm cách gọi tắt vào cột `aliases` | File đủ cột, M3 duyệt pull request |
| M1-03 | Trong Seller Center, tạo **2–3 sản phẩm ở dạng nháp** (không gửi duyệt) để chụp minh chứng cho báo cáo | Có ảnh chụp màn hình |
| M1-06 | **Bộ 100 câu test chatbot** `cua-hang/bo-test-chatbot.docx` (và `.csv`): câu 01–39 của M1, câu 40–100 M3 bổ sung. **Đọc lại câu 40–100**, sửa hoặc thay câu thấy không tự nhiên | M1 xác nhận, M3 chấm được |
| M1-07 | **Viết câu test cho mô hình ý định** trong `cua-hang/test-nlu.csv`, gán nhãn theo [nlu/HUONG_DAN_GAN_NHAN.md](../nlu/HUONG_DAN_GAN_NHAN.md) | Khoảng 100 câu đã gán nhãn |
| M1-08 | Khi M3 gửi link ủy quyền app (sau khi shop duyệt), **bấm đồng ý**. Chỉ chủ shop làm được | M3 xác nhận có token |
| M1-10 | Chấm bot bằng bộ test sau mỗi lần M3 sửa, ghi lại kết quả | Có bảng kết quả chấm |

Cách làm từng file: [cua-hang/README.md](../cua-hang/README.md).

## Danh mục HDX Tech và TikTok thật

Shop demo là **HDX Tech**: laptop và phụ kiện máy tính có hãng (ASUS, Logitech, Sony...), bán trên **web giả lập**. TikTok chỉ cho đăng hàng mang tên hãng khi có thư ủy quyền của hãng hoặc nhà phân phối, nên:
- Không đăng danh mục HDX Tech lên TikTok thật.
- Phần minh chứng TikTok (M1-03): tạo 2–3 sản phẩm **nháp** không thương hiệu (ô Thương hiệu chọn **Không có thương hiệu**), ảnh tự chụp, không để lộ logo, chỉ để chụp màn hình cho báo cáo.
- Báo cáo ghi rõ: hệ thống chạy bằng chế độ giả lập vì TikTok không cấp Open API cho shop cá nhân và không cho đăng hàng có hãng khi chưa có ủy quyền.

## Thử hệ thống với sản phẩm của mình

Khi `cua-hang/san-pham.csv` đã có SKU, mở form giả lập (mục 4 trong [cài đặt chung](00-cai-dat-chung.md)), đặt thử một đơn với SKU của mình và xem đơn đi qua các bước trong trang danh sách đơn. Thấy gì lạ thì ghi vào sheet và báo M3.

## Nộp cho báo cáo

Viết `bao-cao/m1-cua-hang.md`: các bước mở shop (kèm ảnh), danh sách sản phẩm HDX Tech và quy tắc SKU, lý do dùng web giả lập thay cho đăng hàng thật, bộ test và kết quả chấm bot.
