import nodemailer from "nodemailer";
import { config } from "dotenv";
import User from "../../models/User";
import { logger } from "../../utils/logger";

config();

const SendMail = async (email: string, tokenSenha: string) => {
  try {
    if (!email || !tokenSenha) {
      return { status: 400, message: "E-mail inválido" };
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Resposta genérica evita enumeração de e-mails
      return { status: 200, message: "E-mail enviado com sucesso" };
    }

    await user.update({ resetPassword: tokenSenha });

    const logo = `${process.env.BACKEND_URL}/public/logotipos/login.png`;
    const companyName = process.env.COMPANY_NAME || "ISPCHAT";
    const urlSmtp = process.env.MAIL_HOST;
    const port = process.env.MAIL_PORT;
    const userSmtp = process.env.MAIL_USER;
    const passwordSmtp = process.env.MAIL_PASS;
    const fromEmail = process.env.MAIL_FROM;
    const useSecure = process.env.MAIL_SECURE === "true";

    if (!urlSmtp || !fromEmail) {
      logger.warn("SMTP não configurado — token de reset gerado sem e-mail");
      return { status: 200, message: "E-mail enviado com sucesso" };
    }

    const transporter = nodemailer.createTransport({
      host: urlSmtp,
      port: Number(port),
      secure: useSecure,
      auth: { user: userSmtp, pass: passwordSmtp }
    });

    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: `Redefinição de Senha - ${companyName}`,
      html: `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><title>Redefinição de Senha</title></head>
<body style="font-family:sans-serif;background:#F8F9FD;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;">
    <img src="${logo}" alt="${companyName}" style="width:160px;display:block;margin:0 auto 20px;" />
    <h1 style="text-align:center;color:#0F172A;">Redefinição de senha</h1>
    <p style="text-align:center;color:#334155;">Use o código abaixo para redefinir sua senha:</p>
    <div style="font-size:28px;letter-spacing:4px;font-weight:bold;background:#F1F5F9;padding:16px;text-align:center;border-radius:8px;color:#0F172A;">
      ${tokenSenha}
    </div>
    <p style="text-align:center;color:#64748B;font-size:13px;margin-top:24px;">
      Se você não solicitou, ignore este e-mail.
    </p>
  </div>
</body>
</html>`
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info("E-mail enviado: " + info.response);
    return { status: 200, message: "E-mail enviado com sucesso" };
  } catch (error: any) {
    logger.error("Erro ao enviar e-mail:", error?.message || error);
    if (error?.responseCode === 535) {
      return {
        status: 401,
        message: "Usuário ou senha SMTP inválidos",
        error: error.message
      };
    }
    return {
      status: 500,
      message: "Erro ao enviar e-mail",
      error: error?.message || error
    };
  }
};

export default SendMail;
