/** Converte modelo API (FlowNodes/FlowEdges) ↔ React Flow */

export const apiToRf = (apiNodes = [], apiEdges = []) => {
  const nodes = apiNodes.map((n, i) => ({
    id: n.nodeKey,
    type: "flowNode",
    position: {
      x: Number(n.positionX) || 80 + (i % 4) * 220,
      y: Number(n.positionY) || 60 + Math.floor(i / 4) * 120
    },
    data: {
      nodeKey: n.nodeKey,
      nodeType: n.type,
      title: n.title || "",
      message: n.message || "",
      config:
        typeof n.config === "string"
          ? (() => {
              try {
                return JSON.parse(n.config || "{}");
              } catch {
                return {};
              }
            })()
          : n.config || {}
    }
  }));

  const edges = apiEdges.map((e, i) => {
    const condition = e.condition || "";
    const parsed = conditionToConnection(condition);
    let stroke = "#78909c";
    let animated = Boolean(condition);
    let label = e.label || condition || "";
    if (parsed.type === "auto") {
      stroke = "#26a69a";
      animated = true;
      label = e.label || "⚡ auto";
    } else if (parsed.type === "keyword") {
      stroke = "#7e57c2";
      animated = true;
      label = e.label || `kw: ${parsed.keywords}`;
    } else if (parsed.type === "default" || !condition) {
      stroke = "#90a4ae";
      animated = false;
      label = e.label || (condition === "default" ? "qualquer" : label);
    }
    return {
      id: `e-${e.sourceNodeKey}-${e.targetNodeKey}-${condition || i}`,
      source: e.sourceNodeKey,
      target: e.targetNodeKey,
      label,
      data: { condition, label },
      animated,
      style: { stroke, strokeWidth: 2 },
      labelStyle: { fill: "#546e7a", fontSize: 10, fontWeight: 600 },
      markerEnd: { type: "arrowclosed", color: stroke }
    };
  });

  return { nodes, edges };
};

export const rfToApi = (rfNodes = [], rfEdges = []) => {
  const nodes = rfNodes.map(n => ({
    nodeKey: n.data?.nodeKey || n.id,
    type: n.data?.nodeType || "message",
    title: n.data?.title || "",
    message: n.data?.message || "",
    config: n.data?.config || {},
    positionX: Math.round(n.position?.x || 0),
    positionY: Math.round(n.position?.y || 0)
  }));

  const edges = rfEdges.map(e => ({
    sourceNodeKey: e.source,
    targetNodeKey: e.target,
    condition: e.data?.condition || (typeof e.label === "string" && /^\d+$|^true$|^false$|^default$/.test(e.label) ? e.label : "") || "",
    label: e.data?.label || (typeof e.label === "string" ? e.label : "") || ""
  }));

  return { nodes, edges };
};

export const newNodeKey = (type, existingKeys = []) => {
  const base = type || "node";
  let i = 1;
  let key = `${base}_${i}`;
  const set = new Set(existingKeys);
  while (set.has(key)) {
    i += 1;
    key = `${base}_${i}`;
  }
  return key;
};

export const defaultConfigForType = type => {
  switch (type) {
    case "settings":
      return {
        triggerKeywords: ["oi", "olá", "menu"],
        timeoutMinutes: 30,
        fallbackMessage: "Não entendi. Digite *menu* ou *#sair*."
      };
    case "menu":
      return {
        options: [
          { option: "1", label: "Opção 1", keywords: ["1"] },
          { option: "2", label: "Opção 2", keywords: ["2"] },
          { option: "0", label: "Voltar", keywords: ["0", "voltar", "menu"] }
        ],
        backTo: "menu_main"
      };
    case "input":
      return { variable: "input" };
    case "isp_action":
      return { action: "lookupClient" };
    case "condition":
      return { field: "input", operator: "eq", value: "" };
    case "http":
      return { method: "GET", url: "", storeAs: "httpResult" };
    case "transfer":
      return { status: "pending", queueId: null };
    default:
      return {};
  }
};

/** Serializa tipo de conexão Z-PRO → condition no banco */
export const connectionToCondition = (type, keywords = "") => {
  if (type === "auto") return "auto";
  if (type === "default") return "default";
  if (type === "keyword") {
    const raw = String(keywords || "")
      .split(/[,|;]/)
      .map(s => s.trim())
      .filter(Boolean)
      .join(",");
    return raw ? `kw:${raw}` : "kw:";
  }
  return String(keywords || "").trim();
};

export const conditionToConnection = condition => {
  const c = String(condition || "").trim();
  if (!c || c === "default") return { type: "default", keywords: "" };
  if (c === "auto" || c === "__auto__") return { type: "auto", keywords: "" };
  if (c.startsWith("kw:") || c.startsWith("keyword:")) {
    return {
      type: "keyword",
      keywords: c.replace(/^kw:/i, "").replace(/^keyword:/i, "")
    };
  }
  return { type: "exact", keywords: c };
};
