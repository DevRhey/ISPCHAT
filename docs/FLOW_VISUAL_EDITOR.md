# Editor gráfico de automações ISPCHAT

## Onde fica

| Menu | Rota | Função |
|------|------|--------|
| **Automações** | `/flows` ou `/v2/automacoes` | Lista, templates, pré-visualizar |
| **Editor gráfico** | `/flows/editor` | Criar automação no canvas |
| (editar) | `/flows/editor/:id` | Abrir grafo existente |

## Como criar (rápido)

1. Abra **Automações** → **Nova automação gráfica** (ou Editor).
2. Arraste um bloco da biblioteca **ou** clique em **+ Adicionar no centro**.
3. Conecte as bolinhas entre nós.
4. No diálogo, escolha: automático / qualquer resposta / palavra-chave / opção exata.
5. Clique no nó → painel direito (mensagem, menu, ação ISP, tags, encerramento).
6. **Salvar fluxo** → em **Filas**, vincule o fluxo no campo de fluxo ISP.

## Blocos

- Essenciais: Início, Configurações, Mensagem, Menu, Input, Encerrar
- ISP: Ação do provedor (ERP), Atendente humano
- Lógica: Condição (true/false), HTTP, Typebot, n8n

## Motores (recomendação gratuita)

| Camada | Ferramenta | Papel | Veredito |
|--------|------------|-------|----------|
| Canvas UI | **React Flow v11** (MIT) | Editor visual | Melhor opção free para grafo no browser |
| Execução WhatsApp | **FlowEngine** nativo | Roda o grafo salvo | Orquestrador principal — mantenha |
| Intenções ISP | **miniLangGraph** embutido | Classifica boleto/técnico/etc. | Adequado e sem custo de LangChain cloud |
| Jornadas longas | **Typebot** e/ou **n8n** (self-host) | Formulários / webhooks complexos | Opcional; não substituem o FlowEngine na fila |

**Não use** `type=langgraph` e um fluxo FlowEngine **na mesma fila** ao mesmo tempo — escolha um motor por fila.

## Stack UI

- `frontend/src/components/FlowVisualEditor/` (nós, drawer, paleta, converters)
- `frontend/src/pages/FlowEditor/`
- `frontend/src/pages/Flows/`
