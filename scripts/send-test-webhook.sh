#!/usr/bin/env bash
# Gửi một file webhook mẫu tới n8n, có chữ ký giống TikTok, để test Router.
set -euo pipefail

FILE="${1:?Thiếu đường dẫn file JSON}"
URL="${2:-http://localhost:5678/webhook/tiktok-events}"

cd "$(dirname "$0")/.."
if [[ -f .env ]]; then
  set -a; source .env; set +a
fi
: "${TIKTOK_APP_KEY:?Chưa đặt TIKTOK_APP_KEY trong .env}"
: "${TIKTOK_APP_SECRET:?Chưa đặt TIKTOK_APP_SECRET trong .env}"

SIG=$( { printf '%s' "$TIKTOK_APP_KEY"; cat "$FILE"; } \
  | openssl dgst -sha256 -hmac "$TIKTOK_APP_SECRET" -hex | awk '{print $NF}')

echo "POST $URL"
curl -sS -w '\nHTTP %{http_code} trong %{time_total}s\n' -X POST "$URL" \
  -H 'Content-Type: application/json' \
  -H "Authorization: $SIG" \
  --data-binary @"$FILE"
