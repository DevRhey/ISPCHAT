import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Audit log estruturado para ações admin/billing sensíveis.
 * Emite JSON no logger (compatível com agregadores / Sentry breadcrumbs).
 */
const auditLog = (action: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userId = req.user?.id;
    const companyId = req.user?.companyId;
    logger.info(
      {
        audit: true,
        action,
        userId,
        companyId,
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        requestId: (req as any).id
      },
      `[AUDIT] ${action}`
    );
    next();
  };
};

export default auditLog;
