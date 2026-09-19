# ISPCHAT — guia rápido LangGraph

## Arquitetura

```
WhatsApp → wbotMessageListener → langGraphListener → ISP StateGraph
                                      ↓
                    nós: menu, billing, tech, sales, transfer...
                                      ↓
                              IspConnectors (IXC/SGP/demo)
```

Runtime: `backend/src/services/LangGraphServices/` (API estilo LangGraph: StateGraph, Annotation, MemorySaver, conditional edges). Compatível com a tipagem TypeScript 4.9 do projeto.

## Ativar

1. Integrações → tipo **ISPCHAT LangGraph**
2. Filas → vincular integração + chatbot ativo
3. Fluxos ISP → Importar templates ISP (17 fluxos prontos)

## Intenções cobertas

Financeiro: 2ª via, PIX, negociação, status pagamento  
Técnico: sem internet, lenta, reboot ONU, OS, status OS  
Comercial: viabilidade CEP, novo plano, upgrade, instalação  
Cadastro: mudança endereço, Wi-Fi, contrato, cancelamento  
Suporte: protocolo, reclamação/ANATEL, FAQ, transferência humana
