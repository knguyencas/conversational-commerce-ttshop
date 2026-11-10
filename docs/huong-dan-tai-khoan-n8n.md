# Hướng dẫn tài khoản n8n cho cả nhóm

n8n chạy trên máy trưởng nhóm. Lần đầu mở, n8n bắt tạo tài khoản **owner**; tài khoản này chỉ trưởng nhóm giữ. M2 và M4 được mời làm **member**.

## Bản n8n miễn phí làm được gì (đã thử trên n8n 2.45.4)

| Việc | Bản Community miễn phí |
|---|---|
| Mời thêm người làm member, lấy link mời không cần cài email | Được |
| Chia sẻ workflow cho người khác | Không, báo *Plan lacks license for this feature* |
| Chia sẻ credential (Postgres, Odoo, Gemini...) | Không, cùng lỗi trên |
| Nâng member thành admin | Không, cùng lỗi trên |

Vì vậy **member chỉ thấy và sửa được workflow, credential của chính mình**. Workflow chạy thật (Router, các workflow M2 mà Router gọi) phải nằm trong tài khoản owner, với `id` cố định như trong thư mục `n8n/workflows/`. Quy trình làm việc ở mục 3 xử lý chuyện này.

## 1. Trưởng nhóm tạo tài khoản owner (một lần)

1. Mở `http://localhost:5678`.
2. Điền email, họ tên, mật khẩu mạnh của cậu. Lưu mật khẩu vào trình quản lý mật khẩu.
3. Bỏ qua bước khảo sát.

Khi đã bật ngrok, giao diện n8n cũng mở được từ internet qua domain ngrok. Mật khẩu owner là lớp bảo vệ duy nhất ở đó, nên đừng dùng mật khẩu yếu hay mật khẩu đã dùng ở nơi khác.

## 2. Mời M2 và M4

1. **Settings → Users → Invite**, nhập email của M2 và M4, chọn role **Member**.
2. Máy chưa cài gửi email nên n8n không gửi thư. Bấm **Copy invite link** ở từng người.
3. Link có dạng `http://localhost:5678/signup?token=...`. Đổi `localhost` thành địa chỉ Tailscale của máy trưởng nhóm (dạng `100.x.y.z`), rồi gửi **riêng** cho từng người. Link có hạn dùng; hết hạn thì mời lại.
4. M2, M4 bật Tailscale, mở link, đặt mật khẩu của mình.

## 3. Cách M2 và M4 làm workflow

1. **Làm và thử trong tài khoản của mình.** Tạo credential riêng của mình: Odoo (API key của user tích hợp) cho M2, Creatomate và FPT.AI cho M4. Muốn đọc bảng middleware thì xin trưởng nhóm thông tin kết nối PostgreSQL, gửi riêng.
2. **Muốn thay một workflow giữ chỗ** (`M2 · Tạo đơn`, `M2 · Hủy đơn`, `M2 · Đồng bộ tồn kho`, `M2 · Cập nhật Odoo (vận chuyển)`): mở file tương ứng trong `n8n/workflows/` (vd `m2-tao-don.json`), **Import from file** vào tài khoản mình, làm tiếp trên bản đó. Giữ nguyên tên workflow và node trigger.
3. **Khi chạy được**: menu **… → Download**. Mở file vừa tải, sửa dòng `"id"` thành id của file giữ chỗ (vd `"m2TaoDon00000001"`), gửi cho trưởng nhóm hoặc commit vào `n8n/workflows/`.
4. **Trưởng nhóm nạp vào tài khoản owner**: chép file vào `n8n/workflows/`, chạy `./scripts/import-n8n.sh`. Script nạp đè đúng id, publish và khởi động lại n8n. Lần đầu nạp workflow có credential mới (Odoo, Creatomate...), trưởng nhóm tạo credential cùng tên trong tài khoản owner. Mã và khóa lấy từ thành viên qua tin nhắn riêng.
5. Trưởng nhóm kiểm tra workflow đi đúng qua Router và các bảng dùng chung, không sửa hộ phần logic.

## 4. M4 có cần tài khoản n8n không

- Dashboard KPI **không cần**: Google Sheet lấy số qua `M3 · KPI cho dashboard`, xem `docs/huong-dan-kpi-dashboard.md`.
- Workflow tạo video (`M4 · Tạo video`) thì làm theo mục 3 như M2.
