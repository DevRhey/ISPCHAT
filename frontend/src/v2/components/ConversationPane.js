import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { AuthContext } from "../../context/Auth/AuthContext";
import { ReplyMessageProvider } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import MessagesList from "../../components/MessagesList";
import ConversationHeader from "./ConversationHeader";
import ConversationComposer from "./ConversationComposer";
import ContextRail from "./ContextRail";
import ContextPanel from "./ContextPanel";
import TransferDialog from "./dialogs/TransferDialog";
import "./ConversationPane.css";

const ConversationPane = ({ ticketUuid, queuePath }) => {
  const history = useHistory();
  const { user } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);
  const [ticket, setTicket] = useState(null);
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transferOpen, setTransferOpen] = useState(false);
  const [contextTab, setContextTab] = useState("inicio");
  const [panelExpanded, setPanelExpanded] = useState(true);

  useEffect(() => {
    if (!ticketUuid) return;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/tickets/u/${ticketUuid}`);
        const queueAllowed = user?.queues?.find((q) => q.id === data.queueId);
        if (queueAllowed === undefined && user?.profile !== "admin") {
          history.push(queuePath);
          return;
        }
        setTicket(data);
        setContact(data.contact);
        setLoading(false);
      } catch (err) {
        toastError(err);
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [ticketUuid, user, history, queuePath]);

  useEffect(() => {
    if (!ticket?.id) return undefined;
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);

    socket.on("ready", () => socket.emit("joinChatBox", `${ticket.id}`));

    const onTicket = (data) => {
      if (data.action === "update" && data.ticket.id === ticket.id) {
        setTicket(data.ticket);
        setContact(data.ticket.contact);
      }
      if (data.action === "delete" && data.ticketId === ticket.id) {
        history.push(queuePath);
      }
    };

    const onContact = (data) => {
      if (data.action === "update" && data.contact?.id === contact?.id) {
        setContact((prev) => ({ ...prev, ...data.contact }));
      }
    };

    socket.on(`company-${companyId}-ticket`, onTicket);
    socket.on(`company-${companyId}-contact`, onContact);

    return () => {
      socket.off(`company-${companyId}-ticket`, onTicket);
      socket.off(`company-${companyId}-contact`, onContact);
    };
  }, [ticket, contact, socketManager, history, queuePath]);

  const handleClose = async () => {
    if (!ticket) return;
    try {
      await api.put(`/tickets/${ticket.id}`, { status: "closed" });
      history.push(queuePath);
    } catch (err) {
      toastError(err);
    }
  };

  if (loading || !ticket) {
    return (
      <div className="conversation-pane loading quark-page-bg">
        <div className="conversation-loading">Carregando conversa...</div>
      </div>
    );
  }

  return (
    <div className="conversation-pane">
      <div className="conversation-main">
        <ConversationHeader
          ticket={ticket}
          onTransfer={() => setTransferOpen(true)}
          onClose={handleClose}
        />
        <div className="conversation-messages quark-page-bg">
          <ReplyMessageProvider>
            <div className="conversation-messages-inner">
              <MessagesList
                ticket={ticket}
                ticketId={ticket.id}
                isGroup={ticket.isGroup}
              />
            </div>
            <ConversationComposer ticketId={ticket.id} ticketStatus={ticket.status} />
          </ReplyMessageProvider>
        </div>
      </div>

      <ContextRail
        activeTab={contextTab}
        onTabChange={setContextTab}
        expanded={panelExpanded}
        onToggleExpand={() => setPanelExpanded(!panelExpanded)}
      />
      {panelExpanded && (
        <ContextPanel tab={contextTab} contact={contact} ticket={ticket} />
      )}

      <TransferDialog
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        ticketId={ticket.id}
        onTransferred={() => history.push(queuePath)}
      />
    </div>
  );
};

export default ConversationPane;
