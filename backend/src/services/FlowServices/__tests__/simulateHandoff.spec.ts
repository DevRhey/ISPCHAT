/// <reference types="jest" />

import {
  handoffReplyHasProtocol,
  lastBotReply,
  HANDOFF_SCENARIOS
} from "../simulateHandoffChecks";

describe("simulate handoff protocol checks", () => {
  it("detects ISP-123 protocol pattern", () => {
    expect(
      handoffReplyHasProtocol(
        "Pode deixar! Protocolo: ISP-42\nAguarde só um pouquinho."
      )
    ).toBe(true);
  });

  it("detects Protocolo: label", () => {
    expect(handoffReplyHasProtocol("*Protocolo:* ISP-99")).toBe(true);
  });

  it("rejects transfer without protocol", () => {
    expect(handoffReplyHasProtocol("Transferindo para o financeiro…")).toBe(
      false
    );
  });

  it("lastBotReply returns final bot message", () => {
    const turns = [
      { from: "client" as const, body: "oi", at: "" },
      { from: "bot" as const, body: "Olá", at: "" },
      { from: "client" as const, body: "5", at: "" },
      {
        from: "bot" as const,
        body: "Protocolo: ISP-7",
        at: ""
      }
    ];
    expect(lastBotReply(turns)).toBe("Protocolo: ISP-7");
  });

  it("lists handoff scenarios including humano", () => {
    expect(HANDOFF_SCENARIOS).toContain("humano");
    expect(HANDOFF_SCENARIOS).toContain("fin_negociar");
  });
});
