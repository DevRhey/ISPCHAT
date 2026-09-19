# ISPCHAT

Assistente conversacional completo para **provedores de internet (ISP)**, baseado em **LangGraph** (runtime embutido) + Whaticket SaaS (WhatsApp / Baileys).

**Repositório:** https://github.com/DevRhey/ISPCHAT

## O que inclui

- Motor **LangGraph-compatible** com roteamento por intenção (**25+** casos de uso ISP)
- **17 templates** de fluxo FlowEngine importáveis
- Conectores ERP (IXC / SGP / HubSoft) com modo **demo**
- Integrações Typebot / n8n / webhook
- CORS para Cloudflare Quick Tunnel (`*.trycloudflare.com`)
- Auth do frontend com timeout (evita tela de login infinita)

## Documentação

| Doc | Conteúdo |
|-----|----------|
| [docs/AGENT_STATUS.md](docs/AGENT_STATUS.md) | Quem mexe no repo (Cursor vs Grok) e estado do git |
| [docs/FLOW_ATENDIMENTO_UNIFICADO.md](docs/FLOW_ATENDIMENTO_UNIFICADO.md) | Fluxo gráfico Fin/Téc/Comercial + gatilhos |
| [docs/LANGGRAPH_ISPCHAT.md](docs/LANGGRAPH_ISPCHAT.md) | Arquitetura LangGraph, intenções, ativação |
| [docs/ISP_AUTOMATION.md](docs/ISP_AUTOMATION.md) | Fases 1–3: Typebot, n8n, FlowEngine, conectores |
| [docs/DEV_SETUP.md](docs/DEV_SETUP.md) | Subir stack local (Docker + CRA) |
| [docs/COMMERCIAL_HARDENING.md](docs/COMMERCIAL_HARDENING.md) | Hardening SaaS / env produção |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Login infinito, Docker, portas Redis |
| [README.md](README.md) | Whaticket SaaS base (monorepo) |

## Como criar automações no editor gráfico

1. Menu **Editor gráfico** → arraste blocos, conecte arestas, salve
2. Ou **Automações** → abrir ícone de árvore em um fluxo existente
3. Vincule o fluxo à fila (campo Fluxo ISP)

Guia: [docs/FLOW_VISUAL_EDITOR.md](docs/FLOW_VISUAL_EDITOR.md)

## Como ativar o fluxo unificado (template pronto)

1. Menu **Fluxos ISP** → **Instalar atendimento unificado**
2. Confira o gráfico (ícone de olho) e a fila **Atendimento ISPCHAT** (`flowId` preenchido)
3. Em **Conexões WhatsApp**, associe essa fila à conexão
4. No WhatsApp do cliente: digite `boleto`, `internet`, `plano` ou o menu numérico

Detalhes: [docs/FLOW_ATENDIMENTO_UNIFICADO.md](docs/FLOW_ATENDIMENTO_UNIFICADO.md)

## Como ativar o LangGraph na fila

1. **Integrações** → criar tipo **ISPCHAT LangGraph**
2. **Filas** → vincular essa integração (+ chatbot ativo)
3. (Opcional) **Fluxos** → Importar templates ISP
4. Cliente no WhatsApp recebe o menu e é roteado por intenção

## Subir rápido (dev)

```bash
docker compose -f docker/docker-compose-dev.yml up -d
cd frontend && npm start
```

- App: http://localhost:3000  
- API: http://localhost:8080  
- Redis host: **6389** (evita conflito com outros projetos na 6379)

Detalhes: [docs/DEV_SETUP.md](docs/DEV_SETUP.md)

## Login padrão (seed)

- Email: `admin@admin.com`
- Senha: `123456`

## Stack

- Backend: Node 20 + TypeScript + miniLangGraph + Baileys
- Frontend: React 17 (CRA)
- DB: PostgreSQL 14
- Cache/filas: Redis 6
