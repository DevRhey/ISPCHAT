import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Tooltip
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import {
  DeleteOutline,
  Edit,
  FileCopy,
  AccountTree,
  Visibility,
  Add,
  PlayArrow
} from "@material-ui/icons";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ConfirmationModal from "../../components/ConfirmationModal";
import FlowGraphCanvas from "../../components/FlowGraphCanvas";
import EmptyState from "../../components/EmptyState";
import ErpRequiredBanner from "../../components/ErpRequiredBanner";
import OperationLockedBanner from "../../components/OperationLockedBanner";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles
  },
  hint: {
    marginBottom: theme.spacing(2),
    opacity: 0.85
  },
  jsonField: {
    fontFamily: "monospace",
    fontSize: 12
  },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1)
  }
}));

const emptyEditor = {
  id: null,
  name: "",
  description: "",
  active: true,
  queueId: "",
  entryNodeKey: "start",
  nodesJson: "[]",
  edgesJson: "[]"
};

const Flows = () => {
  const classes = useStyles();
  const history = useHistory();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [graphFlow, setGraphFlow] = useState(null);
  const [form, setForm] = useState(emptyEditor);
  const [installing, setInstalling] = useState(false);

  const editorNodes = useMemo(() => {
    try {
      return JSON.parse(form.nodesJson || "[]");
    } catch {
      return [];
    }
  }, [form.nodesJson]);

  const editorEdges = useMemo(() => {
    try {
      return JSON.parse(form.edgesJson || "[]");
    } catch {
      return [];
    }
  }, [form.edgesJson]);

  const loadFlows = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/flows");
      setFlows(data);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlows();
  }, []);

  const openCreate = () => {
    setForm(emptyEditor);
    setEditorOpen(true);
  };

  const openEdit = flow => {
    setForm({
      id: flow.id,
      name: flow.name || "",
      description: flow.description || "",
      active: flow.active !== false,
      queueId: flow.queueId || "",
      entryNodeKey: flow.entryNodeKey || "start",
      nodesJson: JSON.stringify(flow.nodes || [], null, 2),
      edgesJson: JSON.stringify(flow.edges || [], null, 2)
    });
    setEditorOpen(true);
  };

  const openGraph = flow => {
    setGraphFlow(flow);
    setGraphOpen(true);
  };

  const handleSave = async () => {
    try {
      let nodes = [];
      let edges = [];
      try {
        nodes = JSON.parse(form.nodesJson || "[]");
        edges = JSON.parse(form.edgesJson || "[]");
      } catch {
        toast.error("JSON de nós/arestas inválido");
        return;
      }

      const payload = {
        name: form.name,
        description: form.description,
        active: form.active,
        queueId: form.queueId ? Number(form.queueId) : null,
        entryNodeKey: form.entryNodeKey,
        nodes: nodes.map(n => ({
          nodeKey: n.nodeKey,
          type: n.type,
          title: n.title,
          message: n.message,
          config: n.config,
          positionX: n.positionX,
          positionY: n.positionY
        })),
        edges: edges.map(e => ({
          sourceNodeKey: e.sourceNodeKey,
          targetNodeKey: e.targetNodeKey,
          condition: e.condition,
          label: e.label
        }))
      };

      if (form.id) {
        await api.put(`/flows/${form.id}`, payload);
        toast.success("Fluxo atualizado");
      } else {
        await api.post("/flows", payload);
        toast.success("Fluxo criado");
      }
      setEditorOpen(false);
      loadFlows();
    } catch (err) {
      toastError(err);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/flows/${confirmId}`);
      toast.success("Fluxo removido");
      setConfirmId(null);
      loadFlows();
    } catch (err) {
      toastError(err);
    }
  };

  const importIsp = async () => {
    try {
      await api.post("/flows/templates/isp");
      toast.success("Templates ISP importados");
      loadFlows();
    } catch (err) {
      toastError(err);
    }
  };

  const installMaster = async () => {
    setInstalling(true);
    try {
      const { data } = await api.post("/flows/templates/master-atendimento", {});
      toast.success(
        data.created
          ? `Fluxo unificado criado e vinculado à fila ${data.boundQueueId || "—"}`
          : `Fluxo unificado atualizado (fila ${data.boundQueueId || "—"})`
      );
      loadFlows();
      if (data.flow) openGraph(data.flow);
    } catch (err) {
      toastError(err);
    } finally {
      setInstalling(false);
    }
  };

  const simulateFlow = async flow => {
    try {
      const { data } = await api.post("/flows/simulate", {
        scenario: "custom",
        queueId: flow.queueId || undefined,
        messages: ["1", "1"],
        contactName: "Simulação UI"
      });
      toast.success(
        data?.notes?.join?.(" · ") ||
          `Simulação OK · ticket #${data?.ticketId || "—"} · nó ${data?.finalNodeKey || "—"}`
      );
    } catch (err) {
      toastError(err);
    }
  };

  const publishFlow = async flow => {
    try {
      await api.put(`/flows/${flow.id}`, {
        name: flow.name,
        description: flow.description,
        active: true,
        queueId: flow.queueId,
        entryNodeKey: flow.entryNodeKey,
        nodes: flow.nodes,
        edges: flow.edges
      });
      toast.success("Fluxo publicado (ativo)");
      loadFlows();
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title="Excluir fluxo?"
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
      >
        Esta ação não pode ser desfeita.
      </ConfirmationModal>

      <MainHeader>
        <Title>Automações (LangGraph)</Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            color="primary"
            onClick={() => history.push("/flows/editor")}
            startIcon={<Add />}
          >
            Nova automação gráfica
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={installMaster}
            disabled={installing}
            startIcon={<AccountTree />}
          >
            Instalar atendimento unificado
          </Button>
          <Button variant="outlined" color="primary" onClick={importIsp} startIcon={<FileCopy />}>
            Importar templates ISP
          </Button>
          <Button variant="outlined" onClick={openCreate}>
            Novo (JSON)
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <ErpRequiredBanner />
      <OperationLockedBanner />
      <Typography className={classes.hint} variant="body2">
        Use o <strong>editor gráfico</strong> (React Flow / estilo LangGraph) para montar menus,
        gatilhos, ISP actions e transferências. Vincule o fluxo à fila para rodar no WhatsApp.
        Evite integração <em>langgraph</em> na mesma fila se quiser o grafo visual determinístico.
      </Typography>

      <Paper className={classes.mainPaper} variant="outlined">
        {!loading && flows.length === 0 ? (
          <EmptyState
            title="Nenhum fluxo ainda"
            description="Instale o atendimento ISP unificado ou abra o editor gráfico para criar sua primeira jornada."
            ctaLabel="Instalar fluxo master ISP"
            onCta={installMaster}
          />
        ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Fila</TableCell>
              <TableCell>Nós</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flows.map(flow => (
              <TableRow key={flow.id}>
                <TableCell>
                  <strong>{flow.name}</strong>
                  <div>{flow.description}</div>
                </TableCell>
                <TableCell>{flow.queueId || "—"}</TableCell>
                <TableCell>{flow.nodes?.length || 0}</TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={flow.active ? "Ativo" : "Inativo"}
                    color={flow.active ? "primary" : "default"}
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Testar fluxo">
                    <IconButton size="small" onClick={() => simulateFlow(flow)}>
                      <PlayArrow />
                    </IconButton>
                  </Tooltip>
                  {!flow.active && (
                    <Tooltip title="Publicar">
                      <Button size="small" color="primary" onClick={() => publishFlow(flow)}>
                        Publicar
                      </Button>
                    </Tooltip>
                  )}
                  <Tooltip title="Editor gráfico LangGraph">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => history.push(`/flows/editor/${flow.id}`)}
                    >
                      <AccountTree />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Pré-visualizar">
                    <IconButton size="small" onClick={() => openGraph(flow)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar JSON">
                    <IconButton size="small" onClick={() => openEdit(flow)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <IconButton size="small" onClick={() => setConfirmId(flow.id)}>
                    <DeleteOutline />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {loading && <TableRowSkeleton columns={5} />}
          </TableBody>
        </Table>
        )}
      </Paper>

      <Dialog open={graphOpen} onClose={() => setGraphOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{graphFlow?.name || "Fluxo"} — visão gráfica</DialogTitle>
        <DialogContent dividers>
          <div className={classes.legend}>
            <Chip size="small" label="menu" style={{ background: "#6a1b9a", color: "#fff" }} />
            <Chip size="small" label="isp_action" style={{ background: "#ef6c00", color: "#fff" }} />
            <Chip size="small" label="transfer" style={{ background: "#c62828", color: "#fff" }} />
            <Chip size="small" label="input" style={{ background: "#00838f", color: "#fff" }} />
            <Chip size="small" label="message" style={{ background: "#1565c0", color: "#fff" }} />
          </div>
          <FlowGraphCanvas nodes={graphFlow?.nodes || []} edges={graphFlow?.edges || []} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGraphOpen(false)}>Fechar</Button>
          <Button
            color="primary"
            onClick={() => {
              setGraphOpen(false);
              if (graphFlow) history.push(`/flows/editor/${graphFlow.id}`);
            }}
          >
            Abrir editor gráfico
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{form.id ? "Editar fluxo" : "Novo fluxo"}</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Nome"
            fullWidth
            margin="dense"
            variant="outlined"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            label="Descrição"
            fullWidth
            margin="dense"
            variant="outlined"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <TextField
            label="ID da fila (opcional)"
            fullWidth
            margin="dense"
            variant="outlined"
            value={form.queueId}
            onChange={e => setForm({ ...form, queueId: e.target.value })}
          />
          <TextField
            label="Nó de entrada"
            fullWidth
            margin="dense"
            variant="outlined"
            value={form.entryNodeKey}
            onChange={e => setForm({ ...form, entryNodeKey: e.target.value })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.active}
                onChange={e => setForm({ ...form, active: e.target.checked })}
                color="primary"
              />
            }
            label="Ativo"
          />

          <Typography variant="subtitle2" style={{ marginTop: 12 }}>
            Pré-visualização gráfica
          </Typography>
          <FlowGraphCanvas nodes={editorNodes} edges={editorEdges} />

          <TextField
            label="Nós (JSON)"
            fullWidth
            multiline
            rows={8}
            margin="dense"
            variant="outlined"
            className={classes.jsonField}
            value={form.nodesJson}
            onChange={e => setForm({ ...form, nodesJson: e.target.value })}
          />
          <TextField
            label="Arestas (JSON)"
            fullWidth
            multiline
            rows={6}
            margin="dense"
            variant="outlined"
            className={classes.jsonField}
            value={form.edgesJson}
            onChange={e => setForm({ ...form, edgesJson: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditorOpen(false)}>Cancelar</Button>
          <Button color="primary" variant="contained" onClick={handleSave}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </MainContainer>
  );
};

export default Flows;
