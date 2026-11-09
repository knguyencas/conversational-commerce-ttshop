# M3: trưởng nhóm, máy chủ, middleware, AI

Sổ tay chi tiết: [docs/van-hanh-may-chu.md](../docs/van-hanh-may-chu.md). Trang này là danh sách việc theo thứ tự.

## Máy chủ (đã dựng, chỉ cần giữ chạy)

Máy M3 chạy Docker: PostgreSQL, Odoo, n8n, ngrok, sao lưu tự động. Thư mục chạy là bản clone repo trên máy M3 kèm file `.env` (không lên GitHub).

```bash
docker compose up -d                 # bật cả hệ thống
docker compose ps                    # xem container nào đang chạy
bash scripts/dien-tap.sh             # thử trọn luồng, cần 14/14 bước đạt
bash scripts/gia-lap.sh trang-thai   # chế độ giả lập đang bật hay tắt
```

Docker Desktop sập khi khởi động thì làm theo `scripts/fix-docker-desktop.ps1`.

## Việc cài đặt một lần

| Mã | Việc | Trạng thái |
|---|---|---|
| M3-04 | Tài khoản owner n8n | Xong |
| M3-06 | Key AI: Groq (`LLM_API_KEY` trong `.env`) | Xong |
| M3-07 | ngrok: token và domain trong `.env` | Xong |
| M3-08 | Tailscale: cài, **Share** máy cho M1, M2, M4, gửi IP trong nhóm chat | |
| M3-05 | Mời M2, M4 vào n8n ([docs/huong-dan-tai-khoan-n8n.md](../docs/huong-dan-tai-khoan-n8n.md)) | |
| M3-09 | Repo GitHub, mời 3 bạn làm Collaborator, điền tên GitHub vào `.github/CODEOWNERS` | |
| M3-10 | Gửi riêng: mã nhóm giả lập cho cả nhóm, `ODOO_WEBHOOK_SECRET` cho M2, `KPI_SECRET` cho M4 | |

## Việc trong lúc nhóm làm

- **Nạp workflow nhóm gửi:** sau khi merge pull request, trên máy chủ chạy `git pull` rồi `bash scripts/import-n8n.sh`.
- **Train mô hình trên Colab** (không train trên máy): [docs/huong-dan-train-ai.md](../docs/huong-dan-train-ai.md). Mô hình mua kèm làm ngay; PhoBERT chờ câu test của M1.
- **Chấm chatbot** bằng bộ test của M1: `python danh-gia/cham_chatbot.py --help`.
- **Hai lần mỗi tuần** xem cột Kẹt trong sheet phân công.
- **Khi shop được duyệt:** tạo app trên TikTok Partner Center, tìm mục Sandbox / test shop. Có test shop thì nối vào hệ thống và tắt giả lập (`scripts/gia-lap.sh tat`); không có thì giữ giả lập để demo.

## Ngày demo

1. Cắm sạc, tắt chế độ ngủ, `docker compose ps` thấy đủ container.
2. Trước 15 phút: `bash scripts/dien-tap.sh`, chờ 1 phút sau khi xong.
3. Demo: chat với bot trong `M3 · Chat thử`, tạo một đơn bằng form giả lập và đi hết các bước, mở dashboard của M4.

## Báo cáo

Ghép `bao-cao/*.md` của cả nhóm. Phần của M3 lấy từ [docs/kien-truc-middleware.md](../docs/kien-truc-middleware.md).
