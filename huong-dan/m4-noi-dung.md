# M4: nội dung và đo lường

Làm [cài đặt chung](00-cai-dat-chung.md) trước. Thư mục của M4: [`noi-dung/`](../noi-dung/), các file `n8n/workflows/m4-*.json`.

## Việc của M4 (không tốn tiền)

| Mã | Việc | Xong khi |
|---|---|---|
| M4-01 | Chụp ảnh 2–3 sản phẩm không thương hiệu cho M1 (không để lộ logo hãng) | Ảnh trong Drive chung |
| M4-05 | **Dashboard KPI**: tạo Google Sheet, dán Apps Script `noi-dung/apps-script/cap-nhat-kpi.gs`, nối Looker Studio. Cách làm: [docs/huong-dan-kpi-dashboard.md](../docs/huong-dan-kpi-dashboard.md) | Dashboard có số tin nhắn, số đơn, thời gian trả lời |
| M4-04 | 1–2 video ngắn giới thiệu sản phẩm hoặc giới thiệu hệ thống (để demo và báo cáo) | Video trong Drive chung, kịch bản trong `noi-dung/kich-ban/` |
| M4-03 | (Nếu kịp) Workflow `M4 · Tạo video`: Gemini/Groq viết kịch bản, FPT.AI đọc, Creatomate dựng | File `n8n/workflows/m4-tao-video.json` |
| M4-06 | **Không chạy quảng cáo GMV Max** (tốn tiền). Viết `noi-dung/gmv-max.md`: kế hoạch chiến dịch sẽ chạy thế nào nếu có ngân sách | File kế hoạch |

## Có số liệu cho dashboard

Chưa có khách thật, nên số liệu đến từ:
- **Diễn tập** M3 chạy (`scripts/dien-tap.sh`): mỗi lần sinh tin nhắn, đơn hàng, thời gian xử lý.
- **Form giả lập**: M4 tự tạo vài đơn (mục 4 trong [cài đặt chung](00-cai-dat-chung.md)) và chat với bot trong n8n để có thêm số.

Mã truy cập KPI (`KPI_SECRET`) M3 gửi riêng; dán vào *Script properties* của Apps Script, không dán vào file `.gs` trong repo.

## Tài khoản n8n

Chỉ cần nếu làm workflow `M4 · Tạo video`. Cách nhận lời mời và đưa workflow vào repo: [docs/huong-dan-tai-khoan-n8n.md](../docs/huong-dan-tai-khoan-n8n.md).

## Nộp cho báo cáo

Viết `bao-cao/m4-noi-dung.md`: dashboard (ảnh chụp, giải thích từng chỉ số), video, kế hoạch GMV Max.
