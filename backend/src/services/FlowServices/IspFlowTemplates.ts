import { CreateFlowService } from "./FlowCRUDService";

/** Catálogo gigante de templates ISP para o FlowEngine nativo + ISPCHAT */
export const buildIspTemplates = (companyId: number) => {
  const menuLangGraphProxy = {
    name: "ISPCHAT — Menu LangGraph (recomendado)",
    description:
      "Delega ao motor LangGraph ISPCHAT (todas as intenções). Preferir integração type=langgraph na fila.",
    active: true,
    companyId,
    entryNodeKey: "start",
    nodes: [
      { nodeKey: "start", type: "start", title: "Início" },
      {
        nodeKey: "lg",
        type: "message",
        message:
          "Motor LangGraph ativo via integração da fila. Se estiver vendo esta mensagem, vincule a integração *langgraph* na fila ou digite opções do menu clássico."
      },
      {
        nodeKey: "menu",
        type: "menu",
        message: "Menu clássico (fallback):",
        config: {
          options: [
            { option: "1", label: "2ª via" },
            { option: "2", label: "Sem internet" },
            { option: "3", label: "Viabilidade" },
            { option: "4", label: "Humano" }
          ]
        }
      },
      {
        nodeKey: "invoice",
        type: "isp_action",
        config: { action: "getInvoice" }
      },
      {
        nodeKey: "ask_cpf",
        type: "input",
        message: "CPF:",
        config: { variable: "cpf" }
      },
      {
        nodeKey: "triagem",
        type: "menu",
        message: "Luz da ONU:",
        config: {
          options: [
            { option: "1", label: "Verde" },
            { option: "2", label: "Vermelha/apagada" }
          ]
        }
      },
      {
        nodeKey: "ask_cep",
        type: "input",
        message: "CEP:",
        config: { variable: "cep" }
      },
      {
        nodeKey: "coverage",
        type: "isp_action",
        config: { action: "checkCoverage" }
      },
      {
        nodeKey: "humano",
        type: "transfer",
        message: "Transferindo...",
        config: { queueId: null, status: "pending" }
      },
      { nodeKey: "end", type: "end", message: "Obrigado!" }
    ],
    edges: [
      { sourceNodeKey: "start", targetNodeKey: "lg" },
      { sourceNodeKey: "lg", targetNodeKey: "menu" },
      { sourceNodeKey: "menu", targetNodeKey: "ask_cpf", condition: "1" },
      { sourceNodeKey: "menu", targetNodeKey: "triagem", condition: "2" },
      { sourceNodeKey: "menu", targetNodeKey: "ask_cep", condition: "3" },
      { sourceNodeKey: "menu", targetNodeKey: "humano", condition: "4" },
      { sourceNodeKey: "ask_cpf", targetNodeKey: "invoice" },
      { sourceNodeKey: "invoice", targetNodeKey: "end" },
      { sourceNodeKey: "triagem", targetNodeKey: "humano", condition: "1" },
      { sourceNodeKey: "triagem", targetNodeKey: "humano", condition: "2" },
      { sourceNodeKey: "ask_cep", targetNodeKey: "coverage" },
      { sourceNodeKey: "coverage", targetNodeKey: "humano", condition: "true" },
      { sourceNodeKey: "coverage", targetNodeKey: "end", condition: "false" }
    ]
  };

  const mkLinear = (
    name: string,
    description: string,
    steps: Array<{ key: string; type: string; message?: string; config?: any }>
  ) => {
    const nodes = [
      { nodeKey: "start", type: "start", title: "Início" },
      ...steps.map(s => ({
        nodeKey: s.key,
        type: s.type,
        message: s.message || "",
        config: s.config || {}
      })),
      { nodeKey: "end", type: "end", message: "Digite 0 no WhatsApp se o menu LangGraph estiver ativo, ou #sair." }
    ];
    const edges = [
      { sourceNodeKey: "start", targetNodeKey: steps[0].key },
      ...steps.slice(0, -1).map((s, i) => ({
        sourceNodeKey: s.key,
        targetNodeKey: steps[i + 1].key
      })),
      { sourceNodeKey: steps[steps.length - 1].key, targetNodeKey: "end" }
    ];
    return { name, description, active: true, companyId, entryNodeKey: "start", nodes, edges };
  };

  return [
    menuLangGraphProxy,
    mkLinear("ISP — 2ª via / boleto", "CPF → ERP → boleto", [
      { key: "ask", type: "input", message: "CPF do titular:", config: { variable: "cpf" } },
      { key: "lookup", type: "isp_action", config: { action: "lookupClient" } },
      { key: "inv", type: "isp_action", config: { action: "getInvoice" } }
    ]),
    mkLinear("ISP — PIX", "CPF → link PIX", [
      { key: "ask", type: "input", message: "CPF:", config: { variable: "cpf" } },
      { key: "inv", type: "isp_action", config: { action: "getInvoice" } }
    ]),
    mkLinear("ISP — Negociação", "Triagem dívida", [
      {
        key: "msg",
        type: "message",
        message: "Vamos negociar sua pendência. Em seguida um atendente financeiro assume."
      },
      {
        key: "tr",
        type: "transfer",
        message: "Transferindo ao financeiro...",
        config: { status: "pending" }
      }
    ]),
    mkLinear("ISP — Sem internet", "Triagem ONU + OS", [
      {
        key: "menu",
        type: "menu",
        message: "Luz da ONU:",
        config: {
          options: [
            { option: "1", label: "Verde" },
            { option: "2", label: "Vermelha" },
            { option: "3", label: "Apagada" }
          ]
        }
      },
      {
        key: "reboot",
        type: "message",
        message: "Reinicie a ONU por 30s e aguarde 2 minutos."
      },
      { key: "os", type: "isp_action", config: { action: "openTicket" } },
      {
        key: "tr",
        type: "transfer",
        message: "Suporte técnico...",
        config: { status: "pending" }
      }
    ]),
    mkLinear("ISP — Internet lenta", "Checklist velocidade", [
      {
        key: "msg",
        type: "message",
        message: "1) Reinicie roteador 2) Teste no cabo 3) Speedtest. Se persistir, abriremos OS."
      },
      { key: "os", type: "isp_action", config: { action: "openTicket" } }
    ]),
    mkLinear("ISP — Abrir OS", "Abertura de ordem de serviço", [
      {
        key: "ask",
        type: "input",
        message: "Descreva o problema:",
        config: { variable: "reason" }
      },
      { key: "os", type: "isp_action", config: { action: "openTicket" } }
    ]),
    mkLinear("ISP — Viabilidade CEP", "Cobertura por CEP", [
      { key: "ask", type: "input", message: "CEP:", config: { variable: "cep" } },
      { key: "check", type: "isp_action", config: { action: "checkCoverage" } },
      {
        key: "tr",
        type: "transfer",
        message: "Comercial...",
        config: { status: "pending" }
      }
    ]),
    mkLinear("ISP — Novo plano / comercial", "Captação", [
      {
        key: "msg",
        type: "message",
        message: "Planos: 300M R$99 | 500M R$129 | 1G R$169. Vou te passar ao comercial."
      },
      {
        key: "tr",
        type: "transfer",
        message: "Comercial...",
        config: { status: "pending" }
      }
    ]),
    mkLinear("ISP — Upgrade de plano", "Upsell", [
      {
        key: "msg",
        type: "message",
        message: "Solicitação de upgrade registrada. Comercial confirma valores."
      },
      {
        key: "tr",
        type: "transfer",
        message: "Comercial...",
        config: { status: "pending" }
      }
    ]),
    mkLinear("ISP — Agendar instalação", "Agenda", [
      {
        key: "msg",
        type: "message",
        message: "Horários: seg–sáb 08h–18h. Comercial confirma a data."
      },
      {
        key: "tr",
        type: "transfer",
        message: "Comercial...",
        config: { status: "pending" }
      }
    ]),
    mkLinear("ISP — Mudança de endereço", "Remanejamento", [
      { key: "ask", type: "input", message: "Novo CEP:", config: { variable: "cep" } },
      { key: "check", type: "isp_action", config: { action: "checkCoverage" } },
      { key: "os", type: "isp_action", config: { action: "openTicket" } }
    ]),
    mkLinear("ISP — Senha Wi-Fi", "Suporte cadastral", [
      {
        key: "msg",
        type: "message",
        message: "Por segurança a senha é alterada após validação do titular."
      },
      {
        key: "tr",
        type: "transfer",
        message: "Suporte...",
        config: { status: "pending" }
      }
    ]),
    mkLinear("ISP — Dados do contrato", "Consulta cadastro", [
      { key: "ask", type: "input", message: "CPF:", config: { variable: "cpf" } },
      { key: "lookup", type: "isp_action", config: { action: "lookupClient" } }
    ]),
    mkLinear("ISP — Cancelamento / retenção", "Retenção", [
      {
        key: "msg",
        type: "message",
        message: "Antes de cancelar, temos ofertas de retenção. Transferindo ao comercial."
      },
      {
        key: "tr",
        type: "transfer",
        message: "Comercial...",
        config: { status: "pending" }
      }
    ]),
    mkLinear("ISP — Reclamação ANATEL", "Ouvidoria", [
      {
        key: "ask",
        type: "input",
        message: "Descreva a reclamação:",
        config: { variable: "complaint" }
      },
      {
        key: "msg",
        type: "message",
        message: "Reclamação registrada. Supervisor entrará em contato."
      },
      {
        key: "tr",
        type: "transfer",
        message: "Suporte supervisor...",
        config: { status: "pending" }
      }
    ]),
    mkLinear("ISP — Menu principal clássico", "Menu QueueOptions-like", [
      {
        key: "menu",
        type: "menu",
        message: "Olá! Sou o ISPCHAT.",
        config: {
          options: [
            { option: "1", label: "2ª via / PIX" },
            { option: "2", label: "Sem internet" },
            { option: "3", label: "Viabilidade" },
            { option: "4", label: "Humano" }
          ]
        }
      },
      { key: "ask_cpf", type: "input", message: "CPF:", config: { variable: "cpf" } },
      { key: "inv", type: "isp_action", config: { action: "getInvoice" } }
    ])
  ];
};

export const ImportIspTemplatesService = async (companyId: number) => {
  const templates = buildIspTemplates(companyId);
  const created = [];
  for (const tpl of templates) {
    const flow = await CreateFlowService(tpl as any);
    created.push(flow);
  }
  return created;
};
