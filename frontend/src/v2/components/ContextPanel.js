import React from "react";
import { format, parseISO } from "date-fns";
import { getInitials } from "../../helpers/getInitials";
import { generateColor } from "../../helpers/colorGenerator";
import { ContactNotes } from "../../components/ContactNotes";
import { TagsContainer } from "../../components/TagsContainer";
import "./ContextPanel.css";

const ContextPanel = ({ tab, contact, ticket }) => {
  if (!contact || !ticket) return null;

  const avatarColor = generateColor(contact.name || "C");
  const initials = getInitials(contact.name || "C");

  return (
    <aside className="context-panel quark-v2-scroll">
      {(tab === "inicio" || tab === "cliente") && (
        <>
          <div className="context-card">
            <div className="context-client-header">
              <div className="context-client-avatar" style={{ backgroundColor: avatarColor }}>
                {contact.profilePicUrl ? (
                  <img src={contact.profilePicUrl} alt={contact.name} />
                ) : (
                  initials
                )}
              </div>
              <div>
                <h3 className="context-client-name">{contact.name}</h3>
                <p className="context-client-phone">{contact.number}</p>
              </div>
            </div>
            <div className="context-field">
              <label>E-mail</label>
              <span>{contact.email || "—"}</span>
            </div>
            <div className="context-field">
              <label>Empresa</label>
              <span>{contact.company || "—"}</span>
            </div>
            <div className="context-field">
              <label>Tags do cliente</label>
              <select className="context-select" defaultValue="">
                <option value="" disabled>Adicionar tags</option>
              </select>
            </div>
            <div className="context-field">
              <label>Anotações</label>
              <ContactNotes ticket={ticket} />
            </div>
          </div>

          <div className="context-recurrence">
            <span className="context-recurrence-label">Baixa recorrência</span>
            <p className="context-recurrence-desc">
              Nos ultimos 31 dias, o cliente entrou em contato 2 vezes
            </p>
            <div className="context-recurrence-bars">
              <span className="bar active" />
              <span className="bar active" />
              <span className="bar" />
            </div>
          </div>
        </>
      )}

      {(tab === "inicio" || tab === "suporte") && (
        <div className="context-card">
          <h4 className="context-card-title">Atendimento</h4>
          <div className="context-field">
            <label>Iniciado em</label>
            <span>
              {ticket.createdAt
                ? format(parseISO(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm")
                : "—"}
            </span>
          </div>
          <div className="context-field">
            <label>Canal</label>
            <span className="context-channel">
              📱 {ticket.whatsapp?.name || "WhatsApp"}
            </span>
          </div>
          <div className="context-field">
            <label>Atendente</label>
            <span>{ticket.user?.name || "—"}</span>
          </div>
          <div className="context-field">
            <label>Tags do atendimento</label>
            <TagsContainer ticket={ticket} />
          </div>
        </div>
      )}

      {tab === "financeiro" && (
        <div className="context-card">
          <h4 className="context-card-title">Financeiro</h4>
          <p className="context-stub">Dados financeiros do cliente serão exibidos aqui.</p>
        </div>
      )}

      {tab === "rede" && (
        <div className="context-card">
          <h4 className="context-card-title">Rede</h4>
          <p className="context-stub">Informações de rede/conexão do cliente.</p>
        </div>
      )}

      <div className="context-card">
        <h4 className="context-card-title">Histórico</h4>
        <p className="context-stub">Atendimentos anteriores do cliente.</p>
      </div>
    </aside>
  );
};

export default ContextPanel;
