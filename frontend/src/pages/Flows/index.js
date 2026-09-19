import React, { useEffect, useState } from "react";
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
  Switch
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { DeleteOutline, Edit, FileCopy } from "@material-ui/icons";
import { toast } from "react-toastify";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ConfirmationModal from "../../components/ConfirmationModal";
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
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(emptyEditor);

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
        <Title>Fluxos (ISP)</Title>
        <MainHeaderButtonsWrapper>
          <Button variant="outlined" color="primary" onClick={importIsp} startIcon={<FileCopy />}>
            Importar templates ISP
          </Button>
          <Button variant="contained" color="primary" onClick={openCreate}>
            Novo fluxo
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <Typography className={classes.hint} variant="body2">
        Vincule um fluxo à fila (campo flowId na fila) para o bot nativo assumir no lugar do menu QueueOptions.
        Guia: docs/ISP_AUTOMATION.md
      </Typography>

      <Paper className={classes.mainPaper} variant="outlined">
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
                  <IconButton size="small" onClick={() => openEdit(flow)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => setConfirmId(flow.id)}>
                    <DeleteOutline />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {loading && <TableRowSkeleton columns={5} />}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} maxWidth="md" fullWidth>
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
