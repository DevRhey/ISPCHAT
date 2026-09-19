# Ambiente de desenvolvimento (ISPCHAT / Whaticket)

## Subir tudo (recomendado no Windows)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/dev-up.ps1
# opcional — reinicia se cair:
powershell -ExecutionPolicy Bypass -File scripts/dev-watchdog.ps1
```

Health: `http://localhost:8080/health`

## Cloudflare Quick Tunnel (público)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/cloudflare-keep.ps1
```

- Mantém **2 tunnels** (FE `:3000` + API `:8080`) com protocolo `http2`
- Se um cair, **recria** e grava as URLs novas em `scripts/ISPCHAT_PUBLIC.txt`
- Quando a URL da API muda, **reinicia o CRA** com `REACT_APP_BACKEND_URL` certo (sem isso o link HTTPS “quebra” ao falar com `localhost`)

Abrir sempre o link em `scripts/ISPCHAT_PUBLIC.txt` (Quick Tunnel muda de hostname ao reiniciar).

## Por que “caía toda hora”

1. Backend dava `process.exit(1)` em **qualquer** `unhandledRejection` (Baileys/Redis).
2. Frontend apontado para **Cloudflare Quick Tunnel** (DNS timeout periódico).
3. CRA com ESLint no hot-reload + pouca RAM livre (~1.5GB no webpack).

Mitigações: não sair em rejection, `/health` + healthcheck Docker, `.env` com `DISABLE_ESLINT_PLUGIN` + API local, scripts de up/watchdog.

## Stack recomendada (Windows + Docker Desktop)

| Serviço | Como sobe | Porta host |
|---------|-----------|------------|
| Frontend CRA | `npm start` em `frontend/` | **3000** |
| Backend API | container `whaticket-backend` | **8080** |
| PostgreSQL | container `whaticket-postgres` | **5432** |
| Redis Whaticket | container `whaticket-redis` | **6389** → 6379 |

Compose de desenvolvimento:

```bash
docker compose -f docker/docker-compose-dev.yml up -d postgres redis
```

Backend (rápido, usa `dist/` já compilado + volume Linux `node_modules`):

```bash
docker compose -f docker/docker-compose-dev.yml up -d backend
```

Se o container do backend precisar ser recriado manualmente (mesmo network/volumes do compose):

```bash
docker run -d --name whaticket-backend --restart unless-stopped \
  --network docker_whaticket-network \
  -p 8080:8080 \
  -v "%CD%/backend:/app" \
  -v docker_backend_node_modules:/app/node_modules \
  -w /app \
  -e DB_HOST=whaticket-postgres \
  -e REDIS_URI=redis://:whaticket@whaticket-redis:6379 \
  ... (demais envs do compose) \
  node:20-bookworm-slim node --max-old-space-size=4096 dist/server.js
```

Frontend:

```bash
cd frontend
# .env → REACT_APP_BACKEND_URL=http://localhost:8080
npm start
```

## Por que Redis na 6389?

Outros projetos locais (ex.: `wpp-local-redis`) costumam ocupar **6379**. O compose de dev mapeia Whaticket Redis para **6389** no host para evitar `Bind for 0.0.0.0:6379 failed`.

- Dentro da rede Docker o backend continua usando `whaticket-redis:6379`
- No host (Node local), use `REDIS_URI=redis://:whaticket@127.0.0.1:6389`

## Rebuild do backend

O comando padrão do compose **só sobe** `node dist/server.js` (startup rápido).

Para reinstalar deps / recompilar TypeScript no container:

```bash
docker compose -f docker/docker-compose-dev.yml run --rm backend bash -lc \
  "apt-get update && apt-get install -y git python3 make g++ ffmpeg && npm install && npm run build"
```

Ou no host (requer Node 20+ e `node_modules` Windows válidos):

```bash
cd backend && npm install && npm run build
```

> Evite misturar `node_modules` Windows montado no container Linux — use o volume nomeado `docker_backend_node_modules`.

## Variáveis essenciais

**Backend** (`backend/.env` — não versionar):

- `BACKEND_URL=http://localhost:8080`
- `FRONTEND_URL=http://localhost:3000`
- `DB_*` → Postgres
- `REDIS_URI`
- `JWT_SECRET` / `JWT_REFRESH_SECRET`

**Frontend** (`frontend/.env`):

- `REACT_APP_BACKEND_URL=http://localhost:8080`

## Login seed

- Email: `admin@admin.com`
- Senha: `123456`

## Cloudflare Tunnel (exposição rápida)

```bash
cloudflared tunnel --url http://localhost:3000
cloudflared tunnel --url http://localhost:8080
```

URLs `*.trycloudflare.com` são **temporárias**. O backend libera CORS para origens `*.trycloudflare.com` (ver `backend/src/app.ts`).

## Documentação relacionada

- [LANGGRAPH_ISPCHAT.md](./LANGGRAPH_ISPCHAT.md) — motor ISP + intenções
- [ISP_AUTOMATION.md](./ISP_AUTOMATION.md) — Typebot / n8n / FlowEngine
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — login infinito, Docker travado, portas
