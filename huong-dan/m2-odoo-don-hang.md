# M2: Odoo và quy trình đơn hàng

Làm [cài đặt chung](00-cai-dat-chung.md) trước. M2 cần thêm **tài khoản n8n**: M3 gửi link mời, đổi `localhost` trong link thành IP Tailscale của M3 rồi mở, đặt mật khẩu.

Thư mục của M2: [`odoo/`](../odoo/), các file `n8n/workflows/m2-*.json`, `contracts/odoo/`.

## Việc của M2

| Mã | Việc | Xong khi |
|---|---|---|
| M2-01 | Mở Odoo `http://<IP Tailscale M3>:8069`. Tạo database `cntttmdt` (Master Password lưu kỹ), không tick Demo data. Cài **Sales**, **Inventory**; đặt công ty, tiền VND, múi giờ Việt Nam | Vào được Odoo |
| M2-02 | Nhập sản phẩm từ `cua-hang/san-pham.csv` của M1 (Import). **Internal Reference = SKU**. Nhập tồn đầu kỳ | Đủ sản phẩm, giá, tồn |
| M2-03 | Tạo **user riêng cho tích hợp** có API key, chỉ cấp quyền Sales, Inventory. **Gửi riêng** API key cho M3 | M3 tạo được credential Odoo trong n8n |
| M2-04 | Cài **Automation Rule**: phiếu xuất kho chuyển sang Done thì gửi webhook về n8n (mã bí mật M3 gửi riêng). Cách làm: [contracts/internal/van_chuyen.md](../contracts/internal/van_chuyen.md) | Đóng gói một phiếu thử, M3 thấy workflow Đặt vận chuyển chạy |
| M2-05 | Workflow tra sản phẩm từ Odoo cho chatbot, theo [contracts/internal/tool_san_pham.md](../contracts/internal/tool_san_pham.md) | Bot trả đúng giá theo Odoo |
| M2-06 | **M2 · Tạo đơn**: nhận đơn từ Router, đổi SKU qua `sku_map`, tạo và xác nhận Sales Order, ghi `order_status_log` dòng `odoo_created` | Đặt đơn bằng form giả lập thì Odoo có Sales Order |
| M2-07 | **M2 · Hủy đơn**: hủy Sales Order tương ứng | Hủy bằng form giả lập thì Sales Order bị hủy, tồn tăng lại |
| M2-08 | **M2 · Đồng bộ tồn kho**, theo [contracts/internal/ton_kho.md](../contracts/internal/ton_kho.md) | Chạy không lỗi với TikTok giả |
| M2-09 | **M2 · Cập nhật Odoo (vận chuyển)**: ghi mã vận đơn, trạng thái giao vào Sales Order | Sau bước "đang giao" trên form, Sales Order có mã vận đơn |
| M2-11 | Hướng dẫn 1 trang cho người đóng gói: mở phiếu xuất kho, bấm Validate | `odoo/huong-dan-dong-goi.md` |

Cả 4 workflow `M2 · …` đã có **khung chờ sẵn** trong n8n (Router đã gọi tới, dữ liệu vào đúng dạng). M2 chỉ thay node "Chưa làm (giữ chỗ)" bằng xử lý thật.

## Làm và thử workflow

1. Bản n8n miễn phí không chia sẻ workflow giữa tài khoản, nên M2 làm trong tài khoản của mình rồi gửi file cho M3 nạp. Cách làm chi tiết: [docs/huong-dan-tai-khoan-n8n.md](../docs/huong-dan-tai-khoan-n8n.md).
2. Lấy khung: mở `n8n/workflows/m2-tao-don.json` trong repo, **Import from file** vào n8n của mình, làm tiếp trên đó.
3. Thử bằng **form giả lập** (mục 4 trong [cài đặt chung](00-cai-dat-chung.md)): đặt đơn mới, hủy đơn, đóng gói, xem kết quả trong Odoo và trang danh sách đơn.
4. Xong: **Download** workflow, sửa `"id"` thành id của file khung (vd `"m2TaoDon00000001"`), chép đè vào `n8n/workflows/`, mở pull request. M3 nạp vào máy chủ.

Dữ liệu đơn TikTok trông thế nào: [contracts/tiktok/api/order_detail.json](../contracts/tiktok/api/order_detail.json). Lưu ý `line_items` là mỗi đơn vị một dòng: mua 2 cái cùng SKU thì có 2 dòng, phải gộp để ra số lượng.

## Nộp cho báo cáo

Viết `bao-cao/m2-odoo.md`: cấu hình Odoo, 4 workflow (ảnh chụp), kết quả thử đặt đơn, hủy đơn, đóng gói bằng form giả lập.
