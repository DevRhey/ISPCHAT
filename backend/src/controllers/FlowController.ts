import { Request, Response } from "express";
import {
  ListFlowsService,
  ShowFlowService,
  CreateFlowService,
  UpdateFlowService,
  DeleteFlowService
} from "../services/FlowServices/FlowCRUDService";
import { ImportIspTemplatesService } from "../services/FlowServices/IspFlowTemplates";
import { EnsureMasterAtendimentoFlowService } from "../services/FlowServices/EnsureMasterAtendimentoFlowService";
import {
  runBuiltinIspSimulations,
  SimulateFlowConversationService,
  summarizeBuiltinSimulations
} from "../services/FlowServices/SimulateFlowConversationService";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { searchParam } = req.query as any;
  const flows = await ListFlowsService({ companyId, searchParam });
  return res.json(flows);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const flow = await CreateFlowService({ ...req.body, companyId });
  return res.status(201).json(flow);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { flowId } = req.params;
  const flow = await ShowFlowService(flowId, companyId);
  return res.json(flow);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { flowId } = req.params;
  const flow = await UpdateFlowService(flowId, { ...req.body, companyId });
  return res.json(flow);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { flowId } = req.params;
  await DeleteFlowService(flowId, companyId);
  return res.status(200).json({ message: "Flow deleted" });
};

export const importIspTemplates = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const flows = await ImportIspTemplatesService(companyId);
  return res.status(201).json(flows);
};

/** Instala/atualiza fluxo gráfico unificado e vincula à fila */
export const installMasterAtendimento = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const bindQueueId =
    req.body?.queueId != null ? Number(req.body.queueId) : undefined;
  const result = await EnsureMasterAtendimentoFlowService(companyId, {
    bindQueueId,
    bindFirstQueue: bindQueueId == null
  });
  return res.status(result.created ? 201 : 200).json(result);
};

/** Simula diálogo cliente↔bot sem WhatsApp (financeiro / técnico / custom). */
export const simulate = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const { scenario, messages, contactNumber, contactName, queueId, builtin } =
    req.body || {};

  if (builtin === true || scenario === "builtin") {
    const results = await runBuiltinIspSimulations(companyId);
    const summary = summarizeBuiltinSimulations(results);
    return res.json({ results, summary });
  }

  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({
      error: "Informe messages: string[] ou builtin: true"
    });
  }

  const result = await SimulateFlowConversationService(companyId, {
    scenario: scenario || "custom",
    messages,
    contactNumber,
    contactName,
    queueId: queueId != null ? Number(queueId) : undefined,
    ensureMaster: true
  });
  return res.json(result);
};
