# ISPCHAT — Auditoria de prontidão comercial

**Data:** 2026-09-19 (~15:35 America/Sao_Paulo)  
**Alvo pedido:** Windows Rhey · machineId `e62af5c9-8946-4a09-8810-b5673f62df26`  
**Path pedido:** `C:\Users\reyca\Desktop\whaticket-saas-main`  
**Espelho Git:** https://github.com/DevRhey/ISPCHAT  

## Veredito: **GO CONDICIONAL**

Núcleo comercial presente (inbox Whaticket, FlowEngine + editor React Flow, LangGraph ISP, conectores IXC/SGP/Hubsoft, fluxo master, campanhas, hardening P0 documentado). **Não é GO pleno** porque: (1) neste subagente o `machineId` **não roteou** Shell/Read para o Windows (comandos caíram no box Linux); (2) `npm test` / `tsc` / `build` / `docker compose config` **não rodaram ao vivo** no Desktop; (3) WhatsApp Cloud API é fundação/stub; (4) falta smoke E2E WhatsApp + ERP real (não-demo).

---

## 1. Estado do repositório

| Item | Evidência |
|------|-----------|
| Remote | `DevRhey/ISPCHAT` |
| HEAD `origin/master` | `24049282879cae25b809d364a2ba01ea551f95f6` |
| Mensagem | feat: sync local ISPCHAT commercial stack to GitHub (alinha Desktop `whaticket-saas-main`) |
| Data autor | 2026-09-19T18:25:06Z (~15:25 BRT) |
| Diff HEAD | +5664 / −879 |
| `git status` no Desktop | **Não capturado** (sem MachineShell) |

### Limitação operacional

- Tentativas de Shell/Read com `machineId=e62af5c9-8946-4a09-8810-b5673f62df26` **não ativaram** execução na máquina Rhey.
- `ListMachines` / `CopyToBox` / `CopyFromBox` **não estavam no inventário** deste subagente.
- Por isso **não inventamos** saídas de test/tsc/build/compose.

---

## 2. Capabilidades vs mercado (Talqui / Zapisp / Chatmix / ZPRO)

| Capacidade | ISPCHAT | Talqui / Zapisp / Chatmix | ZPRO (ZDG) |
|------------|---------|---------------------------|------------|
| Inbox multiagente WhatsApp | Sim (Whaticket + Baileys) | Sim | Sim (Baileys/WABA/Evolution) |
| Bot ISP (boleto, OS, viabilidade) | Sim — LangGraph + FlowEngine + templates | Sim (forte HSM/campanha) | Sim (Chat Flow) |
| Editor visual de fluxos | Sim — React Flow (`FlowVisualEditor`) | Muitos usam Typebot | Chat Flow maduro |
| Typebot / n8n | Integrado (fase 1) | Comum | Integrado |
| ERP IXC / SGP / Hubsoft | Sim (`IspConnectorServices` + demo) | Via parceiros | Webhook/n8n |
| WhatsApp Cloud (Meta) | Stub + rotas (`WhatsappCloudService/cloudApi.ts`); default Baileys | WABA frequente | Sim |
| Campanhas / HSM | Campanhas no produto; HSM menos “marca” que Quark | Forte | Sim |
| Kanban / CRM leve | Sim | Sim | Sim |
| Hardening SaaS | P0 docs + patches no HEAD (reset SQLi, invoices tenant, webhook secret, JWT, `/ready`) | Maduro | Self-hosted |
| Plug-and-play | Quase — falta E2E real + onboarding | Sim | Sim |

**Leitura:** competitivo em automação conversacional ISP vs forks Whaticket; ainda atrás em WABA/HSM e prova de campo vs Talqui/Zapisp/Chatmix/ZPRO.

---

## 3. Usabilidade e criação de fluxos

### Três motores (não misturar na mesma fila)

1. **LangGraph ISP** — menu 0–15, intents, handoff, estado em variables do ticket.
2. **FlowEngine nativo** — nós message/menu/input/isp_action/transfer; master Atendimento Unificado; `POST /flows/simulate`.
3. **Typebot / n8n** — integrações clássicas.

### Editor local vs Typebot / n8n / Z-PRO

| Critério | Editor local | Typebot | n8n | Z-PRO |
|----------|--------------|---------|-----|-------|
| Criar fluxo no ISPCHAT | Sim (`/flows`, editor gráfico) | Externo | Externo | No produto |
| Conexões tipadas (auto/padrão/keyword) | Sim (`docs/RESEARCH_ZPRO_ISPCHAT.md` + FlowEngine) | Parcial | Genérico | Referência |
| ISP actions | `isp_action` nativo | Webhook | HTTP | Webhook |
| Simulador sem WhatsApp | Sim | Preview | Manual | Limitado |
| Curva ISP não-técnico | Média (templates + master ajudam) | Boa | Ruim | Boa |
| Lacunas vs Z-PRO | Binding canal WA, delay, tags, subfluxo, timeout real de settings, teste no canvas | — | — | Mais maduro |

**Conclusão:** dá para vender canvas + templates + LangGraph “ligado”. Zero-código: templates instaláveis; Typebot só para jornadas exóticas.

---

## 4. Resultados dos testes automatizados

### 4.1 Não executados no Windows (esta sessão)

| Checagem | Resultado real |
|----------|----------------|
| `git status` / `remote` / `HEAD` em `C:\Users\reyca\Desktop\whaticket-saas-main` | **Não executado** |
| Backend `npm test` | **Não executado** |
| Backend `npx tsc` / `npm run build` | **Não executado** |
| Frontend `npm run build` | **Não executado** |
| `docker compose config` | **Não executado** |
| Presença de `node_modules` | **Não verificada** |

Scripts no remote: backend `test` (jest + migrate), `build` (`tsc`); frontend `build` (react-scripts). Pasta `__tests__` **ausente** no remote.

### 4.2 Claims já commitados (não revalidados agora)

| Fonte | Claim |
|-------|--------|
| `scripts/SIM_CHATBOT_REPORT.md` | Sim 2026-09-19: financeiro OK, técnico OK; UI login→tickets; fluxo master id 22 |
| `docs/FLOW_ISP_COVERAGE.md` | `POST /flows/simulate` builtin → **17/17 PASS** (`scripts/sim-results.json` **não** está no remote) |
| Cloud API | Adapter se env ligada; default off |

---

## 5. Must-fix antes de vender

### P0

1. No PC Rhey (agente com machine tools): git status, npm test/tsc/build backend, build frontend, docker compose config — anexar logs aqui.
2. Smoke WhatsApp real (Baileys) + LangGraph **ou** Flow master.
3. ERP real com demo off; alinhar envs `ALLOW_ISP_DEMO`, `WHATSAPP_CLOUD_*`, `GERENCIANET_WEBHOOK_SECRET`, `COOKIE_SECURE`, `JWT_SECRET` / `JWT_REFRESH_SECRET` entre `.env.example`, compose e `docs/COMMERCIAL_HARDENING.md`.
4. Secrets produção sem defaults fracos; HTTPS + cookie secure.
5. Handoff humano com filas mapeadas.
6. Não vender Cloud API como pronto até webhook Meta + send OK.

### P1

7. Retomada pós-restart via variáveis do ticket.  
8. Wizard onboarding ISP <15 min.  
9. Mensagens demo nunca em tenant pagante.  
10. Backup Postgres + runbook.  
11. LGPD / CPF no atendimento.

### P2

12. HSM nível Quark.  
13. Binding fluxo↔conexão WA.  
14. CI: tsc + simulate smoke.

---

## 6. Plano de smoke WhatsApp + ERP

| # | Passo | OK se |
|---|-------|-------|
| 1 | Health/ready | DB+Redis |
| 2 | Login UI | Dashboard |
| 3 | WhatsApp connected | Verde |
| 4 | Fila + flow/langgraph | Salvo (não ambos) |
| 5 | WA “oi” | Menu ISP |
| 6 | Boleto + CPF | Texto humano; demo marcado se demo |
| 7 | Sem internet | Triagem → OS |
| 8 | Humano | pending na fila certa |
| 9 | Restart mid-fluxo | Retoma estado |
| 10 | ERP real lookup/fatura | Bate com painel |
| 11 | (Opc.) Cloud verify+send | Se enabled |
| 12 | Demo off sem conector | Erro controlado |

**GO pleno:** 1–10 verdes com ERP real + tsc/build limpos no Desktop + secrets OK.

---

## 7. Artefatos consultados

- `docs/COMMERCIAL_HARDENING.md`, `docs/FLOW_VISUAL_EDITOR.md`, `docs/LANGGRAPH_ISPCHAT.md`, `docs/RESEARCH_ZPRO_ISPCHAT.md`
- Também: `docs/FLOW_ATENDIMENTO_UNIFICADO.md`, `docs/ISP_AUTOMATION.md`, `docs/FLOW_ISP_COVERAGE.md`, `docs/AGENT_STATUS.md`
- `backend/src/services/WhatsappCloudService/cloudApi.ts`
- `frontend/src/components/FlowVisualEditor/*` · páginas Flows / FlowEditor / IspConnectors
- `backend/src/services/FlowServices/` (FlowEngine, MasterAtendimentoFlow, SimulateFlowConversationService, IspFlowTemplates)
- `scripts/SIM_CHATBOT_REPORT.md`
- Commit `24049282879cae25b809d364a2ba01ea551f95f6`

---

## 8. Entrega

| Onde | Path |
|------|------|
| Box | `/workspace/ispchat-knowledge/COMMERCIAL_READINESS.md` |
| Windows (pedido) | `C:\Users\reyca\Desktop\whaticket-saas-main\docs\COMMERCIAL_READINESS.md` — **pendente** CopyFromBox/PowerShell pelo parent com machineId |
| GitHub | `docs/COMMERCIAL_READINESS.md` (este commit) |

---

*Testes Windows ao vivo: não executados. Veredito GO CONDICIONAL.*
