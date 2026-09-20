import Plan from "../../models/Plan";
import Setting from "../../models/Setting";
import { logger } from "../../utils/logger";

/** Planos públicos do signup (useInternal: true). */
const COMMERCIAL_PLANS = [
  {
    name: "Básico",
    users: 10,
    connections: 3,
    queues: 8,
    value: 349,
    useInternal: true,
    useCampaigns: true,
    useSchedules: true,
    useInternalChat: true,
    useExternalApi: false,
    useKanban: true,
    useOpenAi: false,
    useIntegrations: true
  },
  {
    name: "IA",
    users: 10,
    connections: 3,
    queues: 8,
    value: 549,
    useInternal: true,
    useCampaigns: true,
    useSchedules: true,
    useInternalChat: true,
    useExternalApi: true,
    useKanban: true,
    useOpenAi: true,
    useIntegrations: true
  }
];

/** Nomes antigos: somem do signup público. */
const LEGACY_PUBLIC_NAMES = ["Starter", "Pro", "Enterprise", "Plano 1"];

const EnsureCommercialPlansService = async (): Promise<void> => {
  for (const data of COMMERCIAL_PLANS) {
    const [plan, created] = await Plan.findOrCreate({
      where: { name: data.name },
      defaults: data
    });
    if (!created) {
      await plan.update(data);
    }
  }

  for (const name of LEGACY_PUBLIC_NAMES) {
    const legacy = await Plan.findOne({ where: { name } });
    if (legacy) {
      await legacy.update({ useInternal: false });
    }
  }

  const [trial] = await Setting.findOrCreate({
    where: { companyId: 1, key: "trial" },
    defaults: { companyId: 1, key: "trial", value: "7" }
  });
  if (String(trial.value) !== "7") {
    await trial.update({ value: "7" });
  }

  logger.info("Planos comerciais Básico/IA garantidos (signup público)");
};

export default EnsureCommercialPlansService;
