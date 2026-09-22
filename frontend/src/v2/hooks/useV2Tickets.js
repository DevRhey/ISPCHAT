import { useContext, useEffect, useMemo, useReducer } from "react";
import useTickets from "../../hooks/useTickets";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import { QUEUE_ROUTES } from "../theme/quarkTheme";

const reducer = (state, action) => {
  if (action.type === "LOAD_TICKETS") {
    const newTickets = action.payload;
    newTickets.forEach((ticket) => {
      const idx = state.findIndex((t) => t.id === ticket.id);
      if (idx !== -1) {
        state[idx] = ticket;
        if (ticket.unreadMessages > 0) {
          state.unshift(state.splice(idx, 1)[0]);
        }
      } else {
        state.push(ticket);
      }
    });
    return [...state];
  }
  if (action.type === "UPDATE_TICKET") {
    const idx = state.findIndex((t) => t.id === action.payload.id);
    if (idx !== -1) {
      state[idx] = action.payload;
      return [...state];
    }
    return [action.payload, ...state];
  }
  if (action.type === "DELETE_TICKET") {
    return state.filter((t) => t.id !== action.payload);
  }
  if (action.type === "RESET") {
    return action.payload;
  }
  return state;
};

const useV2Tickets = ({ queueKey, searchParam, tags, users, withUnreadMessages, date }) => {
  const { user } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);
  const queueConfig = QUEUE_ROUTES[queueKey] || QUEUE_ROUTES.andamento;

  const queueIds = JSON.stringify(user?.queues?.map((q) => q.id) || []);
  const parsedQueueIds = JSON.parse(queueIds);

  const { tickets: fetchedTickets, loading } = useTickets({
    searchParam,
    tags,
    users,
    pageNumber: 1,
    status: queueConfig.status,
    date,
    showAll: user?.profile === "admin" ? "true" : undefined,
    queueIds: parsedQueueIds,
    withUnreadMessages,
  });

  const filteredFetched = useMemo(() => {
    if (queueKey === "automacao") {
      return fetchedTickets.filter((t) => t.chatbot === true);
    }
    if (queueKey === "andamento") {
      return fetchedTickets.filter((t) => !t.chatbot);
    }
    return fetchedTickets;
  }, [fetchedTickets, queueKey]);

  const [tickets, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    dispatch({ type: "RESET", payload: filteredFetched });
  }, [filteredFetched]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    if (!companyId) return undefined;

    const socket = socketManager.getSocket(companyId);

    const onTicket = (data) => {
      if (data.action === "update") {
        const ticket = data.ticket;
        const matchesQueue =
          (queueKey === "automacao" && ticket.chatbot) ||
          (queueKey === "andamento" && ticket.status === "open" && !ticket.chatbot) ||
          (queueKey === "espera" && ticket.status === "pending");
        if (matchesQueue) {
          dispatch({ type: "UPDATE_TICKET", payload: ticket });
        } else {
          dispatch({ type: "DELETE_TICKET", payload: ticket.id });
        }
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_TICKET", payload: data.ticketId });
      }
    };

    socket.on(`company-${companyId}-ticket`, onTicket);
    return () => socket.off(`company-${companyId}-ticket`, onTicket);
  }, [socketManager, queueKey]);

  return { tickets, loading, queueConfig };
};

export default useV2Tickets;
