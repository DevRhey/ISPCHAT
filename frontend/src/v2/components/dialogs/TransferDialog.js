import React, { useState, useEffect, useContext } from "react";
import { X } from "react-feather";
import api from "../../../services/api";
import { AuthContext } from "../../../context/Auth/AuthContext";
import toastError from "../../../errors/toastError";
import "./Dialogs.css";

const TransferDialog = ({ open, onClose, ticketId, onTransferred }) => {
  const [mode, setMode] = useState("atendente");
  const [onlineOnly, setOnlineOnly] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [internalMsg, setInternalMsg] = useState("");
  const [clientMsg, setClientMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!open) return;
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/users/");
        setUsers(data.users || data);
      } catch (err) {
        toastError(err);
      }
    };
    fetchUsers();
  }, [open]);

  if (!open) return null;

  const canTransfer = mode === "atendente" ? !!selectedUser : false;

  const handleTransfer = async () => {
    if (!canTransfer || !ticketId) return;
    setLoading(true);
    try {
      await api.put(`/tickets/${ticketId}`, {
        userId: selectedUser,
        status: "pending",
      });
      onTransferred?.();
      onClose();
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
          <h2>Transferir atendimento para</h2>
          <button type="button" className="v2-dialog-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="v2-dialog-body">
          <div className="v2-segment-group">
            <button
              type="button"
              className={`v2-segment ${mode === "atendente" ? "active" : ""}`}
              onClick={() => setMode("atendente")}
            >
              Atendente
            </button>
            <button
              type="button"
              className={`v2-segment ${mode === "departamento" ? "active" : ""}`}
              onClick={() => setMode("departamento")}
            >
              Departamento
            </button>
          </div>

          {mode === "atendente" && (
            <section className="v2-dialog-section">
              <div className="v2-dialog-row">
                <h3>Atendentes</h3>
                <label className="v2-toggle-label">
                  Somente Online
                  <input
                    type="checkbox"
                    checked={onlineOnly}
                    onChange={(e) => setOnlineOnly(e.target.checked)}
                  />
                </label>
              </div>
              <select
                className="v2-select"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Buscar atendentes</option>
                {users
                  .filter((u) => u.id !== user?.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
              </select>
            </section>
          )}

          <section className="v2-dialog-section">
            <h3>Mensagem interna</h3>
            <textarea
              className="v2-textarea"
              placeholder="Comunique, por exemplo, o motivo da transferência. Essa mensagem não é enviada ao cliente!"
              value={internalMsg}
              onChange={(e) => setInternalMsg(e.target.value)}
              rows={3}
            />
          </section>

          <section className="v2-dialog-section">
            <h3>Mensagem para o cliente</h3>
            <textarea
              className="v2-textarea"
              placeholder="Informe o seu cliente, que o atendimento está sendo transferido para outro(s) atendente(s)."
              value={clientMsg}
              onChange={(e) => setClientMsg(e.target.value)}
              rows={3}
            />
          </section>
        </div>

        <div className="v2-dialog-footer right">
          <button type="button" className="quark-btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="quark-btn-primary"
            disabled={!canTransfer || loading}
            onClick={handleTransfer}
          >
            Transferir
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferDialog;
