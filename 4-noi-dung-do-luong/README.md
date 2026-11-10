# Nhóm việc 4: Nội dung và đo lường

**Người làm:** trưởng nhóm làm dashboard; Hữu Đức làm kịch bản, video.

## Việc này phục vụ gì trong đồ án

Hai câu hỏi thầy sẽ hỏi: "khách từ đâu tới?" và "hệ thống có hiệu quả không?". Nhóm việc này trả lời bằng **nội dung** (video kéo khách vào shop) và **dashboard KPI** (số liệu chứng minh hệ thống chạy: số tin nhắn, thời gian bot trả lời, tỉ lệ đúng giá, thời gian xử lý đơn, tỉ lệ nhận lời mời mua kèm).

Shop chưa có khách thật, nên số liệu đến từ **diễn tập** và **form giả lập**. Quảng cáo GMV Max tốn tiền nên chỉ viết kế hoạch, không chạy.

## Phải làm gì

| Mã | Việc | Ai | Xong khi |
|---|---|---|---|
| M4-05 | **Dashboard KPI**: Google Sheet + Apps Script `apps-script/cap-nhat-kpi.gs` + Looker Studio. Cách làm: [docs/huong-dan-kpi-dashboard.md](../docs/huong-dan-kpi-dashboard.md) | Trưởng nhóm | Dashboard có số liệu từ hệ thống |
| M4-04 | 1–2 video ngắn: giới thiệu sản phẩm, hoặc quay màn hình demo hệ thống. Kịch bản trong `kich-ban/` | Hữu Đức | Video trong Drive chung |
| M4-01 | Ảnh 2–3 sản phẩm không thương hiệu (không lộ logo hãng) cho sản phẩm nháp | Hữu Đức | Ảnh trong Drive chung |
| M4-06 | `gmv-max.md`: chiến dịch quảng cáo sẽ chạy thế nào nếu có ngân sách (sản phẩm, ROI mục tiêu, ngân sách ngày) | Hữu Đức | 1 trang kế hoạch |
| M4-03 | (Không bắt buộc) Workflow tạo video tự động: AI viết kịch bản, đọc thành giọng, dựng video | Bỏ nếu không kịp | |

## Thư mục này chứa gì

```
4-noi-dung-do-luong/
├── apps-script/cap-nhat-kpi.gs   dán vào Google Sheet, kéo KPI mỗi giờ
├── kich-ban/                     mỗi video một file .md: sản phẩm, lời đọc, link video
├── workflows/                    workflow n8n m4-* (nếu làm video tự động)
├── dashboard.md                  (viết khi xong) link Looker, giải thích từng chỉ số
└── gmv-max.md                    (viết) kế hoạch quảng cáo trên giấy
```

Ảnh, video gốc để trong **Drive chung**, ở đây chỉ dán link.

## Nối với phần nào, thế nào

```
PostgreSQL (nhóm 3 ghi log) ──▶ M3 · KPI cho dashboard ──ngrok──▶ Apps Script ──▶ Google Sheet ──▶ Looker Studio
Diễn tập / form giả lập / chat thử ──▶ sinh tin nhắn, đơn hàng ──▶ có số cho dashboard
san-pham.csv (nhóm 1) ──▶ kịch bản video
```

- Mã truy cập KPI (`KPI_SECRET` trong `.env` máy chủ) dán vào *Script properties* của Apps Script, **không** dán vào file `.gs` trong repo.
- Các chỉ số có sẵn: số tin nhắn, số cuộc chat, thời gian trả lời, tỉ lệ đúng giá, tỉ lệ chuyển người, tỉ lệ chat ra đơn, số đơn, giá trị đơn trung bình (có mời và không mời mua kèm), thời gian tạo đơn, thời gian đóng gói, tỉ lệ nhận lời mời.

## Cách có số liệu

Trước khi chụp dashboard: chạy `bash scripts/dien-tap.sh` vài lần, tạo vài đơn bằng form giả lập, chat vài câu trong `M3 · Chat thử`. Apps Script kéo số mới trong vòng 1 giờ, hoặc bấm chạy `capNhatKpi` để kéo ngay.

## Nộp cho báo cáo

`bao-cao/nhom-4-noi-dung-do-luong.md`: dashboard (ảnh chụp, giải thích từng chỉ số), video, kế hoạch GMV Max, ghi rõ số liệu đến từ môi trường giả lập.
