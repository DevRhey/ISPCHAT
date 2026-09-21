import React, { useState, useEffect } from "react";
import { Clipboard, Repeat, XCircle, MoreHorizontal } from "react-feather";
import "./ConversationHeader.css";

const formatElapsed = (startDate) => {
  if (!startDate) return "0 dias 0 h 0 min 0 s";
  const start = new Date(startDate);
  const now = new Date();
  const diff = Math.max(0, now - start);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${days} dias ${hours} h ${mins} min ${secs} s`;
};

const ConversationHeader = ({ ticket, onTransfer, onClose, onMenuAction }) => {
  const [elapsed, setElapsed] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const update = () => setElapsed(formatElapsed(ticket?.createdAt));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [ticket?.createdAt]);

  const protocol = ticket?.id ? `${new Date().getFullYear()}${String(ticket.id).padStart(12, "0")}` : "—";

  return (
    <header className="conversation-header">
      <div className="conversation-header-info">
        <div className="conversation-elapsed-pill">
          <span className="conversation-elapsed-label">Tempo decorrido</span>
          <span className="conversation-elapsed-value">{elapsed}</span>
        </div>
        <div className="conversation-protocol">
          <span className="conversation-protocol-label">Protocolo</span>
          <button type="button" className="conversation-protocol-value">{protocol}</button>
        </div>
      </div>
      <div className="conversation-header-actions">
        <button type="button" className="conversation-action-btn" aria-label="Documento" title="Documento">
          <Clipboard size={18} />
        </button>
        <button type="button" className="conversation-action-btn" onClick={onTransfer} aria-label="Transferir">
          <Repeat size={18} />
        </button>
        <button type="button" className="conversation-action-btn danger" onClick={onClose} aria-label="Encerrar">
          <XCircle size={18} />
        </button>
        <div className="conversation-menu-wrap">
          <button
            type="button"
            className="conversation-action-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Mais opções"
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div className="conversation-menu">
              <button type="button" onClick={() => { onMenuAction?.("print"); setMenuOpen(false); }}>
                Imprimir atendimento
              </button>
              <button type="button" onClick={() => { onMenuAction?.("return-automation"); setMenuOpen(false); }}>
                Retornar à automação
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ConversationHeader;
