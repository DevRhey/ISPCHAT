/**
 * Fluxo gráfico unificado ISP — jornadas de mercado (Roizap/Talqui/MK/Maxbot):
 * Financeiro, Técnico N1, Comercial, Serviços do assinante, retenção e humano.
 */
export const MASTER_FLOW_NAME = "ISPCHAT — Atendimento ISP Completo";

type NodeDef = {
  nodeKey: string;
  type: string;
  title?: string;
  message?: string;
  config?: Record<string, any>;
  positionX: number;
  positionY: number;
};

type EdgeDef = {
  sourceNodeKey: string;
  targetNodeKey: string;
  condition?: string;
  label?: string;
};

const opt = (
  option: string,
  label: string,
  keywords: string[],
  icon?: string
): { option: string; label: string; keywords: string[]; icon?: string } => ({
  option,
  label,
  keywords: Array.from(new Set([option, ...keywords])),
  ...(icon ? { icon } : {})
});

export const buildMasterAtendimentoFlow = (companyId: number) => {
  const nodes: NodeDef[] = [
    {
      nodeKey: "start",
      type: "start",
      title: "Início",
      positionX: 520,
      positionY: 0
    },
    {
      nodeKey: "settings",
      type: "settings",
      title: "Configurações",
      config: {
        triggerKeywords: [
          "oi",
          "olá",
          "ola",
          "menu",
          "bom dia",
          "boa tarde",
          "boa noite"
        ],
        timeoutMinutes: 30,
        fallbackMessage:
          "Não entendi. Digite *menu*, o número da opção ou *#sair*."
      },
      positionX: 520,
      positionY: 70
    },
    {
      nodeKey: "welcome",
      type: "message",
      title: "Boas-vindas",
      message:
        "Olá, {{contactName}}! 👋\nSou o *ISPCHAT*, assistente 24h do provedor.\n\nDigite o *número* ou palavras: *boleto*, *internet*, *plano*, *desbloqueio*, *wifi*, *cancelar*.",
      positionX: 520,
      positionY: 150
    },
    {
      nodeKey: "menu_main",
      type: "menu",
      title: "Menu principal",
      message: "*Como posso ajudar?*",
      config: {
        backTo: "menu_main",
        interactiveMode: "auto",
        options: [
          opt("1", "Financeiro (boleto / PIX / desbloqueio)", [
            "financeiro",
            "boleto",
            "2 via",
            "2ª via",
            "pix",
            "fatura",
            "pagar",
            "desbloqueio",
            "negociar"
          ], "💰"),
          opt("2", "Suporte técnico (internet / OS / visita)", [
            "tecnico",
            "técnico",
            "suporte",
            "internet",
            "sem internet",
            "onu",
            "os",
            "lenta",
            "wifi",
            "visita"
          ], "🛠️"),
          opt("3", "Comercial (CEP / planos / instalação)", [
            "comercial",
            "plano",
            "planos",
            "viabilidade",
            "cep",
            "contratar",
            "upgrade",
            "instalação",
            "instalacao"
          ], "🛒"),
          opt("4", "Meus serviços (contrato / endereço / cancelar)", [
            "servicos",
            "serviços",
            "contrato",
            "endereco",
            "endereço",
            "cancelar",
            "cancelamento",
            "mudanca",
            "mudança",
            "anatel"
          ], "📋"),
          opt("5", "Falar com atendente", [
            "humano",
            "atendente",
            "pessoa",
            "falar",
            "operador"
          ], "👤")
        ]
      },
      positionX: 520,
      positionY: 240
    },

    // —— FINANCEIRO ——
    {
      nodeKey: "fin_menu",
      type: "menu",
      title: "Financeiro",
      message: "*Financeiro* — escolha:",
      config: {
        backTo: "menu_main",
        interactiveMode: "auto",
        options: [
          opt("1", "2ª via / boleto", ["boleto", "2 via", "2ª via", "fatura"], "📄"),
          opt("2", "PIX", ["pix"], "💸"),
          opt("3", "Negociar pendência", [
            "negociar",
            "acordo",
            "divida",
            "dívida"
          ], "🤝"),
          opt("4", "Desbloqueio após pagamento", [
            "desbloqueio",
            "desbloquear",
            "liberar",
            "bloqueado"
          ], "🔓"),
          opt("5", "Já paguei / confirmar pagamento", [
            "ja paguei",
            "já paguei",
            "paguei",
            "comprovante",
            "confirmar"
          ], "✅"),
          opt("0", "Voltar ao menu", ["voltar", "menu"], "↩️")
        ]
      },
      positionX: 40,
      positionY: 380
    },
    {
      nodeKey: "fin_cpf",
      type: "input",
      title: "CPF financeiro",
      message: "Informe o *CPF* do titular (somente números):",
      config: { variable: "cpf" },
      positionX: 40,
      positionY: 520
    },
    {
      nodeKey: "fin_lookup",
      type: "isp_action",
      title: "Buscar cliente",
      config: { action: "lookupClient" },
      positionX: 40,
      positionY: 620
    },
    {
      nodeKey: "fin_invoice",
      type: "isp_action",
      title: "Gerar boleto/PIX",
      config: { action: "getInvoice" },
      positionX: 40,
      positionY: 720
    },
    {
      nodeKey: "fin_done",
      type: "message",
      title: "Financeiro OK",
      message:
        "✅ Pronto! Digite *menu* para outras opções ou *#sair* para encerrar.",
      positionX: 40,
      positionY: 820
    },
    {
      nodeKey: "fin_unlock_cpf",
      type: "input",
      title: "CPF desbloqueio",
      message:
        "Para *desbloqueio de confiança*, informe o *CPF* do titular (somente números):",
      config: { variable: "cpf" },
      positionX: -160,
      positionY: 520
    },
    {
      nodeKey: "fin_unlock_lookup",
      type: "isp_action",
      title: "Validar cliente",
      config: { action: "lookupClient" },
      positionX: -160,
      positionY: 620
    },
    {
      nodeKey: "fin_unlock",
      type: "isp_action",
      title: "Desbloquear",
      config: { action: "unlockService" },
      positionX: -160,
      positionY: 720
    },
    {
      nodeKey: "fin_paid",
      type: "message",
      title: "Confirmar pagamento",
      message:
        "Recebemos seu aviso de pagamento. ✅\nEm até *30 minutos* a conexão deve normalizar após compensação.\nSe continuar bloqueado, use a opção *Desbloqueio* ou fale com o financeiro.",
      positionX: -160,
      positionY: 460
    },
    {
      nodeKey: "fin_nego",
      type: "message",
      title: "Negociação",
      message:
        "Vamos negociar sua pendência. Em instantes o *financeiro* assume com propostas de acordo.",
      positionX: -300,
      positionY: 520
    },
    {
      nodeKey: "fin_transfer",
      type: "transfer",
      title: "Departamento financeiro",
      message: "Transferindo para o *financeiro*…",
      config: { status: "pending", queueId: null },
      positionX: -300,
      positionY: 620
    },

    // —— TÉCNICO ——
    {
      nodeKey: "tec_menu",
      type: "menu",
      title: "Técnico",
      message: "*Suporte técnico* — o que está acontecendo?",
      config: {
        backTo: "menu_main",
        interactiveMode: "auto",
        options: [
          opt("1", "Sem internet", ["sem internet", "caiu", "offline"], "📵"),
          opt("2", "Internet lenta", ["lenta", "lento", "velocidade"], "🐢"),
          opt("3", "Senha / Wi-Fi", ["wifi", "wi-fi", "senha", "roteador"], "📶"),
          opt("4", "Agendar visita técnica", [
            "visita",
            "agendar",
            "tecnico em casa"
          ], "🔧"),
          opt("5", "Abrir OS / outro problema", ["os", "ordem", "outro"], "📝"),
          opt("0", "Voltar ao menu", ["voltar", "menu"], "↩️")
        ]
      },
      positionX: 420,
      positionY: 380
    },
    {
      nodeKey: "tec_onu",
      type: "menu",
      title: "Triagem ONU",
      message: "Qual a cor da luz da *ONU/roteador*?",
      config: {
        backTo: "tec_menu",
        interactiveMode: "auto",
        options: [
          opt("1", "Verde fixa", ["verde"], "🟢"),
          opt("2", "Vermelha / piscando", [
            "vermelha",
            "vermelho",
            "piscando"
          ], "🔴"),
          opt("3", "Apagada", ["apagada", "sem luz"], "⚫")
        ]
      },
      positionX: 280,
      positionY: 520
    },
    {
      nodeKey: "tec_signal",
      type: "isp_action",
      title: "Checar sinal ONU",
      config: { action: "checkSignal" },
      positionX: 280,
      positionY: 620
    },
    {
      nodeKey: "tec_reboot",
      type: "message",
      title: "Reboot",
      message:
        "🔌 *Passo a passo N1:*\n1) Desligue a ONU da tomada por *30 segundos*\n2) Ligue e aguarde *2 minutos*\n3) Teste a internet\n\nSe não voltar, abriremos uma OS.",
      positionX: 280,
      positionY: 640
    },
    {
      nodeKey: "tec_slow",
      type: "message",
      title: "Checklist lento",
      message:
        "📶 Checklist rápido:\n1) Reinicie o roteador\n2) Teste com cabo\n3) Faça um speedtest perto do roteador\n\nSe continuar lento, abriremos OS.",
      positionX: 480,
      positionY: 520
    },
    {
      nodeKey: "tec_wifi",
      type: "message",
      title: "Wi-Fi",
      message:
        "📡 *Wi-Fi / senha:*\n• Nome (SSID) e senha ficam na etiqueta da ONU ou no contrato.\n• Dica: rede 5GHz costuma ser mais rápida perto do roteador.\n\nSe não lembrar a senha, um técnico pode redefinir — vamos abrir OS ou agendar visita.",
      positionX: 560,
      positionY: 520
    },
    {
      nodeKey: "tec_wifi_choice",
      type: "menu",
      title: "Wi-Fi próximo",
      message: "Como prefere seguir?",
      config: {
        backTo: "tec_menu",
        interactiveMode: "auto",
        options: [
          opt("1", "Abrir OS para redefinir senha", ["os", "redefinir"], "📝"),
          opt("2", "Agendar visita", ["visita", "agendar"], "🔧"),
          opt("0", "Voltar", ["voltar", "menu"], "↩️")
        ]
      },
      positionX: 560,
      positionY: 640
    },
    {
      nodeKey: "tec_visit_cpf",
      type: "input",
      title: "CPF visita",
      message: "Informe o *CPF* do titular para agendar a visita:",
      config: { variable: "cpf" },
      positionX: 680,
      positionY: 520
    },
    {
      nodeKey: "tec_visit_lookup",
      type: "isp_action",
      title: "Validar visita",
      config: { action: "lookupClient" },
      positionX: 680,
      positionY: 620
    },
    {
      nodeKey: "tec_visit",
      type: "isp_action",
      title: "Agendar visita",
      config: { action: "scheduleVisit" },
      positionX: 680,
      positionY: 720
    },
    {
      nodeKey: "tec_reason",
      type: "input",
      title: "Descrever problema",
      message: "Descreva o problema em uma frase:",
      config: { variable: "reason" },
      positionX: 420,
      positionY: 760
    },
    {
      nodeKey: "tec_os",
      type: "isp_action",
      title: "Abrir OS",
      config: { action: "openTicket" },
      positionX: 420,
      positionY: 860
    },
    {
      nodeKey: "tec_transfer",
      type: "transfer",
      title: "Departamento técnico",
      message: "Transferindo para o *suporte técnico*…",
      config: { status: "pending", queueId: null },
      positionX: 420,
      positionY: 960
    },

    // —— COMERCIAL ——
    {
      nodeKey: "com_menu",
      type: "menu",
      title: "Comercial",
      message: "*Comercial* — o que deseja?",
      config: {
        backTo: "menu_main",
        interactiveMode: "auto",
        options: [
          opt("1", "Viabilidade por CEP", [
            "viabilidade",
            "cep",
            "cobertura"
          ], "📍"),
          opt("2", "Ver planos / contratar", [
            "plano",
            "planos",
            "contratar",
            "preço",
            "preco"
          ], "📦"),
          opt("3", "Upgrade de plano", ["upgrade", "aumentar"], "⬆️"),
          opt("4", "Agendar instalação", [
            "instalação",
            "instalacao",
            "agendar instalação"
          ], "🏠"),
          opt("0", "Voltar ao menu", ["voltar", "menu"], "↩️")
        ]
      },
      positionX: 900,
      positionY: 380
    },
    {
      nodeKey: "com_cep",
      type: "input",
      title: "CEP",
      message: "Informe o *CEP* (somente números):",
      config: { variable: "cep" },
      positionX: 820,
      positionY: 520
    },
    {
      nodeKey: "com_coverage",
      type: "isp_action",
      title: "Checar cobertura",
      config: { action: "checkCoverage" },
      positionX: 820,
      positionY: 620
    },
    {
      nodeKey: "com_plans",
      type: "message",
      title: "Planos",
      message:
        "📦 *Planos sugeridos (demo):*\n• 300 Mega — R$ 99,90\n• 500 Mega — R$ 129,90\n• 1 Giga — R$ 169,90\n\nUm consultor confirma disponibilidade e agendamento.",
      positionX: 1000,
      positionY: 520
    },
    {
      nodeKey: "com_upgrade",
      type: "message",
      title: "Upgrade",
      message:
        "Solicitação de *upgrade* registrada. O comercial confirma valores e prazo de ativação.",
      positionX: 1080,
      positionY: 620
    },
    {
      nodeKey: "com_install_cpf",
      type: "input",
      title: "CPF instalação",
      message: "Informe o *CPF* ou digite *novo* se ainda não é cliente:",
      config: { variable: "cpf" },
      positionX: 1000,
      positionY: 720
    },
    {
      nodeKey: "com_install",
      type: "isp_action",
      title: "Agendar instalação",
      config: { action: "scheduleVisit" },
      positionX: 1000,
      positionY: 820
    },
    {
      nodeKey: "com_transfer",
      type: "transfer",
      title: "Departamento comercial",
      message: "Transferindo para o *comercial*…",
      config: { status: "pending", queueId: null },
      positionX: 940,
      positionY: 920
    },

    // —— MEUS SERVIÇOS ——
    {
      nodeKey: "svc_menu",
      type: "menu",
      title: "Meus serviços",
      message: "*Meus serviços* — escolha:",
      config: {
        backTo: "menu_main",
        interactiveMode: "auto",
        options: [
          opt("1", "Dados do contrato", [
            "contrato",
            "dados",
            "meu plano",
            "status"
          ], "📄"),
          opt("2", "Mudança de endereço", [
            "mudanca",
            "mudança",
            "endereco",
            "endereço",
            "mudar"
          ], "🏠"),
          opt("3", "Cancelamento / retenção", [
            "cancelar",
            "cancelamento",
            "rescindir"
          ], "❌"),
          opt("4", "Reclamação / ANATEL", ["anatel", "reclamação", "reclamacao"], "📣"),
          opt("0", "Voltar ao menu", ["voltar", "menu"], "↩️")
        ]
      },
      positionX: 520,
      positionY: 1100
    },
    {
      nodeKey: "svc_cpf",
      type: "input",
      title: "CPF serviços",
      message: "Informe o *CPF* do titular:",
      config: { variable: "cpf" },
      positionX: 360,
      positionY: 1220
    },
    {
      nodeKey: "svc_lookup",
      type: "isp_action",
      title: "Localizar",
      config: { action: "lookupClient" },
      positionX: 360,
      positionY: 1320
    },
    {
      nodeKey: "svc_contract",
      type: "isp_action",
      title: "Contrato",
      config: { action: "getContract" },
      positionX: 360,
      positionY: 1420
    },
    {
      nodeKey: "svc_move",
      type: "message",
      title: "Mudança de endereço",
      message:
        "📦 *Mudança de endereço:*\n1) Verificamos viabilidade no novo CEP\n2) Agendamos remoção + instalação\n3) Pode haver taxa de visita (conforme contrato)\n\nVamos transferir ao *comercial/técnico* para concluir.",
      positionX: 520,
      positionY: 1220
    },
    {
      nodeKey: "svc_cancel",
      type: "message",
      title: "Retenção",
      message:
        "Antes de cancelar, podemos oferecer:\n• Desconto temporário\n• Upgrade sem custo por 3 meses\n• Renegociação de fidelidade\n\nUm especialista de *retenção* vai falar com você agora.",
      positionX: 680,
      positionY: 1220
    },
    {
      nodeKey: "svc_anatel",
      type: "message",
      title: "ANATEL",
      message:
        "Registramos sua intenção de reclamação formal.\nProtocolo interno gerado. Um supervisor assume e, se necessário, orienta o canal ANATEL.\n\nTransferindo…",
      positionX: 840,
      positionY: 1220
    },
    {
      nodeKey: "svc_transfer",
      type: "transfer",
      title: "Departamento serviços",
      message: "Transferindo para um especialista…",
      config: { status: "pending", queueId: null },
      positionX: 600,
      positionY: 1520
    },
    {
      nodeKey: "svc_done",
      type: "message",
      title: "Serviços OK",
      message: "✅ Dados exibidos. Digite *menu* para continuar.",
      positionX: 360,
      positionY: 1520
    },

    // —— HUMANO / FIM ——
    {
      nodeKey: "human_transfer",
      type: "transfer",
      title: "Atendente",
      message: "Ok! Transferindo para um *atendente humano*…",
      config: { status: "pending", queueId: null },
      positionX: 520,
      positionY: 340
    },
    {
      nodeKey: "end",
      type: "end",
      title: "Fim",
      message:
        "Obrigado pelo contato! Digite *menu* a qualquer momento ou *#sair* para encerrar o bot.",
      positionX: 520,
      positionY: 1680
    }
  ];

  const edges: EdgeDef[] = [
    { sourceNodeKey: "start", targetNodeKey: "settings", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "settings", targetNodeKey: "welcome", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "welcome", targetNodeKey: "menu_main", condition: "auto", label: "⚡ auto" },

    { sourceNodeKey: "menu_main", targetNodeKey: "fin_menu", condition: "1", label: "Financeiro" },
    { sourceNodeKey: "menu_main", targetNodeKey: "tec_menu", condition: "2", label: "Técnico" },
    { sourceNodeKey: "menu_main", targetNodeKey: "com_menu", condition: "3", label: "Comercial" },
    { sourceNodeKey: "menu_main", targetNodeKey: "svc_menu", condition: "4", label: "Serviços" },
    { sourceNodeKey: "menu_main", targetNodeKey: "human_transfer", condition: "5", label: "Humano" },
    { sourceNodeKey: "menu_main", targetNodeKey: "fin_cpf", condition: "kw:boleto,2 via,2ª via,fatura,segunda via", label: "kw boleto" },
    { sourceNodeKey: "menu_main", targetNodeKey: "fin_cpf", condition: "kw:pix", label: "kw pix" },
    { sourceNodeKey: "menu_main", targetNodeKey: "fin_unlock_cpf", condition: "kw:desbloqueio,desbloquear,bloqueado", label: "kw unlock" },
    { sourceNodeKey: "menu_main", targetNodeKey: "fin_nego", condition: "kw:negociar,acordo,divida,dívida", label: "kw nego" },
    { sourceNodeKey: "menu_main", targetNodeKey: "tec_onu", condition: "kw:sem internet,caiu,offline,sem sinal", label: "kw offline" },
    { sourceNodeKey: "menu_main", targetNodeKey: "tec_slow", condition: "kw:lenta,lentidao,velocidade", label: "kw lenta" },
    { sourceNodeKey: "menu_main", targetNodeKey: "tec_wifi", condition: "kw:wifi,wi-fi,senha wifi,roteador", label: "kw wifi" },
    { sourceNodeKey: "menu_main", targetNodeKey: "tec_visit_cpf", condition: "kw:visita,agendar visita", label: "kw visita" },
    { sourceNodeKey: "menu_main", targetNodeKey: "com_cep", condition: "kw:cep,viabilidade,cobertura", label: "kw cep" },
    { sourceNodeKey: "menu_main", targetNodeKey: "com_plans", condition: "kw:plano,planos,contratar", label: "kw planos" },
    { sourceNodeKey: "menu_main", targetNodeKey: "svc_cpf", condition: "kw:contrato,meu plano,dados do contrato", label: "kw contrato" },
    { sourceNodeKey: "menu_main", targetNodeKey: "svc_cancel", condition: "kw:cancelar,cancelamento", label: "kw cancel" },
    { sourceNodeKey: "menu_main", targetNodeKey: "svc_anatel", condition: "kw:anatel,reclamacao,reclamação", label: "kw anatel" },
    { sourceNodeKey: "menu_main", targetNodeKey: "human_transfer", condition: "kw:atendente,humano,falar com", label: "kw humano" },
    { sourceNodeKey: "menu_main", targetNodeKey: "end", condition: "kw:#sair,sair,encerrar,tchau", label: "kw sair" },


    // Financeiro
    { sourceNodeKey: "fin_menu", targetNodeKey: "fin_cpf", condition: "1", label: "Boleto" },
    { sourceNodeKey: "fin_menu", targetNodeKey: "fin_cpf", condition: "2", label: "PIX" },
    { sourceNodeKey: "fin_menu", targetNodeKey: "fin_nego", condition: "3", label: "Negociar" },
    { sourceNodeKey: "fin_menu", targetNodeKey: "fin_unlock_cpf", condition: "4", label: "Desbloqueio" },
    { sourceNodeKey: "fin_menu", targetNodeKey: "fin_paid", condition: "5", label: "Já paguei" },
    { sourceNodeKey: "fin_menu", targetNodeKey: "menu_main", condition: "0", label: "Voltar" },
    { sourceNodeKey: "fin_cpf", targetNodeKey: "fin_lookup", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "fin_lookup", targetNodeKey: "fin_invoice", condition: "true" },
    { sourceNodeKey: "fin_lookup", targetNodeKey: "fin_cpf", condition: "false", label: "CPF inválido" },
    { sourceNodeKey: "fin_invoice", targetNodeKey: "fin_done", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "fin_done", targetNodeKey: "menu_main", condition: "default", label: "qualquer → menu" },
    { sourceNodeKey: "fin_nego", targetNodeKey: "fin_transfer", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "fin_paid", targetNodeKey: "menu_main", condition: "default", label: "→ menu" },
    { sourceNodeKey: "fin_unlock_cpf", targetNodeKey: "fin_unlock_lookup", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "fin_unlock_lookup", targetNodeKey: "fin_unlock", condition: "true" },
    { sourceNodeKey: "fin_unlock_lookup", targetNodeKey: "fin_unlock_cpf", condition: "false", label: "CPF inválido" },
    { sourceNodeKey: "fin_unlock", targetNodeKey: "fin_done", condition: "auto", label: "⚡ auto" },

    // Técnico
    { sourceNodeKey: "tec_menu", targetNodeKey: "tec_onu", condition: "1", label: "Sem net" },
    { sourceNodeKey: "tec_menu", targetNodeKey: "tec_slow", condition: "2", label: "Lenta" },
    { sourceNodeKey: "tec_menu", targetNodeKey: "tec_wifi", condition: "3", label: "Wi-Fi" },
    { sourceNodeKey: "tec_menu", targetNodeKey: "tec_visit_cpf", condition: "4", label: "Visita" },
    { sourceNodeKey: "tec_menu", targetNodeKey: "tec_reason", condition: "5", label: "OS" },
    { sourceNodeKey: "tec_menu", targetNodeKey: "menu_main", condition: "0", label: "Voltar" },
    { sourceNodeKey: "tec_onu", targetNodeKey: "tec_signal", condition: "1" },
    { sourceNodeKey: "tec_onu", targetNodeKey: "tec_signal", condition: "2" },
    { sourceNodeKey: "tec_onu", targetNodeKey: "tec_signal", condition: "3" },
    { sourceNodeKey: "tec_signal", targetNodeKey: "tec_reboot", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "tec_reboot", targetNodeKey: "tec_reason", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "tec_slow", targetNodeKey: "tec_reason", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "tec_wifi", targetNodeKey: "tec_wifi_choice", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "tec_wifi_choice", targetNodeKey: "tec_reason", condition: "1", label: "OS" },
    { sourceNodeKey: "tec_wifi_choice", targetNodeKey: "tec_visit_cpf", condition: "2", label: "Visita" },
    { sourceNodeKey: "tec_wifi_choice", targetNodeKey: "tec_menu", condition: "0", label: "Voltar" },
    { sourceNodeKey: "tec_visit_cpf", targetNodeKey: "tec_visit_lookup", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "tec_visit_lookup", targetNodeKey: "tec_visit", condition: "true" },
    { sourceNodeKey: "tec_visit_lookup", targetNodeKey: "tec_visit_cpf", condition: "false", label: "CPF inválido" },
    { sourceNodeKey: "tec_visit", targetNodeKey: "tec_transfer", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "tec_reason", targetNodeKey: "tec_os", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "tec_os", targetNodeKey: "tec_transfer", condition: "auto", label: "⚡ auto" },

    // Comercial
    { sourceNodeKey: "com_menu", targetNodeKey: "com_cep", condition: "1", label: "CEP" },
    { sourceNodeKey: "com_menu", targetNodeKey: "com_plans", condition: "2", label: "Planos" },
    { sourceNodeKey: "com_menu", targetNodeKey: "com_upgrade", condition: "3", label: "Upgrade" },
    { sourceNodeKey: "com_menu", targetNodeKey: "com_install_cpf", condition: "4", label: "Instalação" },
    { sourceNodeKey: "com_menu", targetNodeKey: "menu_main", condition: "0", label: "Voltar" },
    { sourceNodeKey: "com_cep", targetNodeKey: "com_coverage", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "com_coverage", targetNodeKey: "com_transfer", condition: "true", label: "Cobertura OK" },
    { sourceNodeKey: "com_coverage", targetNodeKey: "com_plans", condition: "false", label: "Sem cobertura" },
    { sourceNodeKey: "com_plans", targetNodeKey: "com_transfer", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "com_upgrade", targetNodeKey: "com_transfer", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "com_install_cpf", targetNodeKey: "com_install", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "com_install", targetNodeKey: "com_transfer", condition: "auto", label: "⚡ auto" },

    // Serviços
    { sourceNodeKey: "svc_menu", targetNodeKey: "svc_cpf", condition: "1", label: "Contrato" },
    { sourceNodeKey: "svc_menu", targetNodeKey: "svc_move", condition: "2", label: "Endereço" },
    { sourceNodeKey: "svc_menu", targetNodeKey: "svc_cancel", condition: "3", label: "Cancelar" },
    { sourceNodeKey: "svc_menu", targetNodeKey: "svc_anatel", condition: "4", label: "ANATEL" },
    { sourceNodeKey: "svc_menu", targetNodeKey: "menu_main", condition: "0", label: "Voltar" },
    { sourceNodeKey: "svc_cpf", targetNodeKey: "svc_lookup", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "svc_lookup", targetNodeKey: "svc_contract", condition: "true" },
    { sourceNodeKey: "svc_lookup", targetNodeKey: "svc_cpf", condition: "false", label: "CPF inválido" },
    { sourceNodeKey: "svc_contract", targetNodeKey: "svc_done", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "svc_done", targetNodeKey: "menu_main", condition: "default", label: "→ menu" },
    { sourceNodeKey: "svc_move", targetNodeKey: "svc_transfer", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "svc_cancel", targetNodeKey: "svc_transfer", condition: "auto", label: "⚡ auto" },
    { sourceNodeKey: "svc_anatel", targetNodeKey: "svc_transfer", condition: "auto", label: "⚡ auto" }
  ];

  return {
    name: MASTER_FLOW_NAME,
    description: "Master único ISP: financeiro, técnico, comercial, serviços, retenção, ANATEL e humano. FlowEngine + ponte NLU.",
    active: true,
    companyId,
    entryNodeKey: "start",
    nodes,
    edges
  };
};
