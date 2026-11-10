# Nhóm việc 3: Middleware và lớp AI

**Người làm:** trưởng nhóm.

## Việc này phục vụ gì trong đồ án

Đây là **phần lõi**: nơi mọi hệ thống nối vào nhau. TikTok và Odoo không nói chuyện trực tiếp; mọi sự kiện đi qua n8n. Chatbot AI trả lời khách bằng dữ liệu thật và có bước soát giá bằng code. Lớp AI do nhóm tự train (hiểu ý định khách, gợi ý mua kèm) là phần "nhóm tự làm AI" đã báo với thầy.

**Trạng thái:** chạy được trọn luồng với TikTok giả và AI thật (Groq). Diễn tập `scripts/dien-tap.sh` đạt 14/14.

## Phải làm gì

| Mã | Việc | Trạng thái |
|---|---|---|
| M3-01…03 | Máy chủ Docker, 11 workflow, sao lưu, diễn tập | Xong |
| M3-04, 06, 07, 09 | Tài khoản n8n, key Groq, ngrok, GitHub | Xong |
| M3-08 | Tailscale: **Share** máy chủ cho Hữu Đức, gửi IP | |
| M3-10 | Gửi riêng cho Hữu Đức: mã nhóm giả lập, `ODOO_WEBHOOK_SECRET` | |
| M3-12 | Train mô hình mua kèm trên Colab, nạp luật ([upsell/README.md](upsell/README.md)) | |
| M3-11 | Train PhoBERT trên Colab ([docs/huong-dan-train-ai.md](../docs/huong-dan-train-ai.md)), chờ `test-nlu.csv` của nhóm 1 | |
| M3-15 | Chấm chatbot bằng `bo-test-chatbot.csv`, sửa đến khi đạt | |
| M3-16 | Báo cáo số liệu AI: F1 ý định, Hit@3 mua kèm, A/B có mời và không mời | |

## Thư mục này chứa gì

```
3-middleware-ai/
├── workflows/         11 workflow n8n chạy thật
│   ├── m3-router.json            cửa vào duy nhất: kiểm chữ ký, bỏ bản trùng, rẽ nhánh
│   ├── m3-chatbot.json           hiểu tin nhắn → tra tool → AI viết câu → soát giá → gửi
│   ├── m3-tool-san-pham-gia.json dữ liệu sản phẩm giả cho chatbot (đến khi có tool đọc Odoo)
│   ├── m3-chat-thu.json          khung chat để thử bot trong n8n
│   ├── m3-ghi-nhan-mua-kem.json  thưởng/phạt bandit theo đơn thật
│   ├── m3-tiktok-api.json        ký request, gọi TikTok API (mọi lệnh gọi TikTok đi qua đây)
│   ├── m3-token.json             ủy quyền, làm mới token
│   ├── m3-dat-van-chuyen.json    Odoo đóng gói xong → đặt TikTok lấy hàng
│   ├── m3-trang-thai-don.json    cập nhật trạng thái giao, nhắn mã vận đơn cho khách
│   ├── m3-gui-tin-tiktok.json    gửi tin nhắn cho khách
│   ├── m3-kpi-dashboard.json     trả số liệu KPI dạng CSV cho dashboard
│   └── m3-xu-ly-loi.json         ghi lỗi vào failed_jobs
├── workflows-test/    TikTok giả, AI giả, form giả lập, danh sách đơn giả lập (chỉ bật khi test/giả lập)
├── nlu/               mô hình hiểu tin nhắn (PhoBERT): sinh dữ liệu, notebook Colab, service FastAPI
├── upsell/            mô hình mua kèm học từ Amazon Reviews 2023: notebook Colab
└── danh-gia/          script chấm chatbot bằng bộ test của nhóm 1
```

**Máy chủ** dùng các file ở thư mục gốc repo vì Docker Compose cần vậy: `docker-compose.yml`, `.env.example`, `init/` (tạo bảng database), `scripts/` (nạp workflow, diễn tập, giả lập, sao lưu). Hướng dẫn: [docs/van-hanh-may-chu.md](../docs/van-hanh-may-chu.md).

## Nối với phần nào, thế nào

```
TikTok / form giả lập ──webhook──▶ m3-router ──┬─▶ m3-chatbot ──▶ Groq + nlu ──▶ m3-gui-tin-tiktok
                                               ├─▶ M2 · Tạo đơn / Hủy đơn          (nhóm 2)
                                               └─▶ m3-trang-thai-don
Odoo đóng gói xong ──webhook──▶ m3-dat-van-chuyen ──▶ m3-tiktok-api ──▶ TikTok
PostgreSQL (chat_logs, order_status_log...) ──▶ m3-kpi-dashboard ──▶ Google Sheet (nhóm 4)
```

- **Từ nhóm 1:** `san-pham.csv` (dữ liệu bot), `bo-test-chatbot.csv`, `test-nlu.csv`.
- **Với nhóm 2:** Router gọi workflow `m2-*`; hai bên trao đổi qua bảng `order_status_log` và các hợp đồng trong `contracts/internal/`.
- **Cho nhóm 4:** số liệu KPI qua `GET /webhook/kpi-dashboard` (header `x-kpi-key`).

## Lệnh hay dùng (trên máy chủ)

```bash
docker compose up -d                 # bật cả hệ thống
bash scripts/import-n8n.sh           # nạp workflow từ */workflows/ vào n8n
bash scripts/dien-tap.sh             # thử trọn luồng, cần 14/14 đạt
bash scripts/gia-lap.sh trang-thai   # chế độ giả lập đang bật hay tắt
git pull                             # lấy code mới của nhóm từ GitHub
```

## Nộp cho báo cáo

`bao-cao/nhom-3-middleware-ai.md`, lấy từ [docs/kien-truc-middleware.md](../docs/kien-truc-middleware.md): kiến trúc, từng workflow, bảng số liệu AI, lý do dùng giả lập thay API thật.
