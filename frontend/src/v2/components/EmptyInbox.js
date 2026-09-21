import React from "react";
import { MessageSquare } from "react-feather";
import "./EmptyInbox.css";

const EmptyInbox = ({ connected }) => (
  <div className="empty-inbox">
    <MessageSquare size={48} className="empty-inbox-icon" />
    <h3 className="empty-inbox-title">Ainda não há atendimentos por aqui...</h3>
    <p className="empty-inbox-text">
      Por favor, volte mais tarde para acompanhar as conversas ou inicie um novo, usando o botão acima!
    </p>
    {!connected && (
      <p className="empty-inbox-disconnected">Chat desconectado</p>
    )}
  </div>
);

export default EmptyInbox;
