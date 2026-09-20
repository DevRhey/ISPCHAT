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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { DeleteOutline, Edit, FlashOn } from "@material-ui/icons";
import { toast } from "react-toastify";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import ConfirmationModal from "../../components/ConfirmationModal";
import EmptyState from "../../components/EmptyState";
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
  hint: { marginBottom: theme.spacing(2), opacity: 0.85 },
  testBox: {
    marginTop: theme.spacing(1),
    padding: theme.spacing(1.5),
    background: theme.palette.type === "dark" ? "#333" : "#F1F5F9",
    borderRadius: 8
  }
}));

const empty = {
  id: null,
  name: "",
  provider: "ixc",
  baseUrl: "",
  token: "",
  config: '{\n  "actions": {\n    "lookupClient": "/webservice/v1/cliente",\n    "getInvoice": "/webservice/v1/fn_areceber"\n  }\n}'
};

const IspConnectors = () => {
  const classes = useStyles();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testCpf, setTestCpf] = useState("00000000000");

  const load = async () => {
    try {
      const { data } = await api.get("/isp-connectors");
      setItems(data);
    } catch (err) {
      toastError(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      let config = form.config;
      try {
        config = JSON.parse(form.config);
      } catch {
        toast.error("Config JSON inválido");
        return;
      }
      const payload = {
        name: form.name,
        provider: form.provider,
        baseUrl: form.baseUrl,
        token: form.token,
        config,
        active: true
      };
      if (form.id) {
        await api.put(`/isp-connectors/${form.id}`, payload);
      } else {
        await api.post("/isp-connectors", payload);
      }
      toast.success("Conector salvo");
      setOpen(false);
      load();
    } catch (err) {
      toastError(err);
    }
  };

  const test = async row => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data } = await api.post("/isp-connectors/test", {
        connectorId: row.id,
        action: "lookupClient",
        variables: { cpf: testCpf, contactName: "Teste conexão" }
      });
      setTestResult({ name: row.name, ...data });
      if (data.ok) toast.success(data.message || "Conexão OK");
      else toast.error(data.message || "Falha no teste");
    } catch (err) {
      toastError(err);
    } finally {
      setTesting(false);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/isp-connectors/${confirmId}`);
      setConfirmId(null);
      toast.success("Removido");
      load();
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title="Excluir conector?"
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        onConfirm={remove}
      >
        Confirma exclusão?
      </ConfirmationModal>

      <MainHeader>
        <Title>Conectores ISP</Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setForm(empty);
              setOpen(true);
            }}
          >
            Novo conector
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <OperationLockedBanner />
      <Typography className={classes.hint} variant="body2">
        Piloto: URL e token são obrigatórios. Sem conector o chatbot não consulta cliente nem emite boleto real.
        Teste a conexão antes de atender.
      </Typography>

      <TextField
        label="CPF para teste"
        size="small"
        variant="outlined"
        value={testCpf}
        onChange={e => setTestCpf(e.target.value)}
        style={{ marginBottom: 12, maxWidth: 220 }}
      />

      {testResult && (
        <div className={classes.testBox}>
          <Typography variant="subtitle2">
            Resultado — {testResult.name}: {testResult.ok ? "OK" : "Falha"}
          </Typography>
          <Typography variant="body2">{testResult.message}</Typography>
        </div>
      )}

      <Paper className={classes.mainPaper} variant="outlined">
        {items.length === 0 ? (
          <EmptyState
            title="Nenhum conector ERP"
            description="Cadastre IXC, SGP ou Hubsoft para emitir boletos e consultar clientes reais no chatbot."
            ctaLabel="Novo conector"
            onCta={() => {
              setForm(empty);
              setOpen(true);
            }}
          />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell>Base URL</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(row => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.provider}</TableCell>
                  <TableCell>{row.baseUrl || "(sem URL)"}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => test(row)}
                      title="Testar conexão"
                      disabled={testing}
                    >
                      <FlashOn />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setForm({
                          id: row.id,
                          name: row.name,
                          provider: row.provider,
                          baseUrl: row.baseUrl || "",
                          token: row.token || "",
                          config:
                            typeof row.config === "string"
                              ? row.config
                              : JSON.stringify(row.config || {}, null, 2)
                        });
                        setOpen(true);
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton size="small" onClick={() => setConfirmId(row.id)}>
                      <DeleteOutline />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? "Editar" : "Novo"} conector</DialogTitle>
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
            select
            label="Provider"
            fullWidth
            margin="dense"
            variant="outlined"
            value={form.provider}
            onChange={e => setForm({ ...form, provider: e.target.value })}
          >
            <MenuItem value="ixc">IXC</MenuItem>
            <MenuItem value="sgp">SGP</MenuItem>
            <MenuItem value="hubsoft">HubSoft</MenuItem>
            <MenuItem value="generic">Generic</MenuItem>
          </TextField>
          <TextField
            label="Base URL"
            fullWidth
            margin="dense"
            variant="outlined"
            value={form.baseUrl}
            onChange={e => setForm({ ...form, baseUrl: e.target.value })}
            helperText="Obrigatório em produção"
          />
          <TextField
            label="Token"
            fullWidth
            margin="dense"
            variant="outlined"
            value={form.token}
            onChange={e => setForm({ ...form, token: e.target.value })}
          />
          <TextField
            label="Config (JSON)"
            fullWidth
            multiline
            rows={6}
            margin="dense"
            variant="outlined"
            value={form.config}
            onChange={e => setForm({ ...form, config: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button color="primary" variant="contained" onClick={save}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </MainContainer>
  );
};

export default IspConnectors;
