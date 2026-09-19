# Troubleshooting — ISPCHAT / Whaticket

## Login fica “carregando” para sempre

### Causa mais comum
API em `:8080` morta ou travada (Docker Desktop hung, Redis fora, backend crash-loop). O Auth do frontend chamava `/auth/refresh_token` **sem timeout** e o `loading` nunca voltava a `false`.

### O que foi corrigido no código
- Timeout Axios de **20s** em `frontend/src/services/api.js`
- `useAuth` garante `setLoading(false)` no `finally` (`frontend/src/hooks/useAuth.js/index.js`)

### O que fazer agora
1. Confirme a API: `POST http://localhost:8080/auth/login` com `{"email":"admin@admin.com","password":"123456"}` → 200
2. Confirme containers: `docker ps --filter name=whaticket`
3. No browser: hard refresh (Ctrl+F5) ou limpar `localStorage` da origem `http://localhost:3000`
4. Login seed: `admin@admin.com` / `123456`

## Docker Desktop / `docker` CLI não responde

Sintomas: `docker ps` timeout, muitas conexões `CLOSE_WAIT` em `:8080`, restart eterno.

Mitigação:

```powershell
# Encerrar Docker e reiniciar WSL + Desktop
Get-Process "*docker*","Docker Desktop","com.docker*" -ErrorAction SilentlyContinue | Stop-Process -Force
wsl --shutdown
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

Aguarde o engine (ícone Docker estável) e suba de novo:

```bash
docker compose -f docker/docker-compose-dev.yml up -d
```

## Erro: Bind 6379 already allocated

Outro container (ex. `wpp-local-redis`) já usa a porta. O compose de dev mapeia Redis Whaticket para **6389**.

Não apague o Redis do outro projeto sem necessidade — use a 6389 no host.

## Backend: `getaddrinfo ENOTFOUND postgres`

Container fora da rede `docker_whaticket-network` ou hostname errado.

Use hostnames estáveis do compose:

- `DB_HOST=whaticket-postgres` (ou alias `postgres` se estiver na mesma network do compose)
- `REDIS_URI=redis://:whaticket@whaticket-redis:6379`

## Backend local Node: `Cannot find module 'baileys'`

`node_modules` do host Windows está incompleto/incompatível. Prefira o container com volume `docker_backend_node_modules`.

## CORS / Cloudflare

Se abrir o front via `*.trycloudflare.com` e a API via outro tunnel, as duas URLs precisam estar ativas e o front com `REACT_APP_BACKEND_URL` apontando para o tunnel da API. CORS já aceita `*.trycloudflare.com`.

## Health check rápido

```powershell
docker ps --filter name=whaticket --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Invoke-RestMethod http://127.0.0.1:8080/auth/login -Method POST `
  -Body '{"email":"admin@admin.com","password":"123456"}' -ContentType application/json
```
