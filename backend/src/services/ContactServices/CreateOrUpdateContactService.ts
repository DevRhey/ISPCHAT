import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import { isNil } from "lodash";
interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  isGroup: boolean;
  email?: string;
  profilePicUrl?: string;
  companyId: number;
  extraInfo?: ExtraInfo[];
  whatsappId?: number;
  disableBot?: boolean;
  remoteJid?: string;
}

const CreateOrUpdateContactService = async ({
  name,
  number: rawNumber,
  profilePicUrl,
  isGroup,
  email = "",
  companyId,
  extraInfo = [],
  whatsappId,
  disableBot = false,
  remoteJid
}: Request): Promise<Contact> => {
  const number = isGroup ? rawNumber : rawNumber.replace(/[^0-9]/g, "");

  const io = getIO();
  let contact: Contact | null;

  contact = await Contact.findOne({
    where: {
      number,
      companyId
    }
  });

  if (contact) {
    const updates: Partial<Contact> = { profilePicUrl };
    if (remoteJid) {
      updates.remoteJid = remoteJid;
    }
    if (isNil(contact.whatsappId === null) && whatsappId) {
      updates.whatsappId = whatsappId;
    }
    await contact.update(updates);
    await contact.reload();

    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-contact`, {
      action: "update",
      contact
    });
  } else {
    contact = await Contact.create({
      name,
      number,
      profilePicUrl,
      email,
      isGroup,
      extraInfo,
      companyId,
      whatsappId,
      disableBot,
      remoteJid: remoteJid || null
    });

    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-contact`, {
      action: "create",
      contact
    });
  }

  return contact;
};

export default CreateOrUpdateContactService;
