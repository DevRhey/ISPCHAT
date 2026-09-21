/**
 * Orquestração gratuita recomendada (ISPCHAT):
 *
 * 1) Fila COM flowId  → FlowEngine (editor gráfico) é o motor principal.
 *    O NLU do miniLangGraph entra só como "ponte de intenção" dentro do
 *    FlowEngine (flowIntentBridge) — não rode o listener LangGraph na mesma fila.
 *
 * 2) Fila SEM flowId + integration langgraph → miniLangGraph completo.
 *
 * 3) Fila SEM flowId + typebot/n8n → integrações externas.
 *
 * Nunca misture listener LangGraph + FlowEngine na mesma fila.
 */

export interface QueueBotShape {
  options?: unknown[] | null;
  flowId?: number | null;
  integrationId?: number | null;
}

export type QueueBotStrategy =
  | "flow_engine"
  | "external_integration"
  | "queue_options"
  | "none";

export const queueBotEnabled = (queue?: QueueBotShape | null): boolean =>
  Boolean(queue?.flowId) ||
  (Array.isArray(queue?.options) && queue.options.length > 0);

/** Integração Typebot/n8n/LangGraph só se NÃO houver fluxo gráfico. */
export const shouldRunExternalIntegration = (
  queue?: QueueBotShape | null
): boolean => Boolean(queue?.integrationId) && !queue?.flowId;

export const getQueueBotStrategy = (
  queue?: QueueBotShape | null
): QueueBotStrategy => {
  if (queue?.flowId) return "flow_engine";
  if (queue?.integrationId) return "external_integration";
  if (Array.isArray(queue?.options) && queue.options.length > 0) {
    return "queue_options";
  }
  return "none";
};