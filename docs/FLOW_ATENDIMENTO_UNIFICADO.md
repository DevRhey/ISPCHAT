# Fluxo gráfico de atendimento unificado

## O que é

O fluxo **ISPCHAT — Atendimento Unificado** é um grafo nativo do FlowEngine com três ramos:

| Área | Gatilhos (exemplos) | Automações |
|------|---------------------|------------|
| **Financeiro** | boleto, pix, fatura, 2ª via, negociar | `lookupClient` → `getInvoice` / transferência |
| **Técnico** | internet, onu, lenta, os, suporte | triagem ONU → reboot → `openTicket` → transferência |
| **Comercial** | plano, cep, viabilidade, upgrade | `checkCoverage` / planos → transferência |

## Instalar (já funcional)

1. Abra **Fluxos ISP** no menu
2. Clique em **Instalar atendimento unificado**
3. O sistema cria/atualiza o fluxo e vincula `flowId` na **primeira fila** da empresa
4. Clique no ícone de olho para ver o **gráfico**

API equivalente:

```http
POST /flows/templates/master-atendimento
Authorization: Bearer <token>
Content-Type: application/json

{ "queueId": 1 }   // opcional; sem body vincula à 1ª fila
```

## Requisitos na fila

- Campo **Fluxo ISP nativo** (`flowId`) = este fluxo
- Chatbot da fila **ativo**
- **Sem** integração `langgraph` na mesma fila (LangGraph tem prioridade e ignora o FlowEngine)

## Comandos do cliente

| Entrada | Efeito |
|---------|--------|
| `1` / `boleto` / `pix` | Ramo financeiro |
| `2` / `internet` / `onu` | Ramo técnico |
| `3` / `plano` / `cep` | Ramo comercial |
| `4` / `humano` | Transferência |
| `0` / `menu` | Volta ao menu |
| `#sair` | Encerra o bot |

## Arquivos

- Template: `backend/src/services/FlowServices/MasterAtendimentoFlow.ts`
- Install: `EnsureMasterAtendimentoFlowService.ts`
- Engine (keywords): `FlowEngine.ts`
- UI gráfica: `frontend/src/components/FlowGraphCanvas`
