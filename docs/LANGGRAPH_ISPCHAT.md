# ISPCHAT — LangGraph para ISP

Assistente conversacional completo para provedores de internet (ISP), integrado ao Whaticket SaaS via WhatsApp (Baileys).

## Arquitetura

```
WhatsApp (Baileys)
    → wbotMessageListener
        → queueIntegration.type === "langgraph"
            → langGraphListener
                → ISP StateGraph (miniLangGraph)
                    → nós por domínio (menu, billing, tech, sales, retention…)
                    → IspConnectors (IXC / SGP / HubSoft / demo)
```

| Peça | Caminho |
|------|---------|
| Runtime estilo LangGraph | `backend/src/services/LangGraphServices/miniLangGraph.ts` |
| Grafo ISP | `backend/src/services/LangGraphServices/ispGraph.ts` |
| Intenções / NLU leve | `backend/src/services/LangGraphServices/ispIntents.ts` |
| Listener WhatsApp | `backend/src/services/LangGraphServices/langGraphListener.ts` |
| Mapeamento de fila (handoff) | `backend/src/services/LangGraphServices/resolveTransferQueueId.ts` |
| Templates FlowEngine | `backend/src/services/FlowServices/IspFlowTemplates.ts` |
| UI integração | `frontend` → Integrações → tipo **ISPCHAT LangGraph** |

> O runtime `miniLangGraph` espelha a API LangGraph (StateGraph, Annotation, MemorySaver, conditional edges) e é compatível com TypeScript 4.9 do projeto (sem depender de Zod v4 / `@langchain/*` que quebram o `tsc` atual).
>
> **Estado durável:** a fonte da verdade entre reinícios é `ticket.flowVariables` (JSON). O `MemorySaver` é só cache em memória do processo — não dependa dele para correção após restart.

## Como ativar

1. **Integrações** → criar integração tipo **ISPCHAT LangGraph**
2. **Filas** → vincular essa integração e manter chatbot ativo
3. (Opcional) **Fluxos** → **Importar templates ISP** (17 fluxos FlowEngine prontos)
4. Cliente no WhatsApp recebe o menu ISPCHAT e é roteado por intenção

## Transferência humana → fila

Quando o grafo encerra com `done` + `transferQueueHint` (`financeiro` | `suporte` | `comercial` | `noc`):

1. O listener resolve um `queueId` via `resolveTransferQueueId(companyId, hint)`
2. Atualiza o ticket para `status: pending`, `chatbot: false`, `useIntegration: false`
3. Se houver match, define `queueId`; se **não** houver, mantém `pending` **sem** fila errada

### Como mapear filas

**Opção A — Setting JSON** (recomendado em produção):

- Chave: `ispTransferQueues`
- Valor exemplo: `{"financeiro":1,"suporte":2,"comercial":3,"noc":4}` (IDs das filas da empresa)

**Opção B — Nome da fila:** busca `Queue.name` (ILIKE) contendo o hint ou aliases (`financeiro`, `suporte`, `comercial`, `noc`, etc.), filtrado por `companyId`.

## Intenções cobertas (25+)

### Financeiro
- 2ª via de boleto
- PIX / código de barras
- Negociação / acordo
- Status de pagamento / fatura

### Técnico
- Sem internet / queda
- Internet lenta
- Reboot ONU / roteador
- Abertura de OS
- Status de OS

### Comercial
- Viabilidade por CEP
- Novo plano / contratação
- Upgrade / downgrade
- Agendamento de instalação

### Cadastro / pós-venda
- Identificar cliente (CPF)
- Mudança de endereço
- Wi-Fi / senha
- Dados de contrato
- Cancelamento + retenção

### Suporte / compliance
- Protocolo de atendimento
- Reclamação / ANATEL
- FAQ
- Transferência para humano

## Fluxos FlowEngine (templates)

Além do LangGraph, o menu **Fluxos** importa templates ISP com nós `message`, `menu`, `isp_action`, `transfer`, etc. Menus ramificados (**Sem internet**, **Menu clássico**) usam `edges.condition` por opção. Documentação das fases 1–3: [ISP_AUTOMATION.md](./ISP_AUTOMATION.md).

## Modo demo vs ERP real

Conectores em **ISP Connectors** (UI) / modelo `IspConnector`:

- **demo** — respostas simuladas rotuladas *(demo)* (ideal para piloto)
- **ixc** / **sgp** / **hubsoft** — HTTP para o ERP (URL + token no conector); a mensagem ao WhatsApp é formatada em pt-BR (não JSON cru). Tokens nunca são logados.

Configure o conector da empresa antes de usar ações reais de boleto/OS.

## Checklist de produção / teste E2E

1. Backend e frontend no ar (portas conforme seu ambiente)
2. Login seed `admin@admin.com` / `123456` (ou usuário da empresa)
3. Integração `langgraph` criada e ligada à fila
4. Filas nomeadas (ou Setting `ispTransferQueues`) para handoff humano
5. Conexão WhatsApp autenticada (QR)
6. Enviar “oi” / “boleto” / “negociar”+CPF / “sem internet” e validar resposta do grafo
7. Opção de transferência humana → ticket `pending` na fila correta
8. Reiniciar o backend e confirmar que o bot retoma o estado via `flowVariables` (não só MemorySaver)
