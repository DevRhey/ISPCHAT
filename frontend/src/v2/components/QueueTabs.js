import React from "react";
import { useHistory, useLocation } from "react-router-dom";
import { QUEUE_ROUTES } from "../theme/quarkTheme";
import "./QueueTabs.css";

const QUEUES = [
  { key: "andamento", badge: null },
  { key: "espera", badge: null },
  { key: "automacao", badge: null },
];

const QueueTabs = ({ counts = {} }) => {
  const history = useHistory();
  const location = useLocation();

  const activeKey = Object.keys(QUEUE_ROUTES).find((key) =>
    location.pathname.startsWith(QUEUE_ROUTES[key].path)
  ) || "andamento";

  const handleTab = (key) => {
    history.push(QUEUE_ROUTES[key].path);
  };

  return (
    <div className="queue-tabs" role="tablist">
      {QUEUES.map(({ key }) => {
        const config = QUEUE_ROUTES[key];
        const count = counts[key];
        const active = activeKey === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            className={`queue-tab ${active ? "active" : ""}`}
            onClick={() => handleTab(key)}
          >
            {config.label}
            {count > 0 && (
              <span className="queue-tab-badge">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default QueueTabs;
