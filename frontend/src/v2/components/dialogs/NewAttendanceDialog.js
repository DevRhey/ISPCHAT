import React, { useState, useEffect, useContext } from "react";
import { X } from "react-feather";
import { useHistory } from "react-router-dom";
import api from "../../../services/api";
import { AuthContext } from "../../../context/Auth/AuthContext";
import toastError from "../../../errors/toastError";
import { toast } from "react-toastify";
import "./Dialogs.css";

const NewAttendanceDialog = ({ open, onClose, queuePath }) => {
  const [whatsapps, setWhatsapps] = useState([]);
  const [selectedWhatsapp, setSelectedWhatsapp] = useState("");
  const [rememberChannel, setRememberChannel] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const history = useHistory();

  useEffect(() => {
    if (!open) return;
    api.get("/whatsapp").then(({ data }) => setWhatsapps(data)).catch(toastError);
  }, [open]);

  useEffect(() => {
    if (!searchParam || searchParam.length < 2) {
      setContacts([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get("/contacts", { params: { searchParam } });
        setContacts(data.contacts || data);
      } catch (err) {
        toastError(err);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchParam]);

  if (!open) return null;

  const canStart = selectedWhatsapp && selectedContacts.length > 0 && selectedContacts.length <= 10;

  const toggleContact = (contact) => {
    setSelectedContacts((prev) => {
      const exists = prev.find((c) => c.id === contact.id);
      if (exists) return prev.filter((c) => c.id !== contact.id);
      if (prev.length >= 10) return prev;
      return [...prev, contact];
    });
  };

  const handleStart = async () => {
    if (!canStart) return;
    setLoading(true);
    try {
      const contact = selectedContacts[0];
      const { data } = await api.post("/tickets", {
        contactId: contact.id,
        userId: user.id,
        status: "open",
        whatsappId: selectedWhatsapp,
      });
      toast.success("Atendimento iniciado");
      onClose();
      history.push(`${queuePath}/${data.uuid || data.ticket?.uuid}`);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="v2-dialog-overlay" onClick={onClose} role="presentation">
      <div className="v2-dialog v2-dialog-lg" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="v2-dialog-header">
          <h2>Novo atendimento</h2>
          <button type="button" className="v2-dialog-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="v2-dialog-body">
          <section className="v2-dialog-section">
            <h3>Canais</h3>
            <select
              className="v2-select"
              value={selectedWhatsapp}
              onChange={(e) => setSelectedWhatsapp(e.target.value)}
            >
              <option value="">Selecione um canal</option>
              {whatsapps.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <label className="v2-checkbox-label">
              <input
                type="checkbox"
                checked={rememberChannel}
                onChange={(e) => setRememberChannel(e.target.checked)}
              />
              Lembrar canal
            </label>
          </section>

          <section className="v2-dialog-section">
            <h3>Clientes</h3>
            <input
              className="v2-input"
              placeholder="Buscar clientes"
              value={searchParam}
              onChange={(e) => setSearchParam(e.target.value)}
            />
            <p className="v2-dialog-hint">Selecione até 10 clientes para iniciar o atendimento</p>
            {contacts.length > 0 && (
              <div className="v2-contact-list">
                {contacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`v2-contact-item ${selectedContacts.find((s) => s.id === c.id) ? "selected" : ""}`}
                    onClick={() => toggleContact(c)}
                  >
                    {c.name} — {c.number}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="v2-dialog-section">
            <h3>Opções de Atendimento</h3>
            <h4>Mensagem</h4>
            <textarea
              className="v2-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </section>
        </div>

        <div className="v2-dialog-footer right">
          <button type="button" className="quark-btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="quark-btn-primary"
            disabled={!canStart || loading}
            onClick={handleStart}
          >
            Iniciar atendimento
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewAttendanceDialog;
