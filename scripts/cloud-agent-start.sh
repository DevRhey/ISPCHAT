#!/usr/bin/env bash
# Per-boot service reconciliation for the ISPCHAT Cloud Agent environment.
# Starts PostgreSQL + Redis and applies any pending migrations. The backend and
# frontend dev servers run as `terminals` (see .cursor/environment.json).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
NODE20_BIN="$(dirname "$(nvm which 20 2>/dev/null)" 2>/dev/null || true)"
[ -n "$NODE20_BIN" ] && export PATH="$NODE20_BIN:$PATH"

# Start datastores (idempotent)
sudo pg_ctlcluster 16 main start 2>/dev/null || sudo service postgresql start 2>/dev/null || true
sudo service redis-server start 2>/dev/null || true

# Wait for PostgreSQL to accept connections
for _ in $(seq 1 30); do
  pg_isready -h 127.0.0.1 -U whaticket -d whaticket >/dev/null 2>&1 && break
  sleep 1
done

# Apply any migrations added since the snapshot was taken (idempotent)
if [ -f "$ROOT/backend/dist/config/database.js" ]; then
  cd "$ROOT/backend"
  npx sequelize db:migrate 2>/dev/null || true
fi

echo "Datastores ready (PostgreSQL:5432, Redis:6379)."

# --- Launch dev servers, fully detached, idempotent by port ---
# setsid + </dev/null detaches from this script's session so `start` returns
# promptly while the servers keep running for the lifetime of the container.
NODE20_DIR="${NODE20_BIN:-}"
# Backend API (:8080)
if ! curl -sf http://127.0.0.1:8080/health >/dev/null 2>&1; then
  setsid bash -c "export PATH=\"$NODE20_DIR:\$PATH\"; cd '$ROOT/backend'; \
      exec node --max-old-space-size=3072 dist/server.js" \
      </dev/null >/tmp/ispchat-backend.log 2>&1 &
  echo "Backend starting on :8080 (logs: /tmp/ispchat-backend.log)"
else
  echo "Backend already running on :8080"
fi

# Frontend CRA dev server (:3000)
if ! curl -sf http://127.0.0.1:3000 >/dev/null 2>&1; then
  setsid bash -c "export PATH=\"$NODE20_DIR:\$PATH\" BROWSER=none NODE_OPTIONS=--max-old-space-size=4096; \
      cd '$ROOT/frontend'; exec npm start" \
      </dev/null >/tmp/ispchat-frontend.log 2>&1 &
  echo "Frontend starting on :3000 (logs: /tmp/ispchat-frontend.log)"
else
  echo "Frontend already running on :3000"
fi
