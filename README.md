# Conversational Commerce trên TikTok Shop

Đồ án môn **Công nghệ thông tin trong thương mại điện tử**. Nhóm dựng một gian hàng đồ công nghệ trên TikTok Shop:
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

**Hiện trạng:** hệ thống chạy được trọn luồng (chat, đơn, đóng gói, giao hàng, báo khách, KPI). TikTok chỉ cấp API cho doanh nghiệp, nên nhóm dùng **chế độ giả lập**: một form trên web gửi sự kiện y như TikTok gửi, để mọi phần chạy được mà không cần API thật, không tốn tiền.

## Bốn nhóm việc, hai người làm

Đồ án gồm 4 nhóm việc; mỗi nhóm là một thư mục, trong đó có README nói rõ việc đó phục vụ gì, phải làm gì, thư mục chứa gì, nối với phần nào.

| Thư mục | Nhóm việc | Hữu Đức | Trưởng nhóm |
|---|---|---|---|
| [1-cua-hang-tiktok/](1-cua-hang-tiktok/README.md) | Cửa hàng TikTok, dữ liệu sản phẩm, bộ câu test | Làm hết | Duyệt |
| [2-kho-don-hang-odoo/](2-kho-don-hang-odoo/README.md) | Kho và đơn hàng | Dựng, cấu hình Odoo | 4 workflow đơn hàng trong n8n |
| [3-middleware-ai/](3-middleware-ai/README.md) | Middleware n8n, chatbot, lớp AI tự train | | Làm hết |
| [4-noi-dung-do-luong/](4-noi-dung-do-luong/README.md) | Video, dashboard KPI | Kịch bản, video, kế hoạch quảng cáo | Dashboard |

Chỉ trưởng nhóm dùng n8n; Hữu Đức chỉ cần Odoo (qua Tailscale), form giả lập và GitHub.

## Bắt đầu từ đây

1. Cài đặt một lần: **[docs/cai-dat-chung.md](docs/cai-dat-chung.md)** (GitHub Desktop, Tailscale, form giả lập, quy tắc giữ bí mật).
2. Đọc README của nhóm việc mình phụ trách (bảng trên).
3. Việc, hạn, trạng thái: **Google Sheet phân công** (link trong nhóm chat). Mỗi việc có mã như `M2-06`; tên nhánh Git và commit ghi theo mã đó.
4. Cách sửa file, tạo nhánh, mở pull request: **[CONTRIBUTING.md](CONTRIBUTING.md)**.

## Cấu trúc thư mục

```
conversational-commerce-ttshop/
├── 1-cua-hang-tiktok/      nhóm 1: san-pham.csv, bộ test chatbot, câu test NLU
├── 2-kho-don-hang-odoo/    nhóm 2: workflows/m2-*.json, cấu hình Odoo, hướng dẫn đóng gói
├── 3-middleware-ai/        nhóm 3: workflows/m3-*.json, workflows-test/, nlu/, upsell/, danh-gia/
├── 4-noi-dung-do-luong/    nhóm 4: apps-script/, kich-ban/, workflows/
│
├── contracts/              dạng dữ liệu đi qua lại giữa các nhóm; đổi gì phải báo nhau
├── bao-cao/                mỗi nhóm việc một file, trưởng nhóm ghép bản nộp
├── docs/                   cài đặt chung, kiến trúc, sổ tay máy chủ, hướng dẫn train AI, KPI
│
├── docker-compose.yml  ┐
├── .env.example        │   máy chủ (thuộc nhóm 3), để ở gốc vì Docker Compose cần vậy
├── init/               │   init/: tạo bảng database   scripts/: nạp workflow, diễn tập, giả lập, sao lưu
└── scripts/            ┘
```

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [docs/kien-truc-middleware.md](docs/kien-truc-middleware.md) | Kiến trúc chi tiết, từng nền tảng, mô hình kinh doanh; dùng cho báo cáo |
| [docs/van-hanh-may-chu.md](docs/van-hanh-may-chu.md) | Dựng, chạy, sao lưu, diễn tập, chế độ giả lập |
| [docs/huong-dan-train-ai.md](docs/huong-dan-train-ai.md) | Train PhoBERT và mô hình mua kèm trên Colab |
| [docs/huong-dan-kpi-dashboard.md](docs/huong-dan-kpi-dashboard.md) | Lấy số KPI vào Google Sheet, nối Looker Studio |
| [contracts/README.md](contracts/README.md) | Dữ liệu TikTok, quy tắc SKU, hợp đồng giữa các workflow |

## Ba quy tắc chung

1. **SKU là khóa** nối TikTok, Odoo, file sản phẩm và chatbot. Một sản phẩm một SKU, viết giống hệt nhau ở mọi nơi.
2. **Odoo là nguồn sự thật** cho giá, tồn kho, đơn hàng.
3. **Mọi sự kiện đi qua n8n.** TikTok và Odoo không nói chuyện trực tiếp với nhau.

Không bao giờ đưa mật khẩu, API key, mã bí mật hay file `.env` lên repo. Gửi riêng cho người cần.
