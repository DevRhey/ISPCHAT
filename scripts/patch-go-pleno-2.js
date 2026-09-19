const fs = require("fs");

// Expand onboarding steps
{
  const path = "frontend/src/components/OnboardingWizard/index.js";
  let s = fs.readFileSync(path, "utf8");
  if (!s.includes('key: "connector"')) {
    s = s.replace(
      `path: "/flows"
  }
];`,
      `path: "/flows"
  },
  {
    key: "langgraph",
    label: "IA ISP",
    title: "Ligue o ISPCHAT LangGraph na fila",
    body: "Em Integrações, crie tipo ISPCHAT LangGraph e vincule na fila principal (não misture com Typebot na mesma fila).",
    cta: "Abrir Integrações",
    path: "/queue-integration"
  },
  {
    key: "connector",
    label: "ERP",
    title: "Conector IXC / SGP / HubSoft",
    body: "Cadastre o ERP em Conectores ISP. Em produção deixe ALLOW_ISP_DEMO=false para nunca enviar boleto fictício.",
    cta: "Abrir Conectores",
    path: "/isp-connectors"
  },
  {
    key: "handoff",
    label: "Handoff",
    title: "Mapeie filas humanas",
    body: "Em Configurações, defina ispTransferQueues (JSON) com IDs de financeiro, suporte, comercial e noc para o bot transferir certo.",
    cta: "Abrir Configurações",
    path: "/settings"
  }
];`
    );
    fs.writeFileSync(path, s);
    console.log("OK onboarding steps");
  } else console.log("SKIP onboarding");
}

// Cloud webhook POST: parse Meta payload and log structured (foundation for ticket pipeline)
{
  const path = "backend/src/routes/whatsappCloudRoutes.ts";
  let s = fs.readFileSync(path, "utf8");
  if (!s.includes("extractCloudInbound")) {
    s = s.replace(
      `import {
  getCloudApiConfig,
  isCloudApiEnabled,
  sendCloudTextMessage,
  verifyCloudWebhook
} from "../services/WhatsappCloudService/cloudApi";`,
      `import {
  getCloudApiConfig,
  isCloudApiEnabled,
  sendCloudTextMessage,
  verifyCloudWebhook
} from "../services/WhatsappCloudService/cloudApi";
import { logger } from "../utils/logger";`
    );
    s = s.replace(
      `whatsappCloudRoutes.post("/whatsapp-cloud/webhook", (req, res) => {
  // Recebe eventos Meta — processar em worker futuro
  return res.sendStatus(200);
});`,
      `whatsappCloudRoutes.post("/whatsapp-cloud/webhook", (req, res) => {
  try {
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
              text: msg.text?.body?.slice?.(0, 120)
            },
            "whatsapp-cloud inbound (ack; Baileys permanece canal padrão até migração completa)"
          );
        }
      }
    }
  } catch (err: any) {
    logger.error({ err: err?.message }, "whatsapp-cloud webhook parse error");
  }
  // Sempre 200 para a Meta não reenviar em loop
  return res.sendStatus(200);
});`
    );
    fs.writeFileSync(path, s);
    console.log("OK cloud webhook");
  } else console.log("SKIP cloud webhook");
}
