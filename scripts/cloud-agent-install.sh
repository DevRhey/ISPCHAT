#!/usr/bin/env bash
# Idempotent repository bootstrap for the ISPCHAT Cloud Agent environment.
# System packages (Node 20 via nvm, PostgreSQL, Redis, ffmpeg) live in the base
# snapshot; this script only prepares the checked-out repository.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# --- Node 20 (Baileys 7 requires Node >=20 <21). /exec-daemon/node is Node 22,
# so we must prepend the nvm Node 20 bin dir to PATH. ---
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 20 >/dev/null 2>&1 || true
NODE20_BIN="$(dirname "$(nvm which 20 2>/dev/null)" 2>/dev/null || true)"
[ -n "$NODE20_BIN" ] && export PATH="$NODE20_BIN:$PATH"
echo "Using Node $(node -v) / npm $(npm -v)"

# Puppeteer is only used at runtime for an optional ERP boleto-PDF flow; skip the
# heavy Chromium download during install.
export PUPPETEER_SKIP_DOWNLOAD=true

# --- Ensure PostgreSQL + Redis are running and provisioned ---
sudo pg_ctlcluster 16 main start 2>/dev/null || sudo service postgresql start 2>/dev/null || true
sudo service redis-server start 2>/dev/null || true

# Configure Redis password (idempotent)
if ! sudo grep -q '^requirepass whaticket' /etc/redis/redis.conf 2>/dev/null; then
  sudo sed -i 's/^# *requirepass .*/requirepass whaticket/; s/^requirepass .*/requirepass whaticket/' /etc/redis/redis.conf || true
  sudo grep -q '^requirepass whaticket' /etc/redis/redis.conf 2>/dev/null || \
    echo 'requirepass whaticket' | sudo tee -a /etc/redis/redis.conf >/dev/null
  sudo service redis-server restart 2>/dev/null || true
fi

# Ensure DB role + database
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='whaticket'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE ROLE whaticket LOGIN PASSWORD 'whaticket' CREATEDB;"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='whaticket'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE whaticket OWNER whaticket;"

# --- Backend .env (dev defaults; kept out of git) ---
if [ ! -f "$ROOT/backend/.env" ]; then
  cat > "$ROOT/backend/.env" <<'EOF'
NODE_ENV=development
BACKEND_URL=http://localhost:8080
FRONTEND_URL=http://localhost:3000
PROXY_PORT=8080
PORT=8080

DB_DIALECT=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=whaticket
DB_PASS=whaticket
DB_NAME=whaticket

JWT_SECRET=kZaOTd+YZpjRUyyuQUpigJaEMk4vcW4YOymKPZX0Ts8=
JWT_REFRESH_SECRET=dBSXqFg9TaNUEDXVp6fhMTRLBysP+j2DSqf7+raxD3A=

REDIS_URI=redis://:whaticket@127.0.0.1:6379
REDIS_OPT_LIMITER_MAX=1
REDIS_OPT_LIMITER_DURATION=3000

USER_LIMIT=10000
CONNECTIONS_LIMIT=100000
CLOSED_SEND_BY_ME=true

ALLOW_ISP_DEMO=true
ISP_INTENT_BRIDGE=true
PRODUCT_MODE=owner_saas
COOKIE_SECURE=false

GERENCIANET_WEBHOOK_SECRET=dev-webhook-secret-change-in-prod
WHATSAPP_CLOUD_ENABLED=false
EOF
fi

# --- Frontend .env (dev defaults; kept out of git) ---
if [ ! -f "$ROOT/frontend/.env" ]; then
  cat > "$ROOT/frontend/.env" <<'EOF'
REACT_APP_BACKEND_URL=http://localhost:8080
REACT_APP_HOURS_CLOSE_TICKETS_AUTO=24
DISABLE_ESLINT_PLUGIN=true
FAST_REFRESH=false
EOF
fi

# --- Dependencies + build ---
cd "$ROOT/backend"
npm install
npm run build

cd "$ROOT/frontend"
# React 17 + newer transitive deps (cache-loader wants webpack 4) need legacy resolution.
npm install --legacy-peer-deps

# --- Migrations (idempotent) + seed (only when the DB has no users yet) ---
cd "$ROOT/backend"
npx sequelize db:migrate
if ! PGPASSWORD=whaticket psql -h 127.0.0.1 -U whaticket -d whaticket -tAc \
     'SELECT 1 FROM "Users" LIMIT 1' 2>/dev/null | grep -q 1; then
  npx sequelize db:seed:all
else
  echo "Seed skipped: Users table already populated."
fi

echo "Cloud Agent install complete."
