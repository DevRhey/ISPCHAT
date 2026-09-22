import * as Sentry from "@sentry/node";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import getContactJid from "../../helpers/GetContactJid";
import formatBody from "../../helpers/Mustache";
import Ticket from "../../models/Ticket";
import { logger } from "../../utils/logger";

export interface InteractiveMenuOption {
  option: string;
  label: string;
  icon?: string;
  keywords?: string[];
}

export type InteractiveMode = "auto" | "buttons" | "list" | "text";

interface Request {
  ticket: Ticket;
  /**
   * Texto principal do menu — inclui cabeçalho, opções numeradas e dica.
   * Enviado como corpo de texto em todos os modos (fallback garantido).
   */
  body: string;
  options: InteractiveMenuOption[];
  interactiveMode?: InteractiveMode;
  /** Sessão Baileys já resolvida (evita busca extra no DB). */
  wbotSession?: any;
}

/** Monta o rótulo exibido no botão / linha da lista. */
const optionDisplayText = (o: InteractiveMenuOption): string => {
  const prefix = o.icon ? `${o.icon} ` : "";
  return `${prefix}${o.label}`;
};

/**
 * Envia o menu de opções como mensagem interativa (botões ou lista) via Baileys
 * com fallback automático para texto simples em caso de erro ou canal sem suporte.
 *
 * Mapeamento de buttonId / rowId = número da opção (string) — isso faz com que
 * a resposta do cliente (selectedButtonId / selectedRowId) seja igual a digitar o
 * número, portanto o FlowEngine resolve normalmente via matchMenuOption.
 */
const SendInteractiveMenuMessage = async ({
  ticket,
  body,
  options,
  interactiveMode = "auto",
  wbotSession
}: Request): Promise<any> => {
  let wbot = wbotSession;

  if (!wbot) {
    try {
      wbot = await GetTicketWbot(ticket);
    } catch (err) {
      logger.warn({ err }, "SendInteractiveMenuMessage: sem sessão Baileys, usando texto");
    }
  }

  if (!wbot) {
    return null;
  }

  let jid: string;
  try {
    jid = await getContactJid(ticket.contact, ticket.isGroup, wbot);
  } catch (err) {
    logger.warn({ err }, "SendInteractiveMenuMessage: falha ao resolver JID");
    return null;
  }

  const formattedBody = formatBody(body, ticket.contact);

  // Resolve modo efetivo
  const count = options.length;
  let mode: "buttons" | "list" | "text" = "text";
  if (interactiveMode === "buttons") mode = "buttons";
  else if (interactiveMode === "list") mode = "list";
  else if (interactiveMode === "auto") mode = count <= 3 ? "buttons" : "list";

  // Baileys buttons suporta até 3 botões; lista suporta até ~10 linhas
  if (mode === "buttons" && count > 3) mode = "list";

  if (mode === "buttons") {
    try {
      const buttons = options.map(o => ({
        buttonId: String(o.option),
        buttonText: { displayText: optionDisplayText(o) },
        type: 4
      }));

      const sent = await wbot.sendMessage(jid, {
        text: formattedBody,
        buttons,
        headerType: 4
      });

      await ticket.update({ lastMessage: body });
      return sent;
    } catch (err: any) {
      Sentry.captureException(err);
      logger.warn(
        { err: err?.message },
        "SendInteractiveMenuMessage: botões falharam — tentando lista"
      );
      mode = "list";
    }
  }

  if (mode === "list") {
    try {
      const rows = options.map(o => ({
        title: optionDisplayText(o),
        rowId: String(o.option),
        description: ""
      }));

      const sent = await wbot.sendMessage(jid, {
        text: formattedBody,
        buttonText: "Ver opções",
        sections: [{ title: "Opções", rows }]
      });

      await ticket.update({ lastMessage: body });
      return sent;
    } catch (err: any) {
      Sentry.captureException(err);
      logger.warn(
        { err: err?.message },
        "SendInteractiveMenuMessage: lista falhou — enviando texto simples"
      );
    }
  }

  // Fallback texto
  try {
    const sent = await wbot.sendMessage(jid, { text: formattedBody });
    await ticket.update({ lastMessage: body });
    return sent;
  } catch (err: any) {
    Sentry.captureException(err);
    logger.error({ err: err?.message }, "SendInteractiveMenuMessage: falha total");
    return null;
  }
};

export default SendInteractiveMenuMessage;
