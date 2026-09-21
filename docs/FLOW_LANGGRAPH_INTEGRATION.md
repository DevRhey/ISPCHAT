# Integração gratuita recomendada — FlowEngine + LangGraph NLU

## Decisão

| Situação | Motor |
|----------|--------|
| Fila com **fluxo gráfico** (`flowId`) | **FlowEngine** (principal) |
| Resposta do cliente que não casa opção/keyword | **Ponte de intenção** (`flowIntentBridge`) usando `classifyIntent` do miniLangGraph |
| Fila **sem** fluxo + integração `langgraph` | miniLangGraph completo |
| Fila sem fluxo + Typebot/n8n | integração externa |
| Typebot/n8n com fluxo na mesma fila | **não** — FlowEngine vence |

## Por que essa combinação

- FlowEngine executa o que você desenha no editor (grátis, determinístico).
- O NLU do LangGraph entra **sem** abrir o listener LangGraph na mesma fila — evita conflito.
- Typebot/n8n ficam para jornadas longas em filas dedicadas.

## Como configurar (fila padrão ISP)

1. Crie/importe o fluxo master no **Editor de fluxos**.
2. Em **Filas**, vincule o `flowId` (Fluxo ISP nativo).
3. **Não** vincule integração `langgraph` nessa mesma fila (deixe a ponte cuidar do NLU).
4. Opcional: outra fila só LangGraph para piloto de IA conversacional.

## Env

- `ISP_INTENT_BRIDGE=true` (padrão) — liga a ponte.
- `ISP_INTENT_BRIDGE=false` — desliga (só exact/keyword/default).

## Arquivos

- `backend/src/services/FlowServices/flowIntentBridge.ts`
- `backend/src/services/FlowServices/botRouting.ts`
- `backend/src/services/FlowServices/FlowEngine.ts` (reply → ponte → default)
