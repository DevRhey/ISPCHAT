import React from "react";
import { Search, PlusCircle, Filter, Sliders } from "react-feather";
import "./TicketListHeader.css";

const TicketListHeader = ({
  searchParam,
  onSearchChange,
  onHistoryClick,
  onNewClick,
  onFilterClick,
  selecting,
  onToggleSelect,
}) => (
  <div className="ticket-list-header">
    <div className="ticket-list-search-row">
      <div className="ticket-list-search">
        <Search size={16} className="ticket-list-search-icon" />
        <input
          type="text"
          placeholder="Buscar atendimento"
          value={searchParam}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Buscar atendimento"
        />
      </div>
      <button
        type="button"
        className="ticket-list-icon-btn"
        onClick={onHistoryClick}
        aria-label="Buscar histórico do cliente"
        title="Buscar histórico do cliente"
      >
        <Search size={18} />
      </button>
      <button
        type="button"
        className="ticket-list-icon-btn"
        onClick={onNewClick}
        aria-label="Iniciar atendimento"
        title="Iniciar atendimento"
      >
        <PlusCircle size={18} />
      </button>
    </div>
    <div className="ticket-list-actions-row">
      <button
        type="button"
        className={`ticket-list-action-btn ${selecting ? "active" : ""}`}
        onClick={onToggleSelect}
      >
        Selecionar atendimentos
      </button>
      <button type="button" className="ticket-list-action-btn" onClick={onFilterClick}>
        <Filter size={14} />
        Filtros
      </button>
      <button type="button" className="ticket-list-icon-btn small" aria-label="Ordenar">
        <Sliders size={16} />
      </button>
    </div>
  </div>
);

export default TicketListHeader;
