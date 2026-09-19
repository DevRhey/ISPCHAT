import gracefulShutdown from "http-graceful-shutdown";
import app from "./app";
import { initIO } from "./libs/socket";
import { logger } from "./utils/logger";
import { StartAllWhatsAppsSessions } from "./services/WbotServices/StartAllWhatsAppsSessions";
import Company from "./models/Company";
import { startQueueProcess } from "./queues";
import { TransferTicketQueue } from "./wbotTransferTicketQueue";
import cron from "node-cron";


const server = app.listen(process.env.PORT, async () => {
  try {
    const companies = await Company.findAll();
    const allPromises: Promise<unknown>[] = [];
    for (const c of companies) {
      if (c.status === true) {
        allPromises.push(
          StartAllWhatsAppsSessions(c.id).catch(err => {
            logger.error(
              `Falha ao iniciar sessões WhatsApp da empresa ${c.id}: ${err?.message || err}`
            );
          })
        );
      } else {
        logger.info(`Empresa INATIVA: ${c.id} | ${c.name}`);
      }
    }

    Promise.all(allPromises)
      .then(() => startQueueProcess())
      .catch(err =>
        logger.error(`startQueueProcess/sessions: ${err?.message || err}`)
      );
  } catch (err: any) {
    logger.error(`Bootstrap companies/sessions: ${err?.message || err}`);
  }
  logger.info(`Server started on port: ${process.env.PORT}`);
});

// Baileys / Redis / filas geram rejections transitórias. Sair do processo
// aqui derruba a API "toda hora". Logamos e seguimos; o Docker restart
// cobre só falhas fatais reais (OOM / segfault / SIGTERM).
process.on("uncaughtException", err => {
  logger.error(
    `${new Date().toUTCString()} uncaughtException: ${err?.message || err}`
  );
  if (err?.stack) logger.error(err.stack);
});

process.on("unhandledRejection", (reason, p) => {
  const msg =
    reason instanceof Error
      ? reason.message
      : typeof reason === "string"
      ? reason
      : JSON.stringify(reason);
  logger.error(
    `${new Date().toUTCString()} unhandledRejection: ${msg}`
  );
  if (reason instanceof Error && reason.stack) logger.error(reason.stack);
  else logger.error(`Promise: ${String(p)}`);
});


cron.schedule("*/5 * * * *", async () => {  // De 1 minuto para 5 minutos
  try {
    logger.info(`Serviço de transferência de tickets iniciado`);
    await TransferTicketQueue();
  } catch (error) {
    logger.error("Error in cron job:", error);
  }
});



initIO(server);

// Configure graceful shutdown to handle all outstanding promises
gracefulShutdown(server, {
  signals: "SIGINT SIGTERM",
  timeout: 30000, // 30 seconds
  onShutdown: async () => {
    logger.info("Gracefully shutting down...");
    // Add any other cleanup code here, if necessary
  },
  finally: () => {
    logger.info("Server shutdown complete.");
  }
});
