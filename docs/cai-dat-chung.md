# Cài đặt chung (cho Hữu Đức, hoặc ai mới vào nhóm)

Làm một lần, khoảng 20 phút. Không cần cài Docker, Odoo hay n8n: những thứ đó chạy trên máy trưởng nhóm (máy chủ), mình mở bằng trình duyệt.

## 1. GitHub: lấy code về máy

1. Tạo tài khoản ở github.com nếu chưa có, gửi **tên GitHub** cho trưởng nhóm.
2. Trưởng nhóm mời vào repo `conversational-commerce-ttshop`. Mở email (hoặc github.com → chuông thông báo), bấm **Accept invitation**.
3. Cài **GitHub Desktop** (desktop.github.com), đăng nhập.
4. **File → Clone repository**, chọn `conversational-commerce-ttshop`, chọn một thư mục trên máy, bấm **Clone**.

Từ đó, mỗi lần bắt đầu làm: mở GitHub Desktop, chọn nhánh `main`, bấm **Fetch origin** rồi **Pull origin** để có bản mới nhất. Cách tạo nhánh và nộp thay đổi: [CONTRIBUTING.md](../CONTRIBUTING.md).

## 2. Tailscale: vào Odoo trên máy chủ

1. Cài Tailscale (tailscale.com/download), đăng nhập bằng tài khoản Google bất kỳ.
2. Bấm link chia sẻ máy mà trưởng nhóm gửi riêng, chọn chấp nhận.
3. Mỗi lần làm việc: bật Tailscale (biểu tượng báo *Connected*), rồi mở Odoo trong trình duyệt: `http://<IP Tailscale máy chủ>:8069`.

Trưởng nhóm gửi IP dạng `100.x.y.z` trong nhóm chat. Không vào được thì có thể máy chủ đang tắt; nhắn trưởng nhóm. n8n chỉ trưởng nhóm dùng, không cần tài khoản.

## 3. Google Sheet phân công

Trưởng nhóm gửi link trong nhóm chat. Mỗi người chỉ sửa cột **Trạng thái**, **Hạn**, **Ghi chú** ở dòng của mình. Kẹt thì chọn **Kẹt** và ghi lý do.

## 4. Chế độ giả lập: chạy thử khi chưa có đơn thật

Shop chưa bán hàng thật, nên nhóm tạo đơn giả bằng form. Hệ thống xử lý đơn giả y như đơn thật: tạo đơn trong Odoo, đặt giao hàng, báo trạng thái.

- **Form:** `https://<domain ngrok>/form/gia-lap-tiktok` (trưởng nhóm gửi link và **mã nhóm** riêng). Lần đầu mở, ngrok hiện trang cảnh báo, bấm **Visit Site**. Mở đúng link domain ngrok, không mở qua IP Tailscale.
- **Danh sách đơn:** `https://<domain ngrok>/webhook/gia-lap-don?ma=<mã nhóm>`. Xem mã đơn và trạng thái từng đơn.

Một đơn đi trọn luồng như sau:

| Bước | Chọn ở ô Việc | Điền thêm | Workflow chạy |
|---|---|---|---|
| 1 | Khách đặt đơn mới | Sản phẩm: `SKU*số lượng`, cách nhau dấu phẩy; Tổng tiền | M2 · Tạo đơn |
| 2 | Kho đóng gói xong (thay Odoo báo) | Mã đơn (lấy ở danh sách đơn) | M3 · Đặt vận chuyển |
| 3 | Đơn đang giao | Mã đơn | M3 · Trạng thái đơn (nhắn mã vận đơn cho khách) |
| 4 | Khách đã nhận hàng | Mã đơn | M3 · Trạng thái đơn |
| hoặc | Khách hủy đơn | Mã đơn | M2 · Hủy đơn |

Sau khi bấm Submit, trang có thể hiện kết quả hoặc đứng ở nút Submit; cả hai đều được. Mở trang danh sách đơn để xem đơn đã tới bước nào.

## 5. Quy tắc giữ bí mật

- Không dán mật khẩu, API key, mã nhóm, mã bí mật vào repo, sheet hay nhóm chat chung. Gửi tin nhắn riêng.
- Không đưa file `.env` lên repo (đã có `.gitignore` chặn).
- Lỡ lộ khóa thì báo trưởng nhóm ngay để đổi khóa.
