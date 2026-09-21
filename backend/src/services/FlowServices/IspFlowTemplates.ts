/**
 * Templates ISP — catálogo = MASTER único.
 * Importar = limpa legado ISP e reinstala o Atendimento ISP Completo.
 */
import Flow from "../../models/Flow";
import {
  MASTER_FLOW_NAME,
  buildMasterAtendimentoFlow
} from "./MasterAtendimentoFlow";
import { EnsureMasterAtendimentoFlowService } from "./EnsureMasterAtendimentoFlowService";

export const buildIspTemplates = (companyId: number) => {
  return [buildMasterAtendimentoFlow(companyId)];
};

const isLegacyIspFlowName = (name: string): boolean => {
  if (!name) return false;
  if (name === MASTER_FLOW_NAME) return false;
  const n = name.toLowerCase();
  return (
    n.startsWith("isp -") ||
    n.startsWith("isp —") ||
    n.startsWith("ispchat -") ||
    n.startsWith("ispchat —") ||
    n.includes("menu langgraph") ||
    n.includes("atendimento unificado")
  );
};

export const ImportIspTemplatesService = async (companyId: number) => {
  const all = await Flow.findAll({ where: { companyId } });
  for (const f of all) {
    if (isLegacyIspFlowName(f.name)) {
      await f.destroy();
    }
  }

  const result = await EnsureMasterAtendimentoFlowService(companyId, {
    bindFirstQueue: true
  });

  return [result.flow];
};

export { MASTER_FLOW_NAME, buildMasterAtendimentoFlow };
