import React, { useContext } from "react";
import { AuthContext } from "../../context/Auth/AuthContext";
import DueDateBanner from "../../components/DueDateBanner";
import "./GestaoV2Shell.css";

/**
 * Wraps legacy admin page content with Quark-aligned header and spacing.
 */
const GestaoPageLayout = ({ title, children, actions }) => {
  const { user } = useContext(AuthContext);

  return (
    <div className="quark-v2 gestao-v2-shell gestao-page-fill">
      <header className="gestao-v2-header">
        <div className="gestao-v2-header-left">
          <h1 className="gestao-v2-title">{title}</h1>
        </div>
        <div className="gestao-v2-header-right">
          {actions}
          <div className="gestao-v2-profile">
            <span className="gestao-v2-profile-name">{user?.name}</span>
            <span className="gestao-v2-profile-link">Ver perfil</span>
          </div>
        </div>
      </header>
      {user?.id ? <DueDateBanner /> : null}
      <div className="gestao-v2-body quark-v2-scroll">{children}</div>
    </div>
  );
};

export default GestaoPageLayout;
