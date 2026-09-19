import { Op } from "sequelize";
import Queue from "../../models/Queue";
import Setting from "../../models/Setting";
import { logger } from "../../utils/logger";

const HINT_ALIASES: Record<string, string[]> = {
  financeiro: ["financeiro", "finance", "cobranca", "cobrança", "faturamento"],
  suporte: ["suporte", "suporte tecnico", "suporte técnico", "helpdesk", "atendimento"],
  comercial: ["comercial", "vendas", "sales", "retencao", "retenção"],
  noc: ["noc", "rede", "network", "backbone"]
};

/**
 * Resolve transferQueueHint (financeiro|suporte|comercial|noc) → queueId.
 * 1) Setting key `ispTransferQueues` JSON: {"financeiro":1,"suporte":2,...}
 * 2) Queue.name ILIKE / contains hint (or aliases), scoped by companyId
 * Returns undefined if no safe match (caller keeps pending without wrong queue).
 */
export async function resolveTransferQueueId(
  companyId: number,
  hint: string
): Promise<number | undefined> {
  const key = String(hint || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (!key || !companyId) return undefined;

  try {
    const setting = await Setting.findOne({
      where: { companyId, key: "ispTransferQueues" }
    });
    if (setting?.value) {
      const map = JSON.parse(setting.value) as Record<string, number | string>;
      const raw = map[key] ?? map[hint];
      const id = typeof raw === "number" ? raw : parseInt(String(raw), 10);
      if (Number.isFinite(id) && id > 0) {
        const exists = await Queue.findOne({ where: { id, companyId } });
        if (exists) return exists.id;
      }
    }
  } catch (err) {
    logger.warn({ err, companyId, hint }, "ispTransferQueues setting parse/lookup failed");
  }

  const aliases = HINT_ALIASES[key] || [key];
  for (const alias of aliases) {
    const queue = await Queue.findOne({
      where: {
        companyId,
        name: { [Op.iLike]: `%${alias}%` }
      },
      order: [["orderQueue", "ASC"], ["id", "ASC"]]
    });
    if (queue) return queue.id;
  }

  return undefined;
}

export default resolveTransferQueueId;
