import runIspAction from "../IspConnectorServices/runIspAction";
import {
  MAIN_MENU_TEXT,
  classifyIntent,
  IspIntent
} from "./ispIntents";
import {
  Annotation,
  END,
  MemorySaver,
  START,
  StateGraph
} from "./miniLangGraph";

export interface IspGraphState {
  messages: string[];
  input: string;
  intent: IspIntent;
  companyId: number;
  ticketId: number;
  contactName: string;
  contactNumber: string;
  cpf: string;
  cep: string;
  awaiting: string;
  replies: string[];
  transferQueueHint: string;
  done: boolean;
  variables: Record<string, any>;
}

const IspState = Annotation.Root({
  messages: Annotation({
    reducer: (left: string[], right: string[]) => left.concat(right),
    default: () => [] as string[]
  }),
  input: Annotation<string>(),
  intent: Annotation<IspIntent>(),
  companyId: Annotation<number>(),
  ticketId: Annotation<number>(),
  contactName: Annotation<string>(),
  contactNumber: Annotation<string>(),
  cpf: Annotation<string>(),
  cep: Annotation<string>(),
  awaiting: Annotation<string>(),
  replies: Annotation({
    reducer: (_l: string[], r: string[]) => r,
    default: () => [] as string[]
  }),
  transferQueueHint: Annotation<string>(),
  done: Annotation<boolean>(),
  variables: Annotation({
    reducer: (left: Record<string, any>, right: Record<string, any>) => ({
      ...left,
      ...right
    }),
    default: () => ({})
  })
});

const onlyDigits = (s: string) => String(s || "").replace(/\D/g, "");

const reply = (
  texts: string | string[],
  extra: Partial<IspGraphState> = {}
) => {
  const replies = Array.isArray(texts) ? texts : [texts];
  return { replies, messages: replies, ...extra };
};

async function nodeRouter(state: IspGraphState) {
  if (state.awaiting && state.awaiting !== "none") return {};
  return { intent: classifyIntent(state.input) };
}

async function nodeMenu() {
  return reply(MAIN_MENU_TEXT, { awaiting: "none", done: false });
}

async function nodeIdentify(state: IspGraphState) {
  const cpf = onlyDigits(state.input);
  if (cpf.length >= 11) {
    const result = await runIspAction({
      companyId: state.companyId,
      action: "lookupClient",
      variables: { cpf, contactName: state.contactName }
    });
    return reply(
      [
        result.message,
        "Agora digite o que precisa (ex: *2ª via*, *sem internet*) ou *0* para o menu."
      ],
      {
        cpf,
        awaiting: "none",
        variables: { client: result.data, ispOk: result.ok }
      }
    );
  }
  return reply("Para continuar, envie o *CPF do titular* (somente números).", {
    awaiting: "cpf",
    intent: "identify_client"
  });
}

async function nodeSegundaVia(state: IspGraphState) {
  let cpf = state.cpf || onlyDigits(state.input);
  if (cpf.length < 11) {
    return reply("Para gerar a 2ª via, envie o *CPF do titular*:", {
      awaiting: "cpf",
      intent: "segunda_via"
    });
  }
  if (state.awaiting === "cpf" && onlyDigits(state.input).length >= 11) {
    cpf = onlyDigits(state.input);
  }
  const lookup = await runIspAction({
    companyId: state.companyId,
    action: "lookupClient",
    variables: { cpf, contactName: state.contactName }
  });
  const invoice = await runIspAction({
    companyId: state.companyId,
    action: "getInvoice",
    variables: { cpf, contactName: state.contactName }
  });
  return reply(
    [lookup.message, invoice.message, "Digite *0* para o menu ou *2* para PIX."],
    { cpf, awaiting: "none", variables: { invoice: invoice.data } }
  );
}

async function nodePix(state: IspGraphState) {
  let cpf = state.cpf || onlyDigits(state.input);
  if (cpf.length < 11) {
    return reply("Para gerar o PIX, envie o *CPF do titular*:", {
      awaiting: "cpf",
      intent: "pix"
    });
  }
  if (state.awaiting === "cpf") cpf = onlyDigits(state.input) || cpf;
  const invoice = await runIspAction({
    companyId: state.companyId,
    action: "getInvoice",
    variables: { cpf }
  });
  const pix = invoice.data?.pixUrl || `https://exemplo.com/pix/${cpf}`;
  return reply(
    [
      `✅ PIX gerado para CPF ${cpf}:`,
      pix,
      "Após pagar, a liberação pode levar alguns minutos. Digite *0* para o menu."
    ],
    { cpf, awaiting: "none" }
  );
}

async function nodeNegociacao() {
  return reply(
    [
      "💬 *Negociação de dívida*",
      "Podemos oferecer acordo em até 3x sem juros (demo).",
      "Digite seu *CPF* para simular, ou *13* para falar com o financeiro."
    ],
    { awaiting: "cpf", intent: "negociacao" }
  );
}

async function nodeStatusPagamento(state: IspGraphState) {
  const cpf = state.cpf || onlyDigits(state.input);
  if (cpf.length < 11) {
    return reply("Envie o CPF para consultar o status do pagamento:", {
      awaiting: "cpf",
      intent: "status_pagamento"
    });
  }
  return reply(
    `Pagamento do CPF ${cpf}: *em análise* (demo). Se já pagou, aguarde até 30 min ou fale com o financeiro (*13*).`,
    { cpf, awaiting: "none" }
  );
}

async function nodeSemInternet(state: IspGraphState) {
  if (state.awaiting === "onu_light") {
    const ans = (state.input || "").toLowerCase();
    if (ans.includes("1") || ans.includes("verde")) {
      return reply(
        [
          "Luz verde: vamos abrir diagnóstico avançado.",
          "Descreva o problema ou digite *6* para abrir OS / *14* suporte humano."
        ],
        { awaiting: "none" }
      );
    }
    return reply(
      [
        "Vamos tentar um reinício:",
        "1) Desligue ONU/roteador da tomada por *30 segundos*",
        "2) Ligue novamente e aguarde *2 minutos*",
        "3) Teste a conexão",
        "",
        "Voltou? Digite *sim* ou *não* (abrir OS)."
      ],
      { awaiting: "confirm_os", intent: "abrir_os" }
    );
  }
  return reply(
    [
      "📡 *Sem internet* — triagem rápida",
      "A luz da ONU/roteador está:",
      "*1* - Verde / normal",
      "*2* - Vermelha / piscando",
      "*3* - Apagada"
    ],
    { awaiting: "onu_light", intent: "sem_internet" }
  );
}

async function nodeInternetLenta() {
  return reply(
    [
      "🐢 *Internet lenta*",
      "1) Reinicie o roteador (30s)",
      "2) Teste por cabo direto na ONU",
      "3) Faça um speedtest e anote o resultado",
      "",
      "Se continuar lento: digite *6* (abrir OS) ou *14* (suporte)."
    ],
    { awaiting: "none" }
  );
}

async function nodeReboot() {
  return reply(
    [
      "🔁 *Reinício guiado*",
      "1. Desconecte a energia da ONU e do roteador",
      "2. Aguarde 30 segundos",
      "3. Ligue a ONU primeiro, depois o roteador",
      "4. Aguarde 2 minutos",
      "",
      "Digite *0* menu | *6* abrir OS se não voltar."
    ],
    { awaiting: "none" }
  );
}

async function nodeAbrirOs(state: IspGraphState) {
  if (state.awaiting === "confirm_os") {
    const ans = (state.input || "").toLowerCase();
    if (ans.includes("sim") || ans === "s") {
      return reply("Que ótimo que voltou! Digite *0* para o menu.", {
        awaiting: "none",
        done: false
      });
    }
  }
  const os = await runIspAction({
    companyId: state.companyId,
    action: "openTicket",
    variables: {
      cpf: state.cpf,
      contactName: state.contactName,
      contactNumber: state.contactNumber,
      reason: state.input
    }
  });
  return reply(
    [
      os.message,
      "Um técnico entrará em contato. Digite *14* para suporte humano ou *0* menu."
    ],
    { awaiting: "none", variables: { os: os.data } }
  );
}

async function nodeStatusOs(state: IspGraphState) {
  return reply(
    `OS vinculada ao ticket #${state.ticketId}: *em fila / a caminho* (demo). Digite *0* para o menu.`,
    { awaiting: "none" }
  );
}

async function nodeViabilidade(state: IspGraphState) {
  let cep = state.cep || onlyDigits(state.input);
  if (state.awaiting === "cep") cep = onlyDigits(state.input);
  if (cep.length < 8) {
    return reply("Envie o *CEP* do endereço (8 dígitos) para checar cobertura:", {
      awaiting: "cep",
      intent: "viabilidade"
    });
  }
  const result = await runIspAction({
    companyId: state.companyId,
    action: "checkCoverage",
    variables: { cep }
  });
  return reply(
    [
      result.message,
      result.ok
        ? "Digite *8* para contratar ou *15* para comercial."
        : "Digite *15* para falar com o comercial sobre alternativas."
    ],
    { cep, awaiting: "none", variables: { coverage: result.data } }
  );
}

async function nodeNovoPlano() {
  return reply(
    [
      "🚀 *Planos disponíveis (demo)*",
      "• 300 Mega — R$ 99,90",
      "• 500 Mega — R$ 129,90",
      "• 1 Giga — R$ 169,90",
      "",
      "Digite *7* para viabilidade ou *15* para fechar com o comercial."
    ],
    { awaiting: "none" }
  );
}

async function nodeUpgrade() {
  return reply(
    "Posso solicitar upgrade do seu plano. Digite *15* (comercial) ou informe o plano desejado (300/500/1000).",
    { awaiting: "none" }
  );
}

async function nodeAgendar() {
  return reply(
    [
      "📅 *Agendamento*",
      "Horários demo: seg–sáb 08h–18h.",
      "Digite *15* para comercial agendar instalação ou *14* para suporte remarcar visita."
    ],
    { awaiting: "none" }
  );
}

async function nodeMudancaEndereco() {
  return reply(
    [
      "🏠 *Mudança de endereço*",
      "1) Envie o novo CEP (*7* viabilidade)",
      "2) Se houver cobertura, abriremos OS de remanejamento",
      "Digite o CEP ou *15* comercial."
    ],
    { awaiting: "cep", intent: "viabilidade" }
  );
}

async function nodeSenhaWifi() {
  return reply(
    [
      "📶 *Senha Wi-Fi*",
      "Por segurança, a troca de senha é feita com validação do titular.",
      "Digite *14* para suporte validar e alterar, ou envie o CPF."
    ],
    { awaiting: "cpf", intent: "identify_client" }
  );
}

async function nodeDadosContrato(state: IspGraphState) {
  const cpf = state.cpf || onlyDigits(state.input);
  if (cpf.length < 11) {
    return reply("Envie o CPF para consultar o contrato:", {
      awaiting: "cpf",
      intent: "dados_contrato"
    });
  }
  const lookup = await runIspAction({
    companyId: state.companyId,
    action: "lookupClient",
    variables: { cpf, contactName: state.contactName }
  });
  return reply(
    [
      lookup.message,
      `Plano demo: 500 Mega | Vencimento: dia 10 | Status: ${lookup.data?.status || "ativo"}`,
      "Digite *0* para o menu."
    ],
    { cpf, awaiting: "none" }
  );
}

async function nodeProtocolo(state: IspGraphState) {
  return reply(
    `Seu protocolo deste atendimento é *ISP-${state.ticketId}-${Date.now()
      .toString()
      .slice(-4)}*. Guarde este número.`,
    { awaiting: "none" }
  );
}

async function nodeCancelamento() {
  return reply(
    [
      "⚠️ *Cancelamento*",
      "Antes de cancelar, podemos oferecer desconto ou upgrade.",
      "Digite *15* comercial (retenção) ou *13* financeiro."
    ],
    { awaiting: "none", transferQueueHint: "comercial" }
  );
}

async function nodeReclamacao(state: IspGraphState) {
  return reply(
    [
      "📋 Registramos sua reclamação.",
      `Protocolo: ISP-REC-${state.ticketId}`,
      "Um supervisor entrará em contato. Digite *14* para suporte agora."
    ],
    { awaiting: "none", transferQueueHint: "suporte" }
  );
}

async function nodeFaq() {
  return reply(
    [
      "ℹ️ *FAQ rápido*",
      "• Atendimento: seg–sáb 08h–20h",
      "• Suporte 24h para queda total",
      "• App do cliente: consulte 2ª via e OS",
      "",
      MAIN_MENU_TEXT
    ],
    { awaiting: "none" }
  );
}

async function nodeTransfer(state: IspGraphState) {
  const map: Record<string, string> = {
    financeiro_humano: "financeiro",
    suporte_humano: "suporte",
    comercial_humano: "comercial",
    noc_humano: "noc"
  };
  const hint = map[state.intent] || state.transferQueueHint || "suporte";
  return reply(`👤 Transferindo você para *${hint}*. Aguarde um momento...`, {
    awaiting: "none",
    done: true,
    transferQueueHint: hint
  });
}

async function nodeEncerrar() {
  return reply(
    "Atendimento automático encerrado. Obrigado por usar o *ISPCHAT*! 👋",
    { awaiting: "none", done: true, transferQueueHint: "" }
  );
}

async function nodeUnknown() {
  return reply(
    ["Não entendi completamente. Vou te mostrar o menu completo:", MAIN_MENU_TEXT],
    { awaiting: "none", intent: "menu" }
  );
}

async function nodeCollect(state: IspGraphState) {
  if (state.awaiting === "cpf") {
    const cpf = onlyDigits(state.input);
    if (cpf.length < 11) {
      return reply("CPF inválido. Envie 11 dígitos:", { awaiting: "cpf" });
    }
    const nextIntent =
      state.intent && state.intent !== "identify_client"
        ? state.intent
        : "dados_contrato";
    return { cpf, awaiting: "none", intent: nextIntent };
  }
  if (state.awaiting === "cep") {
    const cep = onlyDigits(state.input);
    if (cep.length < 8) {
      return reply("CEP inválido. Envie 8 dígitos:", { awaiting: "cep" });
    }
    return { cep, awaiting: "none", intent: "viabilidade" };
  }
  if (state.awaiting === "onu_light") {
    return { intent: "sem_internet" as IspIntent };
  }
  if (state.awaiting === "confirm_os") {
    return { intent: "abrir_os" as IspIntent };
  }
  return {};
}

function routeAfterRouter(state: IspGraphState): string {
  if (state.awaiting && state.awaiting !== "none") return "collect";
  const table: Record<string, string> = {
    menu: "menu",
    identify_client: "identify",
    segunda_via: "segunda_via",
    pix: "pix",
    negociacao: "negociacao",
    status_pagamento: "status_pagamento",
    sem_internet: "sem_internet",
    internet_lenta: "internet_lenta",
    reboot_onu: "reboot",
    abrir_os: "abrir_os",
    status_os: "status_os",
    viabilidade: "viabilidade",
    novo_plano: "novo_plano",
    upgrade_plano: "upgrade",
    agendar_instalacao: "agendar",
    reagendar_visita: "agendar",
    mudanca_endereco: "mudanca_endereco",
    senha_wifi: "senha_wifi",
    dados_contrato: "dados_contrato",
    protocolo: "protocolo",
    cancelamento: "cancelamento",
    reclamacao: "reclamacao",
    faq_geral: "faq",
    financeiro_humano: "transfer",
    suporte_humano: "transfer",
    comercial_humano: "transfer",
    noc_humano: "transfer",
    encerrar: "encerrar",
    unknown: "unknown"
  };
  return table[state.intent] || "unknown";
}

function routeAfterCollect(state: IspGraphState): string {
  return routeAfterRouter({ ...state, awaiting: "none" });
}

let compiledGraph: ReturnType<ReturnType<typeof buildWorkflow>["compile"]> | null =
  null;
const checkpointer = new MemorySaver();

function buildWorkflow() {
  return new StateGraph(IspState as any)
    .addNode("router", nodeRouter)
    .addNode("collect", nodeCollect)
    .addNode("menu", nodeMenu)
    .addNode("identify", nodeIdentify)
    .addNode("segunda_via", nodeSegundaVia)
    .addNode("pix", nodePix)
    .addNode("negociacao", nodeNegociacao)
    .addNode("status_pagamento", nodeStatusPagamento)
    .addNode("sem_internet", nodeSemInternet)
    .addNode("internet_lenta", nodeInternetLenta)
    .addNode("reboot", nodeReboot)
    .addNode("abrir_os", nodeAbrirOs)
    .addNode("status_os", nodeStatusOs)
    .addNode("viabilidade", nodeViabilidade)
    .addNode("novo_plano", nodeNovoPlano)
    .addNode("upgrade", nodeUpgrade)
    .addNode("agendar", nodeAgendar)
    .addNode("mudanca_endereco", nodeMudancaEndereco)
    .addNode("senha_wifi", nodeSenhaWifi)
    .addNode("dados_contrato", nodeDadosContrato)
    .addNode("protocolo", nodeProtocolo)
    .addNode("cancelamento", nodeCancelamento)
    .addNode("reclamacao", nodeReclamacao)
    .addNode("faq", nodeFaq)
    .addNode("transfer", nodeTransfer)
    .addNode("encerrar", nodeEncerrar)
    .addNode("unknown", nodeUnknown)
    .addEdge(START, "router")
    .addConditionalEdges("router", routeAfterRouter)
    .addConditionalEdges("collect", routeAfterCollect)
    .addEdge("menu", END)
    .addEdge("identify", END)
    .addEdge("segunda_via", END)
    .addEdge("pix", END)
    .addEdge("negociacao", END)
    .addEdge("status_pagamento", END)
    .addEdge("sem_internet", END)
    .addEdge("internet_lenta", END)
    .addEdge("reboot", END)
    .addEdge("abrir_os", END)
    .addEdge("status_os", END)
    .addEdge("viabilidade", END)
    .addEdge("novo_plano", END)
    .addEdge("upgrade", END)
    .addEdge("agendar", END)
    .addEdge("mudanca_endereco", END)
    .addEdge("senha_wifi", END)
    .addEdge("dados_contrato", END)
    .addEdge("protocolo", END)
    .addEdge("cancelamento", END)
    .addEdge("reclamacao", END)
    .addEdge("faq", END)
    .addEdge("transfer", END)
    .addEdge("encerrar", END)
    .addEdge("unknown", END);
}

export const getIspGraph = () => {
  if (!compiledGraph) {
    compiledGraph = buildWorkflow().compile({ checkpointer });
  }
  return compiledGraph;
};

export interface RunIspGraphInput {
  threadId: string;
  input: string;
  companyId: number;
  ticketId: number;
  contactName: string;
  contactNumber: string;
  prev?: Partial<IspGraphState>;
}

export const runIspLangGraph = async (payload: RunIspGraphInput) => {
  const graph = getIspGraph();
  const result = await graph.invoke(
    {
      input: payload.input,
      companyId: payload.companyId,
      ticketId: payload.ticketId,
      contactName: payload.contactName || "",
      contactNumber: payload.contactNumber || "",
      cpf: payload.prev?.cpf || "",
      cep: payload.prev?.cep || "",
      awaiting: payload.prev?.awaiting || "none",
      intent: (payload.prev?.intent as IspIntent) || "menu",
      variables: payload.prev?.variables || {},
      replies: [],
      messages: [],
      done: false,
      transferQueueHint: payload.prev?.transferQueueHint || ""
    },
    { configurable: { thread_id: payload.threadId } }
  );

  return {
    replies: (result.replies || []).filter(Boolean),
    state: {
      cpf: result.cpf || "",
      cep: result.cep || "",
      awaiting: result.awaiting || "none",
      intent: result.intent,
      variables: result.variables || {},
      transferQueueHint: result.transferQueueHint || "",
      done: !!result.done
    }
  };
};
