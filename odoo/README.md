# odoo/ — tài liệu của M2 (kho và đơn hàng)

Thư mục này do **M2** giữ. Odoo chạy trên máy trưởng nhóm, nên ở đây chỉ để những gì cần ghi lại để dựng lại được và để người khác hiểu.

| File | Nội dung |
|---|---|
| `cau-hinh.md` | Odoo đã cài app nào, bật cài đặt nào (VND, múi giờ, Lots & Serial Numbers), user tích hợp có quyền gì. Không ghi mật khẩu hay API key |
| `automation-rule.md` | Cách cài Automation Rule báo phiếu xuất kho Done cho n8n, kèm ảnh chụp màn hình nếu cần |
| `huong-dan-dong-goi.md` | Hướng dẫn 1 trang cho người đóng gói: mở phiếu xuất kho, quét serial, bấm Validate |
| `ket-qua-test.md` | Kết quả test đơn trùng, hủy đơn, đồng bộ tồn kho |

Những thứ của M2 nằm ở thư mục khác, vì script và Router đọc ở đó:

- **Workflow n8n**: `n8n/workflows/m2-*.json`. Đây là khung chờ sẵn; làm xong thì xuất JSON từ n8n, giữ nguyên `"id"` của file và thay vào chỗ cũ (cách làm trong [docs/huong-dan-tai-khoan-n8n.md](../docs/huong-dan-tai-khoan-n8n.md)).
- **JSON thật Odoo trả về**: `contracts/odoo/`, để cả nhóm biết dữ liệu Odoo có dạng ra sao.
- **Hợp đồng dữ liệu cần theo**: `contracts/internal/tool_san_pham.md`, `van_chuyen.md`, `ton_kho.md`.
