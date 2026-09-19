import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import { makeStyles } from "@material-ui/core/styles";

export const NODE_META = {
  start: { label: "Início", color: "#1b5e20", hint: "Entrada do grafo" },
  settings: { label: "Configurações", color: "#37474f", hint: "Gatilho / timeout / fallback" },
  message: { label: "Mensagem", color: "#0d47a1", hint: "Envia texto WhatsApp" },
  menu: { label: "Menu", color: "#4a148c", hint: "Opções + gatilhos" },
  input: { label: "Input", color: "#006064", hint: "Captura variável" },
  condition: { label: "Condição", color: "#3e2723", hint: "true / false" },
  isp_action: { label: "ISP Action", color: "#e65100", hint: "ERP / demo" },
  http: { label: "HTTP", color: "#1a237e", hint: "Webhook / API" },
  transfer: { label: "Transferir", color: "#b71c1c", hint: "Fila humana" },
  typebot: { label: "Typebot", color: "#880e4f", hint: "Integração" },
  n8n: { label: "n8n", color: "#311b92", hint: "Webhook n8n" },
  end: { label: "Fim", color: "#263238", hint: "Encerra fluxo" }
};

const useStyles = makeStyles(() => ({
  card: {
    minWidth: 168,
    maxWidth: 220,
    borderRadius: 10,
    border: "2px solid",
    background: "#fff",
    boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
    fontFamily: "Segoe UI, Roboto, sans-serif",
    overflow: "hidden"
  },
  head: {
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.6,
    padding: "5px 10px",
    textTransform: "uppercase"
  },
  body: {
    padding: "8px 10px 10px"
  },
  title: {
    fontSize: 12,
    fontWeight: 700,
    color: "#212121",
    marginBottom: 2,
    wordBreak: "break-word"
  },
  preview: {
    fontSize: 10,
    color: "#616161",
    lineHeight: 1.35,
    maxHeight: 36,
    overflow: "hidden"
  },
  handle: {
    width: 10,
    height: 10,
    background: "#90a4ae",
    border: "2px solid #fff"
  }
}));

const FlowRfNode = memo(({ data, selected }) => {
  const classes = useStyles();
  const meta = NODE_META[data.nodeType] || NODE_META.message;
  const preview =
    data.message ||
    (data.config?.action && `action: ${data.config.action}`) ||
    (data.config?.variable && `var: ${data.config.variable}`) ||
    meta.hint;

  return (
    <div
      className={classes.card}
      style={{
        borderColor: selected ? "#ff6f00" : meta.color,
        boxShadow: selected
          ? "0 0 0 2px #ff6f00, 0 6px 18px rgba(0,0,0,0.18)"
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
      {data.nodeType !== "end" && (
        <Handle
          type="source"
          position={Position.Bottom}
          className={classes.handle}
          style={{ background: meta.color }}
        />
      )}
    </div>
  );
});

FlowRfNode.displayName = "FlowRfNode";

export default FlowRfNode;
