const fs = require("fs");

// --- runIspAction demo gate ---
{
  const path = "backend/src/services/IspConnectorServices/runIspAction.ts";
  let s = fs.readFileSync(path, "utf8");
  if (!s.includes("isIspDemoAllowed")) {
    s = s.replace(
      "const runIspAction = async (",
      `const isIspDemoAllowed = (): boolean => {
  if (process.env.ALLOW_ISP_DEMO === "true") return true;
  if (process.env.ALLOW_ISP_DEMO === "false") return false;
  return process.env.NODE_ENV !== "production";
};

const demoBlockedResponse = (): { ok: boolean; data: Record<string, any>; message: string } => ({
  ok: false,
  data: {},
  message:
    "Conector ISP não configurado. Em produção o modo demo está bloqueado. Cadastre IXC/SGP/HubSoft em Conectores ISP ou defina ALLOW_ISP_DEMO=true apenas em homologação."
});

const runIspAction = async (`
    );
    s = s.replace(
      /if \(!connector \|\| !connector\.baseUrl\) \{\r?\n\s*\/\/ Mock[^\n]*\r?\n/,
      `if (!connector || !connector.baseUrl) {
    if (!isIspDemoAllowed()) {
      return demoBlockedResponse();
    }
    // Mock útil para validar fluxos sem ERP (somente com ALLOW_ISP_DEMO / non-production)
`
    );
    fs.writeFileSync(path, s);
    console.log("OK runIspAction");
  } else console.log("SKIP runIspAction");
}

// --- server production secrets ---
{
  const path = "backend/src/server.ts";
  let s = fs.readFileSync(path, "utf8");
  if (!s.includes("assertProductionSecrets")) {
    const helper = `const assertProductionSecrets = () => {
  if (process.env.NODE_ENV !== "production") return;
  const weak = (v?: string) =>
    !v ||
    v.length < 32 ||
    /change.?me|secret|123456|password/i.test(v);
  if (weak(process.env.JWT_SECRET) || weak(process.env.JWT_REFRESH_SECRET)) {
    logger.error(
      "JWT_SECRET/JWT_REFRESH_SECRET fracos ou ausentes em produção. Defina secrets aleatórios (>=32 chars) e reinicie."
    );
    process.exit(1);
  }
  if (process.env.ALLOW_ISP_DEMO === "true") {
    logger.warn(
      "ALLOW_ISP_DEMO=true em NODE_ENV=production — dados fictícios de ERP podem vazar para clientes."
    );
  }
};

assertProductionSecrets();

`;
    s = s.replace("const server = app.listen", helper + "const server = app.listen");
    fs.writeFileSync(path, s);
    console.log("OK server.ts");
  } else console.log("SKIP server.ts");
}
