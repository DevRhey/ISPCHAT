export type SimTurn = {
  from: "client" | "bot";
  body: string;
  at: string;
};

/** Cenários que terminam em transferência humana (devem citar protocolo). */
export const HANDOFF_SCENARIOS = [
  "fin_negociar",
  "tec_visita",
  "com_viabilidade",
  "com_planos",
  "com_instalacao",
  "svc_mudanca",
  "svc_retencao",
  "svc_anatel",
  "humano"
] as const;

export const lastBotReply = (turns: SimTurn[]): string => {
  for (let i = turns.length - 1; i >= 0; i -= 1) {
    if (turns[i].from === "bot") return turns[i].body;
  }
  return "";
};

/** Verifica se texto de handoff contém identificador de protocolo (ISP-123 ou "Protocolo:"). */
export const handoffReplyHasProtocol = (botText: string): boolean => {
  const text = String(botText || "");
  return (
    /\bISP-\d+\b/i.test(text) ||
    /protocolo\s*:\s*\S+/i.test(text)
  );
};
