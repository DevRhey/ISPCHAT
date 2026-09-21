import React, { useContext, useMemo } from "react";
import { MessageCircle, Clock, Cpu } from "react-feather";
import useTickets from "../../hooks/useTickets";
import { AuthContext } from "../../context/Auth/AuthContext";
import { getInitials } from "../../helpers/getInitials";
import { generateColor } from "../../helpers/colorGenerator";
import "./AttendanceBoard.css";

const BoardColumn = ({ title, icon: Icon, count, tickets, accentColor }) => (
  <div className="attendance-column quark-card">
    <div className="attendance-column-header">
      <Icon size={18} className="attendance-column-icon" />
      <span className="attendance-column-title">{title}</span>
      <span className="attendance-column-badge">{count}</span>
    </div>
    <div className="attendance-column-body quark-v2-scroll">
      {tickets.length === 0 ? (
        <p className="attendance-empty">Ainda não há atendimentos por aqui...</p>
      ) : (
        tickets.map((ticket) => {
          const contact = ticket.contact || {};
          const name = contact.name || "Sem nome";
          const avatarColor = generateColor(name);
          const initials = getInitials(name);
          return (
            <div key={ticket.id} className="attendance-board-card">
              <div className="attendance-board-accent" style={{ background: accentColor }} />
              <div className="attendance-board-avatar" style={{ backgroundColor: avatarColor }}>
                {contact.profilePicUrl ? (
                  <img src={contact.profilePicUrl} alt={name} />
                ) : (
                  initials
                )}
              </div>
              <div className="attendance-board-info">
                <div className="attendance-board-name">{name}</div>
                <div className="attendance-board-preview">{ticket.lastMessage || "—"}</div>
                <div className="attendance-board-meta">
                  {ticket.queue?.name && (
                    <span className="attendance-board-tag">{ticket.queue.name}</span>
                  )}
                  {ticket.user?.name && (
                    <span className="attendance-board-agent">🎧 {ticket.user.name}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);

const AttendanceBoard = () => {
  const { user } = useContext(AuthContext);
  const queueIds = user?.queues?.map((q) => q.id) || [];

  const { tickets: openTickets, loading: loadingOpen } = useTickets({
    status: "open",
    pageNumber: 1,
    showAll: user?.profile === "admin" ? "true" : undefined,
    queueIds,
  });

  const { tickets: pendingTickets, loading: loadingPending } = useTickets({
    status: "pending",
    pageNumber: 1,
    showAll: user?.profile === "admin" ? "true" : undefined,
    queueIds,
  });

  const inProgress = useMemo(
    () => openTickets.filter((t) => !t.chatbot),
    [openTickets]
  );
  const inAutomation = useMemo(
    () => openTickets.filter((t) => t.chatbot),
    [openTickets]
  );

  if (loadingOpen || loadingPending) {
    return <div className="attendance-board-loading">Carregando atendimentos...</div>;
  }

  return (
    <div className="attendance-board">
      <BoardColumn
        title="Em andamento"
        icon={MessageCircle}
        count={inProgress.length}
        tickets={inProgress}
        accentColor="#7b00b5"
      />
      <BoardColumn
        title="Em espera"
        icon={Clock}
        count={pendingTickets.length}
        tickets={pendingTickets}
        accentColor="#ef4444"
      />
      <BoardColumn
        title="Na automação"
        icon={Cpu}
        count={inAutomation.length}
        tickets={inAutomation}
        accentColor="#3499d9"
      />
    </div>
  );
};

export default AttendanceBoard;
