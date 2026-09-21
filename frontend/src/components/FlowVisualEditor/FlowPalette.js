import React, { useMemo, useState } from "react";
import { TextField, Typography, Tooltip, InputAdornment } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import { NODE_META } from "./FlowRfNode";

const useStyles = makeStyles(theme => ({
  root: {
    width: 232,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    background: "#121820",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    minHeight: 0
  },
  head: {
    padding: theme.spacing(1.5, 1.5, 1),
    borderBottom: "1px solid rgba(255,255,255,0.06)"
  },
  title: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: "rgba(232,238,242,0.65)",
    marginBottom: 8
  },
  search: {
    "& .MuiOutlinedInput-root": {
      background: "#1a222d",
      color: "#e8eef2",
      borderRadius: 8,
      fontSize: 13,
      "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
      "&:hover fieldset": { borderColor: "rgba(38,166,154,0.5)" },
      "&.Mui-focused fieldset": { borderColor: "#26a69a" }
    },
    "& .MuiInputAdornment-root": { color: "rgba(255,255,255,0.45)" }
  },
  scroll: {
    flex: 1,
    overflowY: "auto",
    padding: theme.spacing(1)
  },
  group: {
    marginBottom: theme.spacing(1.5)
  },
  groupTitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: "rgba(232,238,242,0.45)",
    margin: theme.spacing(0.5, 0.5, 0.75)
  },
  item: {
    display: "flex",
    alignItems: "flex-start",
    width: "100%",
    textAlign: "left",
    marginBottom: 6,
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#1a222d",
    color: "#e8eef2",
    cursor: "grab",
    transition: "border-color 120ms, background 120ms, transform 80ms",
    "&:hover": {
      borderColor: "#26a69a",
      background: "#223042"
    },
    "&:active": { cursor: "grabbing", transform: "scale(0.98)" }
  },
  swatch: {
    width: 8,
    alignSelf: "stretch",
    borderRadius: 4,
    marginRight: 10,
    flexShrink: 0
  },
  itemBody: { minWidth: 0, flex: 1 },
  itemLabel: { fontSize: 12, fontWeight: 700, lineHeight: 1.25 },
  itemHint: {
    fontSize: 10,
    opacity: 0.55,
    marginTop: 2,
    lineHeight: 1.3
  },
  foot: {
    padding: theme.spacing(1, 1.5, 1.5),
    borderTop: "1px solid rgba(255,255,255,0.06)",
    fontSize: 10,
    lineHeight: 1.45,
    color: "rgba(232,238,242,0.5)"
  },
  addBtn: {
    marginTop: 4,
    fontSize: 10,
    color: "#80cbc4",
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    textDecoration: "underline"
  }
}));

export const PALETTE_GROUPS = [
  {
    id: "core",
    title: "Essenciais",
    types: ["start", "settings", "message", "menu", "input", "end"]
  },
  {
    id: "isp",
    title: "Provedor (ISP)",
    types: ["isp_action", "transfer"]
  },
  {
    id: "logic",
    title: "Lógica e integrações",
    types: ["condition", "http", "typebot", "n8n"]
  }
];

const FlowPalette = ({ onDragStart, onAddNode }) => {
  const classes = useStyles();
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PALETTE_GROUPS.map(g => ({
      ...g,
      types: g.types.filter(t => {
        const m = NODE_META[t];
        if (!m) return false;
        if (!needle) return true;
        return (
          m.label.toLowerCase().includes(needle) ||
          (m.hint || "").toLowerCase().includes(needle) ||
          t.includes(needle)
        );
      })
    })).filter(g => g.types.length);
  }, [q]);

  return (
    <aside className={classes.root}>
      <div className={classes.head}>
        <div className={classes.title}>Biblioteca de blocos</div>
        <TextField
          className={classes.search}
          size="small"
          variant="outlined"
          fullWidth
          placeholder="Buscar bloco..."
          value={q}
          onChange={e => setQ(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )
          }}
        />
      </div>
      <div className={classes.scroll}>
        {groups.map(g => (
          <div key={g.id} className={classes.group}>
            <div className={classes.groupTitle}>{g.title}</div>
            {g.types.map(type => {
              const meta = NODE_META[type];
              return (
                <Tooltip
                  key={type}
                  title="Arraste para o canvas ou clique em Adicionar"
                  placement="right"
                >
                  <div>
                    <button
                      type="button"
                      className={classes.item}
                      draggable
                      onDragStart={e => onDragStart(e, type)}
                      onDoubleClick={() => onAddNode?.(type)}
                    >
                      <span
                        className={classes.swatch}
                        style={{ background: meta.color }}
                      />
                      <span className={classes.itemBody}>
                        <div className={classes.itemLabel}>{meta.label}</div>
                        <div className={classes.itemHint}>{meta.hint}</div>
                        {onAddNode && (
                          <button
                            type="button"
                            className={classes.addBtn}
                            onClick={e => {
                              e.stopPropagation();
                              onAddNode(type);
                            }}
                          >
                            + Adicionar no centro
                          </button>
                        )}
                      </span>
                    </button>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        ))}
        {!groups.length && (
          <Typography variant="caption" style={{ opacity: 0.6, padding: 8 }}>
            Nenhum bloco encontrado.
          </Typography>
        )}
      </div>
      <div className={classes.foot}>
        <strong>Dica:</strong> conecte as bolinhas e escolha se a seta é automática,
        por palavra-chave ou opção do menu. Salve e vincule o fluxo na fila.
      </div>
    </aside>
  );
};

export default FlowPalette;
