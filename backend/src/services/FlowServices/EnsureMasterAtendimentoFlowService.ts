import Flow from "../../models/Flow";
import Queue from "../../models/Queue";
import {
  CreateFlowService,
  UpdateFlowService,
  ShowFlowService
} from "./FlowCRUDService";
import {
  MASTER_FLOW_NAME,
  buildMasterAtendimentoFlow
} from "./MasterAtendimentoFlow";

export interface EnsureMasterResult {
  flow: Flow;
  created: boolean;
  boundQueueId: number | null;
  queueCreated?: boolean;
}

/**
 * Cria ou atualiza o fluxo unificado e vincula a uma fila (cria fila padrão se não houver).
 */
export const EnsureMasterAtendimentoFlowService = async (
  companyId: number,
  options?: { bindQueueId?: number | null; bindFirstQueue?: boolean }
): Promise<EnsureMasterResult> => {
  const payload = buildMasterAtendimentoFlow(companyId);
  const existing = await Flow.findOne({
    where: { companyId, name: MASTER_FLOW_NAME }
  });

  let flow: Flow;
  let created = false;
  let queueCreated = false;

  if (existing) {
    flow = await UpdateFlowService(existing.id, {
      ...payload,
      companyId
    });
  } else {
    flow = await CreateFlowService(payload as any);
    created = true;
  }

  let boundQueueId: number | null = null;
  let targetQueueId = options?.bindQueueId;

  if (targetQueueId == null && options?.bindFirstQueue !== false) {
    const firstQueue = await Queue.findOne({
      where: { companyId },
      order: [["id", "ASC"]]
    });
    targetQueueId = firstQueue?.id ?? null;
  }

  if (targetQueueId == null && options?.bindFirstQueue !== false) {
    const queue = await Queue.create({
      name: "Atendimento ISPCHAT",
      color: "#2e7d32",
      greetingMessage:
        "Olá! Você será atendido pelo assistente ISPCHAT (Financeiro, Técnico e Comercial).",
      companyId,
      orderQueue: 1,
      flowId: flow.id
    } as any);
    targetQueueId = queue.id;
    queueCreated = true;
  }

  if (targetQueueId) {
    await Queue.update(
      { flowId: flow.id },
      { where: { id: targetQueueId, companyId } }
    );
    await flow.update({ queueId: targetQueueId });
    boundQueueId = targetQueueId;
    flow = await ShowFlowService(flow.id, companyId);
  }

  return { flow, created, boundQueueId, queueCreated };
};
