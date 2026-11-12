# Nhóm việc 1: Cửa hàng và giao diện demo

## Bối cảnh

Đồ án: bán hàng qua chat cho một shop đồ công nghệ trên TikTok Shop. Hệ thống phía sau (middleware n8n, chatbot AI, Odoo) đã có. TikTok Shop chỉ cấp API cho doanh nghiệp có giấy phép, nên khi demo, **một trang web đóng vai TikTok Shop**: khách xem hàng, chat với shop, đặt mua, theo dõi đơn. Trang web gọi bộ API JSON có sẵn (`/webhook/demo/...`), và API đó đưa mọi thứ vào hệ thống y như TikTok thật.

Nhóm việc này lo **mọi thứ khách hàng nhìn thấy**: giao diện demo, dữ liệu sản phẩm, minh chứng shop TikTok thật, và bộ câu test để chấm chatbot.

## Đồ án cần gì từ nhóm này

1. **Giao diện demo (shop giả lập)**: trang web chạy được trên trình duyệt, dùng để demo cho thầy.
2. **Dữ liệu sản phẩm** `cua-hang/san-pham.csv`: danh mục **HDX Tech**, 25 sản phẩm laptop và phụ kiện máy tính (đã có, khớp web giả lập).
3. **Bộ câu test**: `cua-hang/bo-test-chatbot.csv` (30–50 câu) và `cua-hang/test-nlu.csv` (khoảng 100 câu đã gán nhãn).
4. **Minh chứng TikTok**: ảnh mở shop, 2–3 sản phẩm nháp, ảnh chỗ TikTok đòi giấy phép doanh nghiệp.

## Hiện trạng

- API cho giao diện **đã chạy** (hợp đồng: [contracts/internal/demo_api.md](../../contracts/internal/demo_api.md)).
- Chatbot đang dùng **dữ liệu sản phẩm giả có tên hãng** (Anker, iPhone...). Khi có `san-pham.csv`, nhóm 3 nạp dữ liệu mới vào chatbot; API `GET /san-pham` sẽ trả danh sách mới.
- `san-pham.csv` mới có 1 dòng ví dụ. Bộ câu test mới có câu mẫu.
- Chưa có giao diện.

## Kết nối với nhóm khác

| Hướng | Thứ gì | Với ai |
|---|---|---|
| Ra | `san-pham.csv` | Nhóm 2 nhập vào Odoo; nhóm 3 nạp vào chatbot |
| Ra | `bo-test-chatbot.csv`, `test-nlu.csv` | Nhóm 3 chấm chatbot và PhoBERT |
| Vào | API demo (`/webhook/demo/...`), mã nhóm | Nhóm 3 cung cấp |
| Ra | Giao diện chạy được | Nhóm 4 quay video demo |

## Triển khai: giao diện demo

### Công nghệ

- **React + Vite**, chỉ có frontend. Không cần backend riêng, không cần database riêng, không gọi AI trực tiếp: các phần đó hệ thống đã có, web chỉ gọi 7 API.
- Code đặt ở thư mục `giao-dien-demo/` trong repo.
- Giao diện kiểu **điện thoại dọc** (giống app TikTok Shop), tiếng Việt, giá dạng `199.000đ`.

**Hướng dẫn làm từng bước, kèm code gọi API và câu giao việc cho AI: [huong-dan-web-gia-lap.md](huong-dan-web-gia-lap.md).**

### Các màn hình

**Màn khách hàng**

1. **Nhập mã nhóm** (lần đầu): lưu vào `localStorage`, gửi trong header `x-ma-nhom` ở mọi lần gọi API.
2. **Danh sách sản phẩm** (`GET /san-pham`): thẻ sản phẩm có tên, giá, màu, còn bao nhiêu; lọc theo `category`; ô tìm kiếm. Hết hàng (`stock = 0`) thì làm mờ, không cho mua.
3. **Chi tiết sản phẩm**: thông số (`specs`), bảo hành, máy dùng được (`compatible`), chọn số lượng, nút **Thêm vào giỏ** và **Chat với shop**.
4. **Chat với shop** (`POST /chat`): khung chat như tin nhắn; giữ một `conversation_id` cho cả phiên; hiện "đang trả lời..." trong lúc chờ (1–3 giây). Câu trả lời có `skus` hoặc `upsell` thì hiện thẻ sản phẩm nhỏ có nút **Mua**. `handed_off = true` thì hiện "Nhân viên shop sẽ trả lời bạn".
5. **Giỏ hàng và đặt mua** (`POST /don`): danh sách món, số lượng, tổng tạm tính; bấm **Đặt hàng** thì gọi API, hiện mã đơn và tổng tiền hệ thống tính. Lỗi (`ok: false`) thì hiện `loi`.
6. **Đơn của tôi** (`GET /don`): mỗi đơn có thanh tiến trình theo `lich_su`: Đã đặt → Shop đã nhận (`odoo_created`) → Đã đóng gói (`shipping_arranged`) → Đang giao (`IN_TRANSIT`) → Đã giao (`DELIVERED`); hiện mã vận đơn. Đơn hủy hiện màu xám.
7. **Thông báo** (`GET /tin-nhan`): tin shop tự gửi (báo đang giao, mã vận đơn); gọi lại 5 giây một lần, có chấm đỏ khi có tin mới.

**Màn người bán** (tab riêng, dùng khi demo)

8. **Đơn hàng**: bảng các đơn (`GET /don`), mỗi đơn có nút theo trạng thái: **Đã đóng gói** (`dong_goi`), **Giao cho vận chuyển** (`dang_giao`), **Đã giao** (`da_giao`), **Hủy** (`huy_don`), gọi `POST /don/viec`. Bấm xong thì tải lại danh sách sau 3–5 giây (hệ thống chạy nền).
9. **Số liệu hôm nay** (`GET /kpi`): vài ô số: tin nhắn, thời gian trả lời trung bình, tỉ lệ đúng giá, số đơn.

### Kịch bản demo giao diện phải chạy được

1. Khách mở shop, hỏi bot "cáp type c còn không" → bot trả giá đúng, mời mua kèm.
2. Khách bấm Mua món bot gợi ý → đặt đơn → thấy mã đơn.
3. Chuyển sang màn người bán → bấm Đã đóng gói → Giao cho vận chuyển.
4. Quay lại màn khách → Đơn của tôi hiện "Đang giao" và mã vận đơn; Thông báo có tin shop báo mã vận đơn.
5. Khách nhắn "hàng bị lỗi, tôi muốn trả" → bot chuyển cho nhân viên.

## Triển khai: dữ liệu và minh chứng

- **`san-pham.csv`**: cột và quy tắc ở [cua-hang/README.md](../../cua-hang/README.md). SKU theo quy tắc `<NHÓM>-<LOẠI>-<MẪU>-<BIẾN THỂ>` ([contracts/README.md](../../contracts/README.md)). Tên không ghi hãng.
- **Bộ câu test chatbot**: viết như khách thật (không dấu, viết tắt, câu lừa bot); mỗi ý định 5–8 câu; đáp án đúng là ý định và SKU.
- **Câu test NLU**: gán nhãn thực thể theo [nlu/HUONG_DAN_GAN_NHAN.md](../../nlu/HUONG_DAN_GAN_NHAN.md); tự nghĩ câu, không chép câu mẫu.
- **Minh chứng TikTok**: mở shop cá nhân ở seller-vn.tiktok.com, chụp từng bước; tạo 2–3 sản phẩm ở dạng **nháp**, không gửi duyệt; chụp trang Partner Center đòi thông tin công ty. Ảnh để Drive chung.

## Ràng buộc

- Giao diện **chỉ gọi 7 API** `https://<domain ngrok>/webhook/demo/...` (do n8n cung cấp). Không gọi các đường khác của n8n (Router `/webhook/tiktok-events`, giao diện quản trị n8n), không gọi Odoo, không kết nối PostgreSQL, không gọi AI. Lý do: mọi đơn và tin nhắn phải đi qua middleware thì mới có chữ ký, chống trùng, soát giá, tạo đơn Odoo, ghi log cho KPI.
- Không viết cứng mã nhóm hay địa chỉ ngrok vào code đưa lên GitHub: cho nhập ở màn đầu, hoặc để trong file cấu hình không commit.
- Không dùng ảnh có logo hãng. Ảnh sản phẩm: tự chụp, hình minh họa theo loại hàng, hoặc biểu tượng.
- Không thêm thư viện trả phí hay dịch vụ cần thẻ.

## Xong khi

- [ ] Chạy giao diện bằng một lệnh, hoặc mở link GitHub Pages, thấy đúng danh sách sản phẩm từ API.
- [ ] Đi trọn 5 bước của kịch bản demo ở trên mà không lỗi.
- [ ] Sau khi đặt đơn và đẩy các bước, trang danh sách đơn giả lập (`/webhook/gia-lap-don?ma=...`) và Odoo khớp với giao diện.
- [ ] `san-pham.csv` có 10–20 món; bộ câu test đủ số lượng; ảnh minh chứng có trong Drive.

## File liên quan

- [contracts/internal/demo_api.md](../../contracts/internal/demo_api.md): toàn bộ API giao diện gọi (bắt buộc đưa cho AI)
- [cua-hang/README.md](../../cua-hang/README.md): cột của `san-pham.csv` và hai bộ câu test
- [contracts/README.md](../../contracts/README.md): quy tắc SKU
- [nlu/HUONG_DAN_GAN_NHAN.md](../../nlu/HUONG_DAN_GAN_NHAN.md): cách gán nhãn câu test NLU

## Câu giao việc mẫu cho AI

Câu giao việc cho từng bước nằm cuối [huong-dan-web-gia-lap.md](huong-dan-web-gia-lap.md).
