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
import { resolveEdgeByIspIntent } from "./flowIntentBridge";
import { logger } from "../../utils/logger";

type Session = any;

type FlowMessageSender = (params: {
  body: string;
  ticket: Ticket;
}) => Promise<any>;

/** Permite simulação sem WhatsApp real (captura respostas do bot). */
let flowMessageSenderOverride: FlowMessageSender | null = null;

export const setFlowMessageSender = (fn: FlowMessageSender | null) => {
  flowMessageSenderOverride = fn;
};

const sendBotMessage = async (params: {
  body: string;
  ticket: Ticket;
}): Promise<any> => {
  if (flowMessageSenderOverride) {
    return flowMessageSenderOverride(params);
  }
  return SendWhatsAppMessage(params);
};

const MAX_STEPS = 24;

type MenuOption = {
  option: string;
  label: string;
  keywords?: string[];
};

/** Tipos de conexão estilo Z-PRO Chat Flow */
export type ConnectionKind = "auto" | "default" | "keyword" | "exact";

export const parseEdgeKind = (condition?: string | null): {
  kind: ConnectionKind;
  keywords: string[];
  exact?: string;
} => {
  const c = String(condition || "").trim();
  if (!c || c === "default") return { kind: "default", keywords: [] };
  if (c === "auto" || c === "__auto__") return { kind: "auto", keywords: [] };
  if (c.startsWith("kw:") || c.startsWith("keyword:")) {
    const raw = c.replace(/^kw:/i, "").replace(/^keyword:/i, "");
    return {
      kind: "keyword",
      keywords: raw
        .split(/[,|;]/)
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
    };
  }
  return { kind: "exact", keywords: [], exact: c };
};

const bodyMatchesKeywords = (body: string, keywords: string[]): boolean => {
  const text = String(body || "").trim().toLowerCase();
  if (!text || !keywords.length) return false;
  return keywords.some(k => k.length >= 1 && (text === k || text.includes(k)));
};

/** Casa número da opção, keywords ou trecho do rótulo (gatilhos). */
const matchMenuOption = (
  options: MenuOption[],
  body: string
): MenuOption | undefined => {
  const raw = String(body || "").trim();
  if (!raw) return undefined;
  const text = raw.toLowerCase();

  const byNumber = options.find(o => String(o.option) === raw);
  if (byNumber) return byNumber;

  for (const o of options) {
    const kws = [
      ...(o.keywords || []),
      o.label,
      String(o.option)
    ]
      .filter(Boolean)
      .map(k => String(k).toLowerCase());

    if (kws.some(k => k.length >= 2 && (text === k || text.includes(k)))) {
      return o;
    }
  }

  if (["menu", "voltar", "inicio", "início"].includes(text)) {
    return options.find(o => String(o.option) === "0");
  }

  return undefined;
};

const render = (text: string, vars: Record<string, any>): string => {
  let out = String(text || "");
  // Quark: @cliente_nome* / @lista_contratos  ·  nosso: {{contactName}}
  out = out.replace(/@(\w+)\*?/g, (_, key) => {
    const map: Record<string, string> = {
      cliente_nome: "contactName",
      lista_contratos: "lista_contratos",
      cpf: "cpf",
      protocolo: "protocolo"
    };
    const mapped = map[key] || key;
    const val = vars[mapped] ?? vars[key];
    return val === undefined || val === null ? "" : String(val);
  });
  out = out.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key];
    return val === undefined || val === null ? "" : String(val);
  });
  return out;
};

const isValidCpfCnpj = (raw: string): boolean => {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits.length === 11 || digits.length === 14;
};

const buildListaContratos = (
  data: Record<string, any>,
  useAddressAsPlan?: boolean
): string => {
  const contracts =
    data?.contracts ||
    data?.contratos ||
    (data?.idContrato || data?.contrato
      ? [
          {
            id: data.idContrato || data.contrato,
            plano: data.plano || data.servico || data.plan,
            endereco: data.endereco || data.address
          }
        ]
      : []);
  if (!Array.isArray(contracts) || !contracts.length) {
    const nome = data?.nome || data?.name || "";
    const status = data?.statusContrato || data?.status || "";
    if (nome || status) {
      return `• ${nome}${status ? ` — ${status}` : ""}`;
    }
    return "• Contrato localizado";
  }
  return contracts
    .map((c: any, i: number) => {
      const id = c.id || c.idContrato || c.contrato || i + 1;
      const label = useAddressAsPlan
        ? c.endereco || c.address || c.plano || c.servico || "Contrato"
        : c.plano || c.servico || c.plan || c.endereco || "Contrato";
      return `${i + 1} - ${id} (${label})`;
    })
    .join("\n");
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

/**
 * Resolve próxima aresta (Z-PRO): keywords primeiro, depois exact, depois default.
 * `mode`:
 *  - reply: avaliando resposta do usuário
 *  - autoOnly: só segue arestas automáticas (encadeamento)
 */
const findNext = (
  edges: FlowEdge[],
  sourceKey: string,
  bodyOrCondition?: string | null,
  mode: "reply" | "autoOnly" | "exact" = "exact"
): FlowEdge | undefined => {
  const fromSource = edges.filter(e => e.sourceNodeKey === sourceKey);
  if (!fromSource.length) return undefined;

  const parsed = fromSource.map(e => ({ edge: e, ...parseEdgeKind(e.condition) }));

  if (mode === "autoOnly") {
    const auto = parsed.find(p => p.kind === "auto");
    if (auto) return auto.edge;
    // Legado: uma única aresta sem condition = automático
    if (
      fromSource.length === 1 &&
      !String(fromSource[0].condition || "").trim()
    ) {
      return fromSource[0];
    }
    return undefined;
  }

  if (mode === "exact" && bodyOrCondition != null && bodyOrCondition !== "") {
    const exact = parsed.find(
      p => p.kind === "exact" && p.exact === String(bodyOrCondition)
    );
    if (exact) return exact.edge;
    const asKw = parsed.find(
      p =>
        p.kind === "keyword" &&
        bodyMatchesKeywords(String(bodyOrCondition), p.keywords)
    );
    if (asKw) return asKw.edge;
  }

  if (mode === "reply") {
    const body = String(bodyOrCondition || "");
    const kwHit = parsed.find(
      p => p.kind === "keyword" && bodyMatchesKeywords(body, p.keywords)
    );
    if (kwHit) return kwHit.edge;

    const exactHit = parsed.find(
      p => p.kind === "exact" && p.exact === body.trim()
    );
    if (exactHit) return exactHit.edge;

    // Ponte gratuita: NLU ISP (mesmo classifyIntent do LangGraph) → aresta do fluxo
    const intentEdge = resolveEdgeByIspIntent(body, fromSource, sourceKey);
    if (intentEdge) return intentEdge as FlowEdge;

    const def = parsed.find(p => p.kind === "default");
    if (def) return def.edge;
  }

  return (
    parsed.find(p => p.kind === "default")?.edge ||
    parsed.find(p => p.kind === "auto")?.edge ||
    fromSource[0]
  );
};

const eHasExplicitDefault = (e: FlowEdge) =>
  String(e.condition || "").trim() === "default";

/** Após enviar mensagem: auto continua; senão espera resposta (default/keyword). */
const shouldWaitAfterMessage = (edges: FlowEdge[], sourceKey: string): boolean => {
  const fromSource = edges.filter(e => e.sourceNodeKey === sourceKey);
  if (!fromSource.length) return false;
  const kinds = fromSource.map(e => parseEdgeKind(e.condition).kind);
  // Só automáticas (ou legado sem condition numa única aresta)
  if (kinds.every(k => k === "auto")) return false;
  if (
    fromSource.length === 1 &&
    !String(fromSource[0].condition || "").trim()
  ) {
    return false;
  }
  return kinds.some(k => k === "keyword" || k === "default" || k === "exact");
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

/** Quark Encerramento: none | transfer | close (message) */
const applyEndAction = async (
  ticket: Ticket,
  cfg: Record<string, any>,
  vars: Record<string, any>
): Promise<"handled" | "continue"> => {
  const action = String(
    cfg.endAction ||
      (cfg.closeOnComplete || cfg.closedFinish === true || cfg.closedFinish === "true"
        ? "close"
        : "none")
  ).toLowerCase();

  if (!action || action === "none") return "continue";

  if (action === "transfer") {
    const queueId =
      cfg.endQueueId != null
        ? Number(cfg.endQueueId)
        : cfg.queueId != null
        ? Number(cfg.queueId)
        : null;
    const transferMsg =
      cfg.endTransferMessage ||
      cfg.explainedMessage ||
      cfg.message ||
      "Estou transferindo seu atendimento. Aguarde um momento.";
    if (transferMsg) {
      await sendBotMessage({ body: render(transferMsg, vars), ticket });
    }
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
    return "handled";
  }

  if (action === "close" || action === "message" || action === "finish") {
    const closeMsg =
      cfg.endMessage ||
      cfg.closeMessage ||
      cfg.explainedMessage ||
      cfg.finishMessage ||
      "Atendimento encerrado. Obrigado!";
    if (closeMsg) {
      await sendBotMessage({ body: render(closeMsg, vars), ticket });
    }
    if (cfg.satisfactionMessage) {
      await sendBotMessage({
        body: render(cfg.satisfactionMessage, vars),
        ticket
      });
    }
    await clearFlowState(ticket);
    await UpdateTicketService({
      ticketData: { status: "closed", chatbot: false } as any,
      ticketId: ticket.id,
      companyId: ticket.companyId
    });
    return "handled";
  }

  return "continue";
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
  // Evita que o mesmo texto (ex.: "1") selecione menu pai e submenu no mesmo turno
  let menuAutoUsed = false;

  vars.contactName = ticket.contact?.name || "";
  vars.contactNumber = ticket.contact?.number || "";
  vars.body = body;

  // Comandos globais
  if (body === "#" || body.toLowerCase() === "#sair") {
    await clearFlowState(ticket);
    await sendBotMessage({
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

  // Se estamos esperando resposta (input / menu / message com conexões default|keyword)
  if (vars._waiting === node.nodeKey) {
    const cfg = node.parseConfig();

    if (node.type === "input") {
      const varName = cfg.variable || "input";
      const trimmed = body.trim();
      if (
        (varName === "cpf" || varName === "document") &&
        !isValidCpfCnpj(trimmed)
      ) {
        await sendBotMessage({
          body: render(
            cfg.invalidIdMessage ||
              "Opss. por favor informe um *CPF/CNPJ* válido",
            vars
          ),
          ticket
        });
        return true;
      }
      vars[varName] = trimmed;
      if (varName === "cpf" || varName === "document") {
        vars.cpf = trimmed.replace(/\D/g, "");
        vars.document = vars.cpf;
      }
      delete vars._waiting;
      await saveVars(ticket, vars);
      const next = findNext(edges, node.nodeKey, body, "reply") || findNext(edges, node.nodeKey);
      if (!next) {
        await clearFlowState(ticket);
        return true;
      }
      nodeKey = next.targetNodeKey;
      node = nodes.find(n => n.nodeKey === nodeKey);
      await ticket.update({ flowNodeKey: nodeKey });
    } else if (node.type === "menu") {
      const options: MenuOption[] = cfg.options || [];
      const chosen = matchMenuOption(options, body);
      if (!chosen) {
        await sendBotMessage({
          body:
            "Opção inválida. Digite o *número*, uma palavra-chave (ex.: boleto, internet, plano) ou *#sair*.",
          ticket
        });
        return true;
      }
      delete vars._waiting;
      vars.lastOption = chosen.option;
      await saveVars(ticket, vars);
      const next =
        findNext(edges, node.nodeKey, chosen.option, "exact") ||
        findNext(edges, node.nodeKey, body, "reply");
      if (!next) {
        await clearFlowState(ticket);
        return true;
      }
      // Impede o submenu de reutilizar o mesmo dígito neste turno
      menuAutoUsed = true;
      nodeKey = next.targetNodeKey;
      node = nodes.find(n => n.nodeKey === nodeKey);
      await ticket.update({ flowNodeKey: nodeKey });
    } else if (node.type === "message" || node.type === "start") {
      const next = findNext(edges, node.nodeKey, body, "reply");
      if (!next) {
        const settingsNode = nodes.find(n => n.type === "settings");
        const fb =
          settingsNode?.parseConfig()?.fallbackMessage ||
          "Não entendi. Digite uma opção válida, *menu* ou *#sair*.";
        await sendBotMessage({ body: fb, ticket });
        return true;
      }
      delete vars._waiting;
      await saveVars(ticket, vars);
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
        const next =
          findNext(edges, node.nodeKey, null, "autoOnly") ||
          findNext(edges, node.nodeKey);
        if (!next) {
          await clearFlowState(ticket);
          return true;
        }
        node = nodes.find(n => n.nodeKey === next.targetNodeKey);
        await ticket.update({ flowNodeKey: node?.nodeKey || null });
        break;
      }

      case "settings": {
        // Bloco de configuração global (Z-PRO): não envia mensagem; só avança
        const next =
          findNext(edges, node.nodeKey, null, "autoOnly") ||
          findNext(edges, node.nodeKey);
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
        if (text) await sendBotMessage({ body: text, ticket });

        if (shouldWaitAfterMessage(edges, node.nodeKey)) {
          vars._waiting = node.nodeKey;
          await saveVars(ticket, vars);
          await ticket.update({ flowNodeKey: node.nodeKey });
          return true;
        }

        const next =
          findNext(edges, node.nodeKey, null, "autoOnly") ||
          findNext(edges, node.nodeKey);
        if (!next) {
          await clearFlowState(ticket);
          return true;
        }
        node = nodes.find(n => n.nodeKey === next.targetNodeKey);
        await ticket.update({ flowNodeKey: node?.nodeKey || null });
        break;
      }

      case "menu": {
        const options: MenuOption[] = cfg.options || [];
        // Gatilho por keyword só 1x por turno (não cascateia pai→filho com o mesmo "1"/"2")
        const auto = matchMenuOption(options, body);
        if (auto && vars._waiting !== node.nodeKey && !menuAutoUsed) {
          menuAutoUsed = true;
          vars.lastOption = auto.option;
          delete vars._waiting;
          await saveVars(ticket, vars);
          const next = findNext(edges, node.nodeKey, auto.option);
          if (next) {
            node = nodes.find(n => n.nodeKey === next.targetNodeKey);
            await ticket.update({ flowNodeKey: node?.nodeKey || null });
            break;
          }
        }

        let text = render(node.message || "", vars);
        if (!text) text = "Escolha uma opção:";
        const lines = options.map(o => `${o.option} - ${o.label}`);
        await sendBotMessage({
          body: [
            text,
            ...lines,
            "",
            "_Dica:_ digite o número, palavra-chave, *0* para voltar ou *#sair*."
          ].join("\n"),
          ticket
        });
        vars._waiting = node.nodeKey;
        await saveVars(ticket, vars);
        await ticket.update({ flowNodeKey: node.nodeKey });
        return true;
      }

      case "input": {
        const prompt = render(
          cfg.askIdMessage ||
            node.message ||
            cfg.prompt ||
            "Digite sua resposta:",
          vars
        );
        await sendBotMessage({ body: prompt, ticket });
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
            await sendBotMessage({
              body: render(cfg.messageTemplate, { ...vars, ...(typeof data === "object" ? data : {}) }),
              ticket
            });
          }
        } catch (err: any) {
          logger.error({ err: err?.message }, "FlowEngine http node failed");
          await sendBotMessage({
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
        if (result.data && typeof result.data === "object") {
          if (result.data.nome || result.data.name) {
            vars.contactName =
              result.data.nome || result.data.name || vars.contactName;
          }
          vars.lista_contratos = buildListaContratos(
            result.data,
            Boolean(cfg.useAddressAsPlan)
          );
        }

        let msg = result.message;
        const isLookup =
          (cfg.action || "lookupClient") === "lookupClient" ||
          cfg.action === "getClientProfile";
        if (isLookup) {
          if (!result.ok && cfg.notFoundMessage) {
            msg = cfg.notFoundMessage;
          } else if (result.ok && cfg.contractsListMessage) {
            msg = cfg.contractsListMessage;
          }
        }
        if (msg) {
          await sendBotMessage({ body: render(msg, vars), ticket });
        }
        // Quark: após sucesso (closed_finish) ou end_action configurado
        if (
          result.ok &&
          (cfg.closedFinish === true ||
            cfg.closedFinish === "true" ||
            cfg.closeOnComplete ||
            cfg.endAction)
        ) {
          const handled = await applyEndAction(ticket, cfg, vars);
          if (handled === "handled") return true;
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
        const transferCfg = {
          ...cfg,
          endAction: "transfer",
          endQueueId: cfg.endQueueId ?? cfg.queueId,
          endTransferMessage:
            cfg.endTransferMessage ||
            cfg.explainedMessage ||
            cfg.message ||
            node.message
        };
        await applyEndAction(ticket, transferCfg, vars);
        return true;
      }

      case "typebot": {
        const integrationId = cfg.integrationId || queue?.integrationId;
        if (!integrationId) {
          await sendBotMessage({
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
          await sendBotMessage({
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
        const endCfg = {
          ...cfg,
          endAction: cfg.endAction || "close",
          endMessage:
            cfg.endMessage ||
            cfg.closeMessage ||
            cfg.explainedMessage ||
            cfg.message ||
            node.message
        };
        await applyEndAction(ticket, endCfg, vars);
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
