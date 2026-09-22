import React from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { Star } from "react-feather";
import { getInitials } from "../../helpers/getInitials";
import { generateColor } from "../../helpers/colorGenerator";
import "./TicketCard.css";

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const date = parseISO(dateStr);
  if (isSameDay(date, new Date())) {
    return format(date, "HH'h'mm");
  }
  return format(date, "dd/MM");
};

const TicketCard = ({ ticket, selected, onClick }) => {
  const contact = ticket.contact || {};
  const name = contact.name || "Sem nome";
  const lastMsg = ticket.lastMessage || "";
  const sender = ticket.user?.name ? `${ticket.user.name.split(" ")[0]}: ` : "";
  const preview = lastMsg ? `${sender}${lastMsg}` : "Sem mensagens";
  const dept = ticket.queue?.name || (ticket.tags?.[0]?.name) || "";
  const avatarColor = generateColor(name);
  const initials = getInitials(name);

  return (
    <button
      type="button"
      className={`v2-ticket-card ${selected ? "selected" : ""}`}
      onClick={() => onClick(ticket)}
    >
      <div className="v2-ticket-accent" />
      <div className="v2-ticket-avatar" style={{ backgroundColor: avatarColor }}>
        {contact.profilePicUrl ? (
          <img src={contact.profilePicUrl} alt={name} />
        ) : (
          initials
        )}
      </div>
      <div className="v2-ticket-body">
        <div className="v2-ticket-header">
          <span className="v2-ticket-name">{name}</span>
          <span className="v2-ticket-time">{formatTime(ticket.updatedAt)}</span>
        </div>
        <div className="v2-ticket-preview">{preview}</div>
        <div className="v2-ticket-footer">
          <Star size={12} className="v2-ticket-star" />
          <span className="v2-ticket-whatsapp" aria-label="WhatsApp">📱</span>
          {dept && <span className="v2-ticket-dept">{dept}</span>}
        </div>
      </div>
      {ticket.unreadMessages > 0 && (
        <span className="v2-ticket-unread">{ticket.unreadMessages}</span>
      )}
    </button>
  );
};

export default TicketCard;
