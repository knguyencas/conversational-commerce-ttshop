# Nhóm việc 2: Kho và đơn hàng

## Bối cảnh

Đồ án: bán hàng qua chat cho một shop đồ công nghệ trên TikTok Shop. **Odoo** (bản Community, miễn phí) là phần mềm quản lý kho và đơn hàng, chạy trong Docker trên máy chủ của nhóm. Middleware **n8n** nhận sự kiện đơn hàng (từ TikTok, hoặc từ giao diện demo khi giả lập) và gọi các workflow của nhóm việc này để ghi vào Odoo.

Nhóm việc này lo phần **"đơn tự chảy vào kho, không ai nhập tay"**: khách đặt thì Odoo có Sales Order giữ hàng, khách hủy thì hủy Sales Order, kho đóng gói xong thì Odoo báo để đặt giao hàng, tồn kho luôn khớp.

## Đồ án cần gì từ nhóm này

1. **Odoo dùng được**: cài Sales, Inventory, có đủ sản phẩm từ `san-pham.csv`, tồn kho đầu kỳ.
2. **4 workflow n8n** (đã có khung chờ sẵn, cần thay phần giữa bằng xử lý thật):
   - `M2 · Tạo đơn`: đơn mới → Sales Order trong Odoo.
   - `M2 · Hủy đơn`: khách hủy → hủy Sales Order.
   - `M2 · Đồng bộ tồn kho`: đẩy số tồn có thể bán từ Odoo lên TikTok.
   - `M2 · Cập nhật Odoo (vận chuyển)`: ghi mã vận đơn, trạng thái giao vào Sales Order.
3. **Automation Rule trong Odoo**: phiếu xuất kho chuyển sang Done thì báo n8n.
4. **Tool tra sản phẩm đọc Odoo** cho chatbot (thay dữ liệu giả), để giá bot nói và giá trong Odoo là một.
5. **Hướng dẫn đóng gói 1 trang** và ảnh chụp cấu hình cho báo cáo.

## Hiện trạng

- Odoo 19 đã chạy trong Docker, **chưa tạo database**, chưa có sản phẩm.
- 4 workflow `m2-*` có **khung chờ sẵn**: Router đã gọi tới, dữ liệu vào đúng dạng, chỉ còn node "Chưa làm (giữ chỗ)".
- Bước "đóng gói xong" hiện được giả lập bằng nút trên giao diện demo / form giả lập.

## Kết nối với nhóm khác

| Hướng | Thứ gì | Dạng |
|---|---|---|
| Vào | Sự kiện đơn mới, đơn hủy từ Router | [contracts/internal/router_event.json](../../contracts/internal/router_event.json); chi tiết đơn lấy qua `M3 · TikTok API`, dạng [contracts/tiktok/api/order_detail.json](../../contracts/tiktok/api/order_detail.json) |
| Vào | `san-pham.csv` từ nhóm 1 | Import vào Odoo, Internal Reference = SKU |
| Ra | Dòng `odoo_created` trong bảng `order_status_log` | [contracts/internal/van_chuyen.md](../../contracts/internal/van_chuyen.md), mục 1 |
| Ra | Webhook phiếu xuất kho Done | [contracts/internal/van_chuyen.md](../../contracts/internal/van_chuyen.md), mục 2 |
| Vào | Yêu cầu ghi mã vận đơn, trạng thái | [contracts/internal/van_chuyen.md](../../contracts/internal/van_chuyen.md), mục 3 |
| Ra | Kết quả tra sản phẩm cho chatbot | [contracts/internal/tool_san_pham.md](../../contracts/internal/tool_san_pham.md), thêm lệnh `danh_sach` (trả mọi sản phẩm) cho giao diện demo |
| Ra | Tồn kho đẩy lên TikTok | [contracts/internal/ton_kho.md](../../contracts/internal/ton_kho.md) |

## Triển khai

### Odoo

1. Mở `http://<IP Tailscale máy chủ>:8069`. Tạo database `cntttmdt`, Master Password lưu kỹ, **không** tick Demo data, ngôn ngữ Tiếng Việt.
2. Cài app **Sales** và **Inventory**. Công ty: tiền VND, múi giờ Asia/Ho_Chi_Minh.
3. **Inventory → Products → Import**: nhập `cua-hang/san-pham.csv`. Cột `sku` → *Internal Reference*, `price` → *Sales Price*, loại sản phẩm *Storable*. Nhập tồn đầu kỳ từ cột `ton_dau_ky` (Inventory → Physical Inventory).
4. **Settings → Users**: tạo user tích hợp (vd `n8n`), chỉ quyền Sales, Inventory; tạo **API key** cho user này (Preferences → Account Security). Key gửi riêng cho người giữ máy chủ để tạo credential Odoo trong n8n.
5. Bật **Developer mode**. **Settings → Technical → Automation Rules**: model *Transfer* (`stock.picking`), khi *State* đổi thành *Done*, hành động *Send Webhook Notification* tới `http://n8n:5678/webhook/odoo-picking-done?secret=<ODOO_WEBHOOK_SECRET>`, gửi các trường `name`, `origin`, `state`, `picking_type_code`, `client_order_ref`.

### Workflow trong n8n

n8n chạy trên máy chủ; bản miễn phí không chia sẻ workflow giữa các tài khoản, nên sửa workflow trên tài khoản chính của máy chủ.

- **M2 · Tạo đơn** (file `n8n/workflows/m2-tao-don.json`):
  1. Lấy chi tiết đơn qua `M3 · TikTok API` (`GET /order/202309/orders`, `ids` = mã đơn).
  2. Gộp `line_items` theo `seller_sku` (mỗi đơn vị một dòng: 2 cái cùng SKU là 2 dòng).
  3. Tìm sản phẩm Odoo theo *Internal Reference* = SKU; tạo **Sales Order**, *Customer Reference* (`client_order_ref`) = mã đơn TikTok; **Confirm** để giữ hàng.
  4. Ghi `order_status_log`: `(tiktok_order_id, odoo_sale_order, 'odoo_created', 'n8n')`.
  5. Gọi `M2 · Đồng bộ tồn kho` (không chờ).
  6. Gửi trùng cùng một đơn thì không tạo Sales Order thứ hai (tìm theo `client_order_ref` trước).
- **M2 · Hủy đơn**: tìm Sales Order theo `client_order_ref`, hủy (nếu phiếu xuất kho đã Done thì không hủy tự động, ghi `failed_jobs` để người xử lý), gọi đồng bộ tồn kho.
- **M2 · Cập nhật Odoo (vận chuyển)**: nhận `{ action, tiktok_order_id, odoo_sale_order, tracking_number, status }`, ghi vào ghi chú hoặc trường tùy chỉnh của Sales Order.
- **M2 · Đồng bộ tồn kho**: theo [contracts/internal/ton_kho.md](../../contracts/internal/ton_kho.md). Khi giả lập, TikTok giả nhận lệnh và trả thành công.
- **Tool tra sản phẩm đọc Odoo**: làm theo [contracts/internal/tool_san_pham.md](../../contracts/internal/tool_san_pham.md), đủ 4 lệnh `tra_san_pham`, `tim_theo_ngan_sach`, `phu_kien_tuong_thich`, `danh_sach`; xong thì đổi workflow mà Chatbot và API demo gọi sang bản này.

Mọi node gọi Odoo hoặc TikTok bật *Retry On Fail* tối đa 3 lần; mọi workflow đặt *Error workflow* là `M3 · Xử lý lỗi`. Sửa xong: **Download** workflow, giữ nguyên `"id"` trong file (Router gọi theo id), chép đè vào `n8n/workflows/`, commit; trên máy chủ chạy `bash scripts/import-n8n.sh`.

### Cách thử

Bật chế độ giả lập, rồi dùng giao diện demo hoặc form giả lập: đặt đơn → xem Odoo có Sales Order; hủy → Sales Order bị hủy; đóng gói phiếu xuất kho thật trong Odoo → `M3 · Đặt vận chuyển` chạy; đang giao → Sales Order có mã vận đơn. Cuối cùng chạy `bash scripts/dien-tap.sh`, phải đạt 14/14.

## Ràng buộc

- Không sửa tồn kho tay trên TikTok; Odoo là nguồn sự thật.
- Không đổi `"id"` hay node trigger của 4 workflow khung.
- Không ghi API key Odoo vào workflow hay repo; dùng *Credentials* của n8n.
- Không đổi dạng dữ liệu trong `contracts/` khi chưa báo nhóm 3.

## Xong khi

- [ ] Odoo có đủ sản phẩm, SKU khớp `san-pham.csv`, có tồn kho.
- [ ] Đặt đơn trên giao diện demo → có Sales Order đã xác nhận; gửi trùng không tạo thêm.
- [ ] Hủy đơn → Sales Order bị hủy, tồn tăng lại.
- [ ] Validate phiếu xuất kho trong Odoo → đơn chuyển sang đã đặt vận chuyển trên giao diện.
- [ ] Sau bước "đang giao", Sales Order có mã vận đơn.
- [ ] Diễn tập 14/14.

## File liên quan

- [contracts/internal/van_chuyen.md](../../contracts/internal/van_chuyen.md), [ton_kho.md](../../contracts/internal/ton_kho.md), [tool_san_pham.md](../../contracts/internal/tool_san_pham.md), [tiktok_api.md](../../contracts/internal/tiktok_api.md)
- [contracts/tiktok/api/order_detail.json](../../contracts/tiktok/api/order_detail.json), [contracts/internal/router_event.json](../../contracts/internal/router_event.json)
- `n8n/workflows/m2-*.json` (4 khung chờ sẵn)
- [docs/van-hanh-may-chu.md](../van-hanh-may-chu.md): nạp workflow, diễn tập, giả lập

## Câu giao việc mẫu cho AI

> Tôi làm phần kho và đơn hàng cho đồ án dùng Odoo 19 Community và n8n. Đọc file nhóm việc và các hợp đồng đính kèm. Hướng dẫn tôi từng bước dựng workflow n8n "M2 · Tạo đơn": nhận sự kiện từ Router theo `router_event.json`, lấy chi tiết đơn qua workflow con `M3 · TikTok API`, gộp `line_items` theo SKU, tìm sản phẩm Odoo theo Internal Reference, tạo và xác nhận Sales Order với Customer Reference là mã đơn TikTok, không tạo trùng, rồi ghi bảng `order_status_log`. Dùng node Odoo hoặc HTTP Request JSON-RPC của n8n. Cho tôi từng node với cấu hình cụ thể.
