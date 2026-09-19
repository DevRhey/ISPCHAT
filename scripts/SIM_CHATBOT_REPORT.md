# Relatório de simulação — chatbot ISPCHAT

Data: 2026-09-19

## Skills / MCP usados
- `npx skills add secondsky/claude-skills@playwright`
- `npx skills add asyrafhussin/agent-skills@e2e-playwright-testing`
- MCP `user-playwright` (navegação UI)
- Subagente explore: mapa do FlowEngine / triggers

## Endpoint criado
`POST /flows/simulate` (auth JWT)

```json
{ "builtin": true }
```
ou
```json
{ "scenario": "custom", "messages": ["oi", "1", "1", "cpf"] }
```

Resultados salvos em `scripts/sim-results.json`.

## Correções feitas durante o teste
1. Fila com `flowId` também ativa `chatbot` (antes só `QueueOptions`)
2. Cascata de menu pai→filho com o mesmo dígito (`1`/`2`) — flag `menuAutoUsed`
3. Simulação sem WhatsApp real (placeholder + captura de mensagens do bot)

## Cenários

### Financeiro (2ª via / boleto) — OK
Cliente: oi → 1 → 1 → CPF `12345678901`  
Bot: menu → submenu financeiro → pede CPF → lookup demo → PIX/boleto links → fim

### Suporte técnico — OK
Cliente: oi → 2 → 1 → 2 → descrição ONU  
Bot: menu → submenu técnico → cor da luz → reboot → pede descrição → OS demo → transfer técnico

## UI
- Login admin OK → `/tickets`
- Dashboard mostrou **3 aguardando** / **3 novos contatos** (tickets das sims)
- Fluxo master: `ISPCHAT — Atendimento Unificado` (id 22, queue 1)

## Como repetir
```powershell
$login = Invoke-RestMethod http://localhost:8080/auth/login -Method POST -ContentType application/json -Body '{"email":"admin@admin.com","password":"123456"}'
Invoke-RestMethod http://localhost:8080/flows/simulate -Method POST -Headers @{Authorization="Bearer $($login.token)"} -ContentType application/json -Body '{"builtin":true}'
```
