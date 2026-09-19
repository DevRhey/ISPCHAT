import React, { useMemo } from "react";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(theme => ({
  wrap: {
    width: "100%",
    overflow: "auto",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    background:
      theme.palette.type === "dark"
        ? "linear-gradient(180deg,#1a1a1a,#121212)"
        : "linear-gradient(180deg,#f7f9fc,#eef2f7)",
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2)
  },
  svg: {
    display: "block",
    minWidth: 1100
  }
}));

const TYPE_COLOR = {
  start: "#2e7d32",
  message: "#1565c0",
  menu: "#6a1b9a",
  input: "#00838f",
  isp_action: "#ef6c00",
  transfer: "#c62828",
  end: "#455a64",
  condition: "#5d4037",
  http: "#283593",
  typebot: "#ad1457",
  n8n: "#4527a0"
};

const nodeW = 160;
const nodeH = 56;

const FlowGraphCanvas = ({ nodes = [], edges = [] }) => {
  const classes = useStyles();

  const layout = useMemo(() => {
    const list = (nodes || []).map((n, i) => ({
      ...n,
      x: Number(n.positionX) || 40 + (i % 5) * 200,
      y: Number(n.positionY) || 40 + Math.floor(i / 5) * 100
    }));
    const byKey = {};
    list.forEach(n => {
      byKey[n.nodeKey] = n;
    });
    let maxX = 800;
    let maxY = 400;
    list.forEach(n => {
      maxX = Math.max(maxX, n.x + nodeW + 40);
      maxY = Math.max(maxY, n.y + nodeH + 40);
    });
    return { list, byKey, maxX, maxY };
  }, [nodes]);

  if (!layout.list.length) {
    return null;
  }

  return (
    <div className={classes.wrap}>
      <svg
        className={classes.svg}
        width={layout.maxX}
        height={layout.maxY}
        viewBox={`0 0 ${layout.maxX} ${layout.maxY}`}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#90a4ae" />
          </marker>
        </defs>

        {(edges || []).map((e, idx) => {
          const s = layout.byKey[e.sourceNodeKey];
          const t = layout.byKey[e.targetNodeKey];
          if (!s || !t) return null;
          const x1 = s.x + nodeW / 2;
          const y1 = s.y + nodeH;
          const x2 = t.x + nodeW / 2;
          const y2 = t.y;
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          return (
            <g key={`${e.sourceNodeKey}-${e.targetNodeKey}-${idx}`}>
              <path
                d={`M ${x1} ${y1} C ${x1} ${y1 + 40}, ${x2} ${y2 - 40}, ${x2} ${y2}`}
                fill="none"
                stroke="#90a4ae"
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
              {(e.label || e.condition) && (
                <text
                  x={mx}
                  y={my}
                  fill="#607d8b"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {e.label || e.condition}
                </text>
              )}
            </g>
          );
        })}

        {layout.list.map(n => {
          const color = TYPE_COLOR[n.type] || "#546e7a";
          const title = n.title || n.nodeKey;
          return (
            <g key={n.nodeKey} transform={`translate(${n.x}, ${n.y})`}>
              <rect
                width={nodeW}
                height={nodeH}
                rx="10"
                fill="#fff"
                stroke={color}
                strokeWidth="2.5"
              />
              <rect width={nodeW} height="18" rx="10" fill={color} />
              <rect y="8" width={nodeW} height="10" fill={color} />
              <text x="8" y="13" fill="#fff" fontSize="10" fontWeight="700">
                {(n.type || "").toUpperCase()}
              </text>
              <text x="8" y="36" fill="#263238" fontSize="11" fontWeight="600">
                {title.length > 22 ? `${title.slice(0, 20)}…` : title}
              </text>
              <text x="8" y="50" fill="#78909c" fontSize="9">
                {n.nodeKey}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default FlowGraphCanvas;
