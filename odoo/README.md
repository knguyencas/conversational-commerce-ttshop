# odoo/ — tài liệu của M2 (kho và đơn hàng)

## Odoo đang chạy thế nào

| | |
|---|---|
| Địa chỉ | `http://localhost:8069` trên máy chủ; máy khác trong Tailscale: `http://<IP Tailscale>:8069` |
| Database | `hdx` (chỉ database này hiện ra; trang quản lý database đã tắt) |
| Đăng nhập xem, demo | `admin`, mật khẩu `ODOO_ADMIN_PASSWORD` trong `.env` máy chủ |
| User cho n8n | `n8n` (quyền quản lý Bán hàng và Kho), mật khẩu `ODOO_N8N_PASSWORD` |
| App | Bán hàng (`sale_management`), Kho (`stock`), Automation Rules (`base_automation`) |
| Công ty | HDX Tech, tiền VND, giờ Việt Nam, giao diện tiếng Việt |
| Sản phẩm | Từ `cua-hang/san-pham.csv`: *Mã nội bộ* = SKU, giá bán, nhóm theo loại hàng, không thuế, tồn đầu kỳ = `ton_dau_ky` |
| Automation Rule | "Báo n8n: phiếu xuất kho đã xong": phiếu sang Done thì gửi webhook cho `M3 · Đặt vận chuyển` |

Dựng và cập nhật bằng `python scripts/dung-odoo.py` (chi tiết ở [docs/van-hanh-may-chu.md](../docs/van-hanh-may-chu.md) mục 4). Không ghi mật khẩu vào repo.

### Xem gì khi demo

1. Khách đặt trên web → **Bán hàng → Đơn hàng**: Sales Order mới, trạng thái *Đơn bán hàng*, *Tham chiếu khách hàng* = mã đơn.
2. **Tồn kho → Sản phẩm**: số dự báo giảm (hàng đang giữ cho đơn).
3. **Tồn kho → Giao hàng**: mở phiếu `WH/OUT/...` của đơn, bấm **Xác nhận**. Vài giây sau trên web đơn chuyển sang "Đã đóng gói", hệ thống tự đặt vận chuyển.
4. Mở lại Sales Order: phần lịch sử bên phải có ghi chú mã vận đơn, trạng thái giao hàng.
5. Khách hủy đơn chưa đóng gói → Sales Order chuyển *Đã hủy*, tồn trở lại.

Sales Order `S00001`, `S00002` là đơn thử lúc dựng (ghi chú "Đơn thử"); các Sales Order có *Tham chiếu khách hàng* đuôi `-dien-tap-...` là đơn diễn tập đã hủy.

Thư mục này do **M2** giữ. Odoo chạy trên máy trưởng nhóm, nên ở đây chỉ để những gì cần ghi lại để dựng lại được và để người khác hiểu.

| File | Nội dung |
|---|---|
| `cau-hinh.md` | Odoo đã cài app nào, bật cài đặt nào (VND, múi giờ, Lots & Serial Numbers), user tích hợp có quyền gì. Không ghi mật khẩu hay API key |
| `automation-rule.md` | Cách cài Automation Rule báo phiếu xuất kho Done cho n8n, kèm ảnh chụp màn hình nếu cần |
| `huong-dan-dong-goi.md` | Hướng dẫn 1 trang cho người đóng gói: tìm phiếu xuất kho, đối chiếu, đóng gói, bấm Xác nhận, xử lý khi thiếu hàng |
| `ket-qua-test.md` | Kết quả test đơn trùng, hủy đơn, đồng bộ tồn kho |

Những thứ của M2 nằm ở thư mục khác, vì script và Router đọc ở đó:

- **Workflow n8n**: `n8n/workflows/m2-*.json`. Đây là khung chờ sẵn; làm xong thì xuất JSON từ n8n, giữ nguyên `"id"` của file và thay vào chỗ cũ (cách làm trong [docs/huong-dan-tai-khoan-n8n.md](../docs/huong-dan-tai-khoan-n8n.md)).
- **JSON thật Odoo trả về**: `contracts/odoo/`, để cả nhóm biết dữ liệu Odoo có dạng ra sao.
- **Hợp đồng dữ liệu cần theo**: `contracts/internal/tool_san_pham.md`, `van_chuyen.md`, `ton_kho.md`.
