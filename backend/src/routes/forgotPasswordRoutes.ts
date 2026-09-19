import express from "express";
import * as ForgotController from "../controllers/ForgotController";

const forgotsRoutes = express.Router();

// Preferir body (evita senha/token na URL); manter path legado por compatibilidade
forgotsRoutes.post("/forgetpassword", ForgotController.store);
forgotsRoutes.post("/forgetpassword/:email", ForgotController.store);
forgotsRoutes.post("/resetpasswords", ForgotController.resetPasswords);
forgotsRoutes.post(
  "/resetpasswords/:email/:token/:password",
  ForgotController.resetPasswords
);

export default forgotsRoutes;
