import { Router, Request, Response } from "express";
import {
  getCloudApiConfig,
  isCloudApiEnabled,
  sendCloudTextMessage,
  verifyCloudWebhook
} from "../services/WhatsappCloudService/cloudApi";
import isAuth from "../middleware/isAuth";
import AppError from "../errors/AppError";
import auditLog from "../middleware/auditLog";
import { logger } from "../utils/logger";

const whatsappCloudRoutes = Router();

whatsappCloudRoutes.get("/whatsapp-cloud/status", isAuth, (_req, res) => {
  const enabled = isCloudApiEnabled();
  const cfg = getCloudApiConfig();
  return res.json({
    enabled,
    configured: !!cfg,
    provider: enabled ? "meta-cloud" : "baileys",
    disclaimer:
      "Canal oficial Meta Cloud API disponível como adapter. Baileys permanece padrão até migração completa do listener de tickets."
  });
});

whatsappCloudRoutes.post(
  "/whatsapp-cloud/send",
  isAuth,
  auditLog("whatsapp_cloud.send"),
  async (req: Request, res: Response) => {
    if (!isCloudApiEnabled()) {
      throw new AppError("Cloud API desabilitada", 400);
    }
    const { to, body } = req.body;
    if (!to || !body) {
      throw new AppError("Informe to e body", 400);
    }
    const result = await sendCloudTextMessage(to, body);
    return res.status(result.ok ? 200 : 502).json(result);
  }
);

whatsappCloudRoutes.get("/whatsapp-cloud/webhook", (req, res) => {
  const mode = String(req.query["hub.mode"] || "");
  const token = String(req.query["hub.verify_token"] || "");
  const challenge = String(req.query["hub.challenge"] || "");
  const result = verifyCloudWebhook(mode, token, challenge);
  if (result !== null) {
    return res.status(200).send(result);
  }
  return res.sendStatus(403);
});

whatsappCloudRoutes.post("/whatsapp-cloud/webhook", (req, res) => {
  try {
    if (!isCloudApiEnabled()) {
      return res.sendStatus(200);
    }
    const body = req.body || {};
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value || {};
        const messages = value.messages || [];
        for (const msg of messages) {
          logger.info(
            {
              from: msg.from,
              type: msg.type,
              id: msg.id,
              text:
                msg.text && msg.text.body
                  ? String(msg.text.body).slice(0, 120)
                  : undefined
            },
            "whatsapp-cloud inbound ack (ticket pipeline ainda via Baileys por padrão)"
          );
        }
      }
    }
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      "whatsapp-cloud webhook parse error"
    );
  }
  return res.sendStatus(200);
});

export default whatsappCloudRoutes;
