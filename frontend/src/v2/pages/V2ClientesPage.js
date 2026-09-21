import React, { useState, useEffect } from "react";
import ChatShell from "../shell/ChatShell";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { getInitials } from "../../helpers/getInitials";
import { generateColor } from "../../helpers/colorGenerator";
import "./V2ChatPages.css";

const V2ClientesPage = () => {
  const [searchParam, setSearchParam] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/contacts", {
          params: { searchParam: searchParam || undefined, pageNumber: 1 },
        });
        setContacts(data.contacts || data);
      } catch (err) {
        toastError(err);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchParam]);

  return (
    <ChatShell activeNav="clientes">
      <div className="v2-clientes-layout">
        <header className="v2-clientes-header">
          <h1>Clientes</h1>
          <input
            className="v2-clientes-search"
            placeholder="Buscar por nome ou telefone"
            value={searchParam}
            onChange={(e) => setSearchParam(e.target.value)}
          />
        </header>
        <div className="v2-clientes-grid quark-v2-scroll">
          {loading ? (
            <p className="v2-clientes-loading">Carregando...</p>
          ) : contacts.length === 0 ? (
            <p className="v2-clientes-empty">Nenhum cliente encontrado.</p>
          ) : (
            contacts.map((contact) => {
              const color = generateColor(contact.name || "C");
              return (
                <div key={contact.id} className="v2-cliente-card quark-card">
                  <div className="v2-cliente-avatar" style={{ backgroundColor: color }}>
                    {contact.profilePicUrl ? (
                      <img src={contact.profilePicUrl} alt={contact.name} />
                    ) : (
                      getInitials(contact.name || "C")
                    )}
                  </div>
                  <div className="v2-cliente-info">
                    <span className="v2-cliente-name">{contact.name}</span>
                    <span className="v2-cliente-phone">{contact.number}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </ChatShell>
  );
};

export default V2ClientesPage;
