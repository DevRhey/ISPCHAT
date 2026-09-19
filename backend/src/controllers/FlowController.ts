import { Request, Response } from "express";
import {
  ListFlowsService,
  ShowFlowService,
  CreateFlowService,
  UpdateFlowService,
  DeleteFlowService
} from "../services/FlowServices/FlowCRUDService";
import { ImportIspTemplatesService } from "../services/FlowServices/IspFlowTemplates";

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
