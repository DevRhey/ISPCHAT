import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useHistory, useParams } from "react-router-dom";
import { v2FlowEditorPath, v2FlowsListPath } from "../../helpers/v2Paths";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  ReactFlowProvider,
  MarkerType
} from "reactflow";
import "reactflow/dist/style.css";

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  IconButton,
  Paper,
  Tooltip,
  CircularProgress,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Select,
  MenuItem
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import SaveIcon from "@material-ui/icons/Save";
import AccountTreeIcon from "@material-ui/icons/AccountTree";
import ZoomOutMapIcon from "@material-ui/icons/ZoomOutMap";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import FlowRfNode, { NODE_META } from "../../components/FlowVisualEditor/FlowRfNode";
import FlowActionDrawer from "../../components/FlowVisualEditor/FlowActionDrawer";
import FlowPalette from "../../components/FlowVisualEditor/FlowPalette";
import { toSelectValue } from "../../helpers/muiSelect";
import {
  apiToRf,
  rfToApi,
  newNodeKey,
  defaultConfigForType,
  connectionToCondition,
  conditionToConnection
} from "../../components/FlowVisualEditor/flowConverters";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    background: "#0f1419",
    color: "#e8eef2"
  },
  bar: {
    background: "linear-gradient(90deg, #0d3b2e 0%, #123047 55%, #1a1f2e 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.08)"
  },
  titleField: {
    marginLeft: theme.spacing(1.5),
    minWidth: 180,
    maxWidth: 260,
    "& .MuiInputBase-input": { color: "#fff" },
    "& .MuiInput-underline:before": { borderBottomColor: "rgba(255,255,255,0.3)" }
  },
  selectLight: {
    marginLeft: theme.spacing(1.5),
    minWidth: 160,
    maxWidth: 220,
    color: "#fff",
    "& .MuiSelect-icon": { color: "rgba(255,255,255,0.7)" },
    "&:before": { borderBottomColor: "rgba(255,255,255,0.3)" },
    "&:after": { borderBottomColor: "#26a69a" }
  },
  body: {
    flex: 1,
    display: "flex",
    minHeight: 0
  },
  palette: {
    width: 168,
    flexShrink: 0,
    padding: theme.spacing(1),
    background: "#151b22",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    overflowY: "auto"
  },
  paletteTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    opacity: 0.7,
    margin: theme.spacing(1, 0.5, 1.5)
  },
  paletteItem: {
    display: "block",
    width: "100%",
    textAlign: "left",
    marginBottom: 6,
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#1c2430",
    color: "#e8eef2",
    cursor: "grab",
    fontSize: 12,
    fontWeight: 600,
    "&:hover": { borderColor: "#26a69a", background: "#243040" }
  },
  canvasWrap: {
    flex: 1,
    position: "relative",
    background: "#0b1016"
  },
  hint: {
    position: "absolute",
    left: 12,
    bottom: 12,
    zIndex: 5,
    padding: "8px 12px",
    background: "rgba(15,20,25,0.85)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    fontSize: 11,
    maxWidth: 320,
    pointerEvents: "none"
  }
}));

const nodeTypes = { flowNode: FlowRfNode };


const edgeStyleForCondition = condition => {
  const { type } = conditionToConnection(condition);
  if (type === "auto") {
    return { stroke: "#26a69a", strokeWidth: 2, animated: true, label: "⚡ auto" };
  }
  if (type === "keyword") {
    return {
      stroke: "#7e57c2",
      strokeWidth: 2,
      animated: true,
      label: `kw: ${conditionToConnection(condition).keywords}`
    };
  }
  if (type === "default") {
    return { stroke: "#90a4ae", strokeWidth: 2, animated: false, label: "qualquer" };
  }
  return {
    stroke: "#78909c",
    strokeWidth: 2,
    animated: Boolean(condition),
    label: condition || ""
  };
};

const FlowEditorInner = () => {
  const classes = useStyles();
  const history = useHistory();
  const { flowId } = useParams();
  const reactFlowWrapper = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);

  const [loading, setLoading] = useState(Boolean(flowId));
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({
    id: flowId || null,
    name: "Nova automação",
    description: "",
    active: true,
    queueId: "",
    entryNodeKey: "start"
  });
  const [queues, setQueues] = useState([]);
  const [allFlows, setAllFlows] = useState([]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selection, setSelection] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [connectDlg, setConnectDlg] = useState(null); // { params }
  const [connType, setConnType] = useState("auto");
  const [connKeywords, setConnKeywords] = useState("");
  // Mantém o alvo do drawer estável (id) para não fechar ao focar nos inputs
  const drawerTargetRef = useRef(null);
  const ignoreSelectionRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [qRes, fRes] = await Promise.all([
          api.get("/queue"),
          api.get("/flows")
        ]);
        setQueues(Array.isArray(qRes.data) ? qRes.data : []);
        setAllFlows(Array.isArray(fRes.data) ? fRes.data : []);
      } catch {
        /* silencioso */
      }
    })();
  }, []);

  const loadFlow = useCallback(async id => {
    setLoading(true);
    try {
      const { data } = await api.get(`/flows/${id}`);
      setMeta({
        id: data.id,
        name: data.name || "",
        description: data.description || "",
        active: data.active !== false,
        queueId: toSelectValue(data.queueId),
        entryNodeKey: data.entryNodeKey || "start"
      });
      const converted = apiToRf(data.nodes || [], data.edges || []);
      setNodes(converted.nodes);
      setEdges(converted.edges);
    } catch (err) {
      toastError(err);
      history.push(v2FlowsListPath());
    } finally {
      setLoading(false);
    }
  }, [history, setNodes, setEdges]);

  useEffect(() => {
    if (flowId) loadFlow(flowId);
    else {
      // canvas inicial estilo Z-PRO: Início → Configurações → Boas-vindas
      setNodes([
        {
          id: "start",
          type: "flowNode",
          position: { x: 280, y: 20 },
          data: {
            nodeKey: "start",
            nodeType: "start",
            title: "Início",
            message: "",
            config: {}
          }
        },
        {
          id: "settings",
          type: "flowNode",
          position: { x: 280, y: 120 },
          data: {
            nodeKey: "settings",
            nodeType: "settings",
            title: "Configurações",
            message: "",
            config: defaultConfigForType("settings")
          }
        },
        {
          id: "welcome",
          type: "flowNode",
          position: { x: 280, y: 240 },
          data: {
            nodeKey: "welcome",
            nodeType: "message",
            title: "Boas-vindas",
            message: "Olá, {{contactName}}! Como posso ajudar?",
            config: {}
          }
        }
      ]);
      setEdges([
        {
          id: "e-start-settings",
          source: "start",
          target: "settings",
          label: "⚡ auto",
          data: { condition: "auto", label: "⚡ auto" },
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: "#26a69a" },
          style: { stroke: "#26a69a", strokeWidth: 2 }
        },
        {
          id: "e-settings-welcome",
          source: "settings",
          target: "welcome",
          label: "⚡ auto",
          data: { condition: "auto", label: "⚡ auto" },
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: "#26a69a" },
          style: { stroke: "#26a69a", strokeWidth: 2 }
        }
      ]);
    }
  }, [flowId, loadFlow, setNodes, setEdges]);

  const onConnect = useCallback(params => {
    setConnType("auto");
    setConnKeywords("");
    setConnectDlg({ params });
  }, []);

  const confirmConnect = () => {
    if (!connectDlg?.params) return;
    const condition = connectionToCondition(connType, connKeywords);
    const styleMeta = edgeStyleForCondition(condition);
    const label =
      connType === "auto"
        ? "⚡ auto"
        : connType === "default"
        ? "qualquer resposta"
        : connType === "keyword"
        ? `kw: ${connKeywords}`
        : connKeywords || styleMeta.label;

    setEdges(eds =>
      addEdge(
        {
          ...connectDlg.params,
          id: `e-${connectDlg.params.source}-${connectDlg.params.target}-${Date.now()}`,
          label,
          data: { condition, label },
          animated: styleMeta.animated,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: styleMeta.stroke
          },
          style: { stroke: styleMeta.stroke, strokeWidth: styleMeta.strokeWidth },
          labelStyle: { fill: "#546e7a", fontSize: 10, fontWeight: 600 }
        },
        eds
      )
    );
    setConnectDlg(null);
  };

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };


  const addNodeAtCenter = useCallback(
    type => {
      if (!type) return;
      const keys = nodes.map(n => n.id);
      const key = type === "start" && !keys.includes("start") ? "start" : newNodeKey(type, keys);
      const metaType = NODE_META[type] || { label: type };
      let position = { x: 280, y: 180 };
      if (rfInstance) {
        const bounds = reactFlowWrapper.current && reactFlowWrapper.current.getBoundingClientRect();
        if (bounds) {
          position = rfInstance.project({
            x: bounds.width / 2,
            y: bounds.height / 2
          });
          position = { x: position.x - 90, y: position.y - 40 };
        }
      }
      const newNode = {
        id: key,
        type: "flowNode",
        position,
        data: {
          nodeKey: key,
          nodeType: type,
          title: metaType.label,
          message:
            type === "message"
              ? "Olá, {{contactName}}!"
              : type === "menu"
              ? "*Como posso ajudar?*"
              : type === "input"
              ? "Por favor, informe o dado solicitado:"
              : "",
          config: defaultConfigForType(type)
        }
      };
      setNodes(nds => nds.concat(newNode));
      setSelection({ kind: "node", node: newNode });
      drawerTargetRef.current = { kind: "node", id: key };
      setDrawerOpen(true);
      toast.info('Bloco "' + metaType.label + '" adicionado');
    },
    [nodes, rfInstance, setNodes]
  );

  const onDrop = event => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/reactflow");
    if (!type || !rfInstance || !reactFlowWrapper.current) return;

    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = rfInstance.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    });

    const keys = nodes.map(n => n.id);
    const key = type === "start" && !keys.includes("start") ? "start" : newNodeKey(type, keys);
    const metaType = NODE_META[type] || { label: type };

    const newNode = {
      id: key,
      type: "flowNode",
      position,
      data: {
        nodeKey: key,
        nodeType: type,
        title: metaType.label,
        message: type === "message" ? "Nova mensagem" : "",
        config: defaultConfigForType(type)
      }
    };
    setNodes(nds => nds.concat(newNode));
  };

  const openNodeDrawer = useCallback(node => {
    if (!node) return;
    drawerTargetRef.current = { kind: "node", id: node.id };
    setSelection({ kind: "node", node });
    setDrawerOpen(true);
  }, []);

  const openEdgeDrawer = useCallback(edge => {
    if (!edge) return;
    drawerTargetRef.current = { kind: "edge", id: edge.id };
    setSelection({ kind: "edge", edge });
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    // Impede onSelectionChange de reabrir o drawer no mesmo tick
    ignoreSelectionRef.current = true;
    drawerTargetRef.current = null;
    setDrawerOpen(false);
    setSelection(null);
    setNodes(nds => nds.map(n => ({ ...n, selected: false })));
    setEdges(eds => eds.map(e => ({ ...e, selected: false })));
    window.setTimeout(() => {
      ignoreSelectionRef.current = false;
    }, 120);
  }, [setNodes, setEdges]);

  const onSelectionChange = ({ nodes: selNodes, edges: selEdges }) => {
    if (ignoreSelectionRef.current) return;
    // Com drawer aberto, ignorar limpeza/troca automática do React Flow
    if (drawerTargetRef.current) {
      return;
    }
    if (selNodes?.length === 1) {
      openNodeDrawer(selNodes[0]);
    } else if (selEdges?.length === 1) {
      openEdgeDrawer(selEdges[0]);
    }
  };

  const handleChangeNode = (id, partial) => {
    setNodes(nds =>
      nds.map(n => {
        if (n.id !== id) return n;
        const nextData = { ...n.data, ...partial };
        if (partial.config) {
          // merge parcial — evita perder campos com updates rápidos do Select
          nextData.config = { ...(n.data?.config || {}), ...partial.config };
        }
        return { ...n, data: nextData };
      })
    );
    setSelection(prev => {
      if (!prev || prev.kind !== "node" || prev.node.id !== id) return prev;
      const nextData = { ...prev.node.data, ...partial };
      if (partial.config) {
        nextData.config = {
          ...(prev.node.data?.config || {}),
          ...partial.config
        };
      }
      return {
        kind: "node",
        node: { ...prev.node, data: nextData }
      };
    });
  };

  const handleChangeEdge = (id, partial) => {
    setEdges(eds =>
      eds.map(e => {
        if (e.id !== id) return e;
        const data = { ...e.data, ...partial };
        const condition = data.condition;
        const styleMeta = edgeStyleForCondition(condition);
        const label =
          partial.label !== undefined
            ? partial.label
            : styleMeta.label || e.label;
        return {
          ...e,
          data: { ...data, label },
          label,
          animated: styleMeta.animated,
          style: { stroke: styleMeta.stroke, strokeWidth: styleMeta.strokeWidth },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: styleMeta.stroke
          },
          labelStyle: { fill: "#546e7a", fontSize: 10, fontWeight: 600 }
        };
      })
    );
    setSelection(prev => {
      if (!prev || prev.kind !== "edge" || prev.edge.id !== id) return prev;
      return {
        kind: "edge",
        edge: {
          ...prev.edge,
          data: { ...prev.edge.data, ...partial },
          label: partial.label !== undefined ? partial.label : prev.edge.label
        }
      };
    });
  };

  const handleDelete = (kind, id) => {
    if (kind === "node") {
      setNodes(nds => nds.filter(n => n.id !== id));
      setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
    } else {
      setEdges(eds => eds.filter(e => e.id !== id));
    }
    closeDrawer();
  };

  const onNodeClick = useCallback(
    (_evt, node) => {
      openNodeDrawer(node);
    },
    [openNodeDrawer]
  );

  const onEdgeClick = useCallback(
    (_evt, edge) => {
      openEdgeDrawer(edge);
    },
    [openEdgeDrawer]
  );

  const onPaneClick = useCallback(() => {
    // Com drawer aberto o backdrop cobre o canvas; ignorar evita click-through do Select
    if (drawerOpen || ignoreSelectionRef.current) return;
    closeDrawer();
  }, [closeDrawer, drawerOpen]);

  const handleSave = async () => {
    if (!meta.name?.trim()) {
      toast.error("Informe o nome da automação");
      return;
    }
    const hasStart = nodes.some(n => n.data?.nodeType === "start");
    if (!hasStart) {
      toast.error("O grafo precisa de um nó Início (start)");
      return;
    }

    setSaving(true);
    try {
      const { nodes: apiNodes, edges: apiEdges } = rfToApi(nodes, edges);
      const entry =
        meta.entryNodeKey && apiNodes.find(n => n.nodeKey === meta.entryNodeKey)
          ? meta.entryNodeKey
          : apiNodes.find(n => n.type === "start")?.nodeKey || apiNodes[0]?.nodeKey;

      const payload = {
        name: meta.name,
        description: meta.description,
        active: meta.active,
        queueId: meta.queueId ? Number(meta.queueId) : null,
        entryNodeKey: entry,
        nodes: apiNodes,
        edges: apiEdges
      };

      if (meta.id) {
        await api.put(`/flows/${meta.id}`, payload);
        toast.success("Automação salva");
      } else {
        const { data } = await api.post("/flows", payload);
        toast.success("Automação criada");
        history.replace(v2FlowEditorPath(data.id));
        setMeta(m => ({ ...m, id: data.id }));
      }
      try {
        const { data: list } = await api.get("/flows");
        setAllFlows(Array.isArray(list) ? list : []);
      } catch {
        /* ignore */
      }
    } catch (err) {
      toastError(err);
    } finally {
      setSaving(false);
    }
  };

  const minimapColors = useMemo(() => {
    const map = {};
    Object.keys(NODE_META).forEach(k => {
      map[k] = NODE_META[k].color;
    });
    return map;
  }, []);

  if (loading) {
    return (
      <div className={classes.root} style={{ alignItems: "center", justifyContent: "center" }}>
        <CircularProgress color="inherit" />
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <AppBar position="static" elevation={0} className={classes.bar}>
        <Toolbar variant="dense" style={{ flexWrap: "wrap", gap: 4, minHeight: 56 }}>
          <IconButton color="inherit" onClick={() => history.push(v2FlowsListPath())}>
            <ArrowBackIcon />
          </IconButton>
          <AccountTreeIcon style={{ marginRight: 4, opacity: 0.85 }} />
          <Typography variant="subtitle1" style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
            Editor de fluxos
          </Typography>

          <Select
            className={classes.selectLight}
            value={toSelectValue(meta.id)}
            displayEmpty
            onChange={e => {
              const id = e.target.value;
              if (id) history.push(v2FlowEditorPath(id));
              else history.push(v2FlowsListPath());
            }}
            disableUnderline
          >
            <MenuItem value="">
              <em>Nova automação</em>
            </MenuItem>
            {allFlows.map(f => (
              <MenuItem key={f.id} value={toSelectValue(f.id)}>
                {f.name}
                {f.active === false ? " (inativo)" : ""}
              </MenuItem>
            ))}
          </Select>

          <TextField
            className={classes.titleField}
            value={meta.name}
            onChange={e => setMeta(m => ({ ...m, name: e.target.value }))}
            placeholder="Nome da automação"
          />

          <Select
            className={classes.selectLight}
            value={toSelectValue(meta.queueId)}
            displayEmpty
            onChange={e =>
              setMeta(m => ({ ...m, queueId: toSelectValue(e.target.value) }))
            }
            disableUnderline
          >
            <MenuItem value="">
              <em>Sem departamento</em>
            </MenuItem>
            {queues.map(q => (
              <MenuItem key={q.id} value={toSelectValue(q.id)}>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: q.color || "#90a4ae",
                    marginRight: 10
                  }}
                />
                {q.name}
              </MenuItem>
            ))}
          </Select>

          <FormControlLabel
            style={{ marginLeft: 4, color: "#fff" }}
            control={
              <Switch
                checked={meta.active}
                onChange={e => setMeta(m => ({ ...m, active: e.target.checked }))}
                color="default"
              />
            }
            label="Ativo"
          />
          <div style={{ flex: 1 }} />
          <Tooltip title="Centralizar canvas">
            <IconButton
              color="inherit"
              size="small"
              onClick={() => rfInstance?.fitView?.({ padding: 0.2 })}
            >
              <ZoomOutMapIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Salvar grafo no FlowEngine (WhatsApp)">
            <span>
              <Button
                variant="contained"
                color="secondary"
                startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                Salvar
              </Button>
            </span>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <div className={classes.body}>
        <FlowPalette onDragStart={onDragStart} onAddNode={addNodeAtCenter} />

        <div className={classes.canvasWrap} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setRfInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onSelectionChange={onSelectionChange}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            connectionLineStyle={{ stroke: "#26a69a", strokeWidth: 2 }}
            defaultEdgeOptions={{ type: "smoothstep" }}
            nodesDraggable={!drawerOpen}
            nodesConnectable={!drawerOpen}
            elementsSelectable={!drawerOpen}
            panOnDrag={!drawerOpen}
            zoomOnScroll={!drawerOpen}
            deleteKeyCode={drawerOpen ? null : ["Backspace", "Delete"]}
            multiSelectionKeyCode={drawerOpen ? null : "Meta"}
            style={{ width: "100%", height: "100%" }}
          >
            <Background color="#2a3544" gap={18} />
            <Controls />
            <MiniMap
              nodeColor={n => minimapColors[n.data?.nodeType] || "#546e7a"}
              maskColor="rgba(0,0,0,0.55)"
            />
          </ReactFlow>
          <Paper className={classes.hint} elevation={0}>
            Clique no bloco para editar. Conexões: automático, palavra-chave ou opção exata do menu.
          </Paper>
        </div>
      </div>

      <FlowActionDrawer
        open={drawerOpen && Boolean(selection)}
        selection={selection}
        onClose={closeDrawer}
        onChangeNode={handleChangeNode}
        onChangeEdge={handleChangeEdge}
        onDelete={handleDelete}
        queues={queues}
      />

      <Dialog
        open={Boolean(connectDlg)}
        onClose={() => setConnectDlg(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Como este caminho avança?</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" style={{ marginBottom: 8 }}>
              Como o fluxo avança após este bloco?
            </FormLabel>
            <RadioGroup
              value={connType}
              onChange={e => setConnType(e.target.value)}
            >
              <FormControlLabel
                value="auto"
                control={<Radio color="primary" />}
                label="⚡ Automático — não espera resposta"
              />
              <FormControlLabel
                value="default"
                control={<Radio color="primary" />}
                label="Padrão — qualquer resposta avança"
              />
              <FormControlLabel
                value="keyword"
                control={<Radio color="primary" />}
                label="Palavras-chave — só se a mensagem bater"
              />
              <FormControlLabel
                value="exact"
                control={<Radio color="primary" />}
                label="Exato — número da opção / true|false"
              />
            </RadioGroup>
          </FormControl>
          {(connType === "keyword" || connType === "exact") && (
            <TextField
              autoFocus
              margin="dense"
              label={
                connType === "keyword"
                  ? "Palavras (vírgula)"
                  : "Valor exato"
              }
              fullWidth
              variant="outlined"
              value={connKeywords}
              onChange={e => setConnKeywords(e.target.value)}
              helperText={
                connType === "keyword"
                  ? "Ex.: boleto, pix, 1"
                  : "Ex.: 1, true, false"
              }
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectDlg(null)}>Cancelar</Button>
          <Button
            color="primary"
            variant="contained"
            onClick={confirmConnect}
            disabled={
              (connType === "keyword" || connType === "exact") &&
              !connKeywords.trim()
            }
          >
            Conectar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const FlowEditor = () => (
  <ReactFlowProvider>
    <FlowEditorInner />
  </ReactFlowProvider>
);

export default FlowEditor;
