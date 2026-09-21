import React, { useState, useEffect, useMemo } from "react";
import {
  Drawer,
  Typography,
  IconButton,
  TextField,
  Button,
  Tabs,
  Tab,
  Chip,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";
import DeleteIcon from "@material-ui/icons/Delete";
import AddIcon from "@material-ui/icons/Add";
import { NODE_META, ISP_ACTION_LABELS } from "./FlowRfNode";
import { conditionToConnection, connectionToCondition } from "./flowConverters";
import {
  toSelectValue,
  parseSelectId,
  sameSelectId,
  selectMenuPropsOverOverlay,
  createSelectMenuGuard
} from "../../helpers/muiSelect";

const useStyles = makeStyles(() => ({
  paper: {
    width: 440,
    maxWidth: "100vw",
    background: "#1e1e1e",
    color: "#e8e8e8",
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid #333"
  },
  header: {
    padding: "16px 16px 8px",
    borderBottom: "1px solid #333",
    position: "relative"
  },
  title: {
    fontWeight: 700,
    fontSize: 18,
    color: "#fff"
  },
  subtitle: {
    fontSize: 12,
    color: "#9e9e9e",
    marginTop: 4
  },
  close: {
    position: "absolute",
    top: 8,
    right: 8,
    color: "#bbb"
  },
  body: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 16px 24px"
  },
  field: {
    marginBottom: 14,
    "& .MuiOutlinedInput-root": {
      background: "#2a2a2a",
      color: "#eee",
      "& fieldset": { borderColor: "#444" },
      "&:hover fieldset": { borderColor: "#666" },
      "&.Mui-focused fieldset": { borderColor: "#42a5f5" }
    },
    "& .MuiInputLabel-root": { color: "#aaa" },
    "& .MuiInputLabel-outlined.MuiInputLabel-shrink": { color: "#90caf9" },
    "& .MuiFormHelperText-root": { color: "#888" },
    "& .MuiSelect-icon": { color: "#aaa" }
  },
  helper: {
    fontSize: 11,
    color: "#888",
    marginTop: -8,
    marginBottom: 12
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: 15,
    color: "#fff",
    margin: "16px 0 10px"
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
    minHeight: 32,
    padding: 8,
    background: "#2a2a2a",
    borderRadius: 6,
    border: "1px solid #444"
  },
  chip: {
    background: "#1976d2",
    color: "#fff",
    "& .MuiChip-deleteIcon": { color: "rgba(255,255,255,0.75)" }
  },
  tabs: {
    minHeight: 40,
    borderBottom: "1px solid #333",
    "& .MuiTab-root": {
      minHeight: 40,
      color: "#9e9e9e",
      textTransform: "none",
      fontWeight: 600
    },
    "& .Mui-selected": { color: "#42a5f5" },
    "& .MuiTabs-indicator": { backgroundColor: "#42a5f5" }
  },
  optionRow: {
    display: "flex",
    gap: 6,
    alignItems: "flex-start",
    marginBottom: 8
  },
  footer: {
    padding: "12px 16px",
    borderTop: "1px solid #333",
    display: "flex",
    justifyContent: "space-between",
    gap: 8
  },
  selectDark: {
    background: "#2a2a2a",
    color: "#eee",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#444" },
    "& .MuiSvgIcon-root": { color: "#aaa" }
  }
}));

/** Menu acima do drawer (z-index 1400) para o clique na opção valer. */
const SELECT_MENU_PROPS = selectMenuPropsOverOverlay({
  background: "#2a2a2a",
  color: "#eee"
});

const GATILHO_TIPOS = [
  {
    value: "topsapp_lookup",
    label: "» TOPSAPP - Identificação do cliente/contrato",
    action: "lookupClient"
  },
  {
    value: "topsapp_invoice",
    label: "» TOPSAPP - 2ª via / boleto",
    action: "getInvoice"
  },
  {
    value: "topsapp_unlock",
    label: "» TOPSAPP - Liberação por confiança",
    action: "unlockService"
  },
  {
    value: "topsapp_support",
    label: "» TOPSAPP - Abrir chamado",
    action: "openTicket"
  },
  {
    value: "coverage",
    label: "» Viabilidade / cobertura",
    action: "checkCoverage"
  },
  {
    value: "message",
    label: "» Mensagem / menu genérico",
    action: null
  },
  {
    value: "transfer",
    label: "» Transferir para atendimento humano",
    action: "transfer"
  }
];

const ChipInput = ({ tags = [], onChange, placeholder = "Digite a Tag" }) => {
  const classes = useStyles();
  const [draft, setDraft] = useState("");

  const addTag = raw => {
    const t = String(raw || "").trim();
    if (!t) return;
    if (tags.some(x => x.toLowerCase() === t.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...tags, t]);
    setDraft("");
  };

  return (
    <div>
      <div className={classes.chips}>
        {tags.map(tag => (
          <Chip
            key={tag}
            size="small"
            label={tag}
            className={classes.chip}
            onDelete={() => onChange(tags.filter(t => t !== tag))}
          />
        ))}
        <TextField
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            e.stopPropagation();
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(draft.replace(/,/g, ""));
            }
            if (e.key === "Backspace" && !draft && tags.length) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={() => {
            if (draft.trim()) addTag(draft);
          }}
          placeholder={tags.length ? "" : placeholder}
          InputProps={{ disableUnderline: true }}
          style={{ flex: 1, minWidth: 100 }}
          inputProps={{ style: { color: "#eee", fontSize: 13, padding: "4px 0" } }}
        />
      </div>
    </div>
  );
};

const DarkField = ({ className, InputProps, ...props }) => {
  const classes = useStyles();
  return (
    <TextField
      {...props}
      className={`${classes.field} ${className || ""}`}
      fullWidth
      margin="dense"
      variant="outlined"
      InputProps={{
        ...InputProps,
        onKeyDown: e => {
          e.stopPropagation();
          InputProps?.onKeyDown?.(e);
        }
      }}
    />
  );
};

/** MenuItem direto: o Select lê value só no filho imediato — nunca wrappear. */
const deptItem = queue => (
  <MenuItem key={queue.id} value={toSelectValue(queue.id)}>
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: queue.color || "#90a4ae",
        marginRight: 10,
        flexShrink: 0
      }}
    />
    {queue.name}
  </MenuItem>
);

const renderDeptValue = (queues, val, emptyLabel) => {
  if (!val) return <em style={{ color: "#999" }}>{emptyLabel}</em>;
  const q = queues.find(x => sameSelectId(x.id, val));
  return q ? (
    <span style={{ display: "flex", alignItems: "center" }}>
      <span
        style={{
          display: "inline-block",
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: q.color || "#90a4ae",
          marginRight: 10,
          flexShrink: 0
        }}
      />
      {q.name}
    </span>
  ) : (
    `Departamento #${val}`
  );
};

/**
 * Drawer Quark: "Gerenciar ação!" — abre ao clicar no nó/aresta.
 */
const FlowActionDrawer = ({
  open,
  selection,
  onClose,
  onChangeNode,
  onChangeEdge,
  onDelete,
  queues = []
}) => {
  const classes = useStyles();
  const [tab, setTab] = useState(0);
  const menuGuard = useMemo(() => createSelectMenuGuard(220), []);
  const selectLifecycle = {
    onOpen: () => menuGuard.onOpen(),
    onClose: () => menuGuard.onClose()
  };

  useEffect(() => {
    setTab(0);
  }, [selection?.kind, selection?.node?.id, selection?.edge?.id]);

  const isEdge = selection?.kind === "edge";
  const node = selection?.kind === "node" ? selection.node : null;
  const edge = isEdge ? selection.edge : null;
  const data = node?.data || {};
  const config = data.config || {};
  const meta = NODE_META[data.nodeType] || {};

  const patch = partial => {
    if (!node) return;
    onChangeNode(node.id, partial);
  };
  const patchConfig = partial => patch({ config: partial });

  const gatilhos =
    config.triggerKeywords ||
    config.gatilhos ||
    (data.nodeType === "menu"
      ? (config.options || []).flatMap(o => o.keywords || [])
      : []) ||
    [];

  const gatilhoTipo =
    config.gatilhoTipo ||
    (data.nodeType === "isp_action"
      ? GATILHO_TIPOS.find(g => g.action === (config.action || "lookupClient"))
          ?.value || "topsapp_lookup"
      : data.nodeType === "transfer"
      ? "transfer"
      : "message");

  const renderEdgeForm = () => {
    const parsed = conditionToConnection(edge.data?.condition);
    return (
      <>
        <Typography className={classes.sectionTitle}>Conexão</Typography>
        <Typography className={classes.helper}>
          {edge.source} → {edge.target}
        </Typography>
        <FormControl fullWidth margin="dense" variant="outlined" className={classes.field}>
          <InputLabel>Tipo de conexão</InputLabel>
          <Select
            label="Tipo de conexão"
            value={parsed.type === "exact" ? "exact" : parsed.type}
            className={classes.selectDark}
            MenuProps={SELECT_MENU_PROPS}
            {...selectLifecycle}
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
            <MenuItem value="auto">⚡ Automático</MenuItem>
            <MenuItem value="default">Padrão (qualquer)</MenuItem>
            <MenuItem value="keyword">Palavras-chave</MenuItem>
            <MenuItem value="exact">Exato</MenuItem>
          </Select>
        </FormControl>
        {(parsed.type === "keyword" || parsed.type === "exact") && (
          <DarkField
            label={parsed.type === "keyword" ? "Keywords" : "Valor exato"}
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
          />
        )}
      </>
    );
  };

  const renderInicio = () => {
    if (isEdge) return renderEdgeForm();

    const isLookup =
      data.nodeType === "isp_action" &&
      (config.action === "lookupClient" ||
        config.action === "getClientProfile" ||
        gatilhoTipo === "topsapp_lookup");

    const isInputCpf =
      data.nodeType === "input" &&
      (config.variable === "cpf" || config.variable === "document");

    return (
      <>
        <FormControl fullWidth margin="dense" variant="outlined" className={classes.field}>
          <InputLabel>Gatilho para ação</InputLabel>
          <Select
            label="Gatilho para ação"
            value={gatilhoTipo}
            className={classes.selectDark}
            MenuProps={SELECT_MENU_PROPS}
            {...selectLifecycle}
            onChange={e => {
              const tipo = e.target.value;
              const found = GATILHO_TIPOS.find(g => g.value === tipo);
              const next = { gatilhoTipo: tipo };
              if (found?.action && found.action !== "transfer") {
                next.action = found.action;
              }
              patchConfig(next);
              if (found?.action === "transfer") {
                patch({ nodeType: "transfer" });
              } else if (found?.action && data.nodeType !== "isp_action") {
                /* só atualiza action no config; tipo do nó permanece */
              }
            }}
          >
            {GATILHO_TIPOS.map(g => (
              <MenuItem key={g.value} value={g.value}>
                {g.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography className={classes.helper}>
          As opções variam conforme o nível da automação e a integração ERP.
        </Typography>

        <DarkField
          label="Identificação da Ação"
          value={data.title || ""}
          onChange={e => patch({ title: e.target.value })}
        />

        <Typography variant="caption" style={{ color: "#aaa", display: "block", marginBottom: 4 }}>
          Gatilhos
        </Typography>
        <ChipInput
          tags={Array.isArray(gatilhos) ? gatilhos : []}
          onChange={next => {
            patchConfig({ triggerKeywords: next, gatilhos: next });
            if (data.nodeType === "menu" && (config.options || []).length) {
              /* mantém keywords do menu; gatilhos do nó também */
            }
          }}
        />
        <Typography className={classes.helper}>
          Textos que o cliente envia para disparar esta ação.
        </Typography>

        {(data.nodeType === "message" ||
          data.nodeType === "menu" ||
          data.nodeType === "input" ||
          data.nodeType === "transfer" ||
          data.nodeType === "end") && (
          <DarkField
            label="Mensagem / prompt"
            multiline
            rows={3}
            value={data.message || ""}
            onChange={e => patch({ message: e.target.value })}
            helperText="Use {{contactName}}, {{cpf}} ou @cliente_nome"
          />
        )}

        {(isLookup || isInputCpf || data.nodeType === "input") && (
          <>
            <DarkField
              label="Solicite identificação do cliente"
              multiline
              rows={3}
              value={
                config.askIdMessage ||
                data.message ||
                "Por favor informe o seu *CPF/CNPJ* para iniciarmos o seu atendimento:"
              }
              onChange={e => {
                patchConfig({ askIdMessage: e.target.value });
                if (data.nodeType === "input") {
                  patch({ message: e.target.value });
                }
              }}
            />
            <DarkField
              label="Identificação errada"
              multiline
              rows={2}
              value={
                config.invalidIdMessage ||
                "Opss. por favor informe um *CPF/CNPJ* válido"
              }
              onChange={e => patchConfig({ invalidIdMessage: e.target.value })}
            />
          </>
        )}

        {(isLookup || data.nodeType === "isp_action") && (
          <>
            <Typography className={classes.sectionTitle}>Após identificação</Typography>
            <DarkField
              label="Cliente não localizado no ERP"
              multiline
              rows={4}
              value={
                config.notFoundMessage ||
                "Não localizei seu cadastro. Confira o CPF/CNPJ ou fale com um atendente."
              }
              onChange={e => patchConfig({ notFoundMessage: e.target.value })}
            />
            <DarkField
              label="Lista de contratos encontrados"
              multiline
              rows={4}
              value={
                config.contractsListMessage ||
                "Olá {{contactName}}!\n\nEncontrei:\n{{lista_contratos}}\n\nDigite o número do contrato ou continue."
              }
              onChange={e =>
                patchConfig({ contractsListMessage: e.target.value })
              }
              helperText="Pressione @ / use {{variavel}} — ex.: {{contactName}}, {{lista_contratos}}"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(config.useAddressAsPlan)}
                  onChange={e =>
                    patchConfig({ useAddressAsPlan: e.target.checked })
                  }
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" style={{ color: "#ccc", fontSize: 12 }}>
                  Utilizar a descrição do endereço, no lugar do serviço, para
                  identificar o contrato, caso haja vários
                </Typography>
              }
            />
          </>
        )}

        {data.nodeType === "settings" && (
          <>
            <DarkField
              label="Timeout (minutos)"
              type="number"
              value={config.timeoutMinutes ?? 30}
              onChange={e =>
                patchConfig({ timeoutMinutes: Number(e.target.value) || 30 })
              }
            />
            <DarkField
              label="Mensagem fallback"
              multiline
              rows={3}
              value={config.fallbackMessage || ""}
              onChange={e => patchConfig({ fallbackMessage: e.target.value })}
            />
          </>
        )}

        {data.nodeType === "input" && (
          <DarkField
            label="Variável"
            value={config.variable || ""}
            onChange={e => patchConfig({ variable: e.target.value })}
          />
        )}

        {data.nodeType === "isp_action" && (
          <FormControl fullWidth margin="dense" variant="outlined" className={classes.field}>
            <InputLabel>Ação ISP (motor)</InputLabel>
            <Select
              label="Ação ISP (motor)"
              value={config.action || "lookupClient"}
              className={classes.selectDark}
              MenuProps={SELECT_MENU_PROPS}
              {...selectLifecycle}
              onChange={e => patchConfig({ action: e.target.value })}
            >
              {[
                "lookupClient",
                "getInvoice",
                "unlockService",
                "scheduleVisit",
                "getContract",
                "checkSignal",
                "checkCoverage",
                "openTicket",
                "custom"
              ].map(a => (
                <MenuItem key={a} value={a}>
                  {(ISP_ACTION_LABELS && ISP_ACTION_LABELS[a]) || a}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {data.nodeType === "menu" && (
          <Box mt={1}>
            <Typography className={classes.sectionTitle}>Opções do menu</Typography>
            {(config.options || []).map((opt, idx) => (
              <div key={idx} className={classes.optionRow}>
                <DarkField
                  label="#"
                  style={{ width: 56 }}
                  value={opt.option || ""}
                  onChange={e => {
                    const next = [...(config.options || [])];
                    next[idx] = { ...opt, option: e.target.value };
                    patchConfig({ options: next });
                  }}
                />
                <DarkField
                  label="Rótulo"
                  value={opt.label || ""}
                  onChange={e => {
                    const next = [...(config.options || [])];
                    next[idx] = { ...opt, label: e.target.value };
                    patchConfig({ options: next });
                  }}
                />
                <IconButton
                  size="small"
                  style={{ color: "#ef5350", marginTop: 8 }}
                  onClick={() => {
                    const next = (config.options || []).filter((_, i) => i !== idx);
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
              style={{ color: "#90caf9" }}
              onClick={() => {
                const options = config.options || [];
                patchConfig({
                  options: [
                    ...options,
                    {
                      option: String(options.length + 1),
                      label: `Opção ${options.length + 1}`,
                      keywords: []
                    }
                  ]
                });
              }}
            >
              Adicionar opção
            </Button>
          </Box>
        )}

        {data.nodeType === "transfer" && (
          <>
            <FormControl
              fullWidth
              margin="dense"
              variant="outlined"
              className={classes.field}
            >
              <InputLabel>Transferir para departamento</InputLabel>
              <Select
                label="Transferir para departamento"
                value={toSelectValue(config.queueId)}
                displayEmpty
                renderValue={val =>
                  renderDeptValue(
                    queues,
                    val,
                    "Departamento atual / espera"
                  )
                }
                className={classes.selectDark}
                MenuProps={SELECT_MENU_PROPS}
                {...selectLifecycle}
                onChange={e =>
                  patchConfig({
                    queueId: parseSelectId(e.target.value),
                    transferDepartament: toSelectValue(e.target.value)
                  })
                }
              >
                <MenuItem value="">
                  <em>Departamento atual / espera</em>
                </MenuItem>
                {queues.map(deptItem)}
              </Select>
              {queues.length === 0 && (
                <Typography className={classes.helper}>
                  Nenhum departamento cadastrado — crie em Departamentos.
                </Typography>
              )}
            </FormControl>
            <DarkField
              label="Mensagem antes da transferência"
              multiline
              rows={3}
              value={
                config.explainedMessage ||
                data.message ||
                "Estou transferindo seu atendimento. Aguarde um momento."
              }
              onChange={e => {
                patchConfig({ explainedMessage: e.target.value });
                patch({ message: e.target.value });
              }}
            />
          </>
        )}

        {data.nodeType === "end" && (
          <DarkField
            label="Mensagem de encerramento"
            multiline
            rows={3}
            value={
              config.explainedMessage ||
              data.message ||
              "Atendimento encerrado. Obrigado!"
            }
            onChange={e => {
              patchConfig({ explainedMessage: e.target.value });
              patch({ message: e.target.value });
            }}
          />
        )}

        {data.nodeType === "http" && (
          <>
            <DarkField
              label="URL"
              value={config.url || ""}
              onChange={e => patchConfig({ url: e.target.value })}
            />
            <DarkField
              label="Método"
              value={config.method || "GET"}
              onChange={e => patchConfig({ method: e.target.value })}
            />
          </>
        )}

        {data.nodeType === "condition" && (
          <>
            <DarkField
              label="Campo"
              value={config.field || ""}
              onChange={e => patchConfig({ field: e.target.value })}
            />
            <DarkField
              label="Valor"
              value={config.value || ""}
              onChange={e => patchConfig({ value: e.target.value })}
            />
          </>
        )}
      </>
    );
  };

  const renderTags = () => (
    <>
      <Typography className={classes.helper}>
        Como no Quark: tags do atendimento e do cliente ao executar a ação.
      </Typography>
      <Typography variant="caption" style={{ color: "#aaa" }}>
        Tags do atendimento
      </Typography>
      <ChipInput
        tags={
          config.ticketTags ||
          (config.tags?.tags_attendance
            ? String(config.tags.tags_attendance)
                .split(",")
                .map(s => s.trim())
                .filter(Boolean)
            : [])
        }
        onChange={next =>
          patchConfig({
            ticketTags: next,
            tags: {
              ...(config.tags || {}),
              is_tags_attendance: next.length ? "true" : "",
              tags_attendance: next.join(",")
            }
          })
        }
        placeholder="Digite a tag do atendimento"
      />
      <Typography className={classes.sectionTitle}>Tags do cliente</Typography>
      <ChipInput
        tags={
          config.contactTags ||
          (config.tags?.tags_client
            ? String(config.tags.tags_client)
                .split(",")
                .map(s => s.trim())
                .filter(Boolean)
            : [])
        }
        onChange={next =>
          patchConfig({
            contactTags: next,
            tags: {
              ...(config.tags || {}),
              is_tags_client: next.length ? "true" : "",
              tags_client: next.join(",")
            }
          })
        }
        placeholder="Digite a tag do cliente"
      />
    </>
  );

  const endAction =
    config.endAction ||
    (config.closeOnComplete
      ? "close"
      : data.nodeType === "transfer"
      ? "transfer"
      : data.nodeType === "end"
      ? "close"
      : "none");

  const renderEncerramento = () => (
    <>
      <Typography className={classes.helper}>
        Modelo Quark: ao concluir (ou timeout), nada / transferir para
        departamento / encerrar com mensagem.
      </Typography>

      <FormControl
        fullWidth
        margin="dense"
        variant="outlined"
        className={classes.field}
      >
        <InputLabel>Ação de encerramento</InputLabel>
        <Select
          label="Ação de encerramento"
          value={endAction}
          className={classes.selectDark}
          MenuProps={SELECT_MENU_PROPS}
          {...selectLifecycle}
          onChange={e => {
            const v = e.target.value;
            patchConfig({
              endAction: v,
              closeOnComplete: v === "close" || v === "transfer"
            });
          }}
        >
          <MenuItem value="none">Nenhuma (seguir fluxo / aguardar)</MenuItem>
          <MenuItem value="transfer">
            Transferir para departamento
          </MenuItem>
          <MenuItem value="close">Encerrar atendimento (com mensagem)</MenuItem>
        </Select>
      </FormControl>

      {endAction === "transfer" && (
        <>
          <FormControl
            fullWidth
            margin="dense"
            variant="outlined"
            className={classes.field}
          >
            <InputLabel>Departamento destino</InputLabel>
            <Select
              label="Departamento destino"
              value={toSelectValue(
                config.endQueueId != null && config.endQueueId !== ""
                  ? config.endQueueId
                  : config.queueId
              )}
              displayEmpty
              renderValue={val =>
                renderDeptValue(queues, val, "Selecione o departamento")
              }
              className={classes.selectDark}
              MenuProps={SELECT_MENU_PROPS}
              {...selectLifecycle}
              onChange={e => {
                const id = parseSelectId(e.target.value);
                patchConfig({
                  endQueueId: id,
                  queueId: id,
                  endDepartament: toSelectValue(e.target.value)
                });
              }}
            >
              <MenuItem value="">
                <em>Selecione o departamento</em>
              </MenuItem>
              {queues.map(deptItem)}
            </Select>
            {queues.length === 0 && (
              <Typography className={classes.helper}>
                Nenhum departamento cadastrado — crie em Departamentos.
              </Typography>
            )}
          </FormControl>
          <DarkField
            label="Mensagem ao transferir"
            multiline
            rows={4}
            value={
              config.endTransferMessage ||
              "Olá, estou transferindo o seu atendimento...\nAguarde, em breve você será atendido."
            }
            onChange={e =>
              patchConfig({ endTransferMessage: e.target.value })
            }
            helperText="Enviada no WhatsApp antes de ir para o departamento humano"
          />
        </>
      )}

      {endAction === "close" && (
        <DarkField
          label="Mensagem de encerramento"
          multiline
          rows={4}
          value={
            config.endMessage ||
            config.closeMessage ||
            "Atendimento encerrado.\n\n*Até logo, volte sempre que precisar!*"
          }
          onChange={e =>
            patchConfig({
              endMessage: e.target.value,
              closeMessage: e.target.value
            })
          }
        />
      )}

      <DarkField
        label="Timeout de inatividade (minutos)"
        type="number"
        value={config.endTime ?? config.timeoutMinutes ?? ""}
        onChange={e =>
          patchConfig({
            endTime: e.target.value === "" ? null : Number(e.target.value)
          })
        }
        helperText="No Quark (end_time): após N min sem resposta aplica a ação acima"
      />

      <FormControlLabel
        control={
          <Switch
            checked={Boolean(
              config.closedFinish === true ||
                config.closedFinish === "true" ||
                config.closeOnComplete
            )}
            onChange={e =>
              patchConfig({
                closedFinish: e.target.checked,
                closeOnComplete: e.target.checked
              })
            }
            color="primary"
          />
        }
        label={
          <Typography variant="body2" style={{ color: "#ccc", fontSize: 12 }}>
            Após sucesso desta ação, aplicar o encerramento automaticamente
            (ex.: após enviar 2ª via)
          </Typography>
        }
      />

      <DarkField
        label="Pesquisa de satisfação (opcional)"
        multiline
        rows={2}
        value={config.satisfactionMessage || ""}
        onChange={e => patchConfig({ satisfactionMessage: e.target.value })}
        helperText="Enviada depois do encerramento, se preenchida"
      />
    </>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={(_e, reason) => {
        // Evita fechar no click-through do Menu do Select (portal)
        if (
          reason === "backdropClick" &&
          menuGuard.shouldIgnoreBackdrop()
        ) {
          return;
        }
        onClose();
      }}
      ModalProps={{
        disableEnforceFocus: true,
        disableAutoFocus: true,
        disableRestoreFocus: true,
        keepMounted: true,
        style: { zIndex: 1400 }
      }}
      PaperProps={{
        className: classes.paper,
        style: { zIndex: 1401, overflow: "visible" },
        onMouseDown: e => e.stopPropagation(),
        onPointerDown: e => e.stopPropagation(),
        onClick: e => e.stopPropagation(),
        onKeyDown: e => e.stopPropagation()
      }}
    >
      <div className={classes.header}>
        <Typography className={classes.title}>{isEdge ? "Editar conexão" : (meta.label ? ("Configurar: " + meta.label) : "Configurar bloco")}</Typography>
        <Typography className={classes.subtitle}>
          Informe os parâmetros das ações da automação
        </Typography>
        <IconButton
          className={classes.close}
          type="button"
          size="small"
          onMouseDown={e => e.stopPropagation()}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
        >
          <CloseIcon />
        </IconButton>
      </div>

      {!isEdge && (
        <Tabs
          className={classes.tabs}
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
        >
          <Tab label="Ação" />
          <Tab label="Tags" />
          <Tab label="Encerramento" />
        </Tabs>
      )}

      <div
        className={classes.body}
        onKeyDown={e => e.stopPropagation()}
        onKeyUp={e => e.stopPropagation()}
      >
        {isEdge && renderEdgeForm()}
        {!isEdge && tab === 0 && renderInicio()}
        {!isEdge && tab === 1 && renderTags()}
        {!isEdge && tab === 2 && renderEncerramento()}

        {!isEdge && (
          <Typography
            variant="caption"
            style={{ display: "block", marginTop: 16, color: "#666" }}
          >
            {meta.label || data.nodeType} · key: {data.nodeKey}
          </Typography>
        )}
      </div>

      <div className={classes.footer}>
        <Button
          startIcon={<DeleteIcon />}
          style={{ color: "#ef5350" }}
          onClick={() => {
            if (isEdge) onDelete("edge", edge.id);
            else onDelete("node", node.id);
            onClose();
          }}
        >
          {isEdge ? "Remover conexão" : "Remover ação"}
        </Button>
        <Button
          variant="contained"
          color="primary"
          type="button"
          onMouseDown={e => e.stopPropagation()}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
        >
          Fechar
        </Button>
      </div>
    </Drawer>
  );
};

export default FlowActionDrawer;
