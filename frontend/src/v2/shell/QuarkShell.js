import React, { useContext, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  Home,
  MessageSquare,
  Users,
  Moon,
  Bell,
  Settings,
  Smartphone,
  Layers,
  User,
  Zap,
  Tag,
  GitBranch,
  DollarSign,
  BarChart2,
  ArrowLeft,
} from "react-feather";
import { AuthContext } from "../../context/Auth/AuthContext";
import ColorModeContext from "../../layout/themeContext";
import { getInitials } from "../../helpers/getInitials";
import { generateColor } from "../../helpers/colorGenerator";
import NotificationsPopOver from "../../components/NotificationsPopOver";
import OnboardingWizard from "../../components/OnboardingWizard";
import UserModal from "../../components/UserModal";
import { Can } from "../../components/Can";
import { V2_CHAT_ANDAMENTO, V2_CHAT_DASHBOARD } from "../../helpers/v2Paths";
import "../theme/quarkTheme.css";
import "./ChatShell.css";
import "./QuarkShell.css";

const ATTENDANCE_NAV = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: V2_CHAT_DASHBOARD },
  { id: "chat", label: "Chat", icon: MessageSquare, path: V2_CHAT_ANDAMENTO },
  { id: "clientes", label: "Clientes", icon: Users, path: "/v2/chat/clientes" },
];

const GESTAO_NAV = [
  { id: "settings", label: "Ajustes", icon: Settings, path: "/settings", perform: "drawer-admin-items:view" },
  { id: "connections", label: "Conexões", icon: Smartphone, path: "/connections", perform: "drawer-admin-items:view" },
  { id: "queues", label: "Filas", icon: Layers, path: "/queues", perform: "drawer-admin-items:view" },
  { id: "users", label: "Usuários", icon: User, path: "/users", perform: "drawer-admin-items:view" },
  { id: "flows", label: "Automações", icon: GitBranch, path: "/flows", perform: "drawer-admin-items:view" },
  { id: "quick-messages", label: "Rápidas", icon: Zap, path: "/quick-messages", perform: "drawer-service-items:view" },
  { id: "tags", label: "Tags", icon: Tag, path: "/tags", perform: "drawer-service-items:view" },
  { id: "financeiro", label: "Financeiro", icon: DollarSign, path: "/financeiro", perform: "drawer-admin-items:view" },
  { id: "relatorios", label: "Relatórios", icon: BarChart2, path: "/relatorios", perform: "drawer-admin-items:view" },
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

const NavButton = ({ item, active, onClick }) => {
  const Icon = item.icon;
  return (
    <button
      type="button"
      className={`chat-shell-nav-item ${active ? "active" : ""}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      title={item.label}
    >
      <span className="chat-shell-nav-icon">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span className="chat-shell-nav-label">{item.label}</span>
    </button>
  );
};

const QuarkShell = ({ children }) => {
  const history = useHistory();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const colorMode = useContext(ColorModeContext);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [volume] = useState(localStorage.getItem("volume") || 1);

  const isChatPath =
    location.pathname.startsWith("/v2/chat/andamento")
    || location.pathname.startsWith("/v2/chat/espera")
    || location.pathname.startsWith("/v2/chat/automacao")
    || location.pathname === "/v2/chat";

  const isActive = (item) => {
    if (item.id === "chat") return isChatPath;
    if (item.id === "dashboard") return location.pathname.startsWith(V2_CHAT_DASHBOARD);
    return location.pathname.startsWith(item.path);
  };

  const avatarColor = generateColor(user?.name || "U");
  const initials = getInitials(user?.name || "U");

  const renderGestaoItem = (item) => (
    <Can key={item.id} role={user?.profile} perform={item.perform} yes={() => (
      <NavButton
        item={item}
        active={location.pathname.startsWith(item.path)}
        onClick={() => history.push(item.path)}
      />
    )} />
  );

  return (
    <div className="quark-v2 chat-shell">
      {user?.id ? <OnboardingWizard /> : null}
      <nav className="chat-shell-rail quark-shell-rail" aria-label="Navegação principal">
        <QuarkLogo />

        <div className="chat-shell-nav quark-shell-nav-section">
          {ATTENDANCE_NAV.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={isActive(item)}
              onClick={() => history.push(item.path)}
            />
          ))}
        </div>

        <div className="quark-shell-divider" aria-hidden />

        <div className="chat-shell-nav quark-shell-gestao-scroll quark-v2-scroll">
          {GESTAO_NAV.map(renderGestaoItem)}
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
          <div className="quark-shell-notifications">
            {user?.id ? <NotificationsPopOver volume={volume} /> : null}
          </div>
          <button type="button" className="chat-shell-nav-item" aria-label="Alerta sonoro">
            <span className="chat-shell-nav-icon"><Bell size={18} /></span>
            <span className="chat-shell-nav-label">Alerta sonoro</span>
          </button>

          {isChatPath ? (
            <button
              type="button"
              className="chat-shell-nav-item quark-shell-gestao-link"
              onClick={() => history.push("/settings")}
              aria-label="Voltar à gestão"
            >
              <span className="chat-shell-nav-icon"><ArrowLeft size={18} /></span>
              <span className="chat-shell-nav-label">Gestão</span>
            </button>
          ) : (
            <button
              type="button"
              className="chat-shell-nav-item quark-shell-gestao-link"
              onClick={() => history.push(V2_CHAT_ANDAMENTO)}
              aria-label="Ir para atendimento"
            >
              <span className="chat-shell-nav-icon"><MessageSquare size={18} /></span>
              <span className="chat-shell-nav-label">Atendimento</span>
            </button>
          )}

          <button
            type="button"
            className="chat-shell-user chat-shell-user-btn"
            onClick={() => setUserModalOpen(true)}
            aria-label="Perfil do usuário"
          >
            <div className="chat-shell-avatar" style={{ backgroundColor: avatarColor }}>
              {user?.profilePic ? (
                <img src={user.profilePic} alt={user.name} />
              ) : (
                initials
              )}
            </div>
            <span className="chat-shell-user-name">{user?.name?.split(" ")[0] || "Usuário"}</span>
          </button>
        </div>
      </nav>

      <main className="chat-shell-content">{children}</main>

      <UserModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        userId={user?.id}
      />
    </div>
  );
};

export default QuarkShell;
