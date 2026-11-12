# contracts: dữ liệu mẫu đi qua lại giữa các hệ thống

Đây là bản chuẩn của mọi dữ liệu đi qua lại (quy tắc mục 7). Workflow nào cũng test được bằng các file này trước khi có quyền API thật. Muốn đổi cấu trúc thì báo cả nhóm trước.

> **Trạng thái:** các file trong `tiktok/` do trưởng nhóm viết tay theo tài liệu TikTok Shop Open API (bản 202309), **chưa đối chiếu với dữ liệu thật**. Khi app được duyệt, mở `http://localhost:4040` (ngrok) để xem webhook thật TikTok gửi tới, rồi thay file mẫu bằng bản thật và sửa bảng dưới.

## Danh sách file

| File | Là gì | Ai dùng | Đã đối chiếu thật |
|---|---|---|---|
| `tiktok/webhooks/order_status_change.json` | Webhook đơn đổi trạng thái | Router → M2 · Tạo đơn | ☐ |
| `tiktok/webhooks/cancellation_status_change.json` | Webhook hủy đơn | Router → M2 · Hủy đơn | ☐ |
| `tiktok/webhooks/package_update.json` | Webhook gói hàng cập nhật | Router → M3 · Trạng thái đơn | ☐ |
| `tiktok/webhooks/new_message_text.json` | Khách nhắn chữ | Router → M3 · Chatbot | ☐ |
| `tiktok/webhooks/new_message_product_card.json` | Khách gửi thẻ sản phẩm | Router → M3 · Chatbot | ☐ |
| `tiktok/webhooks/upcoming_authorization_expiration.json` | Ủy quyền sắp hết hạn | M3 · Token | ☐ |
| `tiktok/api/token_get.json` | Kết quả đổi `auth_code` / làm mới token | M3 · Token | ☐ |
| `tiktok/api/authorized_shops.json` | Lấy `shop_cipher` | M3 · Token | ☐ |
| `tiktok/api/order_detail.json` | Chi tiết đơn (Order API) | M2 · Tạo đơn | ☐ |
| `tiktok/api/ship_package_request.json` | Body gọi Ship Package | M3 · Đặt vận chuyển | ☐ |
| `tiktok/api/shipping_document.json` | Link phiếu gửi hàng + mã vận đơn | M3 · Đặt vận chuyển | ☐ |
| `tiktok/api/send_message_request.json` | Body gửi tin trả lời khách | M3 · Chatbot, Trạng thái đơn | ☐ |
| `internal/router_event.json` | Router truyền gì cho workflow con | M2, M3 | Nhóm tự quy định |
| `internal/chatbot_input.json` | Router truyền gì cho Chatbot | M3 | Nhóm tự quy định |
| `internal/van_chuyen.md` | Vận chuyển: M2 ghi đơn, Odoo báo đóng gói, middleware báo ngược Odoo | M2, M3 | Nhóm tự quy định; API TikTok cần đối chiếu |
| `internal/tiktok_api.md` | Gọi TikTok API qua `M3 · TikTok API`: dữ liệu vào/ra, cách ký | M2, M3 | Cách ký cần đối chiếu khi có app |
| `internal/demo_api.md` | API JSON cho giao diện web demo (shop giả lập): sản phẩm, chat, đặt đơn, trạng thái, tin nhắn, KPI | Giao diện gọi, M3 làm | Nhóm tự quy định |
| `internal/ton_kho.md` | Đồng bộ tồn kho Odoo → TikTok: khi nào chạy, dữ liệu vào, cách gọi API | M2 làm, M3 cung cấp API | Nhóm tự quy định; API TikTok cần đối chiếu |
| `internal/tool_san_pham.md` | Chatbot hỏi gì và nhận về dạng gì khi tra sản phẩm | M3 gọi, **M2 làm bản đọc Odoo** | Nhóm tự quy định |
| `internal/odoo_picking_done.json` | Odoo gửi gì khi phiếu xuất kho Done | M2 cài, M3 nhận | ☐ (M2 thay bằng bản thật) |
| `odoo/` | Kết quả API Odoo thật | M2 lưu vào, mọi người đọc | M2 |

## Số `type` của webhook TikTok (cần đối chiếu)

| type | Tên sự kiện | Router chuyển tới |
|---|---|---|
| 1 | ORDER_STATUS_CHANGE | M2 · Tạo đơn (khi `order_status` = `AWAITING_SHIPMENT`) |
| 4 | PACKAGE_UPDATE | M3 · Trạng thái đơn |
| 7 | UPCOMING_AUTHORIZATION_EXPIRATION | M3 · Token |
| 11 | CANCELLATION_STATUS_CHANGE | M2 · Hủy đơn |
| 14 | NEW_MESSAGE | M3 · Chatbot (chỉ khi `sender.role` = `BUYER`) |

Router đọc số `type` rồi đổi sang tên ở trên, ghi cả hai vào `processed_events`. Sự kiện lạ thì ghi log rồi bỏ qua, không báo lỗi.

## Những điểm dễ sai

- **`line_items` là mỗi đơn vị một dòng.** Khách mua 2 cái cùng SKU thì có 2 dòng giống nhau (xem `order_detail.json`). M2 phải gộp theo `sku_id` để ra số lượng khi tạo Sales Order.
- **Số tiền là chuỗi** (`"199000"`), không phải số. Đổi sang số trước khi so sánh hay cộng.
- **Thời gian là Unix giây** (`1792983600`), theo UTC. Đổi sang giờ Việt Nam khi hiển thị.
- **`access_token_expire_in` là thời điểm hết hạn** (Unix giây), không phải số giây còn lại, dù tên dễ hiểu nhầm.
- **`content` của tin nhắn là chuỗi JSON lồng trong JSON.** Phải `JSON.parse(data.content)` mới lấy được chữ khách gõ hoặc `product_id`.
- **Chatbot phải bỏ qua tin do chính shop gửi** (`sender.role` khác `BUYER`), nếu không bot sẽ tự trả lời chính nó.
- **Mã đơn TikTok rất dài** (18 chữ số). Luôn lưu dạng chuỗi; để dạng số thì JavaScript làm tròn sai.

## Quy tắc SKU (đã chốt theo danh mục HDX Tech)

`HD-<LOẠI>-<SỐ>`, chữ in hoa không dấu, nối bằng gạch ngang, không khoảng trắng. Loại: `LAP` laptop, `KEY` bàn phím, `MOU` chuột, `HDP` tai nghe, `MON` màn hình, `SSD`, `HUB`, `MIC` micro, `WEB` webcam, `PAD` lót chuột.

- `HD-LAP-001`: Laptop ASUS Vivobook 15 X1504
- `HD-MOU-001`: Chuột gaming Logitech G102 LIGHTSYNC
- `HD-SSD-002`: Ổ cứng SSD Kingston NV2 1TB

Cùng một chuỗi này nằm ở: `cua-hang/san-pham.csv`, Internal Reference trong Odoo, web giả lập, dữ liệu sản phẩm của chatbot, cột `seller_sku` trong bảng `sku_map`.

## Gửi thử webhook có chữ ký

Dùng script ở thư mục gốc (chạy bằng Git Bash), cần `TIKTOK_APP_KEY` và `TIKTOK_APP_SECRET` trong `.env`:

```bash
scripts/send-test-webhook.sh contracts/tiktok/webhooks/order_status_change.json
```

Gửi cùng một file hai lần để kiểm tra Router bỏ được bản trùng.
