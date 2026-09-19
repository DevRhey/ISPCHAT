import { Request, Response } from "express";
import IspConnector from "../models/IspConnector";
import AppError from "../errors/AppError";
import runIspAction from "../services/IspConnectorServices/runIspAction";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const connectors = await IspConnector.findAll({
    where: { companyId },
    order: [["name", "ASC"]]
  });
  return res.json(connectors);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { name, provider, baseUrl, token, config, active } = req.body;

  const connector = await IspConnector.create({
    name,
    provider: provider || "generic",
    baseUrl,
    token,
    config: typeof config === "object" ? JSON.stringify(config) : config || "{}",
    active: active !== false,
    companyId
  });

  return res.status(201).json(connector);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { connectorId } = req.params;

  const connector = await IspConnector.findOne({
    where: { id: connectorId, companyId }
  });
  if (!connector) throw new AppError("ERR_NO_CONNECTOR", 404);

  const { name, provider, baseUrl, token, config, active } = req.body;
  await connector.update({
    name: name ?? connector.name,
    provider: provider ?? connector.provider,
    baseUrl: baseUrl ?? connector.baseUrl,
    token: token ?? connector.token,
    config:
      config === undefined
        ? connector.config
        : typeof config === "object"
        ? JSON.stringify(config)
        : config,
    active: active ?? connector.active
  });

  return res.json(connector);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { connectorId } = req.params;

  const connector = await IspConnector.findOne({
    where: { id: connectorId, companyId }
  });
  if (!connector) throw new AppError("ERR_NO_CONNECTOR", 404);

  await connector.destroy();
  return res.json({ message: "Connector deleted" });
};

export const testAction = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const { connectorId, action, variables } = req.body;

  const result = await runIspAction({
    companyId,
    connectorId,
    action: action || "lookupClient",
    variables: variables || {}
  });

  return res.json(result);
};
