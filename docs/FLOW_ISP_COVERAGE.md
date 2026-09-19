# Cobertura de fluxos ISPCHAT — Atendimento Unificado

Atualizado após pesquisa de mercado (Roizap, Talqui, MK Bot, Maxbot, Chatlabs) e suite `POST /flows/simulate` com `builtin: true`.

## Menu principal (5)

| # | Área | Gatilhos exemplo |
|---|------|------------------|
| 1 | Financeiro | boleto, pix, desbloqueio, negociar |
| 2 | Técnico | internet, onu, wifi, visita, OS |
| 3 | Comercial | cep, plano, instalação, upgrade |
| 4 | Meus serviços | contrato, endereço, cancelar, anatel |
| 5 | Humano | atendente, pessoa |

## Jornadas implementadas

### Financeiro
- 2ª via / boleto (+ PIX) → CPF → lookup → fatura demo
- Negociação → fila financeira
- **Desbloqueio após pagamento** (novo) → CPF → unlock demo 24h
- **Já paguei / confirmar** (novo)

### Técnico N1
- Sem internet → triagem ONU → reboot → OS → transfer
- Internet lenta → checklist → OS
- **Senha / Wi-Fi** (novo) → OS ou visita
- **Agendar visita técnica** (novo) → CPF → scheduleVisit
- Abrir OS genérica

### Comercial
- Viabilidade CEP → cobertura → comercial
- Planos / contratar
- Upgrade
- **Agendar instalação** (novo)

### Meus serviços (novo bloco)
- Dados do contrato (`getContract`)
- Mudança de endereço → especialista
- Cancelamento / **retenção** → especialista
- Reclamação **ANATEL** → supervisor

## Ações ISP demo novas
`unlockService`, `getContract`, `scheduleVisit` em `runIspAction.ts`.

## Teste automatizado (17/17 PASS)

```powershell
$login = Invoke-RestMethod http://localhost:8080/auth/login -Method POST `
  -ContentType application/json -Body '{"email":"admin@admin.com","password":"123456"}'
Invoke-RestMethod http://localhost:8080/flows/simulate -Method POST `
  -Headers @{Authorization="Bearer $($login.token)"} `
  -ContentType application/json -Body '{"builtin":true}'
```

Resultados: `scripts/sim-results.json`  
Reinstalar fluxo no banco: `POST /flows/templates/master-atendimento`

## Grafo
~46 nós · ~71 arestas · fila vinculada via EnsureMaster.
