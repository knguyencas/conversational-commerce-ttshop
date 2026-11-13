# Đồ án cần những gì và triển khai thế nào

Tài liệu chia đồ án thành **4 nhóm việc**. Mỗi nhóm việc có một file riêng, viết để đưa thẳng cho trợ lý AI (ChatGPT, Claude, Gemini...) đọc và làm theo. Tài liệu không chia ai làm gì; nhóm tự bàn rồi nhận việc.

## Đề tài trong một đoạn

Môn *Công nghệ thông tin trong thương mại điện tử*. Đề tài: **bán hàng qua chat (conversational commerce) cho một shop đồ công nghệ trên TikTok Shop**. Khách hỏi trong khung chat thì chatbot AI trả lời bằng dữ liệu thật (giá, tồn kho, đơn hàng). Khách đặt mua thì đơn tự chảy vào phần mềm kho Odoo, tự đặt giao hàng, tự báo trạng thái cho khách, không ai nhập tay. Số liệu đổ về dashboard.

TikTok Shop chỉ cấp Open API cho doanh nghiệp có giấy phép, nên đồ án chạy bằng **chế độ giả lập**: một **trang web đóng vai TikTok Shop** gửi sự kiện y như TikTok gửi vào hệ thống. Mọi phần phía sau (middleware, chatbot, Odoo, dashboard) chạy thật.

## Đồ án cần nộp những gì

Trạng thái cập nhật ngày 14/11/2026.

| # | Sản phẩm cuối | Thầy nhìn thấy gì | Trạng thái | Nhóm việc |
|---|---|---|---|---|
| 1 | **Giao diện demo** (shop giả lập trên web) | Khách xem sản phẩm, chat với bot, đặt mua, theo dõi đơn; người bán đẩy đơn qua các bước | Đang làm trên nhánh riêng: đã có phần nhìn, chưa nối API (việc cần sửa: [sua-web-hdx.md](sua-web-hdx.md)) | 1 |
| 2 | **Hệ thống middleware** nối TikTok, Odoo, AI | Đơn đi qua từng bước tự động; chữ ký, chống trùng, xử lý lỗi | Đã chạy (14/14 bước diễn tập) | 3 |
| 3 | **Chatbot AI** trả lời đúng giá, không bịa | Trả lời tiếng Việt, soát giá bằng code, khiếu nại thì chuyển người | Xong: chạy Groq + PhoBERT, đã chấm bộ 125 câu và sửa theo ghi chú chấm tay (`danh-gia/ket-qua/`); lỗi phát sinh sửa sau | 3 |
| 4 | **Odoo** quản lý kho và đơn | Sales Order tự tạo khi khách đặt, hủy khi khách hủy, có mã vận đơn | Đã chạy: 35 sản phẩm, 4 workflow M2, tồn kho lấy từ Odoo; đã có [hướng dẫn đóng gói](../../odoo/huong-dan-dong-goi.md); còn ảnh cho báo cáo | 2 |
| 5 | **Lớp AI nhóm tự train** | Bảng số: F1 hiểu ý định (PhoBERT), Hit@3 gợi ý mua kèm, A/B có mời và không mời | PhoBERT đã train, chạy trong chatbot; điểm chính thức chờ tập test do người viết. Mua kèm (17 loại) đạt: P(B\|A) hơn baseline Hit@3, đạt khoảng 93% trần lý thuyết; luật gồm 3 cặp đi kèm từ Amazon, chỗ thiếu bù luật shop (`upsell/outputs/metrics.json`). Số A/B cần đơn từ buổi diễn tập | 3 |
| 6 | **Dashboard KPI** | Số tin nhắn, thời gian trả lời, tỉ lệ đúng giá, số đơn, thời gian xử lý đơn | Cần làm (API số liệu đã có: `/webhook/kpi-dashboard`) | 4 |
| 7 | **Minh chứng nền tảng TikTok** | Ảnh mở shop, sản phẩm nháp, chỗ TikTok yêu cầu giấy phép doanh nghiệp | Cần làm (chỉ ảnh minh chứng; nhóm không bán trên TikTok thật) | 1 |
| 8 | **Video demo và báo cáo** | Video quay trọn luồng; báo cáo kiến trúc, số liệu, lý do dùng giả lập | Cần làm | 4 (video), cả nhóm (báo cáo) |

**Ngoài phạm vi:** xuất hóa đơn bán hàng và đối soát tiền với sàn. Hệ thống xử lý luồng chat, đơn hàng, kho và giao hàng; Odoo có sẵn module Hóa đơn và Kế toán để mở rộng sau.

## Bốn nhóm việc

| File | Nhóm việc | Gồm |
|---|---|---|
| [1-cua-hang-va-giao-dien-demo.md](1-cua-hang-va-giao-dien-demo.md) | Cửa hàng và giao diện demo | Web shop giả lập, dữ liệu sản phẩm, bộ câu test, minh chứng TikTok |
| [huong-dan-web-gia-lap.md](huong-dan-web-gia-lap.md) | (đi kèm nhóm 1) | Hướng dẫn làm web giả lập bằng React + Vite từng bước, có code gọi API |
| [sua-web-hdx.md](sua-web-hdx.md) | (đi kèm nhóm 1) | Sửa web HDX Tech đang có (nhánh `feature/hdx-tech-shop-huuduc`) để nối vào hệ thống: mục tiêu, quy tắc, giữ/bỏ/sửa/thêm |
| [2-kho-va-don-hang.md](2-kho-va-don-hang.md) | Kho và đơn hàng | Odoo, 4 workflow đơn hàng, tool đọc Odoo cho chatbot |
| [3-middleware-va-ai.md](3-middleware-va-ai.md) | Middleware và AI | Máy chủ, n8n, chatbot, API cho giao diện demo, train và chấm mô hình |
| [4-noi-dung-va-do-luong.md](4-noi-dung-va-do-luong.md) | Nội dung và đo lường | Dashboard KPI, video demo, kế hoạch quảng cáo |

## Nhóm nào cần nhóm nào

```
Nhóm 1 ── san-pham.csv ─────────────▶ Nhóm 2 (nhập Odoo), Nhóm 3 (dữ liệu chatbot)
Nhóm 1 ── bộ câu test ──────────────▶ Nhóm 3 (chấm chatbot, chấm PhoBERT)
Nhóm 1 ── giao diện demo ── gọi API ─▶ Nhóm 3 (API demo: đã có)
Nhóm 2 ── Odoo + 4 workflow ────────▶ Nhóm 3 (Router gọi workflow đơn hàng)
Nhóm 3 ── số liệu KPI ──────────────▶ Nhóm 4 (dashboard)
Nhóm 1 + 2 + 3 chạy được ───────────▶ Nhóm 4 (quay video demo)
```

Không nhóm nào phải chờ nhóm khác mới bắt đầu được: chỗ nào chưa có thì đã có dữ liệu mẫu hoặc khung chờ sẵn.

## Thứ tự triển khai

| Đợt | Việc | Xong đợt khi |
|---|---|---|
| 1. Nền | Nhóm 1: `san-pham.csv`, khung giao diện gọi được `GET /san-pham`. Nhóm 2: Odoo cài xong, nhập sản phẩm. Nhóm 3: Tailscale, nạp dữ liệu sản phẩm mới vào chatbot. Nhóm 4: Google Sheet + Apps Script kéo được KPI | Giao diện hiện đúng danh sách sản phẩm; Odoo có sản phẩm |
| 2. Ghép | Nhóm 1: giao diện có chat, đặt đơn, đơn của tôi. Nhóm 2: Tạo đơn, Hủy đơn chạy thật trong Odoo. Nhóm 3: train mô hình mua kèm. Nhóm 4: Looker Studio | Đặt đơn trên giao diện thì Odoo có Sales Order |
| 3. Hoàn thiện | Nhóm 1: màn người bán, bộ câu test. Nhóm 2: đồng bộ tồn kho, cập nhật vận chuyển. Nhóm 3: train PhoBERT, chấm chatbot. Nhóm 4: quay video | Diễn tập 14/14, chatbot từ 90% câu test đúng, có video |
| 4. Báo cáo | Mỗi nhóm viết phần mình vào `bao-cao/`, ghép thành bản nộp | Nộp |

## Ràng buộc chung (mọi nhóm)

1. **0 đồng.** Không mua hàng, không chạy quảng cáo, chỉ dùng gói miễn phí.
2. **Không có API TikTok thật.** Mọi thứ liên quan TikTok chạy qua chế độ giả lập; giao diện demo là "TikTok" của đồ án.
3. **SKU là khóa** nối giao diện, Odoo, chatbot. Một sản phẩm một SKU, viết giống hệt nhau ở mọi nơi.
4. **Odoo là nguồn sự thật** cho giá, tồn kho, đơn hàng.
5. **Mọi sự kiện đi qua n8n.** Giao diện chỉ gọi 7 API `/webhook/demo/...` (do n8n cung cấp), không gọi Odoo, database hay AI trực tiếp; Odoo không gọi giao diện.
6. **Không lộ khóa.** Mật khẩu, API key, mã nhóm chỉ nằm trong `.env` máy chủ hoặc gửi tin nhắn riêng; không đưa lên GitHub.
7. **Danh mục HDX Tech chỉ nằm trên web giả lập.** 25 sản phẩm laptop và phụ kiện máy tính có hãng trong `cua-hang/san-pham.csv`, 10 loại hàng: laptop, bàn phím, chuột, tai nghe, màn hình, ssd, hub, micro, webcam, lót chuột. TikTok đòi thư ủy quyền mới cho đăng hàng có hãng, nên không đăng danh mục này lên TikTok thật; minh chứng TikTok chỉ dùng sản phẩm nháp không thương hiệu.

## Môi trường dùng chung

| Thứ | Ở đâu | Ai vào được |
|---|---|---|
| Máy chủ (Docker: PostgreSQL, Odoo, n8n, ngrok) | Máy trưởng nhóm | Người giữ máy chủ |
| Odoo | `http://<IP Tailscale máy chủ>:8069` | Ai đã vào Tailscale |
| API demo, form giả lập | `https://<domain ngrok>/webhook/demo/...`, `/form/gia-lap-tiktok` | Ai có mã nhóm |
| n8n | `http://localhost:5678` trên máy chủ | Người giữ máy chủ (bản miễn phí không chia sẻ workflow giữa tài khoản) |
| Code | GitHub `conversational-commerce-ttshop` | Thành viên được mời |

Cài đặt cho người mới: [../../huong-dan/00-cai-dat-chung.md](../../huong-dan/00-cai-dat-chung.md).

## Dùng tài liệu này với trợ lý AI

1. Mở file của nhóm việc mình nhận.
2. Đưa cho AI: **nguyên file đó**, cộng các file trong mục "File liên quan" của nó (nhất là hợp đồng trong `contracts/`).
3. Dán câu giao việc mẫu ở cuối file, sửa theo việc cụ thể.
4. Bắt AI làm từng bước nhỏ, chạy thử sau mỗi bước, đối chiếu với mục "Xong khi".
5. AI đề xuất đổi dạng dữ liệu đi qua lại giữa các nhóm thì **không làm**: sửa `contracts/` trước và báo nhóm kia.
