# Hợp đồng: đồng bộ tồn kho Odoo → TikTok (workflow `M2 · Đồng bộ tồn kho`)

Odoo là nơi duy nhất giữ số tồn đúng. TikTok chỉ nhận số được đẩy lên, không ai sửa tồn kho tay trong Seller Center. Workflow này của **M2**; trưởng nhóm đã dựng sẵn khung giữ chỗ trong `2-kho-don-hang-odoo/workflows/m2-dong-bo-ton-kho.json` với đủ hai trigger dưới đây.

## 1. Khi nào chạy

| Nguồn | Trigger trong workflow | Dữ liệu vào |
|---|---|---|
| Lịch 15 phút một lần, để bắt kịp nhập hàng tay | `Mỗi 15 phút` (đang tắt, M2 bật khi làm xong) | không có, hiểu là đồng bộ tất cả |
| Cuối `M2 · Tạo đơn` và `M2 · Hủy đơn` | `Workflow khác gọi tới` | xem mục 2 |

Ở `M2 · Tạo đơn` và `M2 · Hủy đơn`, thêm node **Execute Workflow** chọn `M2 · Đồng bộ tồn kho`, **tắt** *Wait for sub-workflow*, để đơn không phải chờ TikTok trả lời.

Phiếu xuất kho chuyển sang Done không làm đổi số có thể bán, vì hàng đã được giữ từ lúc xác nhận Sales Order. Vì vậy không cần gọi lại ở bước đóng gói.

## 2. Dữ liệu vào khi gọi từ workflow khác

```json
{ "ly_do": "tao_don", "seller_skus": ["IP15-128-DEN", "OP-IP15-TRONG"], "tiktok_order_id": "579123456789012345" }
```

| Trường | Ý nghĩa |
|---|---|
| `ly_do` | `tao_don`, `huy_don`, `nhap_hang` hoặc `khac`; chỉ để ghi log |
| `seller_skus` | SKU cần đồng bộ. Bỏ trống hoặc `[]` nghĩa là đồng bộ tất cả SKU đang bán |
| `tiktok_order_id` | Không bắt buộc, để lần vết |

Node `Chuẩn hóa yêu cầu` trong khung giữ chỗ đã gom cả hai nguồn về một dạng: `{ ly_do, tat_ca, seller_skus, tiktok_order_id }`.

## 3. Việc M2 làm trong workflow

1. **Đọc số có thể bán trong Odoo**: model `product.product`, lọc `default_code` theo `seller_skus` (hoặc lấy hết khi `tat_ca` = `true`), đọc trường `free_qty`. Đây là tồn thực trừ hàng đã giữ cho đơn chưa giao.
2. **Đổi SKU sang mã TikTok** bằng bảng `sku_map` (credential `Postgres · middleware`):

   ```sql
   SELECT seller_sku, tiktok_product_id, tiktok_sku_id
   FROM sku_map
   WHERE is_active AND seller_sku = ANY($1::text[]);
   ```

3. **Lấy mã kho TikTok** một lần: gọi `M3 · TikTok API` với `GET /logistics/202309/warehouses`, chọn kho bán hàng mặc định, lưu vào `$getWorkflowStaticData('global')` để lần sau khỏi gọi lại.
4. **Gom theo sản phẩm** rồi gọi `M3 · TikTok API` cho từng `tiktok_product_id`:

   ```json
   {
     "method": "POST",
     "path": "/product/202309/products/1729587769570297600/inventory/update",
     "query": {},
     "body": { "skus": [ { "id": "1729587769570363136",
                           "inventory": [ { "warehouse_id": "7068517275539719942", "quantity": 12 } ] } ] },
     "shop": true
   }
   ```

   `quantity` là số nguyên ≥ 0; số âm trong Odoo thì gửi 0.
5. **Xử lý kết quả**: `ok` = `false` thì cho đi qua *Stop and Error* để Retry On Fail (tối đa 3 lần) và workflow `M3 · Xử lý lỗi` ghi vào `failed_jobs`. `auth_error` = `true` thì báo trưởng nhóm.

## 4. Kiểm tra khi làm xong

- Tạo một đơn thử: tồn trên TikTok giảm đúng số lượng trong vòng 1 phút.
- Hủy đơn đó: tồn tăng lại.
- Sửa tồn tay trong Odoo (nhập hàng): sau tối đa 15 phút TikTok khớp lại.
- SKU có trong Odoo nhưng chưa có trong `sku_map`: bỏ qua và ghi chú, không làm hỏng cả lượt.

> Tên endpoint và cấu trúc body viết theo tài liệu TikTok Shop API bản 202309 mà nhóm biết. **Cần đối chiếu trong Partner Center khi app được duyệt.**
