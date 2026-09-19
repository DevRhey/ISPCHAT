import express from "express";
import isAuth from "../middleware/isAuth";
import auditLog from "../middleware/auditLog";
import * as SubscriptionController from "../controllers/SubscriptionController";

const subscriptionRoutes = express.Router();

subscriptionRoutes.post(
  "/subscription",
  isAuth,
  auditLog("subscription.create"),
  SubscriptionController.createSubscription
);
subscriptionRoutes.post(
  "/subscription/create/webhook",
  isAuth,
  auditLog("subscription.webhook_config"),
  SubscriptionController.createWebhook
);
subscriptionRoutes.post(
  "/subscription/webhook/:type?",
  SubscriptionController.webhook
);

export default subscriptionRoutes;
