#!/usr/bin/env bash
# Nạp credential "Postgres · middleware" và mọi workflow trong n8n/workflows/ vào n8n, publish rồi khởi động lại.
set -euo pipefail
cd "$(dirname "$0")/.."
export MSYS_NO_PATHCONV=1

echo "== Credential Postgres · middleware"
docker compose exec -T n8n sh -s <<'EOF'
node -e '
const fs = require("fs");
fs.writeFileSync("/tmp/cred.json", JSON.stringify([{
  id: "pgMiddleware0001",
  name: "Postgres · middleware",
  type: "postgres",
  data: {
    host: "db", port: 5432, database: "middleware",
    user: process.env.DB_POSTGRESDB_USER,
    password: process.env.DB_POSTGRESDB_PASSWORD,
    ssl: "disable", allowUnauthorizedCerts: false, sshTunnel: false,
  },
}]));
'
n8n import:credentials --input=/tmp/cred.json 2>&1 | grep -E 'Successfully|Error' || true
rm -f /tmp/cred.json
EOF

echo "== Workflow trong n8n/workflows/"
docker compose exec -T -u root n8n rm -rf /tmp/wf
docker compose cp n8n/workflows n8n:/tmp/wf >/dev/null 2>&1
docker compose exec -T n8n n8n import:workflow --separate --input=/tmp/wf 2>&1 | grep -E 'Successfully|Error' || true
docker compose exec -T -u root n8n rm -rf /tmp/wf

echo "== Publish workflow"
for f in n8n/workflows/*.json; do
  id=$(grep -m1 -oE '"id": "[A-Za-z0-9]{16}"' "$f" | cut -d'"' -f4)
  docker compose exec -T n8n n8n publish:workflow --id="$id" 2>&1 | grep -E '^Publishing|Error|not found' || true
done

echo "== Khởi động lại n8n để nhận workflow đã publish"
docker compose restart n8n >/dev/null
for i in $(seq 1 30); do
  if curl -fs http://localhost:5678/healthz >/dev/null 2>&1; then
    echo "n8n đã chạy lại. Chờ thêm khoảng 30 giây để webhook nhận request."
    exit 0
  fi
  sleep 2
done
echo "n8n chưa trả lời sau 60 giây: xem docker compose logs n8n"
exit 1
