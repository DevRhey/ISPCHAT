import axios from "axios";
import { proto } from "@whiskeysockets/baileys";
import Ticket from "../../models/Ticket";
import QueueIntegrations from "../../models/QueueIntegrations";
import { getBodyMessage } from "../WbotServices/wbotMessageListener";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import { logger } from "../../utils/logger";

type Session = any;

interface N8nPayload {
  ticketId: number;
  companyId: number;
  queueId: number | null;
  whatsappId: number | null;
  body: string;
  contact: {
    id: number;
    name: string;
    number: string;
  };
  rawMessage?: proto.IWebMessageInfo;
}

const extractMessages = (data: any): string[] => {
  if (!data) return [];

  if (typeof data === "string") return [data];

  if (Array.isArray(data)) {
    return data
      .map(item => {
        if (typeof item === "string") return item;
        if (item?.message) return String(item.message);
        if (item?.text) return String(item.text);
        if (item?.reply) return String(item.reply);
        return null;
      })
      .filter(Boolean) as string[];
  }

  if (Array.isArray(data.messages)) {
    return data.messages.map((m: any) =>
      typeof m === "string" ? m : String(m?.message || m?.text || "")
    ).filter(Boolean);
  }

  if (data.reply) return [String(data.reply)];
  if (data.message) return [String(data.message)];
  if (data.text) return [String(data.text)];

  // Plus-style: flatten string values from object/array response
  if (typeof data === "object") {
    const collected: string[] = [];
    Object.values(data).forEach(value => {
      if (typeof value === "string" && value.trim()) collected.push(value);
    });
    return collected;
  }

  return [];
};

const n8nService = async ({
  wbot,
  msg,
  ticket,
  integration
}: {
  wbot: Session;
  msg: proto.IWebMessageInfo;
  ticket: Ticket;
  integration: QueueIntegrations;
}): Promise<void> => {
  if (!integration?.urlN8N) {
    logger.warn("n8n/webhook sem urlN8N configurada");
    return;
  }

  await ticket.reload({ include: ["contact"] });

  const body = getBodyMessage(msg) || "";

  const payload: N8nPayload = {
    ticketId: ticket.id,
    companyId: ticket.companyId,
    queueId: ticket.queueId,
    whatsappId: ticket.whatsappId,
    body,
    contact: {
      id: ticket.contact.id,
      name: ticket.contact.name,
      number: ticket.contact.number
    },
    rawMessage: msg
  };

  try {
    const { data } = await axios.post(integration.urlN8N, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
      maxBodyLength: Infinity
    });

    const messages = extractMessages(data);

    for (const text of messages) {
      await SendWhatsAppMessage({ body: text, ticket });
    }
  } catch (err) {
    logger.error({ err }, "Erro ao chamar n8n/webhook");
  }
};

export default n8nService;
export { extractMessages };
