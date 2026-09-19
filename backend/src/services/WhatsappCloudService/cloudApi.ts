/**
 * Stub / fundação WhatsApp Cloud API (Meta).
 * Baileys permanece o canal padrão; este módulo prepara o adapter oficial.
 *
 * Ativar com: WHATSAPP_CLOUD_ENABLED=true + tokens Meta.
 */

import axios from "axios";
import { logger } from "../../utils/logger";

export interface CloudApiConfig {
  phoneNumberId: string;
  accessToken: string;
  wabaId?: string;
  apiVersion?: string;
}

export const isCloudApiEnabled = (): boolean =>
  process.env.WHATSAPP_CLOUD_ENABLED === "true";

export const getCloudApiConfig = (): CloudApiConfig | null => {
  if (!isCloudApiEnabled()) return null;
  const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || "";
  const accessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN || "";
  if (!phoneNumberId || !accessToken) {
    logger.warn("WHATSAPP_CLOUD_ENABLED mas tokens incompletos");
    return null;
  }
  return {
    phoneNumberId,
    accessToken,
    wabaId: process.env.WHATSAPP_CLOUD_WABA_ID,
    apiVersion: process.env.WHATSAPP_CLOUD_API_VERSION || "v19.0"
  };
};

export const sendCloudTextMessage = async (
  to: string,
  body: string,
  config?: CloudApiConfig
): Promise<{ ok: boolean; data?: any; error?: string }> => {
  const cfg = config || getCloudApiConfig();
  if (!cfg) {
    return { ok: false, error: "Cloud API não configurada" };
  }

  const version = cfg.apiVersion || "v19.0";
  const url = `https://graph.facebook.com/${version}/${cfg.phoneNumberId}/messages`;

  try {
    const { data } = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to: to.replace(/\D/g, ""),
        type: "text",
        text: { body }
      },
      {
        headers: {
          Authorization: `Bearer ${cfg.accessToken}`,
          "Content-Type": "application/json"
        },
        timeout: 20000
      }
    );
    return { ok: true, data };
  } catch (err: any) {
    logger.error(
      { err: err?.response?.data || err?.message },
      "Cloud API send failed"
    );
    return {
      ok: false,
      error: err?.response?.data?.error?.message || err?.message || "erro"
    };
  }
};

export const verifyCloudWebhook = (
  mode: string,
  token: string,
  challenge: string
): string | null => {
  const verifyToken = process.env.WHATSAPP_CLOUD_VERIFY_TOKEN || "";
  if (mode === "subscribe" && token === verifyToken) {
    return challenge;
  }
  return null;
};
