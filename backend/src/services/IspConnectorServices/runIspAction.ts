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
          ? `Cliente localizado (modo demo). Contrato CTR-${cpf.slice(-4)}.`
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
        message: `2ª via (demo):\nPIX: https://exemplo.com/pix/${cpf || "demo"}\nBoleto: https://exemplo.com/boleto/${cpf || "demo"}`
      };
    }
    if (action === "checkCoverage") {
      const cep = String(variables.cep || "").replace(/\D/g, "");
      return {
        ok: cep.length >= 8,
        data: { covered: cep.length >= 8, cep },
        message: cep.length >= 8
          ? `CEP ${cep}: há cobertura na região (demo).`
          : "Envie um CEP válido com 8 dígitos."
      };
    }
    if (action === "openTicket") {
      return {
        ok: true,
        data: { osId: `OS-${Date.now()}` },
        message: `OS aberta (demo): OS-${Date.now()}`
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

    return {
      ok: true,
      data: typeof data === "object" ? data : { raw: data },
      message: typeof data === "string" ? data : JSON.stringify(data).slice(0, 500)
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
