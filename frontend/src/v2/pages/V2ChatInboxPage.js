import React, { useState, useMemo, useContext } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import QueueTabs from "../components/QueueTabs";
import ConnectionStatus from "../components/ConnectionStatus";
import TicketListHeader from "../components/TicketListHeader";
import TicketList from "../components/TicketList";
import EmptyConversation from "../components/EmptyConversation";
import ConversationPane from "../components/ConversationPane";
import FilterDialog from "../components/dialogs/FilterDialog";
import NewAttendanceDialog from "../components/dialogs/NewAttendanceDialog";
import HistorySearchDialog from "../components/dialogs/HistorySearchDialog";
import useV2Connection from "../hooks/useV2Connection";
import useV2Tickets from "../hooks/useV2Tickets";
import useTickets from "../../hooks/useTickets";
import { AuthContext } from "../../context/Auth/AuthContext";
import { QUEUE_ROUTES } from "../theme/quarkTheme";
import "./V2ChatPages.css";

const QUEUE_KEYS = ["andamento", "espera", "automacao"];

const getQueueKeyFromPath = (pathname) =>
  QUEUE_KEYS.find((key) => pathname.startsWith(QUEUE_ROUTES[key].path)) || "andamento";

const V2ChatInboxPage = () => {
  const history = useHistory();
  const location = useLocation();
  const { ticketId } = useParams();
  const { user } = useContext(AuthContext);

  const queueKey = getQueueKeyFromPath(location.pathname);
  const queuePath = QUEUE_ROUTES[queueKey].path;

  const [searchParam, setSearchParam] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);

  const { connected, reconnecting, refresh } = useV2Connection();

  const filterExtras = useMemo(() => {
    if (!activeFilter) return {};
    const { period } = activeFilter;
    if (period === "Hoje") {
      return { date: new Date().toISOString().split("T")[0] };
    }
    if (period === "Ontem") {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return { date: d.toISOString().split("T")[0] };
    }
    if (period === "Não lidas") {
      return { withUnreadMessages: true };
    }
    return {};
  }, [activeFilter]);

  const { tickets, loading } = useV2Tickets({ queueKey, searchParam, ...filterExtras });

  const queueIds = user?.queues?.map((q) => q.id) || [];
  const { tickets: andamentoTickets } = useTickets({ status: "open", pageNumber: 1, queueIds });
  const { tickets: esperaTickets } = useTickets({ status: "pending", pageNumber: 1, queueIds });
  const { tickets: openAll } = useTickets({ status: "open", pageNumber: 1, queueIds });

  const counts = useMemo(() => ({
    andamento: andamentoTickets.filter((t) => !t.chatbot).length,
    espera: esperaTickets.length,
    automacao: openAll.filter((t) => t.chatbot).length,
  }), [andamentoTickets, esperaTickets, openAll]);

  const handleSelectTicket = (ticket) => {
    history.push(`${queuePath}/${ticket.uuid}`);
  };

  return (
    <>
      <div className="v2-inbox-layout">
        <aside className="v2-inbox-sidebar">
          <QueueTabs counts={counts} />
          <ConnectionStatus
            connected={connected}
            reconnecting={reconnecting}
            onRefresh={refresh}
          />
          <TicketListHeader
            searchParam={searchParam}
            onSearchChange={setSearchParam}
            onHistoryClick={() => setHistoryOpen(true)}
            onNewClick={() => setNewOpen(true)}
            onFilterClick={() => setFilterOpen(true)}
            selecting={selecting}
            onToggleSelect={() => setSelecting(!selecting)}
          />
          <TicketList
            tickets={tickets}
            loading={loading}
            selectedId={ticketId}
            onSelect={handleSelectTicket}
            connected={connected}
            reconnecting={reconnecting}
          />
        </aside>

        <section className="v2-conversation-area">
          {ticketId ? (
            <ConversationPane ticketUuid={ticketId} queuePath={queuePath} />
          ) : (
            <EmptyConversation />
          )}
        </section>
      </div>

      <FilterDialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={(f) => setActiveFilter(f)}
        onClear={() => { setActiveFilter(null); setSearchParam(""); }}
      />
      <NewAttendanceDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        queuePath={queuePath}
      />
      <HistorySearchDialog open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
};

export default V2ChatInboxPage;
