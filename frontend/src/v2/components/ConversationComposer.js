import React, { useState, useRef } from "react";
import { Smile, Zap, Plus, Mic } from "react-feather";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import "./ConversationComposer.css";

const PLACEHOLDER = "Pressione enter para enviar ou shift + enter para pular uma linha";

const ConversationComposer = ({ ticketId, ticketStatus }) => {
  const [message, setMessage] = useState("");
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);

  const handleSend = async () => {
    if (!message.trim() || !ticketId || sending) return;
    if (ticketStatus === "closed") return;

    setSending(true);
    try {
      await api.post(`/messages/${ticketId}`, {
        body: message.trim(),
        fromMe: true,
        read: true,
        ...(internal ? { isPrivate: true } : {}),
      });
      setMessage("");
    } catch (err) {
      toastError(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="conversation-composer">
      <div className="composer-toolbar">
        <button type="button" className="composer-tool-btn" aria-label="Emoji">
          <Smile size={18} />
        </button>
        <button type="button" className="composer-tool-btn" aria-label="Respostas rápidas">
          <Zap size={18} />
        </button>
        <button type="button" className="composer-tool-btn" aria-label="Anexos">
          <Plus size={18} />
        </button>
        <button
          type="button"
          className={`composer-internal-toggle ${internal ? "active" : ""}`}
          onClick={() => setInternal(!internal)}
        >
          Mensagem interna
        </button>
      </div>
      <div className="composer-input-row">
        <button type="button" className="composer-mic-btn" aria-label="Gravar áudio">
          <Mic size={18} />
        </button>
        <textarea
          ref={textareaRef}
          className="composer-textarea"
          placeholder={PLACEHOLDER}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={sending}
        />
      </div>
    </div>
  );
};

export default ConversationComposer;
