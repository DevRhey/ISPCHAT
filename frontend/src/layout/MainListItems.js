import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import { Badge } from "@material-ui/core";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import AutorenewIcon from "@material-ui/icons/Autorenew";
import SearchIcon from "@material-ui/icons/Search";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import FlashOnIcon from "@material-ui/icons/FlashOn";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import PeopleIcon from "@material-ui/icons/People";
import ListIcon from "@material-ui/icons/ListAlt";
import ForumIcon from "@material-ui/icons/Forum";
import RotateRight from "@material-ui/icons/RotateRight";
import { i18n } from "../translate/i18n";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import LoyaltyRoundedIcon from "@material-ui/icons/LoyaltyRounded";
import { Can } from "../components/Can";
import { SocketContext } from "../context/Socket/SocketContext";
import { isArray } from "lodash";
import api from "../services/api";
import BorderColorIcon from "@material-ui/icons/BorderColor";
import toastError from "../errors/toastError";
import { makeStyles } from "@material-ui/core/styles";
import {
  AttachFile,
  BlurCircular,
  DeviceHubOutlined,
  Schedule,
} from "@material-ui/icons";
import usePlans from "../hooks/usePlans";
import Typography from "@material-ui/core/Typography";
import useVersion from "../hooks/useVersion";
import { NAV_DOMAINS } from "./navigationConfig";

const useStyles = makeStyles((theme) => ({
  logoutButton: {
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: theme.palette.sair.main,
    color: theme.palette.text.sair,
  },
  subheader: {
    position: "relative",
    fontSize: "13px",
    textAlign: "left",
    paddingLeft: 16,
    lineHeight: "32px",
    fontWeight: 600,
    letterSpacing: "0.02em",
    color: theme.palette.type === "dark" ? "#94A3B8" : "#64748B",
  },
}));

const ICONS = {
  whatsapp: <WhatsAppIcon />,
  flash: <FlashOnIcon />,
  kanban: <LoyaltyRoundedIcon />,
  todo: <BorderColorIcon />,
  schedule: <Schedule />,
  forum: <ForumIcon />,
  contacts: <ContactPhoneOutlinedIcon />,
  tags: <LocalOfferIcon />,
  help: <HelpOutlineIcon />,
  flows: <AccountTreeOutlinedIcon />,
  flowEditor: <AccountTreeOutlinedIcon />,
  campaigns: <ListIcon />,
  contactLists: <PeopleIcon />,
  dashboard: <DashboardOutlinedIcon />,
  reports: <SearchIcon />,
  connections: <SyncAltIcon />,
  ispConnectors: <BlurCircular />,
  integrations: <DeviceHubOutlined />,
  settings: <SettingsOutlinedIcon />,
  files: <AttachFile />,
};

function ListItemLink({ icon, primary, to, className, badgeContent }) {
  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  const iconNode =
    badgeContent != null ? (
      <Badge badgeContent={badgeContent} color="error">
        {icon}
      </Badge>
    ) : (
      icon
    );

  return (
    <li>
      <ListItem button dense component={renderLink} className={className}>
        {icon ? <ListItemIcon>{iconNode}</ListItemIcon> : null}
        <ListItemText
          primary={primary}
          primaryTypographyProps={{ noWrap: true, variant: "body2" }}
        />
      </ListItem>
    </li>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];

    if (isArray(chats)) {
      chats.forEach((chat) => {
        const chatIndex = state.findIndex((u) => u.id === chat.id);
        if (chatIndex !== -1) {
          state[chatIndex] = chat;
        } else {
          newChats.push(chat);
        }
      });
    }

    return [...state, ...newChats];
  }

  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chat.id);

    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    }
    return [chat, ...state];
  }

  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chatId);
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }

  if (action.type === "CHANGE_CHAT") {
    return state.map((chat) =>
      chat.id === action.payload.chat.id ? action.payload.chat : chat
    );
  }

  return state;
};

const resolveLabel = (item) => {
  if (item.label) return item.label;
  if (item.labelKey) return i18n.t(item.labelKey);
  return item.to;
};

const MainListItems = (props) => {
  const classes = useStyles();
  const { drawerClose } = props;
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user, handleLogout } = useContext(AuthContext);
  const [connectionWarning, setConnectionWarning] = useState(false);
  const [planFlags, setPlanFlags] = useState({});
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);
  const { getPlanCompany } = usePlans();
  const [version, setVersion] = useState(false);
  const { getVersion } = useVersion();
  const socketManager = useContext(SocketContext);

  useEffect(() => {
    async function fetchVersion() {
      const _version = await getVersion();
      setVersion(_version.version);
    }
    fetchVersion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    async function fetchData() {
      const companyId = user?.companyId || localStorage.getItem("companyId");
      if (!companyId) return;

      try {
        const planConfigs = await getPlanCompany(undefined, companyId);
        if (planConfigs?.plan) {
          setPlanFlags(planConfigs.plan);
        }
      } catch (err) {
        console.warn(
          "Falha ao carregar plano da empresa:",
          err?.response?.status || err.message
        );
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.companyId]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);

    socket.on(`company-${companyId}-chat`, (data) => {
      if (data.action === "new-message" || data.action === "update") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  const [chatUnread, setChatUnread] = useState(false);

  useEffect(() => {
    let unreadsCount = 0;
    if (chats.length > 0) {
      for (let chat of chats) {
        for (let chatUser of chat.users) {
          if (chatUser.userId === user.id) {
            unreadsCount += chatUser.unreads;
          }
        }
      }
    }
    setChatUnread(unreadsCount > 0);
  }, [chats, user.id]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter((whats) =>
          ["qrcode", "PAIRING", "DISCONNECTED", "TIMEOUT", "OPENING"].includes(
            whats.status
          )
        );
        setConnectionWarning(offlineWhats.length > 0);
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_CHATS", payload: data.records });
    } catch (err) {
      toastError(err);
    }
  };

  const handleClickLogout = () => {
    handleLogout();
  };

  const isItemVisible = (item) => {
    if (item.planKey && !planFlags[item.planKey]) return false;
    if (localStorage.getItem("cshow") && item.planKey === "useCampaigns") {
      return true;
    }
    return true;
  };

  const resolveBadge = (item) => {
    if (item.badge === "connectionWarning" && connectionWarning) return "!";
    if (item.badge === "chatUnread" && chatUnread) return " ";
    return null;
  };

  const resolveIcon = (item) => {
    if (item.icon === "forum") {
      return (
        <Badge color="secondary" variant="dot" invisible={!chatUnread}>
          <ForumIcon />
        </Badge>
      );
    }
    return ICONS[item.icon] || null;
  };

  const renderDomain = (domainKey) => {
    const domain = NAV_DOMAINS[domainKey];
    if (!domain) return null;

    const items = domain.items.filter(isItemVisible);
    if (!items.length) return null;

    let campanhasHeaderShown = false;

    return (
      <React.Fragment key={domainKey}>
        <ListSubheader className={classes.subheader} disableSticky>
          {domain.label}
        </ListSubheader>
        {items.map((item) => {
          const showCampanhasHeader =
            domainKey === "automacoes" &&
            item.section === "campanhas" &&
            !campanhasHeaderShown;

          if (showCampanhasHeader) {
            campanhasHeaderShown = true;
          }

          return (
            <React.Fragment key={`${domainKey}-${item.to}`}>
              {showCampanhasHeader ? (
                <ListSubheader
                  className={classes.subheader}
                  disableSticky
                  style={{ fontSize: 11, paddingLeft: 24 }}
                >
                  Campanhas
                </ListSubheader>
              ) : null}
              <ListItemLink
                to={item.to}
                primary={resolveLabel(item)}
                icon={resolveIcon(item)}
                badgeContent={resolveBadge(item)}
              />
            </React.Fragment>
          );
        })}
      </React.Fragment>
    );
  };

  const serviceDomains = ["atendimento", "contatos"];
  const adminDomains = [
    "automacoes",
    "relatorios",
    "conexoes",
    "integracoes",
    "ajustes",
  ];

  return (
    <div onClick={drawerClose}>
      <Can
        role={user.profile}
        perform="drawer-service-items:view"
        no={() => (
          <>
            {serviceDomains.map(renderDomain)}
          </>
        )}
      />

      <Can
        role={user.profile}
        perform="drawer-admin-items:view"
        yes={() => (
          <>
            {adminDomains.map(renderDomain)}

            {user.super && (
              <>
                <ListSubheader className={classes.subheader} disableSticky>
                  Sistema
                </ListSubheader>
                <ListItemLink
                  to="/LogLauncher"
                  primary={i18n.t("mainDrawer.listItems.loglauncher")}
                  icon={<AutorenewIcon />}
                />
                <ListItemLink
                  to="/announcements"
                  primary={i18n.t("mainDrawer.listItems.annoucements")}
                  icon={<ListIcon />}
                />
              </>
            )}

            <Divider />
            <Typography
              style={{
                fontSize: "12px",
                padding: "10px",
                textAlign: "right",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "4px",
              }}
            >
              {`${version}`}
              <span
                style={{
                  backgroundColor: "green",
                  color: "white",
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  lineHeight: "normal",
                }}
              >
                latest
              </span>
            </Typography>
          </>
        )}
      />

      <Divider />
      <li>
        <ListItem
          button
          dense
          onClick={handleClickLogout}
          className={classes.logoutButton}
        >
          <ListItemIcon>
            <RotateRight />
          </ListItemIcon>
          <ListItemText primary={i18n.t("Sair")} />
        </ListItem>
      </li>
    </div>
  );
};

export default MainListItems;
