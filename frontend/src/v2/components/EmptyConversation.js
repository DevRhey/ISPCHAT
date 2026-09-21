import React from "react";
import "./EmptyConversation.css";

const QuarkLogoLarge = () => (
  <svg viewBox="0 0 120 120" width="120" height="120" className="empty-conversation-logo">
    <defs>
      <linearGradient id="quarkGradLarge" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3499d9" />
        <stop offset="50%" stopColor="#7b00b5" />
        <stop offset="100%" stopColor="#e91e8c" />
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="55" fill="url(#quarkGradLarge)" opacity="0.12" />
    <path
      d="M30 80V35c0-5 4-8 9-8h35c5 0 9 3 9 8v28c0 5-4 8-9 8H52l-12 12v-12z"
      fill="url(#quarkGradLarge)"
    />
    <text x="46" y="62" fill="#fff" fontSize="32" fontWeight="bold">Q</text>
  </svg>
);

const EmptyConversation = () => (
  <div className="empty-conversation quark-page-bg">
    <QuarkLogoLarge />
    <div className="empty-conversation-pill">
      SELECIONE UM ATENDIMENTO PARA INICIAR
    </div>
  </div>
);

export default EmptyConversation;
