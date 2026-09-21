/** Extrai CPF (11) ou CNPJ (14) — aceita formatação leve. */
export const parseDocumentDigits = (body: string): string => {
  const digits = String(body || "").replace(/\D/g, "");
  if (digits.length === 11 || digits.length === 14) return digits;
  return "";
};

export const bodyMatchesDocument = (body: string): boolean =>
  parseDocumentDigits(body).length > 0;
