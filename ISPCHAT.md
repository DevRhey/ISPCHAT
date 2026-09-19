# ISPCHAT

Assistente conversacional completo para **provedores de internet (ISP)**, baseado em **LangGraph** + Whaticket SaaS (WhatsApp).

## O que inclui

- Motor **LangGraph** com roteamento por intenção (25+ casos de uso)
- Fluxos prontos: 2ª via, PIX, negociação, sem internet, OS, viabilidade CEP, upgrade, cancelamento/retenção, reclamação, transferência humana, etc.
- Conectores ERP (IXC / SGP / HubSoft) com modo demo
- FlowEngine nativo + templates importáveis
- Integração Typebot / n8n

## Como ativar o LangGraph na fila

1. **Integrações** → criar tipo **ISPCHAT LangGraph**
2. **Filas** → vincular essa integração
3. Cliente no WhatsApp recebe o menu ISPCHAT automático

## Stack

- Backend: Node 20 + TypeScript + LangGraph (`@langchain/langgraph`)
- Frontend: React
- WhatsApp: Baileys
- Docs: `docs/ISP_AUTOMATION.md`

## Login padrão (seed)

- Email: `admin@admin.com`
- Senha: `123456`
