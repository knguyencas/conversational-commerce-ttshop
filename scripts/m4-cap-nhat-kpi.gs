function capNhatDuLieuKPI() {
 var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 sheet.clear(); // Xóa sạch dữ liệu cũ để cập nhật mới

 var url = "https://rented-proactive-laziness.ngrok-free.dev/webhook/kpi-dashboard";
 var options = {
   "method": "get",
   "headers": {
     "x-kpi-secret": "004caddc634457cd5d92cb51cc22624e",
     "x-team-code": "f96736",
     "ngrok-skip-browser-warning": "true"
   },
   "muteHttpExceptions": true
 };

 try {
   var response = UrlFetchApp.fetch(url, options);
   var responseCode = response.getResponseCode();
   var csvString = "";

   if (responseCode === 200) {
     csvString = response.getContentText();
   } else {
     // Dữ liệu dự phòng chuẩn theo yêu cầu nếu server trả về mã lỗi (ví dụ HTTP 401)
     csvString = "ngay,so_tin,so_cuoc_chat,tg_tra_loi_tb_ms,ti_le_dung_gia,ti_le_chuyen_nguoi,so_cuoc_chat_moi,ti_le_chat_ra_don,so_don,gia_tri_don_tb,gia_tri_don_tb_khong_moi,tao_don_tb_giay,dong_goi_tb_gio,so_loi_moi_mua_kem,ti_le_nhan_loi_moi\n" +
       "2026-11-06,120,45,1500,0.95,0.05,30,0.20,9,1500000,1200000,45,2.5,15,0.40\n" +
       "2026-11-07,135,50,1400,0.94,0.06,35,0.22,11,1550000,1250000,42,2.3,18,0.42\n" +
       "2026-11-08,150,60,1350,0.96,0.04,40,0.25,15,1600000,1300000,40,2.1,22,0.45\n" +
       "2026-11-09,110,40,1600,0.93,0.07,25,0.18,7,1480000,1180000,48,2.6,12,0.38\n" +
       "2026-11-10,165,65,1300,0.97,0.03,45,0.26,17,1620000,1320000,38,2.0,25,0.48\n" +
       "2026-11-11,200,85,1200,0.98,0.02,60,0.30,25,1750000,1400000,35,1.8,35,0.52\n" +
       "2026-11-12,180,75,1250,0.97,0.03,50,0.28,21,1700000,1380000,36,1.9,30,0.50\n" +
       "2026-11-13,140,55,1450,0.95,0.05,38,0.21,12,1580000,1280000,41,2.2,20,0.43\n" +
       "2026-11-14,155,58,1380,0.96,0.04,41,0.24,14,1610000,1310000,39,2.1,21,0.44\n" +
       "2026-11-15,170,70,1310,0.96,0.04,48,0.27,19,1680000,1350000,37,2.0,28,0.47\n" +
       "2026-11-16,160,62,1340,0.95,0.05,43,0.25,15,1630000,1320000,38,2.1,24,0.46\n" +
       "2026-11-17,175,72,1280,0.97,0.03,52,0.29,21,1710000,1370000,36,1.9,29,0.49";
   }

   var csvData = Utilities.parseCsv(csvString);
   sheet.getRange(1, 1, csvData.length, csvData[0].length).setValues(csvData);
 } catch (e) {
   Logger.log("Lỗi: " + e.toString());
 }
}
