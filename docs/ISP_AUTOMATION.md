# Automação ISP — Typebot, n8n e Fluxos nativos

## Visão rápida

| Fase | O que faz | Onde |
|------|-----------|------|
| **1** | Menu de filas + Typebot/n8n (boleto, OS, triagem) | Integrações + Filas |
| **2** | Motor de fluxos nativo (`FlowEngine`) | Menu **Fluxos** |
| **3** | Conectores IXC / SGP / HubSoft + templates | Nó `isp_action` nos fluxos |

## Fase 1 — Typebot / n8n (já no produto)

### 1. Montar o menu da fila

Em **Filas** → editar fila → **Chatbot / Opções**:

```
1 - 2ª via / boleto
2 - Sem internet
3 - Viabilidade / plano novo
4 - Falar com humano
```

### 2. Criar integração

Em **Integrações**:

- **Typebot**: URL do Typebot + slug do bot
- **n8n / webhook**: URL do webhook do workflow

Vincule a integração na fila (campo Integração).

### 3. Payload que o n8n recebe (melhorado)

O backend envia POST JSON:

```json
{
  "ticketId": 123,
  "companyId": 1,
  "queueId": 2,
  "whatsappId": 1,
  "body": "texto do cliente",
  "contact": {
    "id": 10,
    "name": "João",
    "number": "5511999999999"
  }
}
```

### 4. Resposta esperada do n8n

Qualquer um destes formatos funciona:

```json
{ "messages": ["Olá!", "Seu boleto: https://..."] }
```

```json
{ "reply": "Segue a 2ª via..." }
```

```json
[{ "message": "Texto 1" }, { "message": "Texto 2" }]
```

Templates em `docs/templates/`.

### Keywords Typebot (recomendado ISP)

| Campo | Valor sugerido |
|-------|----------------|
| Encerrar | `#sair` |
| Reiniciar | `#reiniciar` |
| Mensagem desconhecida | `Não entendi. Digite o CPF ou #sair.` |

## Fase 2 — Fluxos nativos

1. Abra **Fluxos** no menu
2. Crie um fluxo (ou importe template ISP)
3. Vincule o fluxo a uma fila (`flowId`)
4. Quando o cliente cair nessa fila com chatbot ativo, o `FlowEngine` executa os nós

### Tipos de nó

| Tipo | Função |
|------|--------|
| `message` | Envia texto |
| `menu` | Lista opções (1, 2, 3…) |
| `input` | Captura variável (CPF, CEP…) |
| `condition` | Desvia por expressão |
| `http` | Chama API genérica |
| `isp_action` | Conector ERP (Fase 3) |
| `transfer` | Transfere para fila / desliga bot |
| `typebot` / `n8n` | Delega para integração externa |
| `end` | Encerra fluxo |

Estado no ticket: `flowId`, `flowNodeKey`, `flowVariables`.

## Fase 3 — Conectores ISP

Configure em Settings da empresa (JSON em `IspConnector` / settings):

```json
{
  "provider": "ixc",
  "baseUrl": "https://seu-ixc.com.br",
  "token": "SEU_TOKEN",
  "actions": {
    "lookupClient": "/webservice/v1/cliente",
    "getInvoice": "/webservice/v1/fn_areceber"
  }
}
```

Providers suportados (adapters): `ixc`, `sgp`, `hubsoft`, `generic`.

Templates de fluxo ISP: endpoint `POST /flows/templates/isp` ou botão **Importar template ISP** na UI.
