const BASE = 'https://ten-mien-ngrok.ngrok-free.app/webhook/kpi-dashboard';
const BANGS = ['tong_hop', 'y_dinh', 'xu_ly_don', 'mua_kem', 'ab_mua_kem'];

// Kéo từng bảng KPI dạng CSV từ n8n rồi ghi đè vào tab cùng tên trong Sheet
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
