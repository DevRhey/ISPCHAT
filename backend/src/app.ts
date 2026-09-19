import * as Sentry from "@sentry/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import "express-async-errors";
import "reflect-metadata";
import "./bootstrap";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";

import bodyParser from 'body-parser';
import uploadConfig from "./config/upload";
import "./database";
import AppError from "./errors/AppError";
import { messageQueue, sendScheduledMessages } from "./queues";
import routes from "./routes";
import { logger } from "./utils/logger";

Sentry.init({ dsn: process.env.SENTRY_DSN });

const app = express();

app.set("trust proxy", "loopback");

app.use((req, res, next) => {
  req.id = uuidv4();
  next();
});

app.set("queues", {
  messageQueue,
  sendScheduledMessages
});

app.use(bodyParser.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "*"]
    }
  }
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições deste IP, tente novamente após 15 minutos',
  skip: (req) => {
    return req.ip === '127.0.0.1' || req.ip === '::1';
  }
});

app.use('/auth', apiLimiter);
app.use('/forgetpassword', apiLimiter);
app.use('/resetpasswords', apiLimiter);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000"
].filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Permite requests sem Origin (curl/health), locais e Cloudflare quick tunnels
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /\.trycloudflare\.com$/i.test(origin)
      ) {
        // Com credentials, refletir o Origin explícito (não usar wildcard)
        return callback(null, origin || true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "x-refresh-token"
    ]
  })
);

app.use(cookieParser());
app.use(express.json());

// Healthcheck leve (Docker / watchdog) — sem DB para não falhar em blip
app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    uptime: process.uptime(),
    ts: Date.now()
  });
});

// Readiness: DB + Redis (quando disponíveis)
app.get("/ready", async (_req, res) => {
  const checks: Record<string, string> = { api: "ok" };
  let ready = true;

  try {
    const sequelize = (await import("./database")).default;
    await sequelize.authenticate();
    checks.database = "ok";
  } catch {
    checks.database = "fail";
    ready = false;
  }

  try {
    const Redis = (await import("ioredis")).default;
    const redis = new Redis(process.env.REDIS_URI || process.env.REDIS_URL || "redis://127.0.0.1:6379", {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true
    });
    await redis.connect();
    const pong = await redis.ping();
    checks.redis = pong === "PONG" ? "ok" : "fail";
    await redis.quit();
    if (checks.redis !== "ok") ready = false;
  } catch {
    checks.redis = "fail";
    ready = false;
  }

  res.status(ready ? 200 : 503).json({
    ok: ready,
    checks,
    ts: Date.now()
  });
});

app.use(Sentry.Handlers.requestHandler());
app.use("/public", express.static(uploadConfig.directory));
app.use(routes);

app.use(Sentry.Handlers.errorHandler());

app.use(async (err: Error, req: Request, res: Response, _: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn(err);
    return res.status(err.statusCode).json({ error: err.message });
  }

  logger.error(err);
  return res.status(500).json({ error: "Internal server error" });
});

export default app;
