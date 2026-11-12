# Hợp đồng: API cho giao diện web demo (shop giả lập)

TikTok Shop chỉ cấp Open API cho doanh nghiệp, nên khách hàng trong buổi demo dùng một **trang web đóng vai TikTok Shop**. Trang web gọi các API dưới đây. Phía sau, API đi đúng đường của hệ thống thật: tin nhắn vào chatbot, đơn hàng thành sự kiện có chữ ký gửi vào Router như TikTok gửi, rồi chạy qua Odoo, đặt vận chuyển, báo khách.

Workflow: `DEMO · API shop giả lập` (`n8n/test-workflows/test-demo-api.json`). Chỉ chạy khi **chế độ giả lập đang bật** (`scripts/gia-lap.sh bat`).

## Chung cho mọi API

| | |
|---|---|
| Địa chỉ gốc | `https://<NGROK_DOMAIN>/webhook/demo` (domain ngrok của máy chủ) |
| Mã truy cập | Header `x-ma-nhom: <mã nhóm>` (giá trị `GIA_LAP_MA` trong `.env` máy chủ, xin trưởng nhóm). Thiếu hoặc sai trả `401` |
| Header thêm | `ngrok-skip-browser-warning: 1` để ngrok bản miễn phí không chen trang cảnh báo |
| CORS | Cho phép mọi origin, nên trang web chạy ở `localhost`, GitHub Pages hay đâu cũng gọi được |
| Dạng dữ liệu | JSON. Mọi phản hồi có `ok` (`true`/`false`); lỗi có `loi` (câu tiếng Việt để hiện lên màn hình) |

Gọi mẫu bằng JavaScript:

```js
const API = 'https://ten-mien.ngrok-free.dev/webhook/demo';
const MA = '<mã nhóm>';

async function api(path, body) {
  const res = await fetch(API + path, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'x-ma-nhom': MA, 'ngrok-skip-browser-warning': '1' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}
```

Không viết mã nhóm cứng vào code đưa lên GitHub: cho người dùng nhập ở màn hình đầu và giữ trong `localStorage`.

## 1. Danh sách sản phẩm: `GET /san-pham`

```json
{
  "ok": true,
  "source": "gia",
  "products": [
    {
      "sku": "HD-MOU-001", "name": "Chuột gaming Logitech G102 LIGHTSYNC", "brand": "Logitech", "category": "chuột",
      "price": 399000, "stock": 20,
      "colors": [ { "color": "đen", "stock": 10 }, { "color": "trắng", "stock": 10 } ],
      "warranty_months": 24, "specs": "Chuột gaming có dây USB-A, cảm biến 8.000 DPI, 6 nút, đèn RGB LIGHTSYNC", "compatible": ["laptop", "pc"]
    }
  ]
}
```

`source` là `gia` khi đang dùng dữ liệu giả của chatbot; sẽ là `odoo` khi tool đọc Odoo thay vào. Không có ảnh sản phẩm: giao diện tự chọn ảnh theo `category` hoặc theo `sku`.

## 2. Chat với shop: `POST /chat`

Vào:

```json
{ "conversation_id": "demo-khach-1", "buyer_user_id": "gia-lap-khach", "text": "chuột g102 còn không shop" }
```

Ra (chờ khoảng 1–3 giây vì AI viết câu):

```json
{
  "ok": true,
  "reply": "Dạ cáp USB-C 1m giá 59.000đ, hiện còn 5 cái ạ.",
  "intent": "hoi_gia",
  "handed_off": false, "handoff_reason": null,
  "price_check_passed": true,
  "model": "qwen/qwen3.8-27b",
  "skus": ["PK-CAP-C2C-1M"],
  "upsell": [ { "sku": "PK-CU-SAC-20W", "name": "Củ sạc 20W", "price": 99000 } ],
  "latency_ms": 1820
}
```

- Giữ nguyên `conversation_id` cho cả cuộc chat; bot nhớ lịch sử theo mã này.
- Dùng cùng `buyer_user_id` cho chat và đặt đơn, để hệ thống tính được "chat ra đơn" và thưởng cho món đã mời mua kèm.
- `handed_off = true`: bot đã chuyển cho nhân viên (khiếu nại, khách xin gặp người); giao diện nên hiện "Nhân viên sẽ trả lời bạn".
- `skus`, `upsell` dùng để hiện thẻ sản phẩm kèm nút Mua ngay dưới câu trả lời.
- Bot **nhớ ngữ cảnh**: hỏi tiếp "còn mấy cái", "giá sao" mà không nêu tên thì hiểu là sản phẩm vừa nói; hỏi "đơn của em tới đâu rồi" mà không có mã thì tra đơn gần nhất của `buyer_user_id`.
- Sau khi chuyển người, các tin tiếp theo trả `{ "ok": true, "silent": true, "reply": null, "handed_off": true, "note": "..." }`: bot im lặng vì nhân viên đang giữ cuộc chat. Gửi `text: "/reset"` để trả cuộc chat về cho bot (trả `{ "ok": true, "reset": true }`); màn người bán nên có nút này.

## 3. Đặt đơn: `POST /don`

Vào:

```json
{ "buyer_user_id": "gia-lap-khach", "items": [ { "sku": "PK-CAP-C2C-1M", "quantity": 2 }, { "sku": "PK-GIA-DO-DT", "quantity": 1 } ] }
```

Ra:

```json
{ "ok": true, "order_id": "579900003397263811", "viec": "dat_don", "status": "AWAITING_SHIPMENT", "total": 207000, "loi": null }
```

Tổng tiền do hệ thống tính theo giá trong danh sách sản phẩm. Tồn kho trong `GET /san-pham` và câu trả lời của bot **trừ đi số đã đặt** (trừ đơn đã hủy). SKU không có hoặc không đủ hàng trả `400` với `loi`, vd `"Củ sạc Anker 20W chỉ còn 9"`. Sau khi đặt, hệ thống chạy `M2 · Tạo đơn` (tạo Sales Order trong Odoo) và ghi nhận đơn cho thống kê mua kèm.

## 4. Đẩy đơn sang bước tiếp: `POST /don/viec`

Vào:

```json
{ "order_id": "579900003397263811", "viec": "dong_goi" }
```

| `viec` | Đóng vai | Hệ thống chạy |
|---|---|---|
| `dong_goi` | Odoo báo phiếu xuất kho đã xong | `M3 · Đặt vận chuyển`: đặt đơn vị vận chuyển tới lấy hàng |
| `dang_giao` | TikTok báo đơn đang giao | `M3 · Trạng thái đơn`: ghi trạng thái, nhắn mã vận đơn cho khách |
| `da_giao` | TikTok báo đã giao | `M3 · Trạng thái đơn` |
| `huy_don` | Khách hủy | `M2 · Hủy đơn` |

Ra: `{ "ok": true, "order_id": "...", "viec": "dong_goi", "status": "AWAITING_SHIPMENT", "loi": null }`.

Thứ tự đúng: `dong_goi` → `dang_giao` → `da_giao`. Nếu đã đóng gói thật trong Odoo (khi Odoo đã cài webhook) thì không cần gọi `dong_goi`.

## 5. Danh sách đơn: `GET /don`

```json
{
  "ok": true,
  "orders": [
    {
      "order_id": "579900003397263811", "buyer_user_id": "gia-lap-khach",
      "status": "IN_TRANSIT", "tracking_number": "VNGL263811",
      "items": [ { "seller_sku": "PK-CAP-C2C-1M", "quantity": 2, "sku_id": "gia-PK-CAP-C2C-1M" } ],
      "total_amount": 207000,
      "created_at": "2026-11-10T21:19:00+07:00", "updated_at": "2026-11-10T21:25:00+07:00",
      "lich_su": [
        { "status": "odoo_created", "tracking_number": null, "luc": "..." },
        { "status": "shipping_arranged", "tracking_number": "VNMOCKSHIP001", "luc": "..." },
        { "status": "IN_TRANSIT", "tracking_number": "VNGL263811", "luc": "..." }
      ]
    }
  ]
}
```

`status` là trạng thái phía TikTok (`AWAITING_SHIPMENT`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`). `lich_su` là các bước hệ thống đã ghi, dùng để vẽ thanh tiến trình đơn. `odoo_created` chỉ xuất hiện khi `M2 · Tạo đơn` đã làm xong phần thật.

## 6. Tin shop gửi khách: `GET /tin-nhan`

```json
{ "ok": true, "messages": [ { "id": 12, "conversation_id": "mock-conv-1", "noi_dung": "Dạ đơn 5799... đã giao cho đơn vị vận chuyển, mã vận đơn VNGL263811 ạ.", "gui_luc": "..." } ] }
```

Đây là tin hệ thống **tự gửi** cho khách qua TikTok (báo đang giao, mã vận đơn). Câu trả lời chat trực tiếp đã có trong phản hồi của `POST /chat`, không nằm ở đây. Giao diện nên gọi lại API này vài giây một lần để hiện thông báo mới.

## 7. Số liệu hôm nay: `GET /kpi`

```json
{ "ok": true, "hom_nay": { "ngay": "2026-11-10", "so_tin": 12, "so_cuoc_chat": 3, "tg_tra_loi_tb_ms": 1900, "ti_le_dung_gia": 100,
  "ti_le_chuyen_nguoi": 8.3, "so_don": 2, "gia_tri_don_tb": 180000, "tao_don_tb_giay": 4.5, "so_loi_moi_mua_kem": 2, "ti_le_nhan_loi_moi": 50 } }
```

Các cột giống bảng `tong_hop` trong [docs/huong-dan-kpi-dashboard.md](../../docs/huong-dan-kpi-dashboard.md).

## Dọn dữ liệu sau khi thử

Trên máy chủ: `scripts/gia-lap.sh xoa-don` xóa mọi đơn và tin nhắn giả lập.
