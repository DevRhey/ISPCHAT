import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import { makeStyles } from "@material-ui/core/styles";

export const NODE_META = {
  start: {
    label: "Início",
    color: "#2e7d32",
    hint: "Ponto de entrada do fluxo"
  },
  settings: {
    label: "Configurações",
    color: "#546e7a",
    hint: "Gatilhos, timeout e fallback"
  },
  message: {
    label: "Mensagem",
    color: "#1565c0",
    hint: "Envia texto no WhatsApp"
  },
  menu: {
    label: "Menu de opções",
    color: "#6a1b9a",
    hint: "Lista numerada + atalhos"
  },
  input: {
    label: "Pergunta / input",
    color: "#00838f",
    hint: "Captura CPF, CEP, texto..."
  },
  condition: {
    label: "Condição",
    color: "#5d4037",
    hint: "Ramifica true / false"
  },
  isp_action: {
    label: "Ação do provedor",
    color: "#ef6c00",
    hint: "ERP: boleto, OS, desbloqueio..."
  },
  http: {
    label: "HTTP / webhook",
    color: "#283593",
    hint: "Chama API externa"
  },
  transfer: {
    label: "Atendente humano",
    color: "#c62828",
    hint: "Transfere para departamento"
  },
  typebot: {
    label: "Typebot",
    color: "#ad1457",
    hint: "Jornada Typebot (opcional)"
  },
  n8n: {
    label: "n8n",
    color: "#4527a0",
    hint: "Automação n8n (opcional)"
  },
  end: {
    label: "Encerrar",
    color: "#37474f",
    hint: "Finaliza a conversa"
  }
};

export const ISP_ACTION_LABELS = {
  lookupClient: "Localizar cliente (CPF/CNPJ)",
  getInvoice: "2ª via / boleto / PIX",
  unlockService: "Desbloqueio de confiança",
  unblock: "Desbloqueio de confiança",
  checkCoverage: "Viabilidade por CEP",
  openTicket: "Abrir chamado / OS",
  scheduleVisit: "Agendar visita técnica",
  getContract: "Consultar contrato",
  checkSignal: "Checar sinal da ONU",
  custom: "Ação personalizada"
};

const useStyles = makeStyles(() => ({
  card: {
    minWidth: 180,
    maxWidth: 240,
    borderRadius: 12,
    border: "1.5px solid",
    background: "linear-gradient(180deg, #1e2834 0%, #172029 100%)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    fontFamily: "Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    overflow: "hidden",
    color: "#e8eef2"
  },
  head: {
    color: "#fff",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0.55,
    padding: "6px 12px",
    textTransform: "uppercase"
  },
  body: {
    padding: "10px 12px 12px"
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    color: "#f5f7fa",
    marginBottom: 4,
    wordBreak: "break-word"
  },
  preview: {
    fontSize: 11,
    color: "rgba(232,238,242,0.62)",
    lineHeight: 1.4,
    maxHeight: 40,
    overflow: "hidden"
  },
  handle: {
    width: 11,
    height: 11,
    background: "#90a4ae",
    border: "2px solid #0f1419"
  }
}));

const FlowRfNode = memo(({ data, selected }) => {
  const classes = useStyles();
  const meta = NODE_META[data.nodeType] || NODE_META.message;
  const actionLabel =
    data.config?.action &&
    (ISP_ACTION_LABELS[data.config.action] || data.config.action);
  const preview =
    data.message ||
    actionLabel ||
    (data.config?.variable && `Variável: ${data.config.variable}`) ||
    meta.hint;

  return (
    <div
      className={classes.card}
      style={{
        borderColor: selected ? "#26a69a" : meta.color,
        boxShadow: selected
          ? "0 0 0 2px rgba(38,166,154,0.55), 0 10px 28px rgba(0,0,0,0.4)"
          : undefined
      }}
    >
      {data.nodeType !== "start" && (
        <Handle
          type="target"
          position={Position.Top}
          className={classes.handle}
          style={{ background: meta.color }}
        />
      )}
      <div className={classes.head} style={{ background: meta.color }}>
        {meta.label}
      </div>
      <div className={classes.body}>
        <div className={classes.title}>{data.title || data.nodeKey}</div>
        <div className={classes.preview}>{preview}</div>
      </div>
      {data.nodeType === "condition" ? (
        <>
          <Handle
            id="true"
            type="source"
            position={Position.Bottom}
            className={classes.handle}
            style={{ left: "30%", background: "#43a047" }}
          />
          <Handle
            id="false"
            type="source"
            position={Position.Bottom}
            className={classes.handle}
            style={{ left: "70%", background: "#e53935" }}
          />
        </>
      ) : (
        data.nodeType !== "end" && (
          <Handle
            type="source"
            position={Position.Bottom}
            className={classes.handle}
            style={{ background: meta.color }}
          />
        )
      )}
    </div>
  );
});

FlowRfNode.displayName = "FlowRfNode";

export default FlowRfNode;
