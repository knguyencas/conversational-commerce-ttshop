# Nhóm việc 4: Nội dung và đo lường

## Bối cảnh

Đồ án: bán hàng qua chat cho một shop đồ công nghệ trên TikTok Shop. Thầy sẽ hỏi hai câu: **"khách từ đâu tới?"** và **"hệ thống có hiệu quả không?"**. Nhóm việc này trả lời bằng nội dung (video), dashboard số liệu, và video demo trọn luồng. Shop chưa có khách thật, nên số liệu đến từ diễn tập, form giả lập và giao diện demo; điều này được ghi rõ trong báo cáo.

## Đồ án cần gì từ nhóm này

1. **Dashboard KPI** trên Looker Studio (miễn phí), đọc số liệu hệ thống qua Google Sheet.
2. **Video demo** 3–5 phút quay trọn luồng trên giao diện demo, dùng khi thuyết trình và nộp kèm.
3. **1–2 video sản phẩm ngắn** kiểu TikTok (tùy chọn): minh họa phần "nội dung kéo khách".
4. **Kế hoạch quảng cáo GMV Max trên giấy**: sẽ chạy thế nào nếu có ngân sách. Không chạy vì tốn tiền.

## Hiện trạng

- Database đã có 5 view KPI; workflow `M3 · KPI cho dashboard` trả CSV qua `GET /webhook/kpi-dashboard?bang=...` (header `x-kpi-key`).
- Apps Script mẫu kéo CSV vào Google Sheet: `noi-dung/apps-script/cap-nhat-kpi.gs`.
- API demo có thêm `GET /webhook/demo/kpi` trả số liệu hôm nay dạng JSON.
- Chưa có Google Sheet, Looker, video.

## Kết nối với nhóm khác

| Hướng | Thứ gì | Với ai |
|---|---|---|
| Vào | CSV KPI, mã `KPI_SECRET` (gửi riêng) | Nhóm 3 |
| Vào | Giao diện demo chạy được | Nhóm 1 (để quay video) |
| Vào | `san-pham.csv` | Nhóm 1 (kịch bản video sản phẩm) |

## Triển khai

### Dashboard

1. Tạo Google Sheet; **Extensions → Apps Script**, dán `noi-dung/apps-script/cap-nhat-kpi.gs`, sửa `BASE` thành domain ngrok của máy chủ.
2. **Script properties**: `KPI_KEY` = mã `KPI_SECRET` (không dán vào file trong repo).
3. Chạy `capNhatKpi` một lần, cấp quyền; thêm trigger *Time-driven* mỗi giờ. Sheet có các tab `tong_hop`, `y_dinh`, `xu_ly_don`, `mua_kem`, `ab_mua_kem`.
4. **Looker Studio**: nguồn Google Sheets, tab `tong_hop`, cột `ngay` kiểu Date. Biểu đồ gợi ý: đường số tin nhắn và số đơn theo ngày; thẻ số tỉ lệ đúng giá, thời gian trả lời trung bình, tỉ lệ chat ra đơn; cột so sánh giá trị đơn có mời và không mời mua kèm; tròn phân bố ý định (tab `y_dinh`); bảng mua kèm.
5. **Có số liệu**: trước khi chụp, chạy diễn tập vài lần, đặt vài đơn và chat vài câu trên giao diện demo.
6. Viết `noi-dung/dashboard.md`: link dashboard, giải thích từng chỉ số và cách tính (xem [docs/huong-dan-kpi-dashboard.md](../huong-dan-kpi-dashboard.md)).

### Video demo (quay màn hình)

Kịch bản 3–5 phút, quay bằng OBS hoặc Xbox Game Bar (miễn phí):

1. Giới thiệu: shop đồ công nghệ, khách chat là mua; TikTok chỉ cấp API cho doanh nghiệp nên dùng giao diện mô phỏng.
2. Khách hỏi giá → bot trả đúng giá, mời mua kèm. Khách hỏi câu lừa → bot không bịa.
3. Khách đặt món bot gợi ý → Odoo tự có Sales Order (quay màn Odoo).
4. Người bán đóng gói → đặt vận chuyển → khách nhận thông báo mã vận đơn.
5. Khách khiếu nại → bot chuyển nhân viên.
6. Dashboard: số liệu vừa phát sinh.

Lưu video vào Drive chung, ghi link và kịch bản vào `noi-dung/kich-ban/`.

### Video sản phẩm (tùy chọn)

Video dọc 15–30 giây cho 1–2 món trong `san-pham.csv`: một bản nói thông số, một bản nói "nỗi đau" (vd cáp hay đứt) để minh họa A/B nội dung. Dựng bằng CapCut (miễn phí), giọng đọc có thể dùng gói miễn phí của các dịch vụ chuyển văn bản thành giọng nói. Không dùng logo hãng.

### Kế hoạch quảng cáo

`noi-dung/gmv-max.md`, 1 trang: sản phẩm chạy, ROI mục tiêu (mức tham khảo ngành điện tử: CTR 0,64%, ROAS 1,98), ngân sách ngày giả định, lịch chạy, chỉ số theo dõi, và lý do chưa chạy.

## Ràng buộc

- 0 đồng: không chạy quảng cáo, không dùng dịch vụ cần thẻ.
- Không đưa `KPI_SECRET` lên GitHub.
- Ghi rõ số liệu đến từ môi trường giả lập, không trình bày như doanh số thật.

## Xong khi

- [ ] Dashboard Looker có số liệu thật từ hệ thống (không nhập tay), tự cập nhật mỗi giờ.
- [ ] `noi-dung/dashboard.md` giải thích đủ chỉ số.
- [ ] Video demo 3–5 phút đi trọn 6 bước kịch bản.
- [ ] `noi-dung/gmv-max.md` có kế hoạch.

## File liên quan

- [docs/huong-dan-kpi-dashboard.md](../huong-dan-kpi-dashboard.md): bảng KPI, Apps Script, Looker
- `noi-dung/apps-script/cap-nhat-kpi.gs`
- [contracts/internal/demo_api.md](../../contracts/internal/demo_api.md): `GET /kpi` nếu muốn số liệu trực tiếp trên giao diện

## Câu giao việc mẫu cho AI

> Tôi làm dashboard KPI cho đồ án. Đọc file nhóm việc và `docs/huong-dan-kpi-dashboard.md`. Google Sheet của tôi có tab `tong_hop` với các cột trong tài liệu. Hướng dẫn tôi từng bước dựng báo cáo Looker Studio một trang gồm: biểu đồ đường số tin nhắn và số đơn theo ngày, 4 thẻ số (tỉ lệ đúng giá, thời gian trả lời trung bình, tỉ lệ chat ra đơn, tỉ lệ nhận lời mời mua kèm), cột so sánh giá trị đơn có mời và không mời, bộ lọc khoảng ngày.
