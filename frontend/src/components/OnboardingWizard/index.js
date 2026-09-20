import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Box
} from "@material-ui/core";
import { useHistory } from "react-router-dom";
import api from "../../services/api";

const STORAGE_KEY = "ispchat_onboarding_done";

const steps = [
  {
    key: "wa",
    label: "WhatsApp",
    title: "Conecte seu WhatsApp",
    body: "Escaneie o QR Code para começar a atender clientes pelo canal da operação.",
    cta: "Abrir Conexões",
    path: "/connections"
  },
  {
    key: "queue",
    label: "Fila",
    title: "Crie suas filas",
    body: "Crie filas Financeiro, Técnico, Comercial e NOC. Elas são usadas no handoff humano do bot.",
    cta: "Abrir Filas",
    path: "/queues"
  },
  {
    key: "flow",
    label: "Fluxo ISP",
    title: "Ative o fluxo de atendimento ISP",
    body: "Use o fluxo master (boleto, ONU, visita, cobertura) ou o editor gráfico. Não misture FlowEngine e LangGraph na mesma fila.",
    cta: "Abrir Fluxos",
    path: "/flows"
  },
  {
    key: "erp",
    label: "ERP",
    title: "Conecte o sistema da provedora",
    body: "Piloto exige IXC, SGP ou Hubsoft com URL e token. Sem conector o bot não consulta cliente nem emite 2ª via real.",
    cta: "Abrir Conectores",
    path: "/isp-connectors"
  },
  {
    key: "langgraph",
    label: "IA ISP",
    title: "Ligue o ISPCHAT LangGraph",
    body: "Em Integrações, crie tipo ISPCHAT LangGraph e vincule na fila principal se for usar o motor de intenções.",
    cta: "Abrir Integrações",
    path: "/queue-integration"
  },
  {
    key: "handoff",
    label: "Handoff",
    title: "Mapeie filas humanas",
    body: "Em Configurações, salve a chave ispTransferQueues com JSON: {\"financeiro\":ID,\"suporte\":ID,\"comercial\":ID,\"noc\":ID}.",
    cta: "Abrir Configurações",
    path: "/settings"
  }
];

const OnboardingWizard = ({ openForce = false }) => {
  const history = useHistory();
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (localStorage.getItem(STORAGE_KEY) === "1" && !openForce) {
        setChecking(false);
        return;
      }
      try {
        const [wa, queues, flows] = await Promise.all([
          api.get("/whatsapp/").catch(() => ({ data: [] })),
          api.get("/queue").catch(() => ({ data: [] })),
          api.get("/flows").catch(() => ({ data: [] }))
        ]);
        const hasWa = Array.isArray(wa.data) ? wa.data.length > 0 : false;
        const hasQueue = Array.isArray(queues.data) ? queues.data.length > 0 : false;
        const hasFlow = Array.isArray(flows.data)
          ? flows.data.length > 0
          : Array.isArray(flows.data?.flows)
          ? flows.data.flows.length > 0
          : false;

        if (hasWa && hasQueue && hasFlow && !openForce) {
          localStorage.setItem(STORAGE_KEY, "1");
          setOpen(false);
        } else {
          if (!hasWa) setActiveStep(0);
          else if (!hasQueue) setActiveStep(1);
          else if (!hasFlow) setActiveStep(2);
          else setActiveStep(3);
          setOpen(true);
        }
      } catch {
        setOpen(true);
      } finally {
        setChecking(false);
      }
    };
    run();
  }, [openForce]);

  if (checking || !open) return null;

  const step = steps[activeStep];

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const go = () => {
    finish();
    history.push(step.path);
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth disableBackdropClick>
      <DialogTitle>Bem-vindo ao ISPCHAT</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map(s => (
            <Step key={s.key}>
              <StepLabel>{s.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box mt={2} mb={1}>
          <Typography variant="h6" style={{ fontWeight: 700, color: "#0F172A" }}>
            {step.title}
          </Typography>
          <Typography style={{ color: "#64748B", marginTop: 8 }}>{step.body}</Typography>
        </Box>
      </DialogContent>
      <DialogActions style={{ padding: 16 }}>
        <Button onClick={finish} color="default">
          Fazer depois
        </Button>
        {activeStep > 0 && (
          <Button onClick={() => setActiveStep(s => s - 1)}>Voltar</Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setActiveStep(s => s + 1)}
            style={{ background: "#2563EB" }}
          >
            Próximo
          </Button>
        ) : null}
        <Button
          variant="contained"
          onClick={go}
          style={{ background: "#059669", color: "#fff" }}
        >
          {step.cta}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OnboardingWizard;
