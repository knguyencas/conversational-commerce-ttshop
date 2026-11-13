# Sửa web HDX Tech để nối vào hệ thống

Tài liệu cho người làm web giả lập, áp dụng cho code đang có ở nhánh `feature/hdx-tech-shop-huuduc` (folder `HDX-Tech-Shop-HuuDuc/`). Không làm lại từ đầu: giữ phần nhìn, thay phần dữ liệu và thêm các màn còn thiếu.

Khi giao việc cho AI, đính kèm **3 file** này cùng code hiện tại:

1. `docs/nhom-viec/sua-web-hdx.md` (file này): phải sửa gì, quy tắc
2. `docs/nhom-viec/huong-dan-web-gia-lap.md`: chi tiết từng màn hình, code `api.js`, bảng trạng thái đơn
3. `contracts/internal/demo_api.md`: dạng dữ liệu vào và ra của 7 API

## 1. Mục tiêu

Nhóm đã bỏ phương án đăng bán trên TikTok Shop thật. **Web này là nơi duy nhất khách hàng nhìn thấy khi demo**: nó đóng vai app TikTok Shop của shop HDX Tech. Khi demo, thầy phải thấy được trọn luồng:

> Khách xem sản phẩm → bấm Chat hỏi shop → chatbot AI trả lời đúng giá, tồn kho và mời mua kèm → khách đặt đơn → người bán đẩy đơn qua đóng gói, giao hàng → khách thấy đơn đổi trạng thái và nhận tin báo mã vận đơn → khách khiếu nại thì bot chuyển nhân viên.

Phía sau web, mọi thứ chạy thật trên máy chủ của nhóm: middleware n8n, chatbot AI, Odoo, PostgreSQL, KPI. Web chỉ là màn hình; nó **không tự xử lý gì**, mọi dữ liệu lấy từ API và mọi hành động gửi vào API.

## 2. Hiện trạng và chỗ lệch

| Phần | Code hiện tại | Phải thành |
|---|---|---|
| Sản phẩm | File cứng `src/data/products.js`, đọc qua server Express `localhost:5000` | Lấy từ `GET /san-pham` (giá, tồn kho thật, trừ theo đơn đã đặt) |
| Backend | Folder `backend/` (Express, cài cả mongoose) | **Xóa.** n8n là backend |
| Đặt hàng | Tự sinh mã `HDX...` trên trình duyệt, không gửi đi đâu | Gọi `POST /don`, hiện mã đơn và tổng tiền hệ thống trả về |
| Chat | Chưa có | Màn chat gọi `POST /chat`, mở từ trang sản phẩm |
| Đơn của tôi, Thông báo | Chưa có | `GET /don`, `GET /tin-nhan` |
| Màn người bán, KPI | Chưa có | `GET /don`, `POST /don/viec`, `GET /kpi` |
| Bố cục | Kiểu web máy tính | Kiểu **app điện thoại** (xem mục 4) |
| Số liệu trang trí | Giá cũ, % giảm, số sao, "đã bán", flash sale đếm ngược | Bỏ: không có trong hệ thống, lệch với giá chatbot báo |
| Folder | `HDX-Tech-Shop-HuuDuc/` | `giao-dien-demo/` |

## 3. Kiến trúc đích

```
Trình duyệt: web React (giao-dien-demo/)
   │  fetch https://<domain ngrok>/webhook/demo/...
   │  header x-ma-nhom: <mã nhóm>
   ▼
n8n trên máy chủ nhóm (đây là backend của web)
   ├─ /san-pham ─────────▶ dữ liệu sản phẩm, tồn kho trừ theo đơn
   ├─ /chat ─────────────▶ Chatbot: hiểu ý định → tra dữ liệu → AI viết câu → soát giá → mời mua kèm
   ├─ /don (POST) ───────▶ sự kiện đơn có chữ ký → Router → tạo đơn Odoo
   ├─ /don/viec ─────────▶ đóng gói, giao hàng, hủy → báo khách
   ├─ /don, /tin-nhan ───▶ PostgreSQL
   └─ /kpi ──────────────▶ số liệu hôm nay
```

## 4. Quy tắc bắt buộc

1. **Chỉ gọi 7 API** `/webhook/demo/...` trong `contracts/internal/demo_api.md`, qua một file duy nhất `src/api.js` (chép từ mục 4 của `huong-dan-web-gia-lap.md`). Không gọi `localhost:5000`, không gọi Odoo, PostgreSQL, AI hay đường nào khác của n8n.
2. **Không backend, không database riêng.** Không Express, MongoDB, Firebase. Trạng thái phía trình duyệt (mã nhóm, khách đang dùng, `conversation_id`, giỏ hàng) để trong `localStorage`.
3. **Mọi con số kinh doanh lấy từ API**: tên, giá, tồn kho, màu, thông số, bảo hành, mã đơn, tổng tiền, trạng thái đơn. Không viết cứng, không tự tính tổng tiền cuối cùng (tạm tính trong giỏ thì được).
4. **SKU là khóa.** Mọi chỗ (giỏ hàng, thẻ sản phẩm trong chat, đặt đơn) dùng `sku` dạng `HD-MOU-001`, không dùng `id` số.
5. **Không đưa bí mật lên GitHub**: domain ngrok để trong `giao-dien-demo/.env.local`; mã nhóm do người dùng nhập ở màn đầu. Không commit `.env.local`, `node_modules/`, `dist/`.
6. **Không dùng logo của shop thật hay của TikTok** (FPT Shop, TikTok...). Tên hãng sản phẩm (ASUS, Logitech...) thì được, vì có trong dữ liệu.
7. **Thứ trang trí thì tự do**: ảnh theo loại hàng, banner, màu, icon, chữ giới thiệu shop. Chỉ không được bịa con số như mục 3.
8. **0 đồng**: không thư viện hay dịch vụ trả phí.
9. Đổi dạng dữ liệu của API thì **không tự làm**: nhắn người giữ máy chủ sửa `contracts/` và n8n trước.

## 5. Giữ, bỏ, sửa, thêm

### Giữ

- `Header`, `ProductCard`, `CartDrawer`, `ProductDetail`, `Checkout` (phần nhìn), `App.css`, `index.css`, icon `lucide-react`.

### Bỏ

- Folder `backend/`.
- `src/data/products.js` (thay bằng `src/lib/anh.js` chỉ chứa ảnh theo loại hàng).
- Giá cũ, % giảm, số sao, "đã bán", flash sale đếm ngược, câu "Ưu đãi đến 50%".
- Thư viện `axios` (dùng `fetch` trong `api.js`).

### Sửa

**a. Dữ liệu sản phẩm.** Đổi tên trường theo API:

| Trong `products.js` cũ | Trong `GET /san-pham` | Ghi chú |
|---|---|---|
| `id` | `sku` | Khóa duy nhất |
| `name` | `name` | |
| `category` (`"Chuột"`) | `category` (`"chuột"`, chữ thường) | Viết hoa chữ đầu khi hiện |
| `price` | `price` | Hiện dạng `399.000đ` |
| `oldPrice`, `rating`, `sold` | (không có) | Bỏ |
| `image` | (không có) | Chọn ảnh theo `category` trong `src/lib/anh.js` |
| `description` | `specs` | |
| | `brand`, `stock`, `colors[]` (màu và tồn từng màu), `warranty_months`, `compatible[]` | Thêm vào thẻ và trang chi tiết |

`stock = 0` thì làm mờ, ghi "Tạm hết", không cho thêm giỏ. Chọn màu thì số lượng không vượt tồn của màu đó.

**b. Đặt hàng (`Checkout.jsx`).** Bấm Xác nhận gọi `datDon(buyer_user_id, items)`, với `items = [{ sku, quantity }]`. Thành công thì hiện `order_id` và `total` API trả về, xóa giỏ, chuyển sang Đơn của tôi. Lỗi thì hiện `loi` (vd "chỉ còn 3"). Ô họ tên, SĐT, địa chỉ giữ cho giống thật nhưng không bắt buộc, vì API không nhận các trường này. Chỉ để một cách thanh toán "Thanh toán khi nhận hàng".

**c. Bố cục kiểu app điện thoại.** Web TikTok Shop trên máy tính không có chat, chỉ app điện thoại có, nên web demo theo app:

- Toàn bộ nội dung nằm trong khung rộng tối đa khoảng 430px, căn giữa màn hình; trên điện thoại thì tràn đủ màn.
- Thanh tab dưới cùng: **Trang chủ · Tin nhắn · Đơn của tôi · Tôi**. Màn người bán là đường riêng `/nguoi-ban`, mở ở tab trình duyệt khác khi demo.
- Trang chi tiết sản phẩm có thanh dưới cố định: **Chat · Thêm vào giỏ · Mua ngay**.

### Thêm

| # | Màn | API | Chi tiết |
|---|---|---|---|
| 1 | Nhập mã nhóm, chọn khách mẫu ("Khách A", "Khách B") | `GET /san-pham` để thử mã | `huong-dan-web-gia-lap.md` mục 5, 6.1 |
| 2 | **Chat với shop** | `POST /chat` | Mục 6.4. Mở từ nút Chat ở trang sản phẩm: khung chat hiện sẵn **thẻ sản phẩm đang xem** có nút Gửi; bấm Gửi thì hiện thẻ đó như một tin của khách và gửi câu "Shop ơi tư vấn giúp mình <tên sản phẩm>" (bot nhận ra sản phẩm theo tên) |
| 3 | Thẻ mua kèm trong chat | trường `skus`, `upsell` của `/chat` | Dưới câu trả lời hiện thẻ nhỏ (tên, giá) có nút **Thêm vào giỏ**. Đây là phần "AI mời mua kèm" thầy cần thấy |
| 4 | Đơn của tôi | `GET /don` | Mục 6.6: thanh tiến trình, mã vận đơn, nút "Hỏi shop về đơn này" |
| 5 | Thông báo | `GET /tin-nhan` | Mục 6.7: gọi lại 5 giây một lần, chấm đỏ khi có tin mới |
| 6 | Màn người bán | `GET /don`, `POST /don/viec`, `POST /chat` với `/reset` | Mục 6.8, 6.9: nút theo bước của đơn, nút trả cuộc chat về bot |
| 7 | Số liệu hôm nay | `GET /kpi` | Mục 6.10 |

**Làm sau, chờ API:** khu "Thường được mua cùng" ở trang sản phẩm và giỏ hàng cần một API mua kèm riêng, chưa có. Khi có, người giữ máy chủ sẽ thêm vào `demo_api.md`. Trước đó mua kèm chỉ hiện trong chat.

## 6. Thứ tự làm và cách kiểm

Mỗi bước xong thì chạy thử với máy chủ đang bật, rồi commit.

| Bước | Làm | Kiểm bằng |
|---|---|---|
| 1 | Đổi folder thành `giao-dien-demo/`, xóa `backend/`, thêm `src/api.js`, `.env.local`, màn nhập mã | Nhập đúng mã thì vào được, sai mã báo "Sai mã nhóm" |
| 2 | Trang chủ, danh sách, chi tiết sản phẩm đọc từ `GET /san-pham`; bỏ số liệu trang trí; bố cục kiểu app | Thấy 25 sản phẩm, giá giống API (vd chuột G102 là 399.000đ), có "còn N" |
| 3 | Màn chat, mở từ trang sản phẩm, thẻ sản phẩm và thẻ mua kèm | Ở trang chuột G102 bấm Chat, hỏi "còn màu trắng không shop" → bot báo giá, tồn, mời lót chuột; hỏi tiếp "còn mấy cái" → bot hiểu là G102 |
| 4 | Giỏ hàng, đặt hàng qua `POST /don` | Đặt 1 đơn → thấy mã đơn dạng số dài; tồn kho G102 trên danh sách giảm |
| 5 | Đơn của tôi, Thông báo | Đơn vừa đặt hiện "Đã đặt hàng" |
| 6 | Màn người bán, KPI | Bấm Đã đóng gói → Giao cho vận chuyển; tab khách thấy "Đang giao", mã vận đơn, có thông báo mới |
| 7 | Chạy trọn kịch bản demo (`huong-dan-web-gia-lap.md` mục 8) | Không lỗi từ đầu đến cuối |

## 7. Xong khi

- [ ] Code nằm ở `giao-dien-demo/`, không còn `backend/`, `products.js`, `localhost:5000`.
- [ ] Tìm trong code không thấy domain ngrok hay mã nhóm viết cứng.
- [ ] `npm run build` và `npm run lint` không lỗi.
- [ ] Trên điện thoại (hoặc F12, chế độ điện thoại) dùng được mọi màn, không tràn ngang.
- [ ] Đi trọn kịch bản demo; danh sách đơn ở màn người bán khớp với Đơn của tôi.

## 8. Câu giao việc mẫu cho AI

Mỗi lần giao việc, đính kèm 3 file ở đầu tài liệu này và các file code liên quan.

**Bước 1**
> Tôi có web React + Vite (code đính kèm) đang đọc sản phẩm từ server Express riêng. Hãy sửa theo `sua-web-hdx.md`: đổi folder thành `giao-dien-demo/`, xóa `backend/` và `src/data/products.js`, gỡ `axios`, thêm `src/api.js` đúng như mục 4 của `huong-dan-web-gia-lap.md`, thêm `.env.local` mẫu (không commit), thêm màn Nhập mã nhóm và chọn khách mẫu lưu trong localStorage. Giữ nguyên CSS và các component hiện có. Không thêm backend, không gọi API nào ngoài 7 API trong `demo_api.md`.

**Bước 2**
> Sửa trang chủ, danh sách và chi tiết sản phẩm để đọc từ `laySanPham()` theo bảng đổi trường ở mục 5a của `sua-web-hdx.md`: dùng `sku` làm khóa, ảnh chọn theo `category` trong `src/lib/anh.js`, hiện `brand`, tồn kho, màu, `specs`, `warranty_months`, `compatible`; hết hàng làm mờ. Bỏ giá cũ, % giảm, số sao, đã bán, flash sale. Đổi bố cục sang kiểu app điện thoại theo mục 5c: khung tối đa 430px căn giữa, thanh tab dưới, trang chi tiết có thanh Chat · Thêm vào giỏ · Mua ngay.

**Bước 3**
> Làm màn Chat theo mục 6.4 của `huong-dan-web-gia-lap.md` và dòng 2, 3 trong bảng "Thêm" của `sua-web-hdx.md`: mở từ nút Chat ở trang sản phẩm với thẻ sản phẩm đang xem có nút Gửi, giữ `conversation_id` và `buyer_user_id` trong localStorage, hiện "Shop đang trả lời..." (chờ tối đa 30 giây), hiện thẻ cho `skus` và `upsell` có nút Thêm vào giỏ, xử lý `handed_off` và `silent`.

**Bước 4**
> Sửa giỏ hàng và `Checkout.jsx` theo mục 5b của `sua-web-hdx.md`: bấm Xác nhận gọi `datDon` với `items = [{ sku, quantity }]`, hiện `order_id` và `total` do API trả, lỗi hiện `loi`, xóa giỏ rồi chuyển sang Đơn của tôi. Không tự sinh mã đơn.

**Bước 5**
> Làm màn Đơn của tôi và Thông báo theo mục 6.6, 6.7 của `huong-dan-web-gia-lap.md`: lọc đơn theo khách đang dùng, thanh tiến trình theo bảng trạng thái, tự tải lại 5 giây một lần, chấm đỏ khi có thông báo mới.

**Bước 6**
> Làm màn Người bán ở đường `/nguoi-ban` theo mục 6.8–6.10 của `huong-dan-web-gia-lap.md`: bảng đơn với nút theo bước hiện tại, nút Trả cuộc chat về bot, ô số liệu từ `GET /kpi`.

## 9. Git

1. Mở GitHub Desktop, chọn nhánh `feature/hdx-tech-shop-huuduc`.
2. **Branch → Update from main** để lấy tài liệu và dữ liệu sản phẩm mới nhất.
3. Làm từng bước ở mục 6, mỗi bước một commit có nói rõ làm gì.
4. Xong bước 2 trở đi thì mở pull request vào `main` để người giữ máy chủ xem và chạy thử. Quy trình chi tiết: [CONTRIBUTING.md](../../CONTRIBUTING.md).

## 10. Mã nhóm và domain ngrok là gì

- **Domain ngrok** (dạng `xxx.ngrok-free.dev`): địa chỉ công khai của máy chủ nhóm. Máy chủ chạy ở nhà người giữ máy, ngrok mở một đường để web ở bất kỳ đâu gọi tới được.
- **Mã nhóm**: một chuỗi ngắn (6 ký tự) do máy chủ tạo khi bật chế độ giả lập. Mọi lần gọi API phải gửi kèm trong header `x-ma-nhom`; sai hoặc thiếu thì API trả `401`. Mục đích: ai tình cờ biết domain ngrok cũng không tạo được đơn giả hay gửi tin làm tốn lượt AI miễn phí của nhóm.

Cả hai **xin người giữ máy chủ, nhận qua tin nhắn riêng**, không ghi vào code hay tài liệu trên GitHub.
