import axios from "axios";
import { proto } from "@whiskeysockets/baileys";
import { isNil } from "lodash";
import Ticket from "../../models/Ticket";
import Flow from "../../models/Flow";
import FlowNode from "../../models/FlowNode";
import FlowEdge from "../../models/FlowEdge";
import QueueIntegrations from "../../models/QueueIntegrations";
import Queue from "../../models/Queue";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import typebotListener from "../TypebotServices/typebotListener";
import n8nService from "../n8nService/n8nService";
import runIspAction from "../IspConnectorServices/runIspAction";
import { logger } from "../../utils/logger";

type Session = any;

const MAX_STEPS = 12;

const render = (text: string, vars: Record<string, any>): string => {
  return String(text || "").replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key];
    return val === undefined || val === null ? "" : String(val);
  });
};

const parseVars = (ticket: Ticket): Record<string, any> => {
  try {
    return JSON.parse(ticket.flowVariables || "{}");
  } catch {
    return {};
  }
};

const saveVars = async (ticket: Ticket, vars: Record<string, any>) => {
  await ticket.update({ flowVariables: JSON.stringify(vars) });
};

const findNext = (
  edges: FlowEdge[],
  sourceKey: string,
  condition?: string | null
): FlowEdge | undefined => {
  const fromSource = edges.filter(e => e.sourceNodeKey === sourceKey);
  if (!fromSource.length) return undefined;

  if (condition !== undefined && condition !== null && condition !== "") {
    const exact = fromSource.find(e => String(e.condition) === String(condition));
    if (exact) return exact;
  }

  return (
    fromSource.find(e => !e.condition || e.condition === "default") ||
    fromSource[0]
  );
};

const loadFlowGraph = async (flowId: number) => {
  const flow = await Flow.findByPk(flowId, {
    include: [
      { model: FlowNode, as: "nodes" },
      { model: FlowEdge, as: "edges" }
    ]
  });
  return flow;
};

const clearFlowState = async (ticket: Ticket) => {
  await ticket.update({
    flowId: null,
    flowNodeKey: null,
    flowVariables: null,
    chatbot: false
  });
};

/**
 * Interpreta fluxos nativos (Fase 2) + ispores ISP (Fase 3).
 * Retorna true se o fluxo consumiu a mensagem.
 */
const runFlowEngine = async (
  ticket: Ticket,
  msg: proto.IWebMessageInfo,
  wbot: Session,
  getBodyMessage: (msg: proto.IWebMessageInfo) => string
): Promise<boolean> => {
  await ticket.reload({ include: ["contact", "queue"] });

  let flowId = ticket.flowId;
  const queue = ticket.queueId
    ? await Queue.findByPk(ticket.queueId)
    : null;

  if (!flowId && queue?.flowId) {
    flowId = queue.flowId;
  }

  if (!flowId) return false;

  const flow = await loadFlowGraph(flowId);
  if (!flow || !flow.active) return false;

  const nodes = flow.nodes || [];
  const edges = flow.edges || [];
  if (!nodes.length) return false;

  const body = getBodyMessage(msg) || "";
  let vars = parseVars(ticket);

  vars.contactName = ticket.contact?.name || "";
  vars.contactNumber = ticket.contact?.number || "";
  vars.body = body;

  // Comandos globais
  if (body === "#" || body.toLowerCase() === "#sair") {
    await clearFlowState(ticket);
    await SendWhatsAppMessage({
      body: "Atendimento automático encerrado. Em breve um atendente falará com você.",
      ticket
    });
    return true;
  }

  let nodeKey = ticket.flowNodeKey;
  if (!nodeKey) {
    nodeKey =
      flow.entryNodeKey ||
      nodes.find(n => n.type === "start")?.nodeKey ||
      nodes[0].nodeKey;
    await ticket.update({ flowId: flow.id, flowNodeKey: nodeKey });
  }

  let node = nodes.find(n => n.nodeKey === nodeKey);
  if (!node) {
    await clearFlowState(ticket);
    return false;
  }

  // Se estamos esperando input/menu
  if (vars._waiting === node.nodeKey) {
    const cfg = node.parseConfig();

    if (node.type === "input") {
      const varName = cfg.variable || "input";
      vars[varName] = body.trim();
      delete vars._waiting;
      await saveVars(ticket, vars);
      const next = findNext(edges, node.nodeKey);
      if (!next) {
        await clearFlowState(ticket);
        return true;
      }
      nodeKey = next.targetNodeKey;
      node = nodes.find(n => n.nodeKey === nodeKey);
      await ticket.update({ flowNodeKey: nodeKey });
    } else if (node.type === "menu") {
      const options: Array<{ option: string; label: string }> = cfg.options || [];
      const chosen = options.find(o => String(o.option) === body.trim());
      if (!chosen) {
        await SendWhatsAppMessage({
          body: "Opção inválida. Digite o número da opção ou #sair.",
          ticket
        });
        return true;
      }
      delete vars._waiting;
      vars.lastOption = chosen.option;
      await saveVars(ticket, vars);
      const next = findNext(edges, node.nodeKey, chosen.option);
      if (!next) {
        await clearFlowState(ticket);
        return true;
      }
      nodeKey = next.targetNodeKey;
      node = nodes.find(n => n.nodeKey === nodeKey);
      await ticket.update({ flowNodeKey: nodeKey });
    }
  }

  let steps = 0;
  while (node && steps < MAX_STEPS) {
    steps += 1;
    const cfg = node.parseConfig();

    switch (node.type) {
      case "start": {
        const next = findNext(edges, node.nodeKey);
        if (!next) {
          await clearFlowState(ticket);
          return true;
        }
        node = nodes.find(n => n.nodeKey === next.targetNodeKey);
        await ticket.update({ flowNodeKey: node?.nodeKey || null });
        break;
      }

      case "message": {
        const text = render(node.message || cfg.text || "", vars);
        if (text) await SendWhatsAppMessage({ body: text, ticket });
        const next = findNext(edges, node.nodeKey);
        if (!next) {
          await clearFlowState(ticket);
          return true;
        }
        node = nodes.find(n => n.nodeKey === next.targetNodeKey);
        await ticket.update({ flowNodeKey: node?.nodeKey || null });
        break;
      }

      case "menu": {
        const options: Array<{ option: string; label: string }> = cfg.options || [];
        let text = render(node.message || "", vars);
        if (!text) text = "Escolha uma opção:";
        const lines = options.map(o => `${o.option} - ${o.label}`);
        await SendWhatsAppMessage({
          body: [text, ...lines, "", "Digite 0 para voltar ou #sair para encerrar."].join("\n"),
          ticket
        });
        vars._waiting = node.nodeKey;
        await saveVars(ticket, vars);
        await ticket.update({ flowNodeKey: node.nodeKey });
        return true;
      }

      case "input": {
        const prompt = render(node.message || cfg.prompt || "Digite sua resposta:", vars);
        await SendWhatsAppMessage({ body: prompt, ticket });
        vars._waiting = node.nodeKey;
        await saveVars(ticket, vars);
        await ticket.update({ flowNodeKey: node.nodeKey });
        return true;
      }

      case "condition": {
        const field = cfg.field || "input";
        const op = cfg.operator || "eq";
        const expected = String(cfg.value ?? "");
        const actual = String(vars[field] ?? "");
        let pass = false;
        if (op === "eq") pass = actual === expected;
        else if (op === "contains") pass = actual.includes(expected);
        else if (op === "gt") pass = Number(actual) > Number(expected);
        else if (op === "lt") pass = Number(actual) < Number(expected);
        else if (op === "truthy") pass = !!actual;

        const next = findNext(edges, node.nodeKey, pass ? "true" : "false");
        if (!next) {
          await clearFlowState(ticket);
          return true;
        }
        node = nodes.find(n => n.nodeKey === next.targetNodeKey);
        await ticket.update({ flowNodeKey: node?.nodeKey || null });
        break;
      }

      case "http": {
        try {
          const url = render(cfg.url || "", vars);
          const method = (cfg.method || "GET").toUpperCase();
          const headers = cfg.headers || { "Content-Type": "application/json" };
          let reqBody = cfg.body;
          if (typeof reqBody === "string") {
            reqBody = render(reqBody, vars);
            try {
              reqBody = JSON.parse(reqBody);
            } catch {
              /* keep string */
            }
          } else if (reqBody && typeof reqBody === "object") {
            reqBody = JSON.parse(render(JSON.stringify(reqBody), vars));
          }
          const { data } = await axios.request({
            url,
            method,
            headers,
            data: method === "GET" ? undefined : reqBody,
            timeout: 20000
          });
          const storeAs = cfg.storeAs || "httpResult";
          vars[storeAs] = data;
          if (cfg.messageTemplate) {
            await SendWhatsAppMessage({
              body: render(cfg.messageTemplate, { ...vars, ...(typeof data === "object" ? data : {}) }),
              ticket
            });
          }
        } catch (err: any) {
          logger.error({ err: err?.message }, "FlowEngine http node failed");
          await SendWhatsAppMessage({
            body: cfg.errorMessage || "Não consegui consultar o serviço agora. Tente novamente.",
            ticket
          });
        }
        await saveVars(ticket, vars);
        const next = findNext(edges, node.nodeKey);
        if (!next) {
          await clearFlowState(ticket);
          return true;
        }
        node = nodes.find(n => n.nodeKey === next.targetNodeKey);
        await ticket.update({ flowNodeKey: node?.nodeKey || null });
        break;
      }

      case "isp_action": {
        const result = await runIspAction({
          companyId: ticket.companyId,
          connectorId: cfg.connectorId,
          action: cfg.action || "lookupClient",
          variables: vars,
          path: cfg.path,
          method: cfg.method,
          body: cfg.body
        });
        vars.ispResult = result.data;
        vars.ispOk = result.ok;
        if (result.message) {
          await SendWhatsAppMessage({ body: render(result.message, vars), ticket });
        }
        await saveVars(ticket, vars);
        const next = findNext(edges, node.nodeKey, result.ok ? "true" : "false");
        if (!next) {
          const fallback = findNext(edges, node.nodeKey);
          if (!fallback) {
            await clearFlowState(ticket);
            return true;
          }
          node = nodes.find(n => n.nodeKey === fallback.targetNodeKey);
        } else {
          node = nodes.find(n => n.nodeKey === next.targetNodeKey);
        }
        await ticket.update({ flowNodeKey: node?.nodeKey || null });
        break;
      }

      case "transfer": {
        const queueId = cfg.queueId || null;
        await clearFlowState(ticket);
        await UpdateTicketService({
          ticketData: {
            queueId,
            chatbot: false,
            useIntegration: false,
            integrationId: null,
            status: cfg.status || "pending"
          } as any,
          ticketId: ticket.id,
          companyId: ticket.companyId
        });
        if (cfg.message || node.message) {
          await SendWhatsAppMessage({
            body: render(cfg.message || node.message, vars),
            ticket
          });
        }
        return true;
      }

      case "typebot": {
        const integrationId = cfg.integrationId || queue?.integrationId;
        if (!integrationId) {
          await SendWhatsAppMessage({
            body: "Integração Typebot não configurada neste fluxo.",
            ticket
          });
          await clearFlowState(ticket);
          return true;
        }
        const integration = await QueueIntegrations.findByPk(integrationId);
        if (!integration) {
          await clearFlowState(ticket);
          return true;
        }
        await ticket.update({
          useIntegration: true,
          integrationId: integration.id,
          typebotStatus: true
        });
        await typebotListener({ wbot, msg, ticket, typebot: integration });
        return true;
      }

      case "n8n": {
        const integrationId = cfg.integrationId || queue?.integrationId;
        if (!integrationId) {
          await SendWhatsAppMessage({
            body: "Integração n8n não configurada neste fluxo.",
            ticket
          });
          await clearFlowState(ticket);
          return true;
        }
        const integration = await QueueIntegrations.findByPk(integrationId);
        if (!integration) {
          await clearFlowState(ticket);
          return true;
        }
        await n8nService({ wbot, msg, ticket, integration });
        const next = findNext(edges, node.nodeKey);
        if (next) {
          node = nodes.find(n => n.nodeKey === next.targetNodeKey);
          await ticket.update({ flowNodeKey: node?.nodeKey || null });
        } else {
          return true;
        }
        break;
      }

      case "end": {
        if (node.message || cfg.message) {
          await SendWhatsAppMessage({
            body: render(node.message || cfg.message, vars),
            ticket
          });
        }
        await clearFlowState(ticket);
        return true;
      }

      default: {
        logger.warn(`FlowEngine: tipo de nó desconhecido ${node.type}`);
        await clearFlowState(ticket);
        return true;
      }
    }
  }

  return true;
};

/**
 * Inicia fluxo da fila (quando cliente entra na fila com flowId).
 */
export const startQueueFlowIfNeeded = async (
  ticket: Ticket,
  msg: proto.IWebMessageInfo,
  wbot: Session,
  getBodyMessage: (msg: proto.IWebMessageInfo) => string
): Promise<boolean> => {
  if (ticket.flowId) {
    return runFlowEngine(ticket, msg, wbot, getBodyMessage);
  }

  if (!ticket.queueId) return false;
  const queue = await Queue.findByPk(ticket.queueId);
  if (!queue?.flowId) return false;

  await ticket.update({
    flowId: queue.flowId,
    flowNodeKey: null,
    flowVariables: JSON.stringify({}),
    chatbot: true
  });

  return runFlowEngine(ticket, msg, wbot, getBodyMessage);
};

export default runFlowEngine;
