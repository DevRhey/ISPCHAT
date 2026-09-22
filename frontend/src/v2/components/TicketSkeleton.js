import React from "react";
import "./TicketSkeleton.css";

const TicketSkeleton = () => (
  <div className="ticket-skeleton">
    <div className="ticket-skeleton-accent" />
    <div className="ticket-skeleton-avatar" />
    <div className="ticket-skeleton-lines">
      <div className="ticket-skeleton-line wide" />
      <div className="ticket-skeleton-line" />
      <div className="ticket-skeleton-line short" />
    </div>
  </div>
);

export default TicketSkeleton;
