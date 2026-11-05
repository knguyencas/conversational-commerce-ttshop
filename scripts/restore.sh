#!/usr/bin/env bash
# Khôi phục một database từ bản sao lưu: ./scripts/restore.sh <thư mục trong backups/db> <tên database> --yes
set -euo pipefail
cd "$(dirname "$0")/.."
export MSYS_NO_PATHCONV=1

STAMP="${1:?Thiếu tên bản sao lưu, xem ls backups/db}"
DB="${2:?Thiếu tên database: middleware, n8n hoặc database Odoo}"
[ "${3:-}" = "--yes" ] || { echo "Lệnh này ghi đè database $DB. Chạy lại kèm --yes nếu chắc chắn."; exit 1; }
[ -f "backups/db/$STAMP/$DB.dump" ] || { echo "Không thấy backups/db/$STAMP/$DB.dump"; exit 1; }

set -a; source .env; set +a
echo "== Tạm dừng n8n và Odoo"
docker compose stop n8n odoo >/dev/null
echo "== Khôi phục $DB từ $STAMP"
docker compose exec -T db pg_restore -U "$PG_USER" -d "$DB" --clean --if-exists --no-owner --role="$PG_USER" < "backups/db/$STAMP/$DB.dump"
echo "== Bật lại n8n và Odoo"
docker compose start n8n odoo >/dev/null
echo "Xong. Nếu khôi phục database n8n, chờ khoảng 30 giây để webhook sẵn sàng."
