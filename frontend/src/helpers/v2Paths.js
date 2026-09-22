/**
 * Central path helpers for the unified Quark V2 frontend.
 * Legacy Whaticket routes redirect through resolveLegacyPath / LEGACY_TO_V2.
 */

export const V2_CHAT_BASE = "/v2/chat";
export const V2_CHAT_ANDAMENTO = `${V2_CHAT_BASE}/andamento`;
export const V2_CHAT_ESPERA = `${V2_CHAT_BASE}/espera`;
export const V2_CHAT_AUTOMACAO = `${V2_CHAT_BASE}/automacao`;
export const V2_CHAT_DASHBOARD = `${V2_CHAT_BASE}/dashboard`;
export const V2_CHAT_CLIENTES = `${V2_CHAT_BASE}/clientes`;

/** Prefer uuid; fall back to numeric id string. */
export const ticketRef = (ticket) => {
  if (!ticket) return null;
  if (typeof ticket === "string" || typeof ticket === "number") {
    return String(ticket);
  }
  return ticket.uuid || (ticket.id != null ? String(ticket.id) : null);
};

/**
 * Build inbox conversation path.
 * @param {string|number|object|null} ref - ticket uuid/id or ticket object
 * @param {'andamento'|'espera'|'automacao'} queue
 */
export const v2TicketPath = (ref = null, queue = "andamento") => {
  const base = `${V2_CHAT_BASE}/${queue}`;
  const id = ticketRef(ref);
  return id ? `${base}/${id}` : base;
};

export const v2TicketsListPath = (queue = "andamento") => v2TicketPath(null, queue);

export const v2ChatPath = () => V2_CHAT_ANDAMENTO;
export const v2ChatDashboardPath = () => V2_CHAT_DASHBOARD;

export const v2FlowsListPath = () => "/flows";
export const v2FlowEditorPath = (flowId) =>
  flowId != null && flowId !== "" ? `/flows/editor/${flowId}` : "/flows/editor";

/** Exact legacy path → V2 equivalent (no dynamic segments). */
export const LEGACY_TO_V2 = {
  "/tickets": V2_CHAT_ANDAMENTO,
  "/app": V2_CHAT_DASHBOARD,
  "/dashboard": V2_CHAT_DASHBOARD,
  "/home": V2_CHAT_DASHBOARD,
};

/**
 * Resolve a legacy pathname (+ optional route params) to a V2 path.
 * Returns null when no mapping exists.
 */
export const resolveLegacyPath = (pathname, params = {}) => {
  if (!pathname) return null;

  const normalized = pathname.replace(/\/+$/, "") || "/";

  if (normalized === "/tickets" || normalized.startsWith("/tickets/")) {
    const ticketId = params.ticketId || normalized.replace(/^\/tickets\/?/, "") || null;
    return v2TicketPath(ticketId || null, "andamento");
  }

  if (LEGACY_TO_V2[normalized]) {
    return LEGACY_TO_V2[normalized];
  }

  return null;
};

export default {
  V2_CHAT_BASE,
  V2_CHAT_ANDAMENTO,
  V2_CHAT_ESPERA,
  V2_CHAT_AUTOMACAO,
  V2_CHAT_DASHBOARD,
  V2_CHAT_CLIENTES,
  ticketRef,
  v2TicketPath,
  v2TicketsListPath,
  v2ChatPath,
  v2ChatDashboardPath,
  v2FlowsListPath,
  v2FlowEditorPath,
  LEGACY_TO_V2,
  resolveLegacyPath,
};
