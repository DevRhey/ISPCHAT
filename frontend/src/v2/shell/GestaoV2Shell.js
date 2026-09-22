import React, { useContext } from "react";
import { useHistory } from "react-router-dom";
import { MessageSquare } from "react-feather";
import { AuthContext } from "../../context/Auth/AuthContext";
import "../theme/quarkTheme.css";
import "./GestaoV2Shell.css";

/**
 * Wrapper leve para alinhar tokens Quark em páginas de gestão/admin
 * sem reconstruir o produto administrativo completo.
 */
const GestaoV2Shell = ({ title, children, actions }) => {
  const history = useHistory();
  const { user } = useContext(AuthContext);

  return (
    <div className="quark-v2 gestao-v2-shell">
      <header className="gestao-v2-header">
        <div className="gestao-v2-header-left">
          <h1 className="gestao-v2-title">{title}</h1>
        </div>
        <div className="gestao-v2-header-right">
          {actions}
          <button
            type="button"
            className="gestao-v2-chat-link"
            onClick={() => history.push("/v2/chat/andamento")}
          >
            <MessageSquare size={16} />
            Chat V2
          </button>
          <div className="gestao-v2-profile">
            <span className="gestao-v2-profile-name">{user?.name}</span>
            <span className="gestao-v2-profile-link">Ver perfil</span>
          </div>
        </div>
      </header>
      <div className="gestao-v2-body">{children}</div>
    </div>
  );
};

export default GestaoV2Shell;
