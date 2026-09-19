const isProd = process.env.NODE_ENV === "production";

const requireSecret = (name: string, fallback: string): string => {
  const value = process.env[name];
  if (value && value.length >= 16) return value;
  if (isProd) {
    throw new Error(
      `${name} deve estar definido com pelo menos 16 caracteres em produção`
    );
  }
  return fallback;
};

export default {
  secret: requireSecret("JWT_SECRET", "dev-only-jwt-secret-change-me"),
  expiresIn: process.env.JWT_EXPIRES_IN || "12h",
  refreshSecret: requireSecret(
    "JWT_REFRESH_SECRET",
    "dev-only-refresh-secret-change-me"
  ),
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d"
};
