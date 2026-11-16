# Kế hoạch triển khai quảng cáo Product GMV Max trên TikTok Shop

## 1. Mục tiêu và Nguyên tắc kích hoạt
- **Mục tiêu cốt lõi:** Thu hút lưu lượng truy cập (traffic) chất lượng vào gian hàng TikTok Shop, kích thích khách hàng tương tác trong khung chat để kiểm chứng luồng vận hành tự động của Chatbot AI (PhoBERT + Gemini) và quy trình đồng bộ đơn hàng/tồn kho với Odoo.
- **Điều kiện kích hoạt (Pre-launch Checklist):** Tuyệt đối chỉ bật chiến dịch khi:
  1. Dữ liệu sản phẩm và tồn kho thực tế từ Odoo đã đồng bộ chính xác lên Seller Center qua `sku_map`.
  2. Chatbot AI đã vượt qua bộ kiểm thử 100 câu hỏi của M1 (tỷ lệ chính xác $\ge 90\%$, không sai lệch giá/tồn kho).
  3. Luồng tự động tạo đơn và đặt vận chuyển trên n8n hoạt động ổn định.

---

## 2. Chỉ số mục tiêu (KPI Benchmarks)
Chiến dịch áp dụng mức chuẩn trung bình thực tế của ngành hàng **Điện tử & Phụ kiện công nghệ (Electronics & Accessories)** trên TikTok Shop:
- **CTR (Click-Through Rate):** $\ge 0,64\%$
- **ROAS / ROI mục tiêu (Return on Ad Spend):** $\ge 1,98$
- **Tỷ lệ chuyển đổi từ Chat ra Đơn (Chat-to-Order CVR):** $\ge 12\%$
- **Tỷ lệ chấp nhận mua kèm (Upsell Acceptance Rate):** $\ge 15\%$

---

## 3. Cấu trúc chiến dịch & Phân bổ ngân sách giả định
Giả định tổng ngân sách thử nghiệm trong **14 ngày** là **7.000.000 VNĐ** (trung bình **500.000 VNĐ/ngày**), thanh toán qua **GMV Pay**.

### Giai đoạn 1: Học máy & Kiểm thử nội dung (Ngày 1 – Ngày 4 | 30% ngân sách: 2.100.000 VNĐ)
- **Loại chiến dịch:** Product GMV Max (tự động tối ưu hiển thị trên tab For You và tab Shop).
- **Nhóm sản phẩm chạy:** Chọn 3–5 SKU chủ lực có biên lợi nhuận tốt, tồn kho dồi dào trên Odoo (ví dụ: Đế tản nhiệt laptop, Hub chuyển đổi Type-C, Chuột không dây).
- **Nguồn Creative (Video):** Đưa đồng thời 2 nhóm video A/B test:
  - *Nhóm A (Thông số kỹ thuật):* Tập trung vào tốc độ truyền tải, công suất, chất liệu.
  - *Nhóm B (Giải quyết nỗi đau):* Tập trung vào tình trạng nóng máy, thiếu cổng kết nối.
- **Thiết lập ROI mục tiêu:** Đặt bằng **85% mức chuẩn** ($ROI \approx 1,68$) trong 4 ngày đầu để thuật toán dễ dàng phân phối.

### Giai đoạn 2: Tối ưu chuyển đổi & Mở rộng ngân sách (Ngày 5 – Ngày 11 | 50% ngân sách: 3.500.000 VNĐ)
- **Lọc Creative:** Tắt các video có $CTR < 0,50\%$ sau 2.000 lượt hiển thị; giữ lại các video đạt $CTR \ge 0,64\%$ để tăng ngân sách.
- **Điều chỉnh ROI:** Nâng dần ROI mục tiêu lên mức chuẩn ngành ($1,98$).

### Giai đoạn 3: Thu hoạch & Đẩy đơn chéo (Ngày 12 – Ngày 14 | 20% ngân sách: 1.400.000 VNĐ)
- Tập trung ngân sách vào 2 SKU có tỷ lệ chuyển đổi và giá trị đơn trung bình (AOV) cao nhất nhờ mô hình mua kèm của Chatbot.
