import React, { useContext } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  Home,
  MessageSquare,
  Users,
  Moon,
  Bell,
  LogOut,
} from "react-feather";
import { AuthContext } from "../../context/Auth/AuthContext";
import ColorModeContext from "../../layout/themeContext";
import { getInitials } from "../../helpers/getInitials";
import { generateColor } from "../../helpers/colorGenerator";
import "../theme/quarkTheme.css";
import "./ChatShell.css";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/v2/chat/dashboard" },
  { id: "chat", label: "Chat", icon: MessageSquare, path: "/v2/chat/andamento", matchPrefix: "/v2/chat" },
  { id: "clientes", label: "Clientes", icon: Users, path: "/v2/chat/clientes" },
];

const QuarkLogo = () => (
  <div className="quark-logo" aria-label="ISPCHAT">
    <svg viewBox="0 0 48 48" width="40" height="40">
      <defs>
        <linearGradient id="quarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3499d9" />
          <stop offset="50%" stopColor="#7b00b5" />
          <stop offset="100%" stopColor="#e91e8c" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#quarkGrad)" opacity="0.15" />
      <path
        d="M14 32V16c0-2 1.5-3 3.5-3h13c2 0 3.5 1 3.5 3v10c0 2-1.5 3-3.5 3H20l-6 6v-6z"
        fill="url(#quarkGrad)"
      />
      <text x="19" y="26" fill="#fff" fontSize="14" fontWeight="bold">Q</text>
    </svg>
  </div>
);

const ChatShell = ({ children, activeNav }) => {
  const history = useHistory();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const colorMode = useContext(ColorModeContext);

  const isActive = (item) => {
    if (activeNav) return activeNav === item.id;
    if (item.id === "chat") {
      return location.pathname.startsWith("/v2/chat/andamento")
        || location.pathname.startsWith("/v2/chat/espera")
        || location.pathname.startsWith("/v2/chat/automacao")
        || location.pathname === "/v2/chat";
    }
    return location.pathname.startsWith(item.path);
  };

  const avatarColor = generateColor(user?.name || "U");
  const initials = getInitials(user?.name || "U");

  return (
    <div className="quark-v2 chat-shell">
      <nav className="chat-shell-rail" aria-label="Navegação principal">
        <QuarkLogo />

        <div className="chat-shell-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <button
                key={item.id}
                type="button"
                className={`chat-shell-nav-item ${active ? "active" : ""}`}
                onClick={() => history.push(item.path)}
                aria-current={active ? "page" : undefined}
              >
                <span className="chat-shell-nav-icon">
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <span className="chat-shell-nav-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="chat-shell-bottom">
          <button
            type="button"
            className="chat-shell-nav-item"
            onClick={colorMode.toggleColorMode}
            aria-label="Modo escuro"
          >
            <span className="chat-shell-nav-icon"><Moon size={18} /></span>
            <span className="chat-shell-nav-label">Modo escuro</span>
          </button>
          <button type="button" className="chat-shell-nav-item" aria-label="Alerta sonoro">
            <span className="chat-shell-nav-icon"><Bell size={18} /></span>
            <span className="chat-shell-nav-label">Alerta sonoro</span>
          </button>
          <button
            type="button"
            className="chat-shell-nav-item danger"
            onClick={() => history.push("/app")}
            aria-label="Voltar à gestão"
          >
            <span className="chat-shell-nav-icon"><LogOut size={18} /></span>
            <span className="chat-shell-nav-label">Voltar à gestão</span>
          </button>

          <div className="chat-shell-user">
            <div
              className="chat-shell-avatar"
              style={{ backgroundColor: avatarColor }}
            >
              {user?.profilePic ? (
                <img src={user.profilePic} alt={user.name} />
              ) : (
                initials
              )}
            </div>
            <span className="chat-shell-user-name">{user?.name?.split(" ")[0] || "Usuário"}</span>
          </div>
        </div>
      </nav>

      <main className="chat-shell-content">{children}</main>
    </div>
  );
};

export default ChatShell;
