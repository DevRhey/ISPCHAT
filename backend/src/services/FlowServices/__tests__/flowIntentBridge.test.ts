import { resolveEdgeByIspIntent } from "../flowIntentBridge";

describe("flowIntentBridge", () => {
  const edges = [
    {
      sourceNodeKey: "menu",
      targetNodeKey: "fin",
      condition: "kw:boleto,pix,1,financeiro",
      label: "Financeiro"
    },
    {
      sourceNodeKey: "menu",
      targetNodeKey: "tec",
      condition: "kw:internet,suporte,2",
      label: "Suporte"
    },
    {
      sourceNodeKey: "menu",
      targetNodeKey: "fallback",
      condition: "default",
      label: "qualquer"
    }
  ];

  it("routes boleto text to financeiro edge", () => {
    const hit = resolveEdgeByIspIntent("quero a segunda via do boleto", edges, "menu");
    expect(hit?.targetNodeKey).toBe("fin");
  });

  it("routes internet text to suporte edge", () => {
    const hit = resolveEdgeByIspIntent("minha internet caiu", edges, "menu");
    expect(hit?.targetNodeKey).toBe("tec");
  });
});
