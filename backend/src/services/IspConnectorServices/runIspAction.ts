import axios from "axios";
import IspConnector from "../../models/IspConnector";
import { logger } from "../../utils/logger";

export type IspAction =
  | "lookupClient"
  | "getInvoice"
  | "checkCoverage"
  | "openTicket"
  | "custom";

interface ActionParams {
  companyId: number;
  connectorId?: number;
  action: IspAction | string;
  variables: Record<string, any>;
  path?: string;
  method?: string;
  body?: Record<string, any>;
}

const interpolate = (template: string, vars: Record<string, any>): string => {
  return String(template || "").replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key];
    return val === undefined || val === null ? "" : String(val);
  });
};

const buildAuthHeaders = (connector: IspConnector): Record<string, string> => {
  const cfg = connector.parseConfig();
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (connector.token) {
    if (connector.provider === "ixc") {
      headers.Authorization = connector.token.startsWith("Basic ")
        ? connector.token
        : `Basic ${connector.token}`;
      headers.ixcsoft = cfg.ixcsoft || "listar";
    } else if (connector.provider === "sgp") {
      headers.Authorization = `Bearer ${connector.token}`;
      if (cfg.app) headers.app = cfg.app;
    } else if (connector.provider === "hubsoft") {
      headers.Authorization = `Bearer ${connector.token}`;
    } else {
      headers.Authorization = connector.token.includes(" ")
        ? connector.token
        : `Bearer ${connector.token}`;
    }
  }

  if (cfg.headers && typeof cfg.headers === "object") {
    Object.assign(headers, cfg.headers);
  }

  return headers;
};

const resolvePath = (
  connector: IspConnector,
  action: string,
  customPath?: string
): string => {
  if (customPath) return customPath;
  const cfg = connector.parseConfig();
  const actions = cfg.actions || {};
  return actions[action] || actions.custom || "/";
};


/** Mensagem curta pt-BR amigável ao WhatsApp a partir do payload do ERP (sem tokens). */
const formatErpMessage = (
  action: string,
  data: Record<string, any>,
  provider: string
): string => {
  const d = data || {};
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = d[k] ?? d?.data?.[k] ?? d?.cliente?.[k] ?? d?.registros?.[0]?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
    }
    return "";
  };

  if (action === "lookupClient") {
    const name = pick("name", "nome", "razao", "razao_social");
    const contract = pick("contract", "contrato", "contrato_id", "id");
    const status = pick("status", "situacao", "ativo");
    const parts = ["✅ Cliente localizado no ERP (" + provider + ")."];
    if (name) parts.push(`Nome: *${name}*`);
    if (contract) parts.push(`Contrato: *${contract}*`);
    if (status) parts.push(`Status: *${status}*`);
    return parts.join("\n");
  }

  if (action === "getInvoice") {
    const amount = pick("amount", "valor", "valor_total", "total");
    const due = pick("dueDate", "vencimento", "data_vencimento");
    const pix = pick("pixUrl", "pix", "qrcode_pix", "linha_pix");
    const boleto = pick("boletoUrl", "boleto", "link_boleto", "linha_digitavel");
    const parts = [`🧾 Fatura (${provider}):`];
    if (amount) parts.push(`Valor: *R$ ${amount}*`);
    if (due) parts.push(`Vencimento: *${due}*`);
    if (pix) parts.push(`PIX: ${pix}`);
    if (boleto) parts.push(`Boleto: ${boleto}`);
    if (parts.length === 1) parts.push("Consulta OK — detalhes no sistema.");
    return parts.join("\n");
  }

  if (action === "checkCoverage") {
    const covered = d.covered ?? d.cobertura ?? d.viable;
    const cep = pick("cep", "zip");
    if (covered === true || covered === "true" || covered === 1) {
      return `📡 CEP ${cep || ""}: *há cobertura* (${provider}).`.replace("  ", " ");
    }
    if (covered === false || covered === "false" || covered === 0) {
      return `📡 CEP ${cep || ""}: *sem cobertura* no momento (${provider}).`.replace("  ", " ");
    }
    return `📡 Consulta de cobertura concluída (${provider}).`;
  }

  if (action === "openTicket") {
    const osId = pick("osId", "os", "id", "protocolo", "ticket_id");
    return osId
      ? `🛠️ OS aberta: *${osId}* (${provider}).`
      : `🛠️ OS registrada no ERP (${provider}).`;
  }

  // generic: short summary, never dump huge JSON
  const keys = Object.keys(d).filter(k => !/token|password|senha|authorization|secret/i.test(k));
  const preview = keys.slice(0, 4).map(k => {
    const v = d[k];
    const s = typeof v === "object" ? "[…]" : String(v).slice(0, 80);
    return `• ${k}: ${s}`;
  });
  return [`Resposta ERP (${provider}):`, ...preview].join("\n") || `OK (${provider}).`;
};

/**
 * Executa ação no ERP do provedor.
 * Sem credenciais reais, retorna dados mock para testes de fluxo.
 */
const runIspAction = async (
  params: ActionParams
): Promise<{ ok: boolean; data: Record<string, any>; message: string }> => {
  const { companyId, action, variables } = params;

  let connector: IspConnector | null = null;

  if (params.connectorId) {
    connector = await IspConnector.findOne({
      where: { id: params.connectorId, companyId, active: true }
    });
  } else {
    connector = await IspConnector.findOne({
      where: { companyId, active: true },
      order: [["id", "ASC"]]
    });
  }

  if (!connector || !connector.baseUrl) {
    // Mock útil para validar fluxos sem ERP
    const cpf = String(variables.cpf || variables.document || "").replace(/\D/g, "");
    if (action === "lookupClient") {
      return {
        ok: !!cpf,
        data: {
          name: variables.contactName || "Cliente demonstração",
          cpf,
          contract: cpf ? `CTR-${cpf.slice(-4)}` : null,
          status: "ativo"
        },
        message: cpf
          ? `Cliente localizado *(demo)*. Contrato CTR-${cpf.slice(-4)}.`
          : "Informe o CPF para localizar o cliente."
      };
    }
    if (action === "getInvoice") {
      return {
        ok: true,
        data: {
          amount: "149.90",
          dueDate: new Date().toISOString().slice(0, 10),
          pixUrl: `https://exemplo.com/pix/${cpf || "demo"}`,
          boletoUrl: `https://exemplo.com/boleto/${cpf || "demo"}`
        },
        message: `2ª via *(demo)*:\nPIX: https://exemplo.com/pix/${cpf || "demo"}\nBoleto: https://exemplo.com/boleto/${cpf || "demo"}`
      };
    }
    if (action === "checkCoverage") {
      const cep = String(variables.cep || "").replace(/\D/g, "");
      return {
        ok: cep.length >= 8,
        data: { covered: cep.length >= 8, cep },
        message: cep.length >= 8
          ? `CEP ${cep}: há cobertura na região *(demo)*.`
          : "Envie um CEP válido com 8 dígitos."
      };
    }
    if (action === "openTicket") {
      return {
        ok: true,
        data: { osId: `OS-${Date.now()}` },
        message: `OS aberta *(demo)*: OS-${Date.now()}`
      };
    }
    return {
      ok: false,
      data: {},
      message: "Nenhum conector ISP configurado. Cadastre em Conectores ISP."
    };
  }

  try {
    const path = resolvePath(connector, action, params.path);
    const url = `${connector.baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
    const method = (params.method || "POST").toUpperCase();
    const headers = buildAuthHeaders(connector);

    let body: any = params.body || { ...variables, action };
    if (typeof body === "object") {
      body = JSON.parse(interpolate(JSON.stringify(body), variables));
    }

    // IXC tipicamente usa form-urlencoded + qtype
    if (connector.provider === "ixc" && action === "lookupClient") {
      const cpf = String(variables.cpf || "").replace(/\D/g, "");
      body = {
        qtype: "cliente.cnpj_cpf",
        query: cpf,
        oper: "=",
        page: "1",
        rp: "1"
      };
    }

    const { data } = await axios.request({
      url,
      method,
      headers,
      data: body,
      timeout: 25000
    });

    const payload = typeof data === "object" && data !== null ? data : { raw: data };
    return {
      ok: true,
      data: payload as Record<string, any>,
      message:
        typeof data === "string"
          ? data.slice(0, 500)
          : formatErpMessage(String(action), payload as Record<string, any>, connector.provider)
    };
  } catch (err: any) {
    logger.error({ err: err?.message }, `IspConnector action ${action} failed`);
    return {
      ok: false,
      data: {},
      message: `Falha ao consultar ERP (${connector.provider}): ${err?.message || "erro"}`
    };
  }
};

export default runIspAction;
