# Hướng dẫn lấy số liệu KPI cho dashboard (dành cho M4)

Middleware ghi mọi tin nhắn, đơn hàng và lời mời mua kèm vào PostgreSQL trên máy trưởng nhóm. Workflow `M3 · KPI cho dashboard` trả các số đó dưới dạng CSV. Google Sheet của M4 kéo CSV về mỗi giờ, rồi Looker Studio đọc Sheet. Số liệu quảng cáo (CTR, ROI) thì M4 lấy từ Ads Manager, ghép vào cùng Sheet theo cột `ngay`.

```
PostgreSQL (view kpi_*) → n8n /webhook/kpi-dashboard → ngrok → Apps Script trong Google Sheet → Looker Studio
```

## 1. Địa chỉ và mã truy cập

- Địa chỉ: `https://<NGROK_DOMAIN>/webhook/kpi-dashboard?bang=<tên bảng>`
- Mã truy cập: gửi trong header `x-kpi-key`. Trưởng nhóm gửi mã này **riêng** cho M4 (giá trị `KPI_SECRET` trong `.env`), không dán vào nhóm chat.
- Sai mã thì nhận `401`, sai tên bảng thì nhận `400` kèm danh sách tên đúng.

## 2. Các bảng

| `bang` | Một dòng là | Cột chính |
|---|---|---|
| `tong_hop` | một ngày, 90 ngày gần nhất | `ngay`, `so_tin`, `so_cuoc_chat`, `tg_tra_loi_tb_ms`, `ti_le_dung_gia`, `ti_le_chuyen_nguoi`, `so_cuoc_chat_moi`, `ti_le_chat_ra_don`, `so_don`, `gia_tri_don_tb`, `gia_tri_don_tb_co_moi`, `gia_tri_don_tb_khong_moi`, `tao_don_tb_giay`, `dong_goi_tb_gio`, `so_loi_moi_mua_kem`, `ti_le_nhan_loi_moi` |
| `chatbot` | một ngày có chat | thêm `tg_tra_loi_p90_ms`, `ti_le_viet_lai` |
| `y_dinh` | một ngày × một ý định | `ngay`, `y_dinh`, `so_tin` |
| `chat_ra_don` | ngày bắt đầu cuộc chat | `so_cuoc_chat_moi`, `co_don_trong_7_ngay`, `ti_le_chat_ra_don` |
| `xu_ly_don` | một đơn | mốc nhận đơn, tạo đơn Odoo, đặt vận chuyển, giao xong; `tao_don_sau_giay`, `dong_goi_sau_gio`, `giao_sau_gio` |
| `mua_kem` | món đang mua × món được mời | `so_lan_moi`, `so_lan_mua`, `ti_le_nhan_loi_moi` |
| `ab_mua_kem` | nhóm có mời / không mời / không chat | `so_don`, `gia_tri_don_tb`, `don_co_mua_kem` |

Cách tính các chỉ số chính:

- `ti_le_dung_gia`: phần trăm câu trả lời qua bước soát giá ngay lần đầu.
- `ti_le_chat_ra_don`: phần trăm cuộc chat mới mà khách đặt đơn trong 7 ngày sau đó.
- `tao_don_tb_giay`: từ lúc TikTok báo đơn tới lúc Sales Order có trong Odoo. `dong_goi_tb_gio`: từ lúc tạo Sales Order tới lúc đặt được vận chuyển.
- `gia_tri_don_tb_co_moi` so với `gia_tri_don_tb_khong_moi` là kết quả A/B của upsell (khoảng 20% cuộc chat không được mời).
- Độ chính xác bot trên bộ test 100 câu không nằm trong log; lấy từ kết quả `3-middleware-ai/danh-gia/cham_chatbot.py` và nhập tay vào một tab riêng.

## 3. Cài Apps Script trong Google Sheet

1. Tạo Google Sheet mới, vào **Extensions → Apps Script**.
2. Dán đoạn sau, sửa `BASE` thành domain ngrok của nhóm:

   ```js
   const BASE = 'https://ten-mien-ngrok.ngrok-free.app/webhook/kpi-dashboard';
   const BANGS = ['tong_hop', 'y_dinh', 'xu_ly_don', 'mua_kem', 'ab_mua_kem'];

   function capNhatKpi() {
     const key = PropertiesService.getScriptProperties().getProperty('KPI_KEY');
     const ss = SpreadsheetApp.getActive();
     BANGS.forEach((bang) => {
       const res = UrlFetchApp.fetch(BASE + '?bang=' + bang, {
         headers: { 'x-kpi-key': key, 'ngrok-skip-browser-warning': '1' },
         muteHttpExceptions: true,
       });
       if (res.getResponseCode() !== 200) throw new Error(bang + ': HTTP ' + res.getResponseCode());
       const rows = Utilities.parseCsv(res.getContentText('UTF-8'));
       const sh = ss.getSheetByName(bang) || ss.insertSheet(bang);
       sh.clearContents();
       if (rows.length) sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
     });
   }
   ```

3. **Project Settings → Script properties → Add property**: tên `KPI_KEY`, giá trị là mã trưởng nhóm gửi.
4. Chạy `capNhatKpi` một lần, cấp quyền khi Google hỏi. Sheet sẽ có 5 tab.
5. **Triggers → Add trigger**: hàm `capNhatKpi`, *Time-driven*, *Hour timer*, mỗi 1 giờ.

Header `ngrok-skip-browser-warning` là để vượt trang cảnh báo của ngrok bản miễn phí. Vì vậy không dùng `=IMPORTDATA()`: hàm này không gửi được header.

## 4. Nối Looker Studio

1. **Create → Data source → Google Sheets**, chọn Sheet trên, tab `tong_hop`. Đặt kiểu cột `ngay` là *Date*.
2. Thêm nguồn thứ hai cho số liệu Ads Manager (xuất CSV hằng ngày vào một tab khác), rồi **Blend** hai nguồn theo `ngay`.
3. Gợi ý biểu đồ: đường `so_tin` và `so_don` theo ngày; thẻ số `ti_le_dung_gia`, `tg_tra_loi_tb_ms`, `ti_le_chat_ra_don`; cột so sánh `gia_tri_don_tb_co_moi` với `gia_tri_don_tb_khong_moi`; bảng `mua_kem`.

## 5. Khi máy trưởng nhóm tắt

Apps Script sẽ báo lỗi trong lần chạy đó và giữ nguyên số cũ trong Sheet. Lần chạy sau khi máy bật lại sẽ cập nhật đủ, vì mỗi lần đều lấy lại toàn bộ 90 ngày.
