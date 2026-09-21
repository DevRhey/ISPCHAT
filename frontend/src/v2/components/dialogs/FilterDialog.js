import React, { useState } from "react";
import { X, Trash2, Filter } from "react-feather";
import "./Dialogs.css";

const PERIODS = ["Todas", "Hoje", "Ontem", "Não lidas", "Última do cliente"];

const FilterDialog = ({ open, onClose, onApply, onClear }) => {
  const [period, setPeriod] = useState("Todas");

  if (!open) return null;

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="v2-dialog-overlay" onClick={onClose} onKeyDown={handleKeyDown} role="presentation">
      <div
        className="v2-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="filter-dialog-title"
      >
        <div className="v2-dialog-header">
          <h2 id="filter-dialog-title">Filtrar atendimentos</h2>
          <button type="button" className="v2-dialog-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="v2-dialog-body">
          <section className="v2-dialog-section">
            <h3>Conversas</h3>
            <p className="v2-dialog-hint">Por período (última mensagem) ou não lidas</p>
            <div className="v2-segment-group">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`v2-segment ${period === p ? "active" : ""}`}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          <section className="v2-dialog-section">
            <h3>Canais</h3>
            <select className="v2-select" defaultValue="">
              <option value="" disabled>Filtre por canais</option>
            </select>
          </section>

          <section className="v2-dialog-section">
            <h3>Departamentos</h3>
            <select className="v2-select" defaultValue="">
              <option value="" disabled>Filtre por departamentos</option>
            </select>
          </section>
        </div>

        <div className="v2-dialog-footer">
          <button type="button" className="v2-dialog-link" onClick={onClose}>Cancelar</button>
          <div className="v2-dialog-footer-actions">
            <button type="button" className="quark-btn-outline" onClick={() => { onClear?.(); onClose(); }}>
              <Trash2 size={14} /> Limpar filtros
            </button>
            <button type="button" className="quark-btn-primary" onClick={() => { onApply?.({ period }); onClose(); }}>
              <Filter size={14} /> Aplicar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterDialog;
