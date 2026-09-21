import { proto } from "@whiskeysockets/baileys";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Queue from "../../models/Queue";
import Whatsapp from "../../models/Whatsapp";
import AppError from "../../errors/AppError";
import runFlowEngine, {
  setFlowMessageSender
} from "./FlowEngine";
import { EnsureMasterAtendimentoFlowService } from "./EnsureMasterAtendimentoFlowService";

export type SimTurn = {
  from: "client" | "bot";
  body: string;
  at: string;
};

export type SimScenarioResult = {
  scenario: string;
  contactNumber: string;
  ticketId: number;
  flowId: number;
  queueId: number;
  turns: SimTurn[];
  finalNodeKey: string | null;
  finalVariables: Record<string, unknown>;
  ok: boolean;
  notes: string[];
};

const fakeMsg = (text: string, number: string): proto.IWebMessageInfo =>
  ({
    key: {
      id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      remoteJid: `${number}@s.whatsapp.net`,
      fromMe: false
    },
    message: { conversation: text },
    messageTimestamp: Math.floor(Date.now() / 1000)
  } as proto.IWebMessageInfo);

const getBody = (msg: proto.IWebMessageInfo) =>
  msg.message?.conversation ||
  msg.message?.extendedTextMessage?.text ||
  "";

async function ensureSimContact(
  companyId: number,
  number: string,
  name: string
): Promise<Contact> {
  const [contact] = await Contact.findOrCreate({
    where: { number, companyId },
    defaults: {
      name,
      number,
      email: "",
      profilePicUrl: "",
      isGroup: false,
      companyId
    } as any
  });
  if (contact.name !== name) {
    await contact.update({ name });
  }
  return contact;
}

async function ensureSimTicket(
  companyId: number,
  contact: Contact,
  queueId: number,
  flowId: number
): Promise<Ticket> {
  let whatsapp = await Whatsapp.findOne({
    where: { companyId },
    order: [["id", "ASC"]]
  });

  // Simulação não precisa de sessão Baileys real — cria placeholder se faltar
  if (!whatsapp) {
    whatsapp = await Whatsapp.create({
      name: "SIM-LOCAL",
      status: "DISCONNECTED",
      isDefault: true,
      companyId,
      token: `sim-${companyId}-${Date.now()}`,
      retries: 0
    } as any);
  }

  let ticket = await Ticket.findOne({
    where: {
      contactId: contact.id,
      companyId,
      whatsappId: whatsapp.id
    }
  });

  if (!ticket) {
    ticket = await Ticket.create({
      contactId: contact.id,
      status: "pending",
      companyId,
      whatsappId: whatsapp.id,
      queueId,
      chatbot: true,
      flowId,
      flowNodeKey: null,
      flowVariables: JSON.stringify({}),
      isGroup: false,
      unreadMessages: 0
    } as any);
  } else {
    await ticket.update({
      queueId,
      chatbot: true,
      flowId,
      flowNodeKey: null,
      flowVariables: JSON.stringify({}),
      status: "pending",
      userId: null
    });
  }

  await ticket.reload({ include: ["contact", "queue"] });
  return ticket;
}

/**
 * Roda um diálogo cliente→bot sem Baileys (captura sendBotMessage).
 */
export const SimulateFlowConversationService = async (
  companyId: number,
  params: {
    scenario: string;
    messages: string[];
    contactNumber?: string;
    contactName?: string;
    ensureMaster?: boolean;
    queueId?: number;
  }
): Promise<SimScenarioResult> => {
  const notes: string[] = [];
  let flowId: number;
  let queueId: number;

  if (params.ensureMaster !== false) {
    const master = await EnsureMasterAtendimentoFlowService(companyId, {
      bindQueueId: params.queueId,
      bindFirstQueue: params.queueId == null
    });
    flowId = master.flow.id;
    queueId = master.boundQueueId || params.queueId!;
    notes.push(
      master.created
        ? "Master flow criado"
        : "Master flow atualizado/já existia"
    );
  } else {
    const queue = params.queueId
      ? await Queue.findByPk(params.queueId)
      : await Queue.findOne({ where: { companyId }, order: [["id", "ASC"]] });
    if (!queue?.flowId) {
      throw new AppError("ERR_NO_FLOW_ON_QUEUE", 400);
    }
    flowId = queue.flowId;
    queueId = queue.id;
  }

  const number =
    params.contactNumber ||
    `55${String(900000000 + Math.floor(Math.random() * 9999999)).padStart(9, "0")}`;
  const name = params.contactName || `Sim ${params.scenario}`;
  const contact = await ensureSimContact(companyId, number, name);
  const ticket = await ensureSimTicket(companyId, contact, queueId, flowId);

  const turns: SimTurn[] = [];
  const wbotStub = {
    id: 0,
    sendMessage: async () => ({ key: { id: "stub" } })
  };

  setFlowMessageSender(async ({ body }) => {
    turns.push({
      from: "bot",
      body,
      at: new Date().toISOString()
    });
    return { key: { id: `bot-${turns.length}` } };
  });

  try {
    for (const text of params.messages) {
      turns.push({
        from: "client",
        body: text,
        at: new Date().toISOString()
      });
      await ticket.reload({ include: ["contact", "queue"] });
      const msg = fakeMsg(text, number);
      const consumed = await runFlowEngine(
        ticket,
        msg,
        wbotStub as any,
        getBody
      );
      if (!consumed) {
        notes.push(`Engine não consumiu mensagem: "${text}"`);
      }
    }
  } finally {
    setFlowMessageSender(null);
  }

  await ticket.reload();
  let finalVariables: Record<string, unknown> = {};
  try {
    finalVariables = JSON.parse(ticket.flowVariables || "{}");
  } catch {
    finalVariables = {};
  }

  const botReplies = turns.filter(t => t.from === "bot").length;
  return {
    scenario: params.scenario,
    contactNumber: number,
    ticketId: ticket.id,
    flowId,
    queueId,
    turns,
    finalNodeKey: ticket.flowNodeKey,
    finalVariables,
    ok: botReplies > 0,
    notes
  };
};

/** Suite completa de jornadas ISP (financeiro, técnico, comercial, serviços) */
export const runBuiltinIspSimulations = async (
  companyId: number
): Promise<SimScenarioResult[]> => {
  const scenarios: Array<{
    scenario: string;
    contactName: string;
    contactNumber: string;
    messages: string[];
  }> = [
    {
      scenario: "fin_boleto",
      contactName: "Sim Fin Boleto",
      contactNumber: "5511988001001",
      messages: ["oi", "1", "1", "12345678901"]
    },
    {
      scenario: "fin_intent_boleto_cpf",
      contactName: "Sim Fin Intent CPF",
      contactNumber: "5511988001010",
      messages: ["quero meu boleto", "52998224725"]
    },
    {
      scenario: "fin_desbloqueio",
      contactName: "Sim Fin Unlock",
      contactNumber: "5511988001002",
      messages: ["oi", "1", "4", "52998224725"]
    },
    {
      scenario: "fin_ja_paguei",
      contactName: "Sim Fin Paguei",
      contactNumber: "5511988001003",
      messages: ["oi", "1", "5"]
    },
    {
      scenario: "fin_negociar",
      contactName: "Sim Fin Nego",
      contactNumber: "5511988001004",
      messages: ["oi", "1", "3"]
    },
    {
      scenario: "tec_sem_internet",
      contactName: "Sim Tec Offline",
      contactNumber: "5511988002001",
      messages: ["oi", "2", "1", "2", "ONU vermelha sem link"]
    },
    {
      scenario: "tec_lenta",
      contactName: "Sim Tec Lenta",
      contactNumber: "5511988002002",
      messages: ["oi", "2", "2", "velocidade baixa no wifi"]
    },
    {
      scenario: "tec_wifi",
      contactName: "Sim Tec Wifi",
      contactNumber: "5511988002003",
      messages: ["oi", "2", "3", "1", "esqueci senha wifi"]
    },
    {
      scenario: "tec_visita",
      contactName: "Sim Tec Visita",
      contactNumber: "5511988002004",
      messages: ["oi", "2", "4", "12345678901"]
    },
    {
      scenario: "com_viabilidade",
      contactName: "Sim Com CEP",
      contactNumber: "5511988003001",
      messages: ["oi", "3", "1", "01310100"]
    },
    {
      scenario: "com_planos",
      contactName: "Sim Com Planos",
      contactNumber: "5511988003002",
      messages: ["oi", "3", "2"]
    },
    {
      scenario: "com_instalacao",
      contactName: "Sim Com Install",
      contactNumber: "5511988003003",
      messages: ["oi", "3", "4", "novo"]
    },
    {
      scenario: "svc_contrato",
      contactName: "Sim Svc Contrato",
      contactNumber: "5511988004001",
      messages: ["oi", "4", "1", "12345678901"]
    },
    {
      scenario: "svc_mudanca",
      contactName: "Sim Svc Mudanca",
      contactNumber: "5511988004002",
      messages: ["oi", "4", "2"]
    },
    {
      scenario: "svc_retencao",
      contactName: "Sim Svc Cancel",
      contactNumber: "5511988004003",
      messages: ["oi", "4", "3"]
    },
    {
      scenario: "svc_anatel",
      contactName: "Sim Svc Anatel",
      contactNumber: "5511988004004",
      messages: ["oi", "4", "4"]
    },
    {
      scenario: "kw_boleto",
      contactName: "Sim KW Boleto",
      contactNumber: "5511988005001",
      messages: ["boleto", "52998224725"]
    },
    {
      scenario: "humano",
      contactName: "Sim Humano",
      contactNumber: "5511988005002",
      messages: ["oi", "5"]
    }
  ];

  const results: SimScenarioResult[] = [];
  for (const s of scenarios) {
    results.push(
      await SimulateFlowConversationService(companyId, {
        ...s,
        ensureMaster: true
      })
    );
  }
  return results;
};
