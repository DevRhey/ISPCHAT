import React, { useState } from "react";
import { X, Search } from "react-feather";
import "./Dialogs.css";

const HistorySearchDialog = ({ open, onClose }) => {
  const [query, setQuery] = useState("");

  if (!open) return null;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      // stub: integração futura com busca de histórico
    }
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="v2-dialog-overlay" onClick={onClose} role="presentation">
      <div className="v2-dialog" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="v2-dialog-header">
          <h2>Buscar histórico do cliente</h2>
          <button type="button" className="v2-dialog-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="v2-dialog-body">
          <div className="v2-history-search">
            <input
              className="v2-input"
              placeholder="Digite o nome ou telefone e pressione enter"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button type="button" className="quark-btn-primary" aria-label="Buscar">
              <Search size={16} />
            </button>
          </div>
        </div>

        <div className="v2-dialog-footer right">
          <button type="button" className="quark-btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default HistorySearchDialog;
