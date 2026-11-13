# Hướng dẫn làm web giả lập (React + Vite)

Tài liệu cho người làm giao diện demo. Đọc hết một lần, rồi làm theo từng bước; mỗi bước có câu giao việc mẫu cho AI ở cuối file.

Đã có web HDX Tech (nhánh `feature/hdx-tech-shop-huuduc`) thì đọc [sua-web-hdx.md](sua-web-hdx.md) trước: file đó nói phải sửa gì trên code đang có.

## 0. Web này là gì, nằm ở đâu

TikTok Shop chỉ cấp API cho doanh nghiệp, nên khi demo, **web này đóng vai app TikTok Shop**: khách xem hàng, chat với shop, đặt mua, theo dõi đơn; người bán đẩy đơn qua các bước. Mọi xử lý phía sau đã có và đã chạy, web chỉ cần gọi 7 API.

```
Web giả lập (React + Vite)              ← phần cần làm
   │  chỉ gọi 7 API: https://<domain ngrok>/webhook/demo/...
   ▼
n8n (middleware, đã chạy)
   ├─ Router → M2 · Tạo đơn / Hủy đơn → Odoo (sản phẩm, giá, tồn kho, đơn)
   ├─ Chatbot: hiểu ý định → tra dữ liệu → AI viết câu → soát giá → mời mua kèm
   ├─ Đặt vận chuyển, Trạng thái đơn, báo khách
   └─ PostgreSQL: lịch sử chat, đơn, log → KPI → dashboard
```

**Không làm:** backend riêng (Express), database riêng (MongoDB), tài khoản đăng nhập thật, gọi AI trực tiếp, gọi Odoo trực tiếp. Làm những thứ đó là đi vòng qua middleware: đơn sẽ không có chữ ký, không chống trùng, không vào Odoo đúng cách, chatbot mất bước soát giá và có thể bịa giá, dashboard không thấy số liệu.

## 1. Chuẩn bị

1. Cài **Node.js** bản LTS (nodejs.org), kiểm tra bằng `node -v`.
2. Clone repo `conversational-commerce-ttshop` bằng GitHub Desktop.
3. Xin người giữ máy chủ hai thứ, **gửi riêng**: **domain ngrok** (dạng `xxx.ngrok-free.dev`) và **mã nhóm**.
4. Kiểm tra API sống: mở trình duyệt vào `https://<domain ngrok>/webhook/demo/san-pham?ma=<mã nhóm>`. Lần đầu ngrok hiện trang cảnh báo, bấm **Visit Site**. Thấy JSON `{"ok":true, "products":[...]}` là được.
   - `404`: máy chủ đang tắt hoặc chế độ giả lập đang tắt. Nhắn người giữ máy chủ.
   - `401`: sai mã nhóm.

## 2. Tạo dự án

Trong thư mục repo:

```bash
npm create vite@latest giao-dien-demo -- --template react
cd giao-dien-demo
npm install
npm install react-router-dom
npm run dev
```

Mở địa chỉ Vite in ra (thường `http://localhost:5173`). Muốn làm giao diện nhanh thì cài thêm Tailwind CSS theo hướng dẫn chính thức cho Vite.

Tạo file `giao-dien-demo/.env.local` (file này **không lên GitHub**, Vite đã chặn sẵn các file `*.local`):

```
VITE_API_BASE=https://<domain ngrok>/webhook/demo
```

Mã nhóm **không** để trong `.env.local`: biến `VITE_...` bị đóng gói vào web, ai mở web cũng đọc được. Cho người dùng nhập mã nhóm ở màn hình đầu, lưu trong `localStorage`.

## 3. Cấu trúc thư mục gợi ý

```
giao-dien-demo/src/
├── api.js                 gọi 7 API (code ở mục 4)
├── lib/
│   ├── tien.js            199000 → "199.000đ"
│   ├── trang-thai.js      mã trạng thái → chữ tiếng Việt (mục 6)
│   └── luu-tru.js         đọc/ghi localStorage: mã nhóm, khách, giỏ hàng, conversation_id
├── pages/
│   ├── NhapMa.jsx         nhập mã nhóm
│   ├── SanPham.jsx        danh sách sản phẩm
│   ├── ChiTiet.jsx        chi tiết sản phẩm
│   ├── Chat.jsx           chat với shop
│   ├── GioHang.jsx        giỏ hàng, đặt hàng
│   ├── DonCuaToi.jsx      đơn của tôi, thông báo
│   └── NguoiBan.jsx       màn người bán
└── components/            thẻ sản phẩm, bong bóng chat, thanh tiến trình đơn...
```

## 4. Code gọi API (chép nguyên vào `src/api.js`)

```js
const BASE = import.meta.env.VITE_API_BASE;

export const layMaNhom = () => localStorage.getItem('ma_nhom') || '';
export const luuMaNhom = (ma) => localStorage.setItem('ma_nhom', ma.trim());

// Gọi một API demo; trả về JSON, ném lỗi có câu tiếng Việt khi không thành công
async function goi(path, body) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-ma-nhom': layMaNhom(),
        'ngrok-skip-browser-warning': '1',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Không kết nối được máy chủ. Máy chủ có thể đang tắt.');
  }
  if (res.status === 404) throw new Error('Máy chủ chưa bật chế độ giả lập.');
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Máy chủ trả về dữ liệu lạ (kiểm tra domain ngrok).'); }
  if (res.status === 401) throw new Error('Sai mã nhóm.');
  if (!data.ok) throw new Error(data.loi || 'Có lỗi xảy ra.');
  return data;
}

export const laySanPham = () => goi('/san-pham');
export const chat = (conversation_id, buyer_user_id, text) => goi('/chat', { conversation_id, buyer_user_id, text });
export const traChatVeBot = (conversation_id) => goi('/chat', { conversation_id, text: '/reset' });
export const datDon = (buyer_user_id, items) => goi('/don', { buyer_user_id, items });
export const dayBuoc = (order_id, viec) => goi('/don/viec', { order_id, viec });
export const layDon = () => goi('/don');
export const layTinNhan = () => goi('/tin-nhan');
export const layKpi = () => goi('/kpi');
```

Dạng dữ liệu vào và ra của từng API: [contracts/internal/demo_api.md](../../contracts/internal/demo_api.md). **Đưa file này cho AI cùng với file hướng dẫn này.**

## 5. Trạng thái dùng chung (không cần backend)

| Thứ | Lưu ở đâu | Ghi chú |
|---|---|---|
| Mã nhóm | `localStorage` | Nhập ở màn đầu |
| Khách đang dùng | `localStorage`, vd `gia-lap-khach` | Cho chọn 1–2 khách mẫu ("Khách A", "Khách B") thay cho đăng nhập. Gửi đúng giá trị này làm `buyer_user_id` ở **cả chat lẫn đặt đơn**, để hệ thống nối được "chat ra đơn" và hỏi "đơn của em" |
| `conversation_id` | `localStorage`, mỗi khách một mã, vd `demo-` + chuỗi ngẫu nhiên | Giữ nguyên cho cả cuộc chat; bot nhớ ngữ cảnh theo mã này. Có nút "Cuộc chat mới" để tạo mã khác |
| Giỏ hàng | `localStorage` | Danh sách `{ sku, quantity }` |
| Danh sách đơn, tin nhắn | Không lưu | Lấy từ `GET /don`, `GET /tin-nhan` mỗi lần mở trang và tự gọi lại 5 giây một lần |

## 6. Từng màn hình

### Màn khách hàng

1. **Nhập mã nhóm**: ô nhập + nút Vào. Gọi thử `laySanPham()`; thành công thì lưu mã và chuyển sang danh sách sản phẩm.
2. **Danh sách sản phẩm** (`GET /san-pham`): lưới thẻ sản phẩm: tên, giá, các màu, "còn N". Lọc theo `category`, ô tìm theo tên. `stock = 0` thì làm mờ, ghi "Tạm hết". Không có ảnh sản phẩm: dùng biểu tượng theo `category`.
3. **Chi tiết sản phẩm**: `specs`, `warranty_months`, `compatible` (dùng được cho máy nào), chọn màu và số lượng (không vượt `stock` của màu đó). Nút **Thêm vào giỏ**, **Mua ngay**, **Hỏi shop về sản phẩm này** (mở chat và điền sẵn câu "Shop ơi <tên sản phẩm> còn không ạ").
4. **Chat với shop** (`POST /chat`):
   - Bong bóng khách bên phải, shop bên trái; hiện "Shop đang trả lời..." trong lúc chờ (1–3 giây, có khi tới 10 giây).
   - Phản hồi có `skus` hoặc `upsell`: dưới câu trả lời hiện thẻ sản phẩm nhỏ (tên, giá) có nút **Thêm vào giỏ**. Đây là phần "AI gợi ý, mời mua kèm"; tìm thông tin sản phẩm theo `sku` từ danh sách đã tải ở màn 2.
   - `handed_off: true`: hiện dòng "Shop đã chuyển cho nhân viên".
   - `silent: true`: hiện dòng "Nhân viên đang trả lời bạn" và không hiện bong bóng shop.
   - Bot hiểu câu nối tiếp ("còn mấy cái", "giá sao") và "đơn của em tới đâu rồi" mà không cần mã.
5. **Giỏ hàng** (`POST /don`): danh sách món, đổi số lượng, xóa; tổng tạm tính. Bấm **Đặt hàng**: gọi `datDon`, hiện mã đơn và `total` hệ thống tính, xóa giỏ, chuyển sang Đơn của tôi. Lỗi thì hiện `loi` (vd "chỉ còn 3").
6. **Đơn của tôi** (`GET /don`, lọc theo `buyer_user_id` của khách đang dùng):
   - Mỗi đơn: mã đơn, món, tổng tiền, thanh tiến trình, mã vận đơn.
   - Nút **Hỏi shop về đơn này**: mở chat và gửi "Đơn <mã đơn> của em tới đâu rồi shop".
7. **Thông báo** (`GET /tin-nhan`): tin shop tự gửi khi đơn chuyển sang đang giao (kèm mã vận đơn). Gọi lại 5 giây một lần; có chấm đỏ khi có tin mới.

### Màn người bán (tab riêng, dùng khi demo)

8. **Đơn hàng** (`GET /don`): bảng mọi đơn, nút theo bước hiện tại:

   | Đơn đang ở | Nút hiện | Gọi |
   |---|---|---|
   | `AWAITING_SHIPMENT`, chưa có `shipping_arranged` trong `lich_su` | **Đã đóng gói**, **Hủy** | `dayBuoc(id, 'dong_goi')`, `dayBuoc(id, 'huy_don')` |
   | `AWAITING_SHIPMENT`, đã có `shipping_arranged` | **Giao cho vận chuyển** | `dayBuoc(id, 'dang_giao')` |
   | `IN_TRANSIT` | **Đã giao** | `dayBuoc(id, 'da_giao')` |
   | `DELIVERED`, `CANCELLED` | không có nút | |

   Bấm xong thì khóa nút, chờ 3–5 giây rồi tải lại (hệ thống xử lý nền).
9. **Chat cần nhân viên**: nhập `conversation_id` (hoặc chọn khách), nút **Trả cuộc chat về bot** gọi `traChatVeBot`.
10. **Số liệu hôm nay** (`GET /kpi`): 4–6 ô số: tin nhắn, thời gian trả lời trung bình (`tg_tra_loi_tb_ms`), tỉ lệ đúng giá, số đơn, giá trị đơn trung bình, tỉ lệ nhận lời mời mua kèm. Thêm 2 nút mở **Odoo** và **dashboard Looker** ở tab mới (địa chỉ xin người giữ máy chủ) để lúc demo chuyển màn hình nhanh.

### Chữ hiển thị cho trạng thái (`src/lib/trang-thai.js`)

| Mã | Hiện |
|---|---|
| (vừa đặt) | Đã đặt hàng |
| `odoo_created` | Shop đã xác nhận đơn |
| `shipping_arranged` | Đã đóng gói, chờ đơn vị vận chuyển lấy |
| `AWAITING_SHIPMENT` | Chờ đóng gói |
| `AWAITING_COLLECTION` | Chờ lấy hàng |
| `IN_TRANSIT` | Đang giao |
| `DELIVERED` | Đã giao |
| `COMPLETED` | Hoàn tất |
| `CANCELLED` | Đã hủy |

Thanh tiến trình: Đã đặt → Shop xác nhận → Đã đóng gói → Đang giao → Đã giao. "Shop xác nhận" chỉ sáng khi Odoo đã tạo đơn (`odoo_created` có trong `lich_su`), phần này chạy khi workflow Tạo đơn của Odoo làm xong.

## 7. Thứ tự làm

| Bước | Làm | Thử bằng |
|---|---|---|
| 1 | Dự án Vite, `api.js`, màn nhập mã, danh sách sản phẩm | Thấy đúng danh sách từ API |
| 2 | Chat (kể cả thẻ gợi ý sản phẩm) | Hỏi "chuột g102 màu trắng giá bao nhiêu", rồi "còn mấy cái" |
| 3 | Chi tiết sản phẩm, giỏ hàng, đặt hàng | Đặt 1 đơn, thấy mã đơn; tồn kho trên danh sách giảm |
| 4 | Đơn của tôi, thông báo | Đơn hiện đúng bước |
| 5 | Màn người bán | Đẩy đơn qua đủ bước, khách thấy cập nhật và thông báo |
| 6 | Làm đẹp, chạy trọn kịch bản demo (mục 8) | Không lỗi từ đầu đến cuối |

Mỗi bước xong thì commit lên một nhánh và mở pull request (xem [CONTRIBUTING.md](../../CONTRIBUTING.md)).

## 8. Kịch bản demo phải chạy được

1. Khách mở trang chuột G102, bấm Chat, hỏi "chuột này còn màu trắng không shop" → bot trả đúng giá, tồn kho; có thẻ gợi ý mua kèm (lót chuột).
2. Khách hỏi tiếp "còn mấy cái" → bot trả lời đúng sản phẩm vừa nói.
3. Khách bấm Thêm vào giỏ ở thẻ gợi ý → Đặt hàng → thấy mã đơn; tồn kho giảm.
4. Tab người bán: Đã đóng gói → Giao cho vận chuyển.
5. Tab khách: Đơn của tôi hiện "Đang giao", mã vận đơn; Thông báo có tin báo mã vận đơn.
6. Khách chat "đơn của em tới đâu rồi" → bot trả đúng trạng thái.
7. Khách chat "hàng bị lỗi, em muốn trả" → bot chuyển nhân viên; tab người bán bấm Trả cuộc chat về bot.

Song song mở Odoo (thấy Sales Order khi workflow Tạo đơn đã làm xong) và dashboard (số liệu tăng).

## 9. Chạy khi demo

- Cách chắc nhất: chạy trên máy dùng để chiếu, `npm run dev`, mở `localhost:5173`.
- Muốn có link gửi thầy: `npm run build` rồi kéo thư mục `dist/` lên **Netlify Drop** hoặc deploy **Vercel** (gói miễn phí); đặt biến `VITE_API_BASE` lúc build. GitHub Pages chỉ dùng được nếu repo công khai.
- Trước giờ demo: nhắc người giữ máy chủ bật máy, bật giả lập, chạy diễn tập; xóa đơn thử bằng `scripts/gia-lap.sh xoa-don`.

## 10. Lỗi hay gặp

| Hiện tượng | Nguyên nhân | Cách sửa |
|---|---|---|
| "Máy chủ chưa bật chế độ giả lập", `404` | Máy chủ tắt, Docker sập, giả lập tắt | Nhắn người giữ máy chủ |
| "Sai mã nhóm", `401` | Mã nhóm sai hoặc thiếu header `x-ma-nhom` | Nhập lại mã |
| "Máy chủ trả về dữ liệu lạ" | Thiếu header `ngrok-skip-browser-warning`, ngrok trả trang cảnh báo HTML | Dùng đúng `api.js` ở mục 4 |
| Lỗi CORS trong Console | Gọi sai đường (không phải `/webhook/demo/...`) | Kiểm tra `VITE_API_BASE` |
| Bot không trả lời, `silent: true` | Cuộc chat đã chuyển cho nhân viên | Tab người bán: Trả cuộc chat về bot, hoặc tạo cuộc chat mới |
| Chat chờ lâu | AI miễn phí đôi khi chậm, hệ thống tự thử model dự phòng | Hiện "Shop đang trả lời..."; đặt thời gian chờ 30 giây |
| Đơn không chuyển bước ngay | Hệ thống xử lý nền | Chờ 3–5 giây rồi tải lại |

## 11. Câu giao việc mẫu cho AI

Mỗi lần giao việc, đính kèm **file này** và [contracts/internal/demo_api.md](../../contracts/internal/demo_api.md).

**Bước 1**
> Tôi làm web giả lập TikTok Shop bằng React + Vite, chỉ có frontend, gọi 7 API trong hợp đồng đính kèm. Đã có `src/api.js` như trong hướng dẫn. Hãy làm màn Nhập mã nhóm và màn Danh sách sản phẩm: giao diện điện thoại dọc, tiếng Việt, giá dạng 199.000đ, lọc theo loại, ô tìm kiếm, sản phẩm hết hàng làm mờ. Dùng react-router-dom. Không thêm backend, không gọi API nào khác.

**Bước 2**
> Làm màn Chat với shop theo mục 6.4 của hướng dẫn: giữ `conversation_id` và `buyer_user_id` trong localStorage, hiện "Shop đang trả lời...", hiện thẻ sản phẩm cho `skus` và `upsell` có nút Thêm vào giỏ, xử lý `handed_off` và `silent`.

**Bước 3**
> Làm màn Chi tiết sản phẩm và Giỏ hàng theo mục 6.3 và 6.5: giỏ hàng lưu localStorage, đặt hàng gọi `datDon`, hiện mã đơn và tổng tiền do API trả, lỗi hiện `loi`.

**Bước 4**
> Làm màn Đơn của tôi và Thông báo theo mục 6.6, 6.7: lọc đơn theo khách đang dùng, thanh tiến trình theo bảng trạng thái mục 6, tự tải lại 5 giây một lần, nút "Hỏi shop về đơn này".

**Bước 5**
> Làm tab Người bán theo mục 6.8–6.10: bảng đơn với nút theo bước hiện tại đúng bảng trong hướng dẫn, nút Trả cuộc chat về bot, ô số liệu từ `GET /kpi`, nút mở Odoo và dashboard.
