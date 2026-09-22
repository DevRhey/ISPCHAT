import React, { useContext } from "react";
import { useHistory } from "react-router-dom";
import {
  Settings,
  Smartphone,
  Layers,
  User,
  GitBranch,
  Zap,
  Tag,
  DollarSign,
  BarChart2,
  Calendar,
  Code,
  Wifi,
  CreditCard,
} from "react-feather";
import { Can } from "../../components/Can";
import { AuthContext } from "../../context/Auth/AuthContext";
import { AJUSTES_HUB_CARDS } from "./navigationConfig";
import "./AjustesHub.css";

const ICON_MAP = {
  settings: Settings,
  smartphone: Smartphone,
  layers: Layers,
  user: User,
  flows: GitBranch,
  "git-branch": GitBranch,
  zap: Zap,
  tag: Tag,
  dollar: DollarSign,
  "bar-chart": BarChart2,
  calendar: Calendar,
  code: Code,
  wifi: Wifi,
  "credit-card": CreditCard,
};

const HubCard = ({ card, onClick }) => {
  const Icon = ICON_MAP[card.icon] || Settings;
  return (
    <button
      type="button"
      className="ajustes-hub-card"
      onClick={() => onClick(card.path)}
      aria-label={card.title}
    >
      <div className="ajustes-hub-card-icon">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <div className="ajustes-hub-card-body">
        <h3 className="ajustes-hub-card-title">{card.title}</h3>
        <p className="ajustes-hub-card-desc">{card.description}</p>
      </div>
    </button>
  );
};

const AjustesHub = () => {
  const history = useHistory();
  const { user } = useContext(AuthContext);

  const navigate = (path) => history.push(path);

  return (
    <div className="ajustes-hub quark-v2-scroll">
      <header className="ajustes-hub-header">
        <div>
          <h1 className="ajustes-hub-title">Ajustes</h1>
          <p className="ajustes-hub-subtitle">Gerencie todas as configurações do ISPCHAT</p>
        </div>
        <div className="ajustes-hub-profile">
          <span className="ajustes-hub-profile-name">{user?.name}</span>
          <span className="ajustes-hub-profile-link">Ver perfil</span>
        </div>
      </header>

      <div className="ajustes-hub-grid">
        {AJUSTES_HUB_CARDS.map((card) =>
          card.perform ? (
            <Can
              key={card.id}
              role={user?.profile}
              perform={card.perform}
              yes={() => <HubCard card={card} onClick={navigate} />}
            />
          ) : (
            <HubCard key={card.id} card={card} onClick={navigate} />
          )
        )}
      </div>
    </div>
  );
};

export default AjustesHub;
