import { v4 as uuid } from "uuid";
import { Request, Response } from "express";
import SendMail from "../services/ForgotPassWordServices/SendMail";
import ResetPassword from "../services/ResetPasswordService/ResetPassword";

export const store = async (req: Request, res: Response): Promise<Response> => {
  const email = (req.body?.email || req.params?.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "E-mail inválido" });
  }

  const TokenSenha = uuid();
  const forgotPassword = await SendMail(email, TokenSenha);

  if (forgotPassword.status === 200) {
    return res.status(200).json({ message: "E-mail enviado com sucesso" });
  }
  if (forgotPassword.status === 404) {
    return res.status(404).json({ error: forgotPassword.message });
  }
  return res
    .status(forgotPassword.status || 500)
    .json({ error: forgotPassword.message, details: forgotPassword.error });
};

export const resetPasswords = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const email = (
    req.body?.email ||
    req.params?.email ||
    ""
  )
    .trim()
    .toLowerCase();
  const token = String(req.body?.token || req.params?.token || "").trim();
  const password = String(req.body?.password || req.params?.password || "");

  if (!email || !token || password.length < 6) {
    return res.status(400).json({
      error: "Informe e-mail, token e senha (mín. 6 caracteres)"
    });
  }

  const resetPassword = await ResetPassword(email, token, password);
  if (resetPassword?.status === 200) {
    return res.status(200).json({ message: "Senha redefinida com sucesso" });
  }
  return res
    .status(resetPassword?.status || 404)
    .json({ error: resetPassword?.message || "Verifique o Token informado" });
};
