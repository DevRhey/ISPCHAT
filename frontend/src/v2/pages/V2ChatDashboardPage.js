import React, { useContext, useMemo } from "react";
import ChatShell from "../shell/ChatShell";
import AttendanceBoard from "../components/AttendanceBoard";
import useTickets from "../../hooks/useTickets";
import { AuthContext } from "../../context/Auth/AuthContext";
import "./V2ChatPages.css";

const V2ChatDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const queueIds = user?.queues?.map((q) => q.id) || [];

  const { tickets: allOpen } = useTickets({
    status: "open",
    pageNumber: 1,
    showAll: "true",
    queueIds,
  });
  const { tickets: closedToday } = useTickets({
    status: "closed",
    pageNumber: 1,
    showAll: "true",
    queueIds,
    date: new Date().toISOString().split("T")[0],
  });

  const totalActive = useMemo(() => {
    const pending = allOpen.filter((t) => !t.chatbot).length;
    return pending;
  }, [allOpen]);

  return (
    <ChatShell activeNav="dashboard">
      <div className="v2-dashboard-layout">
        <header className="v2-dashboard-header">
          <h1>Dashboard de atendimento</h1>
          <div className="v2-dashboard-profile">
            <span className="v2-dashboard-name">{user?.name}</span>
            <span className="v2-dashboard-link">Ver perfil</span>
          </div>
        </header>

        <div className="v2-dashboard-toolbar">
          <button type="button" className="v2-dashboard-tab active">
            Todos atendimentos
            <span className="v2-dashboard-badge">{totalActive}</span>
          </button>
          <button type="button" className="v2-dashboard-tab outline">
            Encerrados hoje
            <span className="v2-dashboard-badge muted">{closedToday?.length || 0}</span>
          </button>
          <select className="v2-dashboard-filter" defaultValue="">
            <option value="" disabled>Canais</option>
          </select>
          <select className="v2-dashboard-filter" defaultValue="">
            <option value="" disabled>Atendentes</option>
          </select>
          <select className="v2-dashboard-filter" defaultValue="">
            <option value="" disabled>Tags</option>
          </select>
          <select className="v2-dashboard-filter" defaultValue="">
            <option value="" disabled>Departamentos</option>
          </select>
        </div>

        <AttendanceBoard />
      </div>
    </ChatShell>
  );
};

export default V2ChatDashboardPage;
