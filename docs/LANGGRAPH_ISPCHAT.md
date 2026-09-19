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
| Templates FlowEngine | `backend/src/services/FlowServices/IspFlowTemplates.ts` |
| UI integração | `frontend` → Integrações → tipo **ISPCHAT LangGraph** |

> O runtime `miniLangGraph` espelha a API LangGraph (StateGraph, Annotation, MemorySaver, conditional edges) e é compatível com TypeScript 4.9 do projeto (sem depender de Zod v4 / `@langchain/*` que quebram o `tsc` atual).

## Como ativar

1. **Integrações** → criar integração tipo **ISPCHAT LangGraph**
2. **Filas** → vincular essa integração e manter chatbot ativo
3. (Opcional) **Fluxos** → **Importar templates ISP** (17 fluxos FlowEngine prontos)
4. Cliente no WhatsApp recebe o menu ISPCHAT e é roteado por intenção

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

Além do LangGraph, o menu **Fluxos** importa templates ISP com nós `message`, `menu`, `isp_action`, `transfer`, etc. Documentação das fases 1–3: [ISP_AUTOMATION.md](./ISP_AUTOMATION.md).

## Modo demo vs ERP real

Conectores em **ISP Connectors** (UI) / modelo `IspConnector`:

- **demo** — respostas simuladas (ideal para piloto)
- **ixc** / **sgp** / **hubsoft** — HTTP para o ERP (URL + token no conector)

Configure o conector da empresa antes de usar ações reais de boleto/OS.

## Checklist de teste E2E

1. Backend `:8080` e frontend `:3000` no ar
2. Login seed `admin@admin.com` / `123456`
3. Integração `langgraph` criada e ligada à fila
4. Conexão WhatsApp autenticada (QR)
5. Enviar “oi” / “boleto” / “sem internet” e validar resposta do grafo
6. Opção de transferência humana abre ticket para atendente
