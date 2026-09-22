import React from "react";
import TicketCard from "./TicketCard";
import EmptyInbox from "./EmptyInbox";
import TicketSkeleton from "./TicketSkeleton";
import "./TicketList.css";

const TicketList = ({ tickets, loading, selectedId, onSelect, connected, reconnecting }) => {
  if (!connected && reconnecting) {
    return (
      <div className="ticket-list quark-v2-scroll">
        {[1, 2, 3, 4].map((i) => (
          <TicketSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (loading && tickets.length === 0) {
    return (
      <div className="ticket-list quark-v2-scroll">
        {[1, 2, 3].map((i) => (
          <TicketSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return <EmptyInbox connected={connected} />;
  }

  return (
    <div className="ticket-list quark-v2-scroll">
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          selected={selectedId === ticket.uuid}
          onClick={onSelect}
        />
      ))}
    </div>
  );
};

export default TicketList;
