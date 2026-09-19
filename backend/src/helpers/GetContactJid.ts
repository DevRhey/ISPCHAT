import Contact from "../models/Contact";

/**
 * Monta o JID correto para envio no Baileys 7.
 * Contatos com LID não podem ser enviados como @s.whatsapp.net.
 */
const getContactJid = async (
  contact: Contact,
  isGroup: boolean,
  wbot?: any
): Promise<string> => {
  if (contact.remoteJid) {
    return contact.remoteJid;
  }

  const number = String(contact.number || "").replace(/\D/g, "");

  if (isGroup || contact.isGroup) {
    return `${number}@g.us`;
  }

  // LID costuma ter >= 15 dígitos; telefone BR típico tem 12–13
  if (number.length >= 15) {
    const lidJid = `${number}@lid`;

    try {
      const mapping = wbot?.signalRepository?.lidMapping;
      if (mapping?.getPNForLID) {
        const pn = await mapping.getPNForLID(lidJid);
        if (pn) {
          return String(pn).includes("@") ? String(pn) : `${pn}@s.whatsapp.net`;
        }
      }
    } catch {
      // segue enviando pelo @lid
    }

    return lidJid;
  }

  return `${number}@s.whatsapp.net`;
};

export default getContactJid;
