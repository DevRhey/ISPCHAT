import {
  ticketRef,
  v2TicketPath,
  v2TicketsListPath,
  v2ChatPath,
  v2ChatDashboardPath,
  v2FlowsListPath,
  v2FlowEditorPath,
  LEGACY_TO_V2,
  resolveLegacyPath,
  V2_CHAT_ANDAMENTO,
  V2_CHAT_DASHBOARD,
} from "./v2Paths";

describe("v2Paths", () => {
  test("ticketRef prefers uuid", () => {
    expect(ticketRef({ id: 1, uuid: "abc-123" })).toBe("abc-123");
    expect(ticketRef({ id: 42 })).toBe("42");
    expect(ticketRef("xyz")).toBe("xyz");
    expect(ticketRef(null)).toBeNull();
  });

  test("v2TicketPath builds andamento paths", () => {
    expect(v2TicketPath()).toBe(V2_CHAT_ANDAMENTO);
    expect(v2TicketPath("abc-123")).toBe(`${V2_CHAT_ANDAMENTO}/abc-123`);
    expect(v2TicketPath({ uuid: "u-1" }, "espera")).toBe("/v2/chat/espera/u-1");
  });

  test("v2TicketsListPath", () => {
    expect(v2TicketsListPath()).toBe(V2_CHAT_ANDAMENTO);
    expect(v2TicketsListPath("automacao")).toBe("/v2/chat/automacao");
  });

  test("v2ChatPath and dashboard", () => {
    expect(v2ChatPath()).toBe(V2_CHAT_ANDAMENTO);
    expect(v2ChatDashboardPath()).toBe(V2_CHAT_DASHBOARD);
  });

  test("flow editor helpers as functions", () => {
    expect(v2FlowsListPath()).toBe("/flows");
    expect(v2FlowEditorPath()).toBe("/flows/editor");
    expect(v2FlowEditorPath(7)).toBe("/flows/editor/7");
  });

  test("LEGACY_TO_V2 maps app and dashboard", () => {
    expect(LEGACY_TO_V2["/app"]).toBe(V2_CHAT_DASHBOARD);
    expect(LEGACY_TO_V2["/tickets"]).toBe(V2_CHAT_ANDAMENTO);
  });

  test("resolveLegacyPath for tickets with and without id", () => {
    expect(resolveLegacyPath("/tickets")).toBe(V2_CHAT_ANDAMENTO);
    expect(resolveLegacyPath("/tickets/abc")).toBe(`${V2_CHAT_ANDAMENTO}/abc`);
    expect(resolveLegacyPath("/tickets/:ticketId", { ticketId: "xyz" })).toBe(
      `${V2_CHAT_ANDAMENTO}/xyz`
    );
    expect(resolveLegacyPath("/app")).toBe(V2_CHAT_DASHBOARD);
    expect(resolveLegacyPath("/unknown")).toBeNull();
  });
});
