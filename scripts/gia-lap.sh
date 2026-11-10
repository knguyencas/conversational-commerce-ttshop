#!/usr/bin/env bash
# Bật/tắt chế độ giả lập khi chưa có shop thật: n8n gọi TikTok giả, cả nhóm tạo đơn giả bằng form. Dùng: scripts/gia-lap.sh bat|tat|xoa-don|trang-thai
set -euo pipefail
cd "$(dirname "$0")/.."
export MSYS_NO_PATHCONV=1
MOCK=http://localhost:5678/webhook/tiktok-mock
TEST_IDS=(testTikTokGia001 testGiaLapForm01 testGiaLapDs0001)

set_env() {
  if grep -q "^$1=" .env; then sed -i "s|^$1=.*|$1=$2|" .env; else printf '%s=%s\n' "$1" "$2" >> .env; fi
}

sql() {
  docker compose exec -T db psql -U "$PG_USER" -d middleware -v ON_ERROR_STOP=1 -qAtc "$1"
}

wait_n8n() {
  for _ in $(seq 1 60); do curl -fs http://127.0.0.1:5678/healthz >/dev/null 2>&1 && break; sleep 2; done
  sleep 30
}

case "${1:-}" in
  bat)
    set_env TIKTOK_API_BASE "$MOCK"
    set_env TIKTOK_AUTH_BASE "$MOCK"
    grep -q '^GIA_LAP_MA=.\+' .env || set_env GIA_LAP_MA "$(openssl rand -hex 3)"
    set -a; source .env; set +a
    docker compose exec -T db psql -U "$PG_USER" -d postgres -q < init/05-gia-lap.sql
    mkdir -p backups/.tmp-gia-lap
    cp 3-middleware-ai/workflows-test/test-tiktok-gia.json 3-middleware-ai/workflows-test/test-gia-lap-form.json 3-middleware-ai/workflows-test/test-gia-lap-ds.json backups/.tmp-gia-lap/
    docker compose exec -T -u root n8n rm -rf /tmp/gl
    docker compose cp backups/.tmp-gia-lap n8n:/tmp/gl >/dev/null 2>&1
    rm -rf backups/.tmp-gia-lap
    docker compose exec -T n8n n8n import:workflow --separate --input=/tmp/gl 2>&1 | grep -E 'Successfully|Error' || true
    for id in "${TEST_IDS[@]}"; do docker compose exec -T n8n n8n publish:workflow --id="$id" >/dev/null 2>&1; done
    sql "INSERT INTO tokens (shop_id, shop_cipher, shop_name, access_token, access_token_expires_at, refresh_token, refresh_token_expires_at)
         VALUES ('gia-lap-shop', 'mock_cipher', 'Shop giả lập', 'mock_at_gialap', now() + interval '365 days', 'mock_rt_gialap', now() + interval '365 days')
         ON CONFLICT (shop_id) DO UPDATE SET access_token = EXCLUDED.access_token, access_token_expires_at = EXCLUDED.access_token_expires_at;"
    docker compose up -d n8n >/dev/null 2>&1
    wait_n8n
    echo "Chế độ giả lập đang BẬT. Mở bằng domain ngrok (localhost hay IP Tailscale thì form không gửi được):"
    echo "  Form giả lập:          https://${NGROK_DOMAIN:-<domain ngrok>}/form/gia-lap-tiktok"
    echo "  Danh sách đơn giả lập: https://${NGROK_DOMAIN:-<domain ngrok>}/webhook/gia-lap-don?ma=$GIA_LAP_MA"
    echo "  Mã nhóm (gửi riêng cho nhóm): $GIA_LAP_MA"
    ;;
  tat)
    sed -i '/^TIKTOK_API_BASE=/d; /^TIKTOK_AUTH_BASE=/d' .env
    set -a; source .env; set +a
    for id in "${TEST_IDS[@]}"; do docker compose exec -T n8n n8n unpublish:workflow --id="$id" >/dev/null 2>&1 || true; done
    sql "DELETE FROM tokens WHERE shop_id = 'gia-lap-shop';"
    docker compose up -d n8n >/dev/null 2>&1
    wait_n8n
    echo "Chế độ giả lập đã TẮT: n8n gọi TikTok thật. Đơn giả lập vẫn còn; xóa bằng: scripts/gia-lap.sh xoa-don"
    ;;
  xoa-don)
    set -a; source .env; set +a
    sql "DELETE FROM order_status_log WHERE tiktok_order_id IN (SELECT order_id FROM gia_lap_don);
         DELETE FROM upsell_order_stats WHERE order_id IN (SELECT order_id FROM gia_lap_don);
         DELETE FROM processed_events WHERE event_id LIKE 'gialap%';
         DELETE FROM gia_lap_don;"
    echo "Đã xóa mọi đơn giả lập và log của chúng."
    ;;
  trang-thai)
    if grep -q '^TIKTOK_API_BASE=.*tiktok-mock' .env; then echo "Giả lập: BẬT"; else echo "Giả lập: TẮT (dùng TikTok thật)"; fi
    set -a; source .env; set +a
    sql "SELECT order_id || '  ' || rpad(status, 18) || COALESCE(tracking_number, '') FROM gia_lap_don ORDER BY created_at DESC LIMIT 10;" || true
    ;;
  *)
    echo "Dùng: scripts/gia-lap.sh bat | tat | xoa-don | trang-thai"
    exit 1
    ;;
esac
