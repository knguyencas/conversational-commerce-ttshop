# Báo cáo kết quả công việc: Thành viên 4 (Nội dung, Quảng cáo & Đo lường)

## 1. Tóm tắt các nhiệm vụ đã thực hiện
Thành viên 4 chịu trách nhiệm toàn bộ phần MarTech, tối ưu nội dung số, thiết lập chiến dịch quảng cáo, kịch bản A/B test và xây dựng hệ thống đo lường dữ liệu tự động cho đồ án Thương mại điện tử.

---

## 2. Chi tiết các hạng mục công việc đã triển khai

### M4-01: Chụp ảnh sản phẩm không lộ logo
- **Nội dung:** Sưu tầm và chụp ảnh các sản phẩm phụ kiện công nghệ chủ lực (Đế tản nhiệt, Hub chuyển đổi Type-C, Chuột không dây) theo góc chụp thương mại sạch sẽ, tuyệt đối không để lộ logo thương hiệu bên ngoài.
- **Lưu trữ:** Toàn bộ file ảnh gốc chất lượng cao đã được tải lên thư mục lưu trữ chung của nhóm trên Google Drive.

### M4-04: Kịch bản video A/B test nội dung
- **Nội dung:** Xây dựng 2 phiên bản kịch bản video ngắn (30 giây) phục vụ chiến dịch TikTok Shop:
  - *Phiên bản A (`video-01-thong-so.md`):* Tập trung vào thông số phần cứng, tốc độ truyền tải và công nghệ (Hard Specs).
  - *Phiên bản B (`video-02-noi-dau.md`):* Tập trung vào việc giải quyết nỗi đau nóng máy, thiếu cổng kết nối của người dùng (Pain-point).
- **Mục đích:** Thay vì dùng tính năng Split Test đắt đỏ trên Ads Manager, nhóm áp dụng phương pháp A/B test tự nhiên qua TikTok Studio để tiết kiệm chi phí tối đa.

### M4-05: Xây dựng Dashboard KPI tự động hóa
- **Nội dung:** 
  - Viết và cấu hình đoạn mã Google Apps Script (`apps-script/cap-nhat-kpi.gs`) để tự động kết nối qua ngrok, xác thực bằng header `x-kpi-key` lấy dữ liệu CSV từ middleware n8n/PostgreSQL của trưởng nhóm (M3).
  - Thiết lập trigger tự động đồng bộ 5 bảng dữ liệu (`tong_hop`, `y_dinh`, `xu_ly_don`, `mua_kem`, `ab_mua_kem`) vào Google Sheet mỗi giờ để làm nguồn dữ liệu trực quan cho Looker Studio.

### M4-06: Kế hoạch chiến dịch Product GMV Max
- **Nội dung:** Hoàn thiện bản kế hoạch chi tiết lưu tại `noi-dung/gmv-max.md`, bám sát các chỉ số chuẩn của ngành điện tử:
  - **CTR mục tiêu:** $\ge 0,64\%$
  - **ROAS / ROI mục tiêu:** $\ge 1,98$
  - Phân bổ ngân sách giả định 14 ngày (7.000.000 VNĐ) chia thành 3 giai đoạn rõ rệt: Học máy, Tối ưu chuyển đổi và Thu hoạch.

---

## 3. Đánh giá và Kết luận
- Toàn bộ mã nguồn, kịch bản, kế hoạch quảng cáo và cấu hình đo lường của M4 đã được đóng gói đồng bộ, đẩy đủ lên GitHub của nhóm.
- Hệ thống đo lường và kịch bản sẵn sàng vận hành thực tế khi kết nối hạ tầng máy chủ của nhóm.
