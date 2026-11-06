# noi-dung/ — nội dung, quảng cáo, đo lường của M4

Thư mục này do **M4** giữ. Ảnh và video gốc để trong **Drive chung** (Git không hợp với file lớn); ở đây chỉ để chữ và code.

| Đường dẫn | Nội dung |
|---|---|
| `kich-ban/` | Kịch bản từng video, mỗi video một file `.md`: SKU, phiên bản A/B, lời đọc, link video trong Drive, link bài đăng |
| `apps-script/cap-nhat-kpi.gs` | Apps Script trong Google Sheet KPI, kéo số từ `M3 · KPI cho dashboard` mỗi giờ |
| `ab-test.md` | Kết quả A/B: video nói thông số so với video nói nỗi đau (lượt xem, lượt bấm sản phẩm, số đơn) |
| `gmv-max.md` | Kế hoạch chiến dịch GMV Max (sản phẩm, ROI mục tiêu, ngân sách) và kết quả theo ngày; hoặc lý do nhóm không chạy |
| `dashboard.md` | Link Looker Studio, danh sách biểu đồ và chỉ số nào lấy từ đâu |

Workflow tạo video của M4 nằm ở `n8n/workflows/m4-tao-video.json`. Hướng dẫn lấy số KPI: [docs/huong-dan-kpi-dashboard.md](../docs/huong-dan-kpi-dashboard.md).

Không dán `KPI_SECRET` vào file `.gs` trong repo. Mã này để trong *Script properties* của Apps Script.
