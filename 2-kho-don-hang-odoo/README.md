# Nhóm việc 2: Kho và đơn hàng (Odoo)

**Người làm:** Hữu Đức dựng và cấu hình Odoo; trưởng nhóm làm các workflow n8n.

## Việc này phục vụ gì trong đồ án

Odoo là **nguồn sự thật** cho giá, tồn kho và đơn hàng. Khi khách đặt đơn trên TikTok, đơn phải **tự chảy vào Odoo** để giữ hàng, không ai nhập tay. Khi kho đóng gói xong, Odoo báo n8n để đặt giao hàng. Đây là phần chứng minh "tự động hóa quy trình đơn hàng" của đồ án.

## Phải làm gì

| Mã | Việc | Ai | Xong khi |
|---|---|---|---|
| M2-01 | Mở Odoo `http://<IP Tailscale máy chủ>:8069`, tạo database `cntttmdt` (Master Password lưu kỹ), không tick Demo data. Cài **Sales** và **Inventory**; đặt công ty, tiền VND, múi giờ Việt Nam | Hữu Đức | Vào được Odoo |
| M2-02 | Nhập sản phẩm từ `1-cua-hang-tiktok/san-pham.csv` (Import). **Internal Reference = SKU**, nhập tồn đầu kỳ | Hữu Đức | Đủ sản phẩm, giá, tồn |
| M2-03 | Tạo user riêng cho tích hợp, có API key, chỉ quyền Sales và Inventory. Gửi riêng API key cho trưởng nhóm | Hữu Đức | Có credential Odoo trong n8n |
| M2-04 | Cài **Automation Rule**: phiếu xuất kho chuyển sang Done thì gửi webhook về n8n. Cách làm: [contracts/internal/van_chuyen.md](../contracts/internal/van_chuyen.md) | Hữu Đức | Đóng gói một phiếu thử thì `M3 · Đặt vận chuyển` chạy |
| M2-11 | Viết `huong-dan-dong-goi.md`: mở phiếu xuất kho, bấm Validate | Hữu Đức | 1 trang hướng dẫn |
| M2-06 | Workflow **M2 · Tạo đơn**: đổi SKU, tạo và xác nhận Sales Order, ghi `order_status_log` dòng `odoo_created` | Trưởng nhóm | Đặt đơn bằng form giả lập thì Odoo có Sales Order |
| M2-07 | Workflow **M2 · Hủy đơn**: hủy Sales Order tương ứng | Trưởng nhóm | Hủy trên form thì Sales Order bị hủy, tồn tăng lại |
| M2-08 | Workflow **M2 · Đồng bộ tồn kho**, theo [contracts/internal/ton_kho.md](../contracts/internal/ton_kho.md) | Trưởng nhóm | Chạy không lỗi với TikTok giả |
| M2-09 | Workflow **M2 · Cập nhật Odoo (vận chuyển)**: ghi mã vận đơn, trạng thái giao vào Sales Order | Trưởng nhóm | Sau bước "đang giao" trên form, Sales Order có mã vận đơn |
| M2-05 | Tool tra sản phẩm đọc Odoo cho chatbot, theo [contracts/internal/tool_san_pham.md](../contracts/internal/tool_san_pham.md) | Trưởng nhóm | Bot trả giá theo Odoo thay vì dữ liệu giả |

## Thư mục này chứa gì

```
2-kho-don-hang-odoo/
├── workflows/
│   ├── m2-tao-don.json                   M2 · Tạo đơn                    (khung chờ sẵn)
│   ├── m2-huy-don.json                   M2 · Hủy đơn                    (khung chờ sẵn)
│   ├── m2-dong-bo-ton-kho.json           M2 · Đồng bộ tồn kho            (khung chờ sẵn)
│   └── m2-cap-nhat-odoo-van-chuyen.json  M2 · Cập nhật Odoo (vận chuyển) (khung chờ sẵn)
├── cau-hinh.md            (Hữu Đức viết) Odoo đã cài gì, bật cài đặt gì; không ghi mật khẩu
└── huong-dan-dong-goi.md  (Hữu Đức viết) hướng dẫn 1 trang cho người đóng gói
```

Các workflow `m2-*` đã có **khung chờ sẵn**: Router đã gọi tới đúng chỗ, dữ liệu vào đúng dạng. Chỉ cần thay node "Chưa làm (giữ chỗ)" bằng xử lý thật, **giữ nguyên `"id"`** trong file vì Router gọi theo id.

## Nối với phần nào, thế nào

```
TikTok (hoặc form giả lập) ──▶ M3 · Router ──▶ M2 · Tạo đơn ──▶ Odoo: Sales Order
                                            └▶ M2 · Hủy đơn  ──▶ Odoo: hủy Sales Order
Odoo: phiếu xuất kho Done ──webhook──▶ M3 · Đặt vận chuyển ──▶ M2 · Cập nhật Odoo (vận chuyển)
M2 · Tạo đơn / Hủy đơn ──▶ M2 · Đồng bộ tồn kho ──▶ M3 · TikTok API ──▶ TikTok
```

- **Vào:** sự kiện đơn hàng từ Router, dạng dữ liệu trong [contracts/internal/router_event.json](../contracts/internal/router_event.json) và [contracts/tiktok/api/order_detail.json](../contracts/tiktok/api/order_detail.json). Lưu ý `line_items` là mỗi đơn vị một dòng: mua 2 cái cùng SKU thì có 2 dòng, phải gộp lại để ra số lượng.
- **Ra:** dòng trong bảng `order_status_log` (để nhóm 3 biết phiếu xuất kho thuộc đơn TikTok nào), Sales Order trong Odoo.
- **Gọi TikTok** luôn qua workflow `M3 · TikTok API` ([contracts/internal/tiktok_api.md](../contracts/internal/tiktok_api.md)), không tự ký request.

## Cách thử

Dùng form giả lập ([docs/cai-dat-chung.md](../docs/cai-dat-chung.md), mục 4): đặt đơn mới với SKU có trong Odoo, rồi đóng gói, đang giao, hủy. Sau mỗi bước, mở Odoo xem Sales Order và trang danh sách đơn. Trưởng nhóm sửa workflow trong n8n, xong thì **Download**, chép đè vào `workflows/`, commit, rồi chạy `bash scripts/import-n8n.sh` trên máy chủ.

## Nộp cho báo cáo

`bao-cao/nhom-2-kho-don-hang.md`: cấu hình Odoo (ảnh chụp), 4 workflow (ảnh chụp), kết quả thử đặt, đóng gói, hủy bằng form giả lập.
