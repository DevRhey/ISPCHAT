import React from "react";
import {
  TextField,
  Typography,
  Button,
  IconButton,
  Divider,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import DeleteIcon from "@material-ui/icons/Delete";
import AddIcon from "@material-ui/icons/Add";
import { NODE_META, ISP_ACTION_LABELS } from "./FlowRfNode";
import { conditionToConnection, connectionToCondition } from "./flowConverters";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
    height: "100%",
    overflowY: "auto",
    background: "#fafafa",
    borderLeft: "1px solid #e0e0e0"
  },
  section: {
    marginBottom: theme.spacing(2)
  },
  optionRow: {
    display: "flex",
    gap: 6,
    alignItems: "flex-start",
    marginBottom: 8
  },
  empty: {
    opacity: 0.7,
    paddingTop: theme.spacing(4),
    textAlign: "center"
  }
}));

const ISP_ACTIONS = [
  "lookupClient",
  "getInvoice",
  "unlockService",
  "scheduleVisit",
  "getContract",
  "checkSignal",
  "checkCoverage",
  "openTicket",
  "custom"
];

const FlowNodeInspector = ({
  selection,
  onChangeNode,
  onChangeEdge,
  onDelete
}) => {
  const classes = useStyles();

  if (!selection) {
    return (
      <div className={classes.root}>
        <Typography className={classes.empty} variant="body2">
          Modelo Z-PRO: <strong>interação</strong> (o que o bot faz) no nó;
          <strong> conexão</strong> (para onde vai) na aresta.
          <br />
          <br />
          Ao conectar, escolha: ⚡ Automático, Padrão ou Palavras-chave.
        </Typography>
      </div>
    );
  }

  if (selection.kind === "edge") {
    const edge = selection.edge;
    const parsed = conditionToConnection(edge.data?.condition);
    return (
      <div className={classes.root}>
        <Typography variant="subtitle1" gutterBottom>
          Conexão (estilo Z-PRO)
        </Typography>
        <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
          {edge.source} → {edge.target}
        </Typography>
        <FormControl fullWidth margin="dense" variant="outlined">
          <InputLabel>Tipo de conexão</InputLabel>
          <Select
            label="Tipo de conexão"
            value={parsed.type === "exact" ? "exact" : parsed.type}
            onChange={e => {
              const type = e.target.value;
              const condition = connectionToCondition(type, parsed.keywords);
              const label =
                type === "auto"
                  ? "⚡ auto"
                  : type === "default"
                  ? "qualquer resposta"
                  : type === "keyword"
                  ? `kw: ${parsed.keywords || ""}`
                  : condition;
              onChangeEdge(edge.id, { condition, label });
            }}
          >
            <MenuItem value="auto">⚡ Automático (não espera)</MenuItem>
            <MenuItem value="default">Padrão (qualquer resposta)</MenuItem>
            <MenuItem value="keyword">Palavras-chave</MenuItem>
            <MenuItem value="exact">Exato (nº opção / true|false)</MenuItem>
          </Select>
        </FormControl>
        {(parsed.type === "keyword" || parsed.type === "exact") && (
          <TextField
            label={parsed.type === "keyword" ? "Keywords (vírgula)" : "Valor exato"}
            fullWidth
            margin="dense"
            variant="outlined"
            value={parsed.keywords || ""}
            onChange={e => {
              const condition = connectionToCondition(parsed.type, e.target.value);
              onChangeEdge(edge.id, {
                condition,
                label:
                  parsed.type === "keyword"
                    ? `kw: ${e.target.value}`
                    : e.target.value
              });
            }}
            helperText={
              parsed.type === "keyword"
                ? "Ex.: 1, boleto, pix — avaliadas antes do Padrão"
                : "Ex.: 1, true, false"
            }
          />
        )}
        <TextField
          label="Rótulo no gráfico"
          fullWidth
          margin="dense"
          variant="outlined"
          value={edge.data?.label || edge.label || ""}
          onChange={e => onChangeEdge(edge.id, { label: e.target.value })}
        />
        <Button
          color="secondary"
          startIcon={<DeleteIcon />}
          onClick={() => onDelete("edge", edge.id)}
          style={{ marginTop: 16 }}
        >
          Remover conexão
        </Button>
      </div>
    );
  }

  const node = selection.node;
  const data = node.data || {};
  const meta = NODE_META[data.nodeType] || {};
  const config = data.config || {};
  const options = config.options || [];

  const patch = partial => onChangeNode(node.id, partial);
  const patchConfig = partial =>
    patch({ config: { ...config, ...partial } });

  return (
    <div className={classes.root}>
      <Typography variant="subtitle1" gutterBottom>
        {meta.label || data.nodeType}
      </Typography>
      <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
        key: {data.nodeKey} · interação do bloco
      </Typography>

      <div className={classes.section}>
        <TextField
          label="Título"
          fullWidth
          margin="dense"
          variant="outlined"
          value={data.title || ""}
          onChange={e => patch({ title: e.target.value })}
        />
        {["message", "menu", "input", "transfer", "end"].includes(data.nodeType) && (
          <TextField
            label="Mensagem / prompt"
            fullWidth
            margin="dense"
            variant="outlined"
            multiline
            rows={4}
            value={data.message || ""}
            onChange={e => patch({ message: e.target.value })}
            helperText="Use {{contactName}}, {{cpf}}, etc."
          />
        )}
      </div>

      {data.nodeType === "settings" && (
        <>
          <TextField
            label="Palavras-gatilho (vírgula)"
            fullWidth
            margin="dense"
            variant="outlined"
            value={(config.triggerKeywords || []).join(", ")}
            onChange={e =>
              patchConfig({
                triggerKeywords: e.target.value
                  .split(",")
                  .map(s => s.trim())
                  .filter(Boolean)
              })
            }
          />
          <TextField
            label="Timeout (minutos)"
            fullWidth
            margin="dense"
            variant="outlined"
            type="number"
            value={config.timeoutMinutes ?? 30}
            onChange={e =>
              patchConfig({ timeoutMinutes: Number(e.target.value) || 30 })
            }
          />
          <TextField
            label="Mensagem fallback"
            fullWidth
            margin="dense"
            variant="outlined"
            multiline
            rows={3}
            value={config.fallbackMessage || ""}
            onChange={e => patchConfig({ fallbackMessage: e.target.value })}
          />
        </>
      )}

      {data.nodeType === "input" && (
        <TextField
          label="Variável"
          fullWidth
          margin="dense"
          variant="outlined"
          value={config.variable || ""}
          onChange={e => patchConfig({ variable: e.target.value })}
        />
      )}

      {data.nodeType === "isp_action" && (
        <FormControl fullWidth margin="dense" variant="outlined">
          <InputLabel>Ação ISP</InputLabel>
          <Select
            label="Ação ISP"
            value={config.action || "lookupClient"}
            onChange={e => patchConfig({ action: e.target.value })}
          >
            {ISP_ACTIONS.map(a => (
              <MenuItem key={a} value={a}>
                {(ISP_ACTION_LABELS && ISP_ACTION_LABELS[a]) || a}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {data.nodeType === "condition" && (
        <>
          <TextField
            label="Campo (variável)"
            fullWidth
            margin="dense"
            variant="outlined"
            value={config.field || ""}
            onChange={e => patchConfig({ field: e.target.value })}
          />
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel>Operador</InputLabel>
            <Select
              label="Operador"
              value={config.operator || "eq"}
              onChange={e => patchConfig({ operator: e.target.value })}
            >
              <MenuItem value="eq">igual</MenuItem>
              <MenuItem value="contains">contém</MenuItem>
              <MenuItem value="gt">maior que</MenuItem>
              <MenuItem value="lt">menor que</MenuItem>
              <MenuItem value="truthy">preenchido</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Valor"
            fullWidth
            margin="dense"
            variant="outlined"
            value={config.value || ""}
            onChange={e => patchConfig({ value: e.target.value })}
          />
        </>
      )}

      {data.nodeType === "http" && (
        <>
          <TextField
            label="URL"
            fullWidth
            margin="dense"
            variant="outlined"
            value={config.url || ""}
            onChange={e => patchConfig({ url: e.target.value })}
          />
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel>Método</InputLabel>
            <Select
              label="Método"
              value={config.method || "GET"}
              onChange={e => patchConfig({ method: e.target.value })}
            >
              {["GET", "POST", "PUT", "PATCH", "DELETE"].map(m => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Salvar resposta em"
            fullWidth
            margin="dense"
            variant="outlined"
            value={config.storeAs || "httpResult"}
            onChange={e => patchConfig({ storeAs: e.target.value })}
          />
        </>
      )}

      {data.nodeType === "transfer" && (
        <TextField
          label="ID do departamento destino (opcional)"
          fullWidth
          margin="dense"
          variant="outlined"
          value={config.queueId ?? ""}
          onChange={e =>
            patchConfig({
              queueId: e.target.value === "" ? null : Number(e.target.value)
            })
          }
        />
      )}

      {data.nodeType === "menu" && (
        <div className={classes.section}>
          <Typography variant="subtitle2" gutterBottom>
            Opções do menu
          </Typography>
          {options.map((opt, idx) => (
            <div key={idx} className={classes.optionRow}>
              <TextField
                label="#"
                variant="outlined"
                margin="dense"
                style={{ width: 56 }}
                value={opt.option || ""}
                onChange={e => {
                  const next = [...options];
                  next[idx] = { ...opt, option: e.target.value };
                  patchConfig({ options: next });
                }}
              />
              <TextField
                label="Rótulo"
                variant="outlined"
                margin="dense"
                fullWidth
                value={opt.label || ""}
                onChange={e => {
                  const next = [...options];
                  next[idx] = { ...opt, label: e.target.value };
                  patchConfig({ options: next });
                }}
              />
              <TextField
                label="Keywords"
                variant="outlined"
                margin="dense"
                fullWidth
                value={(opt.keywords || []).join(", ")}
                onChange={e => {
                  const next = [...options];
                  next[idx] = {
                    ...opt,
                    keywords: e.target.value
                      .split(",")
                      .map(s => s.trim())
                      .filter(Boolean)
                  };
                  patchConfig({ options: next });
                }}
              />
              <IconButton
                size="small"
                onClick={() => {
                  const next = options.filter((_, i) => i !== idx);
                  patchConfig({ options: next });
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </div>
          ))}
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() =>
              patchConfig({
                options: [
                  ...options,
                  {
                    option: String(options.length + 1),
                    label: `Opção ${options.length + 1}`,
                    keywords: []
                  }
                ]
              })
            }
          >
            Adicionar opção
          </Button>
          <Divider style={{ margin: "12px 0" }} />
          <Typography variant="caption" color="textSecondary">
            Ligue cada opção com conexão <strong>Exato</strong> = número (ex.: 1).
          </Typography>
        </div>
      )}

      <Button
        color="secondary"
        startIcon={<DeleteIcon />}
        onClick={() => onDelete("node", node.id)}
        style={{ marginTop: 24 }}
      >
        Remover nó
      </Button>
    </div>
  );
};

export default FlowNodeInspector;
