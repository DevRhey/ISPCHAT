import { classifyIntent, ISP_INTENTS, IspIntent } from "../LangGraphServices/ispIntents";

export type EdgeLike = {
  sourceNodeKey: string;
  targetNodeKey: string;
  condition?: string | null;
  label?: string | null;
};

const normalize = (text: string) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

/**
 * Dicas extras por intenção para casar arestas do FlowEngine
 * (números de menu + palavras usadas nos templates ISP).
 */
const INTENT_EDGE_HINTS: Partial<Record<IspIntent, string[]>> = {
  segunda_via: ["1", "boleto", "2via", "segunda via", "fatura", "financeiro"],
  pix: ["2", "pix", "codigo", "financeiro"],
  negociacao: ["3", "negociar", "acordo", "pendencia", "financeiro"],
  status_pagamento: ["5", "paguei", "pagamento", "financeiro"],
  sem_internet: ["2", "1", "internet", "offline", "sem sinal", "tecnico", "suporte"],
  internet_lenta: ["2", "lenta", "lentidao", "tecnico"],
  reboot_onu: ["onu", "reiniciar", "reboot", "tecnico"],
  abrir_os: ["os", "chamado", "visita", "tecnico", "suporte"],
  status_os: ["protocolo", "os", "chamado"],
  senha_wifi: ["wifi", "senha", "roteador"],
  viabilidade: ["3", "cep", "cobertura", "viabilidade", "comercial"],
  novo_plano: ["3", "plano", "contratar", "comercial"],
  upgrade_plano: ["upgrade", "plano", "comercial"],
  agendar_instalacao: ["instalacao", "agendar", "comercial"],
  reagendar_visita: ["reagendar", "visita", "tecnico"],
  mudanca_endereco: ["4", "endereco", "mudanca"],
  dados_contrato: ["4", "contrato", "dados"],
  cancelamento: ["cancelar", "cancelamento", "retencao"],
  reclamacao: ["reclamacao", "anatel", "procon"],
  financeiro_humano: ["5", "atendente", "humano", "financeiro"],
  suporte_humano: ["5", "atendente", "humano", "suporte"],
  comercial_humano: ["5", "atendente", "humano", "comercial"],
  noc_humano: ["5", "atendente", "noc"],
  encerrar: ["#sair", "sair", "encerrar", "tchau"],
  identify_client: ["cpf", "cnpj", "identificar"],
  faq_geral: ["duvida", "ajuda", "faq"]
};

const hintsForIntent = (intent: IspIntent): string[] => {
  const fromDef = ISP_INTENTS.find(i => i.intent === intent);
  const base = [
    ...(INTENT_EDGE_HINTS[intent] || []),
    ...(fromDef?.keywords || []),
    fromDef?.menuOption || ""
  ]
    .map(normalize)
    .filter(Boolean);
  return Array.from(new Set(base));
};

const edgeSearchBlob = (edge: EdgeLike): string => {
  const cond = String(edge.condition || "");
  const label = String(edge.label || "");
  let kwPart = "";
  if (/^kw:/i.test(cond) || /^keyword:/i.test(cond)) {
    kwPart = cond.replace(/^kw:/i, "").replace(/^keyword:/i, "");
  }
  return normalize(`${cond} ${label} ${kwPart}`);
};

/**
 * Ponte gratuita: usa o mesmo NLU do miniLangGraph (classifyIntent)
 * para escolher a aresta do FlowEngine quando a resposta do usuário
 * não casou exact/keyword literal — sem chamar o listener LangGraph.
 */
export const resolveEdgeByIspIntent = (
  body: string,
  edges: EdgeLike[],
  sourceKey: string
): EdgeLike | undefined => {
  // Desliga com ISP_INTENT_BRIDGE=false (default: ligado)
  if (process.env.ISP_INTENT_BRIDGE === "false") {
    return undefined;
  }

  const intent = classifyIntent(body);
  if (
    !intent ||
    intent === "unknown" ||
    intent === "menu" ||
    intent === "faq_geral"
  ) {
    return undefined;
  }

  const hints = hintsForIntent(intent);
  if (!hints.length) return undefined;

  const candidates = edges.filter(e => e.sourceNodeKey === sourceKey);
  let best: EdgeLike | undefined;
  let bestScore = 0;

  for (const edge of candidates) {
    const blob = edgeSearchBlob(edge);
    if (!blob) continue;
    // ignora auto-only na ponte (não é escolha do usuário)
    if (blob === "auto" || blob === "__auto__") continue;

    let score = 0;
    for (const h of hints) {
      if (!h) continue;
      if (blob === h) score += h.length + 20;
      else if (blob.includes(h)) score += h.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = edge;
    }
  }

  // limiar mínimo: evita saltos aleatórios em arestas genéricas
  if (bestScore < 3) return undefined;
  return best;
};

export const isIspIntentBridgeEnabled = (): boolean =>
  process.env.ISP_INTENT_BRIDGE !== "false";