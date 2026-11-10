# Conversational Commerce trên TikTok Shop

Đồ án môn **Công nghệ thông tin trong thương mại điện tử**. Nhóm 4 người dựng một gian hàng đồ công nghệ trên TikTok Shop:
- khách hỏi trong khung chat thì **chatbot AI** trả lời bằng dữ liệu thật về giá, tồn kho, đơn hàng;
- khách đặt mua thì đơn **tự chảy vào kho (Odoo)**, tự đặt giao hàng và báo trạng thái cho khách, không ai nhập tay;
- mọi số liệu đổ về **dashboard KPI**.

```
Khách trên TikTok ──▶ TikTok Shop ──webhook──▶ n8n (middleware) ──▶ Odoo (kho, đơn)
                                                 │      ▲
                                                 ▼      │
                                   AI (Groq) + mô hình nhóm tự train
                                                 │
                                                 ▼
                                    PostgreSQL ──▶ Google Sheet ──▶ Looker Studio
```

Mọi thứ chạy trên máy trưởng nhóm bằng Docker. Các bạn khác không cài gì nặng: chỉ cần trình duyệt, GitHub Desktop và Tailscale.

**Hiện trạng:** hệ thống đã chạy được trọn luồng (chat, đơn, đóng gói, giao hàng, báo khách, KPI). Shop chưa có đơn thật, nên nhóm dùng **chế độ giả lập**: một form trên web tạo đơn giả y như TikTok gửi, để mọi workflow chạy được mà không tốn tiền.

## Bắt đầu từ đây

1. Ai cũng đọc trước: **[huong-dan/00-cai-dat-chung.md](huong-dan/00-cai-dat-chung.md)**. Cài GitHub Desktop và Tailscale, nhận lời mời, quy tắc giữ bí mật, cách dùng form giả lập.
2. Rồi đọc hướng dẫn của mình:

| Thành viên | Phụ trách | Hướng dẫn |
|---|---|---|
| **M1** | Cửa hàng TikTok, dữ liệu sản phẩm, bộ test chatbot | [huong-dan/m1-cua-hang.md](huong-dan/m1-cua-hang.md) |
| **M2** | Odoo (kho, đơn hàng), 4 workflow đơn hàng | [huong-dan/m2-odoo-don-hang.md](huong-dan/m2-odoo-don-hang.md) |
| **M3** (trưởng nhóm) | Máy chủ, middleware n8n, chatbot, lớp AI, ghép báo cáo | [huong-dan/m3-truong-nhom.md](huong-dan/m3-truong-nhom.md) |
| **M4** | Video, dashboard KPI | [huong-dan/m4-noi-dung.md](huong-dan/m4-noi-dung.md) |

3. Việc cụ thể, hạn và trạng thái nằm trong **Google Sheet phân công** (link M3 gửi trong nhóm chat). Mỗi việc có mã như `M2-06`; đặt tên nhánh Git và commit theo mã đó.
4. Cách sửa file, tạo nhánh, mở pull request: **[CONTRIBUTING.md](CONTRIBUTING.md)**.

## Cấu trúc thư mục

```
conversational-commerce-ttshop/
├── README.md               trang này
├── CONTRIBUTING.md         quy trình Git: nhánh, commit, pull request
├── huong-dan/              hướng dẫn cài đặt và làm việc cho từng người
│
├── cua-hang/          M1   sản phẩm, sku-map, bộ test chatbot, câu test NLU
├── odoo/              M2   cấu hình Odoo, hướng dẫn đóng gói, kết quả test
├── noi-dung/          M4   kịch bản video, Apps Script KPI, dashboard
├── bao-cao/           cả nhóm  mỗi người một file, M3 ghép bản nộp
│
├── n8n/workflows/          workflow n8n: m2-*.json của M2, m3-*.json của M3, m4-*.json của M4
├── n8n/test-workflows/     TikTok giả, AI giả, form giả lập (M3)
├── contracts/              dạng dữ liệu đi qua lại giữa các phần; đổi gì phải báo cả nhóm
│
├── docker-compose.yml  ┐
├── .env.example        │
├── init/               │   M3: máy chủ (PostgreSQL, Odoo, n8n, ngrok, sao lưu)
├── scripts/            ┘
├── nlu/, upsell/           M3: mô hình AI nhóm tự train (Colab)
├── danh-gia/               script chấm chatbot bằng bộ test của M1
├── docs/                   tài liệu kiến trúc, sổ tay vận hành máy chủ, các hướng dẫn chuyên đề
└── backups/                bản sao lưu trên máy chủ (không lên GitHub)
```

Các file máy chủ nằm ở thư mục gốc vì Docker Compose cần vậy; chỉ M3 đụng tới.

## Tài liệu

| Tài liệu | Dành cho |
|---|---|
| [docs/kien-truc-middleware.md](docs/kien-truc-middleware.md) | Kiến trúc chi tiết, từng nền tảng, mô hình kinh doanh; dùng cho báo cáo |
| [docs/van-hanh-may-chu.md](docs/van-hanh-may-chu.md) | M3: dựng, chạy, sao lưu, diễn tập, chế độ giả lập |
| [docs/huong-dan-train-ai.md](docs/huong-dan-train-ai.md) | M3: train PhoBERT và mô hình mua kèm trên Colab |
| [docs/huong-dan-tai-khoan-n8n.md](docs/huong-dan-tai-khoan-n8n.md) | M2, M4: tài khoản n8n, cách đưa workflow vào repo |
| [docs/huong-dan-kpi-dashboard.md](docs/huong-dan-kpi-dashboard.md) | M4: lấy số KPI vào Google Sheet, nối Looker Studio |
| [contracts/README.md](contracts/README.md) | Cả nhóm: dữ liệu TikTok, quy tắc SKU, hợp đồng giữa các workflow |

## Ba quy tắc chung

1. **SKU là khóa** nối TikTok, Odoo, sheet sản phẩm và chatbot. Một sản phẩm một SKU, viết giống hệt nhau ở mọi nơi.
2. **Odoo là nguồn sự thật** cho giá, tồn kho, đơn hàng.
3. **Mọi sự kiện đi qua n8n.** TikTok và Odoo không nói chuyện trực tiếp với nhau.

Không bao giờ đưa mật khẩu, API key, mã bí mật hay file `.env` lên repo. Gửi riêng cho người cần.
