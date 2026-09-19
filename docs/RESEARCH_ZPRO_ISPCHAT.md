# Pesquisa: ISPCHAT (Quark) × Z-PRO × nosso ISPCHAT

## O que é cada um

| Produto | Quem | Modelo de automação |
|---------|------|---------------------|
| **ISPCHAT Quark** | Quark Agência (marketing p/ ISPs) + stack típica Whaticket/Typebot | Forte em **disparos HSM/CSV** ([disparos.quarkagencia.com.br](https://disparos.quarkagencia.com.br/)) e chatbot WhatsApp para provedor; fluxos conversacionais costumam apoiar-se em **Typebot** / integrações (padrão do mercado ISP white-label). Documentação pública de “flow builder” nativo é escassa — o produto de marca é atendimento ISP + campanhas. |
| **Z-PRO (ZDG)** | [zpro.zdg.com.br](https://zpro.zdg.com.br/) | **Chat Flow** nativo documentado: canvas estilo n8n, blocos + **interações** + **conexões tipadas**. Fonte: [ajuda Chat Flow](https://ajuda.zdg.com.br/configuracao-administrador/automacao/chat-flow). |
| **Nosso ISPCHAT** | Fork Whaticket + FlowEngine + React Flow | Já temos canvas, menus com keywords, ISP actions e LangGraph. Faltava o modelo mental Z-PRO de **conexão ≠ interação**. |

## Como o Z-PRO faz (referência principal)

### Conceitos
1. **Fluxo** = jornada inteira  
2. **Bloco (nó)** = momento da conversa  
3. **Interação** = o que o bot *faz* no bloco (mensagem, etiqueta, webhook…) — em sequência  
4. **Conexão** = para onde *vai* depois da resposta do cliente  

> Interação ≠ conexão. Menu sem conexões nas opções **não avança**.

### Tipos de conexão (o diferencial)
| Tipo | Comportamento |
|------|----------------|
| **Padrão** | Espera *qualquer* resposta e avança |
| **⚡ Automático** | Não espera — encadeia na hora |
| **Palavras-chave** | Só avança se a resposta contiver uma das palavras (`1, comercial, vendas`) |

**Ordem de avaliação:** keywords → depois padrão (fallback).

### Blocos fixos
Todo fluxo tem: **Início**, **Configurações** (gatilho global, timeout, fallback), **Boas-vindas**.

### Gatilhos / audiência
- Palavra-gatilho no bloco Configurações  
- Filtros: contato novo/recorrente, tags, canal, kanban  
- Fluxo só roda depois de **vincular ao canal** (não só existir no banco)

### Interações (categorias)
- Mensagens (texto, mídia, botões, lista, HSM, PIX…)  
- Roteamento (transferir, sub-fluxo, atraso, bloquear bot)  
- Integrações (webhook, ChatGPT, Typebot, n8n…)  
- CRM (etiqueta, kanban, agenda…)

## Como o mercado “ISPCHAT / Typebot” faz
- Canvas com blocos de **entrada** (primeira mensagem / keyword)  
- Coleta de variáveis `{{var}}`  
- Condicionais e webhooks  
- Escape para humano  
- Typebot = builder conversacional; Whaticket/Z-PRO = inbox + binding ao canal

## Lacunas no nosso sistema (antes desta melhoria)

| Z-PRO | Nós (antes) |
|-------|-------------|
| Conexão Automática vs Padrão vs Keyword no **canvas** | Keyword só dentro do nó `menu`; `message` sempre seguia (auto implícito) |
| Bloco Configurações (timeout, gatilho, fallback) | Não havia |
| Modal ao conectar escolhendo o tipo | Aresta só com `condition` livre |
| Avisos de conexões faltando | Não havia |
| Vincular ao **canal** WhatsApp | Só `queue.flowId` |

## Melhorias aplicadas

1. Tipos de conexão no editor + persistência (`auto` / `default` / `kw:…` / exact)
2. Modal ao conectar (estilo Z-PRO) pedindo o tipo
3. FlowEngine: auto não espera; default/keyword esperam e roteiam (keywords → exact → default)
4. Nó `settings` (gatilho, timeout, fallback) na paleta e no fluxo master
5. Inspector de aresta/nó alinhado ao vocabulário Z-PRO
6. Estilo visual das arestas por tipo (verde=auto, roxo=keyword, cinza=padrão)

### Como usar no editor
1. Arraste blocos (inclui **Configurações**)
2. Conecte handles → escolha **⚡ Automático**, **Padrão**, **Palavras-chave** ou **Exato**
3. Clique na aresta para editar o tipo depois
4. Menu: opções no nó + arestas `Exato=1/2/3` para cada saída
5. Salve e vincule o fluxo à **fila** (queueId)

Próximos passos (backlog): binding direto na conexão WhatsApp, delay, tags, sub-fluxo, simulação de teste no canvas, timeout real do settings.
