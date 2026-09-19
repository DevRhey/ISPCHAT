/**
 * Catálogo completo de intenções / casos de uso ISP (ISPCHAT).
 * Usado pelo classificador do LangGraph e pelos templates de fluxo.
 */
export type IspIntent =
  | "menu"
  | "identify_client"
  | "segunda_via"
  | "pix"
  | "negociacao"
  | "status_pagamento"
  | "sem_internet"
  | "internet_lenta"
  | "reboot_onu"
  | "abrir_os"
  | "status_os"
  | "viabilidade"
  | "novo_plano"
  | "upgrade_plano"
  | "agendar_instalacao"
  | "reagendar_visita"
  | "mudanca_endereco"
  | "senha_wifi"
  | "dados_contrato"
  | "protocolo"
  | "cancelamento"
  | "reclamacao"
  | "faq_geral"
  | "financeiro_humano"
  | "suporte_humano"
  | "comercial_humano"
  | "noc_humano"
  | "encerrar"
  | "unknown";

export interface IntentDef {
  intent: IspIntent;
  label: string;
  keywords: string[];
  menuOption?: string;
  category: "billing" | "tech" | "sales" | "account" | "support" | "system";
}

export const ISP_INTENTS: IntentDef[] = [
  {
    intent: "menu",
    label: "Menu principal",
    keywords: ["menu", "inicio", "começar", "oi", "olá", "ola", "bom dia", "boa tarde", "boa noite"],
    menuOption: "0",
    category: "system"
  },
  {
    intent: "segunda_via",
    label: "2ª via / boleto",
    keywords: ["2 via", "2ª via", "segunda via", "boleto", "fatura", "conta", "pdf boleto"],
    menuOption: "1",
    category: "billing"
  },
  {
    intent: "pix",
    label: "Pagamento PIX",
    keywords: ["pix", "qr code", "qrcode", "pagar pix", "copia e cola"],
    menuOption: "2",
    category: "billing"
  },
  {
    intent: "negociacao",
    label: "Negociação de dívida",
    keywords: ["negociar", "negociação", "divida", "dívida", "atrasado", "acordo", "parcelar"],
    menuOption: "3",
    category: "billing"
  },
  {
    intent: "status_pagamento",
    label: "Status de pagamento",
    keywords: ["pago", "pagou", "status pagamento", "confirmar pagamento", "baixou"],
    category: "billing"
  },
  {
    intent: "sem_internet",
    label: "Sem internet",
    keywords: ["sem internet", "caiu", "offline", "não funciona", "nao funciona", "fora do ar", "sem sinal"],
    menuOption: "4",
    category: "tech"
  },
  {
    intent: "internet_lenta",
    label: "Internet lenta",
    keywords: ["lenta", "devagar", "lentidão", "lentidao", "velocidade", "ping alto"],
    menuOption: "5",
    category: "tech"
  },
  {
    intent: "reboot_onu",
    label: "Reiniciar ONU/roteador",
    keywords: ["reiniciar", "reboot", "resetar", "ligar e desligar", "onu"],
    category: "tech"
  },
  {
    intent: "abrir_os",
    label: "Abrir ordem de serviço",
    keywords: ["abrir os", "ordem de serviço", "ordem de servico", "técnico", "tecnico", "visita técnica"],
    menuOption: "6",
    category: "tech"
  },
  {
    intent: "status_os",
    label: "Status da OS",
    keywords: ["status os", "andamento os", "quando vem o tecnico", "protocolo os"],
    category: "tech"
  },
  {
    intent: "viabilidade",
    label: "Viabilidade / cobertura",
    keywords: ["viabilidade", "cobertura", "tem sinal", "atende", "cep", "meu endereço"],
    menuOption: "7",
    category: "sales"
  },
  {
    intent: "novo_plano",
    label: "Contratar plano",
    keywords: ["quero contratar", "novo plano", "assinar", "plano novo", "fibra"],
    menuOption: "8",
    category: "sales"
  },
  {
    intent: "upgrade_plano",
    label: "Upgrade de plano",
    keywords: ["upgrade", "aumentar velocidade", "mudar plano", "mais mega", "trocar plano"],
    category: "sales"
  },
  {
    intent: "agendar_instalacao",
    label: "Agendar instalação",
    keywords: ["agendar instalação", "agendar instalacao", "data instalação", "quando instalam"],
    category: "sales"
  },
  {
    intent: "reagendar_visita",
    label: "Reagendar visita",
    keywords: ["reagendar", "remarcar", "outra data", "adiar visita"],
    category: "tech"
  },
  {
    intent: "mudanca_endereco",
    label: "Mudança de endereço",
    keywords: ["mudança", "mudanca", "trocar endereço", "trocar endereco", "me mudei"],
    menuOption: "9",
    category: "account"
  },
  {
    intent: "senha_wifi",
    label: "Senha do Wi-Fi",
    keywords: ["senha wifi", "senha do wifi", "wifi", "wi-fi", "esqueceu senha wifi"],
    menuOption: "10",
    category: "account"
  },
  {
    intent: "dados_contrato",
    label: "Dados do contrato",
    keywords: ["contrato", "meu plano", "vencimento", "dia de vencimento", "dados cadastrais"],
    menuOption: "11",
    category: "account"
  },
  {
    intent: "protocolo",
    label: "Consultar protocolo",
    keywords: ["protocolo", "número do protocolo", "numero do protocolo"],
    category: "support"
  },
  {
    intent: "cancelamento",
    label: "Cancelamento",
    keywords: ["cancelar", "cancelamento", "desistir", "encerrar contrato"],
    menuOption: "12",
    category: "account"
  },
  {
    intent: "reclamacao",
    label: "Reclamação / ANATEL",
    keywords: ["reclamação", "reclamacao", "anatel", "procon", "reclamar"],
    category: "support"
  },
  {
    intent: "faq_geral",
    label: "Dúvidas gerais",
    keywords: ["horário", "horario", "funcionamento", "como funciona", "ajuda"],
    category: "support"
  },
  {
    intent: "financeiro_humano",
    label: "Falar com financeiro",
    keywords: ["financeiro", "atendente financeiro"],
    menuOption: "13",
    category: "support"
  },
  {
    intent: "suporte_humano",
    label: "Falar com suporte",
    keywords: ["suporte", "atendente", "humano", "pessoa"],
    menuOption: "14",
    category: "support"
  },
  {
    intent: "comercial_humano",
    label: "Falar com comercial",
    keywords: ["comercial", "vendedor", "vendas"],
    menuOption: "15",
    category: "sales"
  },
  {
    intent: "noc_humano",
    label: "NOC / rede",
    keywords: ["noc", "rede", "backbone"],
    category: "tech"
  },
  {
    intent: "encerrar",
    label: "Encerrar atendimento",
    keywords: ["sair", "#sair", "tchau", "obrigado", "valeu", "encerrar"],
    menuOption: "#",
    category: "system"
  }
];

export const MAIN_MENU_TEXT = `🏢 *ISPCHAT — Assistente do Provedor*

Escolha uma opção digitando o *número* ou descreva o que precisa:

*Financeiro*
1 - 2ª via / boleto
2 - PIX
3 - Negociação de dívida

*Técnico*
4 - Sem internet
5 - Internet lenta
6 - Abrir OS / visita técnica

*Comercial*
7 - Viabilidade (CEP)
8 - Contratar / novo plano

*Cadastro*
9 - Mudança de endereço
10 - Senha do Wi-Fi
11 - Dados do contrato
12 - Cancelamento

*Atendente*
13 - Financeiro humano
14 - Suporte humano
15 - Comercial humano

Digite *0* para ver este menu novamente.
Digite *#sair* para encerrar.`;

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const classifyIntent = (raw: string): IspIntent => {
  const text = normalize(raw || "");
  if (!text) return "menu";

  // opção numérica do menu
  const byOption = ISP_INTENTS.find(
    i => i.menuOption && text === normalize(i.menuOption)
  );
  if (byOption) return byOption.intent;

  if (text === "#" || text === "#sair") return "encerrar";

  let best: IntentDef | null = null;
  let bestScore = 0;
  for (const def of ISP_INTENTS) {
    for (const kw of def.keywords) {
      const nkw = normalize(kw);
      if (text === nkw || text.includes(nkw)) {
        const score = nkw.length;
        if (score > bestScore) {
          bestScore = score;
          best = def;
        }
      }
    }
  }
  return best?.intent || "unknown";
};
