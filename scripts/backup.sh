#!/usr/bin/env bash
# Sao lưu ngay: dump mọi database và xuất toàn bộ workflow n8n ra JSON trong backups/.
set -euo pipefail
cd "$(dirname "$0")/.."
export MSYS_NO_PATHCONV=1

echo "== Dump database"
docker compose run --rm --no-deps -T backup --once

stamp=$(date +%Y%m%d-%H%M%S)
echo "== Xuất workflow n8n vào backups/n8n/$stamp"
docker compose exec -T n8n sh -c "mkdir -p /backups/n8n/$stamp && n8n export:workflow --all --separate --pretty --output=/backups/n8n/$stamp/" 2>&1 \
  | grep -E 'Successfully|Error' || true
ls "backups/n8n/$stamp" | wc -l | xargs echo "Số workflow đã xuất:"
