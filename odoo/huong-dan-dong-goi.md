# Hướng dẫn đóng gói (1 trang)

Dành cho người đóng gói đơn của HDX Tech. Đóng gói xong chỉ cần bấm **Xác nhận** trên phiếu xuất kho; hệ thống tự đặt vận chuyển và báo khách.

## Trước khi bắt đầu

- Mở Odoo: `http://localhost:8069` trên máy chủ, hoặc `http://<IP Tailscale>:8069` từ máy khác. Database `hdx`.
- Đăng nhập bằng tài khoản trưởng nhóm cấp (không dùng user `n8n`, user đó để máy chạy).
- Mỗi đơn khách đặt có sẵn một **Sales Order** (`S000..`) và một **phiếu xuất kho** (`WH/OUT/000..`). Không cần tạo tay.

## Các bước cho mỗi đơn

1. **Tìm đơn cần đóng gói:** vào **Tồn kho → Giao hàng**, lọc **Sẵn sàng**. Mỗi dòng là một phiếu `WH/OUT/...`; cột *Chứng từ gốc* là số Sales Order.
2. **Mở phiếu và đối chiếu:** xem danh sách sản phẩm (SKU dạng `HD-...`) và số lượng. Muốn xem mã đơn của khách thì mở Sales Order ở *Chứng từ gốc*, trường *Tham chiếu khách hàng*.
3. **Lấy hàng:** lấy đúng SKU, đúng số lượng. Kiểm tra hộp còn nguyên, đủ phụ kiện.
4. **Đóng gói:** cho hàng vào hộp, chèn chống sốc, dán kín.
5. **Bấm Xác nhận** trên phiếu. Phiếu chuyển sang *Hoàn tất*.
6. **Kiểm tra:** vài giây sau, trên web đơn chuyển sang "Đã đóng gói" và hệ thống tự đặt đơn vị vận chuyển. Mở lại Sales Order: phần lịch sử bên phải có ghi chú mã vận đơn.

Trên giao diện demo, nút **Đã đóng gói** ở tab người bán làm đúng việc của bước 5 (xác nhận phiếu xuất kho thật trong Odoo); dùng một trong hai, không bấm cả hai.

## Khi có vấn đề

| Gặp gì | Làm gì |
|---|---|
| Phiếu ở trạng thái *Đang chờ* | Kho không đủ hàng. Không đóng gói, báo trưởng nhóm. |
| Thiếu hàng hoặc hàng lỗi khi lấy | Không bấm Xác nhận. Báo trưởng nhóm để liên hệ khách. |
| Odoo hỏi tạo *đơn giao hàng chậm* (backorder) | Nghĩa là số lượng đã lấy ít hơn đơn. Bấm hủy, kiểm tra lại số lượng; thiếu thật thì làm như dòng trên. |
| Phiếu ở trạng thái *Đã hủy* | Khách đã hủy đơn trước khi đóng gói. Không đóng gói, hàng tự trả lại tồn kho. |
| Lỡ bấm Xác nhận nhầm phiếu | Không tự sửa trong Odoo (vận chuyển đã được đặt). Báo ngay trưởng nhóm. |
| Bấm Xác nhận mà web không đổi trạng thái sau 1 phút | Báo trưởng nhóm kiểm tra n8n (`M3 · Đặt vận chuyển`, bảng `failed_jobs`). Không bấm lại. |

## Không làm

- Không sửa giá, số lượng hay khách hàng trên Sales Order: đơn đến từ sàn, sửa tay sẽ lệch với đơn của khách.
- Không xóa Sales Order hay phiếu xuất kho.
- Không tự tạo phiếu xuất kho mới.
