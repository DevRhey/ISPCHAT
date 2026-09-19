import { Response } from "express";

const isTunnelOrHttps = (): boolean => {
  const front = process.env.FRONTEND_URL || "";
  const back = process.env.BACKEND_URL || "";
  return (
    process.env.COOKIE_SECURE === "true" ||
    /^https:/i.test(front) ||
    /^https:/i.test(back) ||
    /\.trycloudflare\.com/i.test(front) ||
    /\.trycloudflare\.com/i.test(back)
  );
};

export const SendRefreshToken = (res: Response, token: string): void => {
  const secure = isTunnelOrHttps();

  res.cookie("jrt", token, {
    httpOnly: true,
    // Cross-site (front e API em subdomínios trycloudflare diferentes) exige None+Secure
    sameSite: secure ? "none" : "lax",
    secure,
    path: "/"
  });
};
