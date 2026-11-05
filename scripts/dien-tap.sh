#!/usr/bin/env bash
# Diễn tập cả luồng bằng TikTok giả: khách chat, đặt đơn, đóng gói, giao hàng, báo khách, rồi dọn sạch dữ liệu thử.
set -euo pipefail
cd "$(dirname "$0")/.."
export MSYS_NO_PATHCONV=1
set -a; source .env; set +a

ORDER=579123456789012345
CONV=mock-conv-1
BUYER=7430999999999999333
RUN="dientap$(date +%s)"
N8N=http://127.0.0.1:5678
TMP="backups/.tmp-$RUN"
mkdir -p "$TMP"
PASS=0
FAIL=0
DC_TEST=(docker compose -f docker-compose.yml -f docker-compose.dien-tap.yml)

sql() {
  docker compose exec -T db psql -U "$PG_USER" -d middleware -v ON_ERROR_STOP=1 -Atc "$1"
}

check() {
  if [ "$2" = "1" ]; then echo "  [ĐẠT]  $1"; PASS=$((PASS + 1)); else echo "  [HỎNG] $1"; FAIL=$((FAIL + 1)); fi
}

wait_for() {
  local q="$1" i
  for i in $(seq 1 30); do
    [ "$(sql "$q")" = "t" ] && { echo 1; return; }
    sleep 2
  done
  echo 0
}

wait_n8n() {
  local i
  for i in $(seq 1 60); do
    curl -fs "$N8N/healthz" >/dev/null 2>&1 && break
    sleep 2
  done
  sleep 30
}

webhook() {
  local file="$1" id="$2"
  python -c "import json,sys; d=json.load(open(sys.argv[1],encoding='utf-8')); d['tts_notification_id']=sys.argv[2]; \
d.get('data',{}).get('conversation_id') and d['data'].update(conversation_id=sys.argv[3]); \
open(sys.argv[4],'w',encoding='utf-8').write(json.dumps(d,ensure_ascii=False))" \
    "$file" "$id" "$CONV" "$TMP/$id.json"
  bash scripts/send-test-webhook.sh "$TMP/$id.json" "$N8N/webhook/tiktok-events" | grep -oE 'HTTP [0-9]+' | cut -d' ' -f2
}

clean_rows() {
  sql "DELETE FROM order_status_log WHERE tiktok_order_id = '$ORDER';
       DELETE FROM upsell_order_stats WHERE order_id = '$ORDER';
       DELETE FROM chat_logs WHERE conversation_id = '$CONV';
       DELETE FROM upsell_offers WHERE conversation_id = '$CONV';
       DELETE FROM conversations WHERE conversation_id = '$CONV';
       DELETE FROM processed_events WHERE event_id LIKE 'dientap%';
       DELETE FROM tokens WHERE shop_id = 'dien-tap-shop';" >/dev/null
}

cleanup() {
  echo "== Dọn dữ liệu thử và trả n8n về cấu hình thật"
  clean_rows || true
  sql "DELETE FROM failed_jobs WHERE created_at >= '$START';
       DO \$\$ BEGIN
         IF to_regclass('dien_tap_bandit_arms') IS NOT NULL THEN
           DELETE FROM bandit_arms;
           INSERT INTO bandit_arms SELECT * FROM dien_tap_bandit_arms;
           DROP TABLE dien_tap_bandit_arms;
         END IF;
       END \$\$;" >/dev/null || true
  for id in testTikTokGia001 testGeminiGia001; do
    docker compose exec -T n8n n8n unpublish:workflow --id="$id" >/dev/null 2>&1 || true
  done
  docker compose up -d n8n >/dev/null 2>&1 || true
  rm -rf "$TMP"
  echo "Kết quả: $PASS bước đạt, $FAIL bước hỏng. n8n cần khoảng 1 phút để nhận webhook lại."
}

echo "== Chuẩn bị: nạp TikTok giả, Gemini giả và trỏ n8n vào đó"
START=$(sql "SELECT now()")
trap cleanup EXIT
clean_rows
sql "DROP TABLE IF EXISTS dien_tap_bandit_arms; CREATE TABLE dien_tap_bandit_arms AS SELECT * FROM bandit_arms;" >/dev/null
docker compose exec -T -u root n8n rm -rf /tmp/twf
mkdir -p "$TMP/twf"
cp n8n/test-workflows/test-tiktok-gia.json n8n/test-workflows/test-gemini-gia.json "$TMP/twf/"
docker compose cp "$TMP/twf" n8n:/tmp/twf >/dev/null 2>&1
docker compose exec -T n8n n8n import:workflow --separate --input=/tmp/twf >/dev/null 2>&1
for id in testTikTokGia001 testGeminiGia001; do
  docker compose exec -T n8n n8n publish:workflow --id="$id" >/dev/null 2>&1
done
"${DC_TEST[@]}" up -d n8n >/dev/null 2>&1
wait_n8n
sql "INSERT INTO tokens (shop_id, shop_cipher, shop_name, access_token, access_token_expires_at,
                         refresh_token, refresh_token_expires_at)
     VALUES ('dien-tap-shop', 'mock_cipher', 'Shop diễn tập', 'mock_at_dientap', now() + interval '7 days',
             'mock_rt_dientap', now() + interval '30 days');" >/dev/null

echo "== 1. Khách hỏi giá trong khung chat"
check "Router nhận tin nhắn, trả 200" "$([ "$(webhook contracts/tiktok/webhooks/new_message_text.json "${RUN}1")" = 200 ] && echo 1 || echo 0)"
check "Chatbot trả lời và ghi chat_logs" "$(wait_for "SELECT EXISTS (SELECT 1 FROM chat_logs WHERE conversation_id = '$CONV' AND bot_reply IS NOT NULL)")"
sql "SELECT '    ý định: ' || COALESCE(intent, '?') || ' | soát giá: ' || COALESCE(price_check_passed::text, '?')
            || E'\n    bot: ' || left(regexp_replace(bot_reply, '\s+', ' ', 'g'), 160)
     FROM chat_logs WHERE conversation_id = '$CONV' ORDER BY id DESC LIMIT 1"

echo "== 2. Khách đặt đơn"
check "Router nhận đơn mới, trả 200" "$([ "$(webhook contracts/tiktok/webhooks/order_status_change.json "${RUN}2")" = 200 ] && echo 1 || echo 0)"
check "Ghi nhận đơn cho thống kê mua kèm" "$(wait_for "SELECT EXISTS (SELECT 1 FROM upsell_order_stats WHERE order_id = '$ORDER')")"
check "Gửi lại cùng webhook không tạo bản trùng" "$([ "$(webhook contracts/tiktok/webhooks/order_status_change.json "${RUN}2")" = 200 ] \
  && [ "$(sql "SELECT count(*) FROM processed_events WHERE event_id = '${RUN}2'")" = 1 ] && echo 1 || echo 0)"
echo "    (giả lập M2 · Tạo đơn: ghi Sales Order S00012 vào order_status_log)"
sql "INSERT INTO order_status_log (tiktok_order_id, odoo_sale_order, status, source)
     VALUES ('$ORDER', 'S00012', 'odoo_created', 'n8n');" >/dev/null

echo "== 3. Kho đóng gói xong, Odoo báo n8n"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$N8N/webhook/odoo-picking-done?secret=$ODOO_WEBHOOK_SECRET" \
  -H 'Content-Type: application/json' --data-binary @contracts/internal/odoo_picking_done.json)
check "Đặt vận chuyển nhận phiếu xuất kho, trả 200" "$([ "$code" = 200 ] && echo 1 || echo 0)"
check "Đã đặt TikTok tới lấy hàng" "$(wait_for "SELECT EXISTS (SELECT 1 FROM order_status_log WHERE tiktok_order_id = '$ORDER' AND status = 'shipping_arranged')")"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$N8N/webhook/odoo-picking-done?secret=sai" \
  -H 'Content-Type: application/json' --data-binary @contracts/internal/odoo_picking_done.json)
check "Sai mã bí mật thì bị chặn (401)" "$([ "$code" = 401 ] && echo 1 || echo 0)"

echo "== 4. Đơn vị vận chuyển cập nhật, n8n báo khách"
check "Router nhận cập nhật gói hàng, trả 200" "$([ "$(webhook contracts/tiktok/webhooks/package_update.json "${RUN}3")" = 200 ] && echo 1 || echo 0)"
check "Ghi trạng thái IN_TRANSIT" "$(wait_for "SELECT EXISTS (SELECT 1 FROM order_status_log WHERE tiktok_order_id = '$ORDER' AND status = 'IN_TRANSIT')")"
sql "SELECT '    ' || to_char(changed_at, 'HH24:MI:SS') || '  ' || rpad(status, 18) || COALESCE(tracking_number, '')
     FROM order_status_log WHERE tiktok_order_id = '$ORDER' ORDER BY changed_at"

echo "== 5. Kiểm tra chặn chữ ký giả và số liệu KPI"
echo '{"type":1,"tts_notification_id":"dientap-gia","data":{}}' > "$TMP/gia.json"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$N8N/webhook/tiktok-events" -H 'Authorization: sai' \
  -H 'Content-Type: application/json' --data-binary @"$TMP/gia.json")
check "Webhook sai chữ ký bị chặn (401)" "$([ "$code" = 401 ] && echo 1 || echo 0)"
kpi=$(curl -s "$N8N/webhook/kpi-dashboard?bang=tong_hop" -H "x-kpi-key: $KPI_SECRET" | sed -n 2p)
so_tin=$(echo "$kpi" | cut -d, -f2)
so_don=$(echo "$kpi" | cut -d, -f9)
check "KPI hôm nay có tin nhắn và đơn" "$([ "${so_tin:-0}" -gt 0 ] 2>/dev/null && [ "${so_don:-0}" -gt 0 ] 2>/dev/null && echo 1 || echo 0)"
echo "    $kpi"
check "Không có lỗi mới trong failed_jobs" "$([ "$(sql "SELECT count(*) FROM failed_jobs WHERE created_at >= '$START' AND status = 'open'")" = 0 ] && echo 1 || echo 0)"
sql "SELECT '    lỗi: ' || workflow_name || ' / ' || COALESCE(node_name, '') || ': ' || left(error_message, 120)
     FROM failed_jobs WHERE created_at >= '$START' AND status = 'open'"

[ "$FAIL" = 0 ]
