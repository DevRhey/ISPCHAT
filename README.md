# ISPCHAT (Whaticket SaaS + LangGraph ISP)

Plataforma de atendimento via WhatsApp para **o provedor usar na própria operação**. O dono do SaaS vende contas; o cliente não revende o produto. Estendida com **ISPCHAT**: motor LangGraph e fluxos prontos para ISPs.

- Repositório: https://github.com/DevRhey/ISPCHAT
- Visão ISPCHAT: [ISPCHAT.md](ISPCHAT.md)
- LangGraph / intenções: [docs/LANGGRAPH_ISPCHAT.md](docs/LANGGRAPH_ISPCHAT.md)
- Dev local: [docs/DEV_SETUP.md](docs/DEV_SETUP.md)
- Problemas comuns: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

Monorepo: `backend` (Node.js + TypeScript) e `frontend` (React 17 + CRA).

## Sumário

- Visão geral e recursos
- Arquitetura e diretórios
- Pré-requisitos
- Variáveis de ambiente
- Execução local (Node)
- Execução via Docker / compose de desenvolvimento
- Imagens do Docker Hub
- Deploy em Docker Swarm
- Personalização de logos
- Scripts úteis
- Licença

## Visão geral e recursos

- Filas e múltiplos atendentes
- Tickets com histórico, tags e anexos
- Campanhas e listas de contatos
- Mensagens com mídia, áudio, vCards
- Chat interno e prompts por fila
- Integrações Typebot / n8n / webhooks / **ISPCHAT LangGraph**
- **Fluxos ISP nativos** + conectores IXC / SGP / HubSoft — [docs/ISP_AUTOMATION.md](docs/ISP_AUTOMATION.md)
- **25+ intenções ISP** no grafo conversacional — [docs/LANGGRAPH_ISPCHAT.md](docs/LANGGRAPH_ISPCHAT.md)
- Painéis e relatórios

## Arquitetura e diretórios

- `backend/`: API, serviços, filas e WebSocket
- `frontend/`: SPA React
- `docker/`: arquivos Docker
  - `Dockerfile.backend` / `Dockerfile.frontend`
  - `docker-compose-dev.yml` — **recomendado para desenvolvimento** (Postgres/Redis/backend Node 20)
  - `docker-compose-local.yml` / `docker-compose-hub.yml` / `docker-compose-swarm.yml`
  - `backend-entrypoint.sh` / `nginx-frontend.conf`
- `docs/`: ISPCHAT, automação ISP, setup e troubleshooting

## Pré-requisitos

- Node.js 20+ e npm
- PostgreSQL (recomendado) ou MySQL via `DB_DIALECT`
- Redis
- Docker e Docker Compose

## Variáveis de ambiente

- Backend (`backend/.env.example`):
  - `BACKEND_URL`, `FRONTEND_URL`, `PORT`
  - `DB_DIALECT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
  - `JWT_SECRET`, `JWT_REFRESH_SECRET`
  - `REDIS_URI`, `REDIS_OPT_LIMITER_MAX`, `REDIS_OPT_LIMITER_DURATION`
  - `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`, `MAIL_SECURE`
  - `GERENCIANET_*` e certificado em `backend/certs/`
  - `SENTRY_DSN` (opcional)
- Frontend (`frontend/.env.example`):
  - `REACT_APP_BACKEND_URL`
  - `REACT_APP_HOURS_CLOSE_TICKETS_AUTO`

Observações:

- `.env` e certificados não devem ser versionados
- `backend/certs/` está ignorado e mantém apenas o placeholder

## Execução local (Node)

Instalação:

```bash
cd backend && npm install
cd ../frontend && npm install
```

Desenvolvimento:

```bash
cd backend && npm run dev
cd ../frontend && npm start
```

Produção:

```bash
cd backend && npm run build && npm start
cd ../frontend && npm run build
```

## Execução via Docker

### Desenvolvimento (recomendado)

```bash
docker compose -f docker/docker-compose-dev.yml up -d
cd frontend && npm start
```

Portas host:

| Serviço | Porta |
|---------|-------|
| Frontend CRA | 3000 |
| Backend | 8080 |
| Postgres | 5432 |
| Redis Whaticket | **6389** (6379 no container; evita conflito local) |

Guia completo: [docs/DEV_SETUP.md](docs/DEV_SETUP.md).

### Compose local (build de produção)

```bash
docker compose -f docker/docker-compose-local.yml up -d
```

### Compose com imagens do Hub

```bash
docker compose -f docker/docker-compose-hub.yml up -d
```

## Imagens do Docker Hub

- Backend: `ronaldodavi/whaticket-saas-backend:6.0.0`
- Frontend: `ronaldodavi/whaticket-saas-frontend:6.0.0`

Configurar `REACT_APP_BACKEND_URL` no build do frontend (para domínio público):

```bash
docker build -f docker/Dockerfile.frontend \
  -t seuusuario/whaticket-saas-frontend:6.0.0 \
  --build-arg REACT_APP_BACKEND_URL=https://seu-dominio:8080 .
```

## Deploy em Docker Swarm

Inicialização e deploy:

```bash
docker swarm init
docker stack deploy -c docker/docker-compose-swarm.yml whaticket
```

Verificação e escala:

```bash
docker service ls
docker service ps whaticket_backend
docker service scale whaticket_backend=3
docker service scale whaticket_frontend=3
```

Notas:

- Volumes locais em Swarm residem no nó do serviço
- Para dados persistentes distribuídos, utilize drivers de volume adequados

## Personalização de logos

- Adicione imagens em `backend/public/logotipos/` (ex.: `logo.png`, `login.png`)
- O frontend consome `REACT_APP_BACKEND_URL/public/logotipos/...`

## Scripts úteis

- Backend
  - `npm run dev`
  - `npm run build`
  - `npm start`
  - `npm run db:migrate` e `npm run db:seed`
  - `npm test`
- Frontend
  - `npm start`
  - `npm run build`

## Licença

Licença MIT. Consulte `LICENSE`.

## Atualizações Baileys

- Tutorial completo de atualização do Baileys e requisitos de Node: `./TUTORIAL_ATUALIZACAO_BAILEYS.md`
