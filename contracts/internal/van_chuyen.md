# Hợp đồng: vận chuyển (Odoo ↔ middleware)

Phần vận chuyển nối giữa kho (Odoo, **M2**) và TikTok (middleware, **M3**). Middleware không đọc hay ghi Odoo trực tiếp; hai bên trao đổi qua ba điểm dưới đây.

## 1. M2 ghi đơn vào `order_status_log` khi tạo Sales Order

Trong workflow `M2 · Tạo đơn`, sau khi tạo và xác nhận Sales Order, ghi một dòng:

```sql
INSERT INTO order_status_log (tiktok_order_id, odoo_sale_order, status, source)
VALUES ('579123456789012345', 'S00012', 'odoo_created', 'n8n');
```

Đặt vận chuyển dựa vào dòng này để biết phiếu xuất kho thuộc đơn TikTok nào.

## 2. Odoo báo "đã đóng gói" cho n8n (M2 cài trong Odoo)

Automation Rule trên **Phiếu xuất kho** (`stock.picking`): khi `Trạng thái` đổi thành `Done`, chọn hành động *Send Webhook Notification*:

- **URL:** `http://n8n:5678/webhook/odoo-picking-done?secret=<ODOO_WEBHOOK_SECRET>`. Odoo và n8n cùng mạng Docker nên không cần ngrok. Mã bí mật lấy trong `.env` của trưởng nhóm.
- **Trường gửi kèm:** `name`, `origin`, `state`, `picking_type_code`, và `client_order_ref` nếu thêm được.

Body Odoo gửi (xem `odoo_picking_done.json`):

```json
{ "_model": "stock.picking", "_id": 15, "id": 15, "name": "WH/OUT/00015",
  "origin": "S00012", "state": "done", "picking_type_code": "outgoing" }
```

Middleware chỉ xử lý phiếu **xuất kho** (`picking_type_code` = `outgoing`, hoặc tên có `/OUT/`) ở trạng thái `done`; các phiếu khác bị bỏ qua. Mã bí mật sai thì nhận `401`.

Không cài được webhook trong Odoo Community thì dùng phương án dự phòng trong tài liệu: n8n quét phiếu xuất kho mới theo lịch. Phương án này cần đọc Odoo, nên do M2 làm.

## 3. Middleware báo ngược cho Odoo: workflow `M2 · Cập nhật Odoo (vận chuyển)`

M3 gọi workflow này (không chờ kết quả) với một trong hai dạng sau. **M2 làm phần ghi vào Odoo**; hiện đây là workflow giữ chỗ.

Đã đặt vận chuyển, có mã vận đơn:

```json
{ "action": "ghi_van_don", "tiktok_order_id": "579123456789012345", "odoo_sale_order": "S00012",
  "picking": "WH/OUT/00015", "tracking_number": "VN123456789", "label_url": "https://.../label.pdf",
  "package_id": "1155443322110099887" }
```

Trạng thái giao hàng thay đổi:

```json
{ "action": "cap_nhat_trang_thai", "tiktok_order_id": "579123456789012345", "odoo_sale_order": "S00012",
  "status": "IN_TRANSIT", "nhom": "dang_giao", "tracking_number": "VN123456789" }
```

`nhom` là một trong: `dang_giao`, `da_giao`, `giao_that_bai`, `khac`. Khi là `giao_that_bai`, M2 theo dõi hàng hoàn về kho.

## Trạng thái ghi trong `order_status_log`

| status | Ai ghi | Nghĩa |
|---|---|---|
| `odoo_created` | M2 | Đã tạo Sales Order, giữ hàng |
| `shipping_arranged` | M3 · Đặt vận chuyển | Đã đặt TikTok tới lấy hàng, có phiếu gửi hàng |
| `AWAITING_COLLECTION`, `IN_TRANSIT`, `DELIVERED`, `COMPLETED`, `CANCELLED`... | M3 · Trạng thái đơn | Trạng thái lấy từ TikTok |

> Các API TikTok dùng ở đây (`/order/202309/orders`, `/fulfillment/202309/packages/{id}/ship`, `/fulfillment/202309/packages/{id}/shipping_documents`, `/customer_service/202309/conversations`) viết theo tài liệu nhóm biết. **Cần đối chiếu tên và tham số trong Partner Center khi app được duyệt.**
