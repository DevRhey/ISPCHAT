import React from "react";
import { RefreshCw } from "react-feather";
import "./ConnectionStatus.css";

const ConnectionStatus = ({ connected, reconnecting, onRefresh }) => (
  <div className="connection-status">
    <div className="connection-status-left">
      <span className={`connection-dot ${connected ? "online" : "offline"}`} />
      <span className={connected ? "connection-text" : "connection-text offline"}>
        {reconnecting ? "Conectando..." : connected ? "Chat conectado" : "Chat desconectado"}
      </span>
    </div>
    <button
      type="button"
      className="connection-refresh"
      onClick={onRefresh}
      aria-label="Atualizar conexão"
    >
      <RefreshCw size={14} />
    </button>
  </div>
);

export default ConnectionStatus;
