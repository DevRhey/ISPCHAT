# Editor gráfico de automações (LangGraph visual)

## Onde fica

| Menu | Rota | Função |
|------|------|--------|
| **Automações** | `/flows` | Lista, instalar template, pré-visualizar |
| **Editor gráfico** | `/flows/editor` | Criar automação no canvas |
| (editar) | `/flows/editor/:id` | Abrir grafo existente |

## Como criar uma automação

1. Menu **Editor gráfico** (ou Automações → Nova automação gráfica)
2. Arraste blocos da barra esquerda para o canvas
3. Conecte as bolinhas (handles) entre nós
4. Clique num nó → painel direito (mensagem, opções, keywords, ISP action…)
5. Clique numa aresta → defina **condição** (`1`, `true`, `false`…)
6. **Salvar** → grava no FlowEngine
7. Em **Filas**, selecione o fluxo no campo Fluxo ISP nativo

## Blocos disponíveis

- `start` · `message` · `menu` (gatilhos/keywords) · `input`
- `isp_action` (lookupClient, getInvoice, checkCoverage, openTicket)
- `condition` · `http` · `transfer` · `end`

## Relação com LangGraph

O canvas é o **modelo gráfico** para organizar o mesmo tipo de grafo (nós + arestas condicionais) usado no ISPCHAT. A execução no WhatsApp passa pelo **FlowEngine** nativo (determinístico). A integração `type=langgraph` continua sendo o motor IA embutido — não use os dois na mesma fila.

## Stack UI

- [React Flow](https://reactflow.dev/) v11
- Componentes: `frontend/src/components/FlowVisualEditor/`
- Página: `frontend/src/pages/FlowEditor/`
