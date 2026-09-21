/**
 * Mapa de navegação único — domínios operacionais ISPCHAT (PT-BR).
 * Aponta apenas para rotas existentes e funcionais (sem /v2 /v3).
 */

export const NAV_DOMAINS = {
  atendimento: {
    label: "Atendimento",
    audience: "service",
    items: [
      { to: "/tickets", labelKey: "mainDrawer.listItems.tickets", icon: "whatsapp" },
      { to: "/quick-messages", labelKey: "mainDrawer.listItems.quickMessages", icon: "flash" },
      { to: "/kanban", label: "Kanban", icon: "kanban", planKey: "useKanban" },
      { to: "/todolist", labelKey: "Tarefas", icon: "todo" },
      { to: "/schedules", labelKey: "mainDrawer.listItems.schedules", icon: "schedule", planKey: "useSchedules" },
      { to: "/chats", labelKey: "mainDrawer.listItems.chats", icon: "forum", planKey: "useInternalChat", badge: "chatUnread" },
    ],
  },
  contatos: {
    label: "Contatos / Clientes",
    audience: "service",
    items: [
      { to: "/contacts", labelKey: "mainDrawer.listItems.contacts", icon: "contacts" },
      { to: "/tags", labelKey: "mainDrawer.listItems.tags", icon: "tags" },
      { to: "/helps", label: "Ajuda ISP", icon: "help" },
    ],
  },
  automacoes: {
    label: "Automações / Fluxos",
    audience: "admin",
    items: [
      { to: "/flows", label: "Automações", icon: "flows" },
      { to: "/flows/editor", label: "Editor gráfico", icon: "flowEditor" },
      { to: "/campaigns", labelKey: "Listagem", icon: "campaigns", planKey: "useCampaigns", section: "campanhas" },
      { to: "/contact-lists", labelKey: "Listas de Contatos", icon: "contactLists", planKey: "useCampaigns", section: "campanhas" },
    ],
  },
  relatorios: {
    label: "Relatórios",
    audience: "admin",
    items: [
      { to: "/app", label: "Visão geral", icon: "dashboard" },
      { to: "/relatorios", labelKey: "Relátorios", icon: "reports" },
    ],
  },
  conexoes: {
    label: "Conexões",
    audience: "admin",
    items: [
      {
        to: "/connections",
        labelKey: "mainDrawer.listItems.connections",
        icon: "connections",
        badge: "connectionWarning",
      },
    ],
  },
  integracoes: {
    label: "Integrações / ISP",
    audience: "admin",
    items: [
      { to: "/isp-connectors", label: "Conectores ISP", icon: "ispConnectors" },
      {
        to: "/queue-integration",
        labelKey: "mainDrawer.listItems.queueIntegration",
        icon: "integrations",
        planKey: "useIntegrations",
      },
    ],
  },
  ajustes: {
    label: "Ajustes",
    audience: "admin",
    items: [{ to: "/ajustes", label: "Central de ajustes", icon: "settings" }],
  },
};

/**
 * Cartões do hub /ajustes — inspirado no Quark, com descrição de negócio.
 */
export const AJUSTES_HUB_CARDS = [
  {
    id: "configuracoes",
    title: "Configurações",
    description: "Descubra a melhor forma de operar o atendimento: horários, permissões e comportamento do chat.",
    to: "/settings",
    icon: "settings",
  },
  {
    id: "usuarios",
    title: "Usuários",
    description: "Gerencie atendentes, perfis de acesso e quem pode operar cada área da sua operação.",
    to: "/users",
    icon: "users",
  },
  {
    id: "departamentos",
    title: "Departamentos / Filas",
    description: "Organize filas de atendimento, saudações e roteamento por área (financeiro, suporte, comercial).",
    to: "/queues",
    icon: "queues",
  },
  {
    id: "integracoes",
    title: "Integrações",
    description: "Conecte ERP, webhooks e ferramentas externas ao fluxo de atendimento.",
    to: "/queue-integration",
    icon: "integrations",
    planKey: "useIntegrations",
  },
  {
    id: "isp",
    title: "Conectores ISP",
    description: "Configure identificação de cliente, boletos e integrações específicas para provedores.",
    to: "/isp-connectors",
    icon: "ispConnectors",
  },
  {
    id: "pesquisa",
    title: "Pesquisa de Satisfação",
    description: "Ative avaliações pós-atendimento e acompanhe a percepção dos seus clientes.",
    to: "/settings",
    icon: "satisfaction",
  },
  {
    id: "arquivos",
    title: "Arquivos",
    description: "Gerencie mídias e documentos usados nas respostas rápidas e automações.",
    to: "/files",
    icon: "files",
  },
  {
    id: "planos",
    title: "Planos e faturamento",
    description: "Consulte seu plano, limites de uso e informações financeiras da assinatura.",
    to: "/financeiro",
    icon: "financeiro",
  },
  {
    id: "prompts",
    title: "Agente de IA",
    description: "Configure prompts e assistentes de inteligência artificial para apoiar o atendimento.",
    to: "/prompts",
    icon: "prompts",
    planKey: "useOpenAi",
  },
  {
    id: "api",
    title: "API de mensagens",
    description: "Integre sistemas externos para enviar e receber mensagens programaticamente.",
    to: "/messages-api",
    icon: "api",
    planKey: "useExternalApi",
  },
  {
    id: "logs",
    title: "Logs do sistema",
    description: "Acompanhe eventos técnicos e diagnósticos para suporte avançado.",
    to: "/LogLauncher",
    icon: "logs",
    superOnly: true,
  },
];
