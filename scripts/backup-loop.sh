#!/usr/bin/env bash
# Chạy trong container backup: dump mọi database và filestore Odoo khi bản mới nhất đã cũ, xóa bản quá hạn.
set -euo pipefail

ROOT=/backups/db
EVERY_HOURS="${BACKUP_EVERY_HOURS:-24}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
mkdir -p "$ROOT"

dump_all() {
  local stamp dir
  stamp=$(date +%Y%m%d-%H%M%S)
  dir="$ROOT/$stamp.partial"
  mkdir -p "$dir"
  for db in $(psql -d postgres -Atc "SELECT datname FROM pg_database WHERE NOT datistemplate AND datname <> 'postgres' ORDER BY 1"); do
    pg_dump -Fc -d "$db" -f "$dir/$db.dump"
  done
  pg_dumpall --globals-only -f "$dir/globals.sql"
  if [ -d /odoo-data/filestore ]; then
    tar -czf "$dir/odoo-filestore.tar.gz" -C /odoo-data filestore
  fi
  mv "$dir" "$ROOT/$stamp"
  echo "$(date '+%F %T') sao lưu xong: $stamp ($(du -sh "$ROOT/$stamp" | cut -f1))"
}

prune() {
  find "$ROOT" -mindepth 1 -maxdepth 1 -type d -name '*.partial' -mmin +120 -exec rm -rf {} +
  find "$ROOT" -mindepth 1 -maxdepth 1 -type d ! -name '*.partial' -mtime +"$KEEP_DAYS" -exec rm -rf {} +
}

needs_backup() {
  local newest
  newest=$(find "$ROOT" -mindepth 1 -maxdepth 1 -type d ! -name '*.partial' -mmin -$((EVERY_HOURS * 60)) | head -n1)
  [ -z "$newest" ]
}

if [ "${1:-}" = "--once" ]; then
  dump_all
  prune
  exit 0
fi

until pg_isready -q; do sleep 5; done
while true; do
  if needs_backup; then
    dump_all || echo "$(date '+%F %T') sao lưu lỗi, thử lại sau 1 giờ" >&2
    prune
  fi
  sleep 3600
done
