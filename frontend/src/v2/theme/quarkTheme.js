export const quarkColors = {
  primary: "#3499d9",
  primaryDark: "#3082b5",
  surface: "#ffffff",
  pageBlue: "#eaf2fb",
  text: "#262626",
  textSecondary: "#374151",
  muted: "#6b7280",
  mutedLight: "#9ca3af",
  border: "#e5e7eb",
  success: "#22c55e",
  danger: "#ef4444",
  accentPurple: "#7b00b5",
  recurrenceLow: "#86efac",
  recurrenceHigh: "#fca5a5",
};

export const quarkLayout = {
  railWidth: 70,
  inboxWidth: 350,
  contextRailWidth: 64,
  contextPanelWidth: 338,
};

export const QUEUE_ROUTES = {
  andamento: { path: "/v2/chat/andamento", status: "open", label: "Andamento" },
  espera: { path: "/v2/chat/espera", status: "pending", label: "Espera" },
  automacao: { path: "/v2/chat/automacao", status: "open", label: "Automação", chatbot: true },
};

export const applyQuarkTheme = (primaryColor) => {
  if (primaryColor) {
    document.documentElement.style.setProperty("--chat-primary", primaryColor);
  }
};

export default quarkColors;
