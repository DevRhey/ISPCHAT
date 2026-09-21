import React from "react";
import { Home, User, DollarSign, Headphones, Wifi, ChevronLeft, ChevronRight } from "react-feather";
import "./ContextRail.css";

const TABS = [
  { id: "inicio", label: "Início", icon: Home, color: "#f97316" },
  { id: "cliente", label: "Cliente", icon: User, color: "#3499d9" },
  { id: "financeiro", label: "Financeiro", icon: DollarSign, color: "#22c55e" },
  { id: "suporte", label: "Suporte", icon: Headphones, color: "#7b00b5" },
  { id: "rede", label: "Rede", icon: Wifi, color: "#6366f1" },
];

const ContextRail = ({ activeTab, onTabChange, expanded, onToggleExpand }) => (
  <nav className="context-rail" aria-label="Painel contextual">
    <button
      type="button"
      className="context-rail-toggle"
      onClick={onToggleExpand}
      aria-label={expanded ? "Recolher painel" : "Expandir painel"}
    >
      {expanded ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
    </button>
    {TABS.map((tab) => {
      const Icon = tab.icon;
      const active = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          type="button"
          className={`context-rail-item ${active ? "active" : ""}`}
          onClick={() => onTabChange(tab.id)}
          style={{ "--tab-color": tab.color }}
        >
          <span className="context-rail-icon">
            <Icon size={18} />
          </span>
          <span className="context-rail-label">{tab.label}</span>
        </button>
      );
    })}
  </nav>
);

export default ContextRail;
