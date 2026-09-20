import { Request, Response } from "express";
import * as Yup from "yup";
import Gerencianet from "gn-api-sdk-typescript";
import AppError from "../errors/AppError";

import options from "../config/Gn";
import Company from "../models/Company";
import Invoices from "../models/Invoices";
import { getIO } from "../libs/socket";

const assertWebhookSecret = (req: Request) => {
  const expected = process.env.GERENCIANET_WEBHOOK_SECRET;
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      throw new AppError("Webhook secret não configurado", 503);
    }
    return;
  }
  const provided =
    (req.headers["x-webhook-secret"] as string) ||
    (req.query.secret as string) ||
    "";
  if (provided !== expected) {
    throw new AppError("Webhook não autorizado", 401);
  }
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const gerencianet = Gerencianet(options);
  return res.json(gerencianet.getSubscriptions());
};

export const createSubscription = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const gerencianet = Gerencianet(options);
  const { companyId } = req.user;

  const schema = Yup.object().shape({
    price: Yup.string().required(),
    users: Yup.string().required(),
    connections: Yup.string().required()
  });

  if (!(await schema.isValid(req.body))) {
    throw new AppError("Validation fails", 400);
  }

  const { price, invoiceId } = req.body;

  const company = await Company.findByPk(companyId);
  if (!company) {
    throw new AppError("Company not found", 404);
  }

  if (invoiceId) {
    const invoice = await Invoices.findOne({
      where: { id: invoiceId, companyId }
    });
    if (!invoice) {
      throw new AppError("Fatura não encontrada", 404);
    }
  }

  const body = {
    calendario: {
      expiracao: 3600
    },
    valor: {
      original: price
        .toLocaleString("pt-br", { minimumFractionDigits: 2 })
        .replace(",", ".")
    },
    chave: process.env.GERENCIANET_PIX_KEY,
    solicitacaoPagador: `#Fatura:${invoiceId}`
  };

  try {
    const pix = await gerencianet.pixCreateImmediateCharge(null, body);
    const qrcode = await gerencianet.pixGenerateQRCode({
      id: pix.loc.id
    });

    return res.json({
      ...pix,
      qrcode,
      companyId
    });
  } catch (error) {
    throw new AppError("Falha ao criar cobrança PIX", 400);
  }
};

export const createWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const schema = Yup.object().shape({
    chave: Yup.string().required(),
    url: Yup.string().required()
  });

  if (!(await schema.isValid(req.body))) {
    throw new AppError("Validation fails", 400);
  }

  const { chave, url } = req.body;
  const secret = process.env.GERENCIANET_WEBHOOK_SECRET;
  const webhookUrl =
    secret && !url.includes("secret=")
      ? `${url}${url.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}`
      : url;

  try {
    const gerencianet = Gerencianet(options);
    const create = await gerencianet.pixConfigWebhook(
      { chave },
      { webhookUrl }
    );
    return res.json(create);
  } catch (error) {
    console.log(error);
    throw new AppError("Falha ao configurar webhook", 400);
  }
};

export const webhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  assertWebhookSecret(req);

  const { evento } = req.body;
  if (evento === "teste_webhook") {
    return res.json({ ok: true });
  }

  if (req.body.pix) {
    const gerencianet = Gerencianet(options);

    for (const pix of req.body.pix) {
      const detahe = await gerencianet.pixDetailCharge({
        txid: pix.txid
      });

      if (detahe.status !== "CONCLUIDA") continue;

      const { solicitacaoPagador } = detahe;
      const invoiceID = String(solicitacaoPagador || "").replace("#Fatura:", "");
      if (!invoiceID) continue;

      const invoices = await Invoices.findByPk(invoiceID);
      if (!invoices) continue;

      const companyId = invoices.companyId;
      const company = await Company.findByPk(companyId);
      if (!company) continue;

      const expiresAt = new Date(company.dueDate || Date.now());
      expiresAt.setDate(expiresAt.getDate() + 30);
      const date = expiresAt.toISOString().split("T")[0];

      await company.update({
        dueDate: date,
        status: true,
        activationState: "active"
      });
      await invoices.update({ status: "paid" });
      await company.reload();

      const io = getIO();
      io.to(`company-${companyId}-mainchannel`).emit(
        `company-${companyId}-payment`,
        {
          action: detahe.status,
          company
        }
      );
    }
  }

  return res.json({ ok: true });
};
