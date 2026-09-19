import { proto } from "@whiskeysockets/baileys";
import Ticket from "../../models/Ticket";
import QueueIntegrations from "../../models/QueueIntegrations";
import { getBodyMessage } from "../WbotServices/wbotMessageListener";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import { runIspLangGraph } from "./ispGraph";
import { logger } from "../../utils/logger";

type Session = any;

interface PrevState {
  cpf?: string;
  cep?: string;
  awaiting?: string;
  intent?: string;
  variables?: Record<string, any>;
  transferQueueHint?: string;
}

const parsePrev = (ticket: Ticket): PrevState => {
  try {
    const raw = ticket.flowVariables || ticket.typebotSessionId;
    if (!raw) return {};
    // Prefer flowVariables JSON; fallback typebotSessionId if JSON
    if (ticket.flowVariables) return JSON.parse(ticket.flowVariables);
    if (ticket.typebotSessionId?.startsWith("{")) {
      return JSON.parse(ticket.typebotSessionId);
    }
    return {};
  } catch {
    return {};
  }
};

const langGraphListener = async ({
  wbot,
  msg,
  ticket,
  integration
}: {
  wbot: Session;
  msg: proto.IWebMessageInfo;
  ticket: Ticket;
  integration?: QueueIntegrations;
}): Promise<void> => {
  if (msg.key.remoteJid === "status@broadcast") return;

  await ticket.reload({ include: ["contact"] });
  const body = getBodyMessage(msg) || "";
  const prev = parsePrev(ticket);
  const threadId = `ispchat-ticket-${ticket.id}`;

  try {
    const { replies, state } = await runIspLangGraph({
      threadId,
      input: body,
      companyId: ticket.companyId,
      ticketId: ticket.id,
      contactName: ticket.contact?.name || "",
      contactNumber: ticket.contact?.number || "",
      prev: prev as any
    });

    await ticket.update({
      useIntegration: true,
      integrationId: integration?.id || ticket.integrationId,
      flowVariables: JSON.stringify(state),
      typebotStatus: !state.done,
      chatbot: !state.done
    });

    for (const text of replies) {
      await SendWhatsAppMessage({ body: text, ticket });
    }

    if (state.done && state.transferQueueHint) {
      await UpdateTicketService({
        ticketData: {
          chatbot: false,
          useIntegration: false,
          integrationId: null,
          status: "pending"
        } as any,
        ticketId: ticket.id,
        companyId: ticket.companyId
      });
    } else if (state.done) {
      await UpdateTicketService({
        ticketData: {
          chatbot: false,
          useIntegration: false,
          integrationId: null,
          status: "closed"
        } as any,
        ticketId: ticket.id,
        companyId: ticket.companyId
      });
    }
  } catch (err) {
    logger.error({ err }, "LangGraph ISPCHAT error");
    await SendWhatsAppMessage({
      body: "Tive um problema técnico no ISPCHAT. Digite *0* para o menu ou aguarde um atendente.",
      ticket
    });
  }
};

export default langGraphListener;
