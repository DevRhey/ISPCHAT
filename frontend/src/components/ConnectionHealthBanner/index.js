import React, { useContext, useMemo, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from "@material-ui/core";
import RefreshIcon from "@material-ui/icons/Refresh";
import SignalCellularConnectedNoInternet0BarIcon from "@material-ui/icons/SignalCellularConnectedNoInternet0Bar";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import CropFreeIcon from "@material-ui/icons/CropFree";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import QrcodeModal from "../QrcodeModal";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(1),
    padding: theme.spacing(1, 1.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    minHeight: 44,
  },
  healthy: {
    backgroundColor: theme.palette.type === "dark" ? "#0F2A1D" : "#ECFDF5",
    borderBottomColor: theme.palette.type === "dark" ? "#14532D" : "#BBF7D0",
  },
  warning: {
    backgroundColor: theme.palette.type === "dark" ? "#2A1F0F" : "#FFF7ED",
    borderBottomColor: theme.palette.type === "dark" ? "#78350F" : "#FED7AA",
  },
  error: {
    backgroundColor: theme.palette.type === "dark" ? "#2A1215" : "#FEF2F2",
    borderBottomColor: theme.palette.type === "dark" ? "#7F1D1D" : "#FECACA",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    minWidth: 0,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  dotHealthy: {
    backgroundColor: "#16A34A",
  },
  dotWarning: {
    backgroundColor: "#EA580C",
  },
  dotError: {
    backgroundColor: "#DC2626",
  },
  title: {
    fontWeight: 600,
    fontSize: "0.875rem",
    lineHeight: 1.3,
  },
  subtitle: {
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
    lineHeight: 1.3,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    flexShrink: 0,
  },
  cta: {
    textTransform: "none",
    fontWeight: 600,
    borderRadius: 20,
    padding: theme.spacing(0.5, 1.5),
    fontSize: "0.8125rem",
  },
}));

const getHealthState = (whatsApps) => {
  if (!whatsApps || whatsApps.length === 0) {
    return {
      level: "warning",
      title: i18n.t("inbox.connection.noChannelsTitle"),
      subtitle: i18n.t("inbox.connection.noChannelsSubtitle"),
      disconnected: [],
      pendingQr: [],
    };
  }

  const disconnected = whatsApps.filter((w) => w.status === "DISCONNECTED");
  const pendingQr = whatsApps.filter((w) => w.status === "qrcode");
  const connecting = whatsApps.filter(
    (w) => w.status === "OPENING" || w.status === "PAIRING" || w.status === "TIMEOUT"
  );
  const connected = whatsApps.filter((w) => w.status === "CONNECTED");

  if (disconnected.length > 0) {
    return {
      level: "error",
      title: i18n.t("inbox.connection.disconnectedTitle", {
        count: disconnected.length,
      }),
      subtitle: i18n.t("inbox.connection.disconnectedSubtitle"),
      disconnected,
      pendingQr,
      connecting,
      connected,
    };
  }

  if (pendingQr.length > 0 || connecting.length > 0) {
    return {
      level: "warning",
      title: i18n.t("inbox.connection.pendingTitle"),
      subtitle: i18n.t("inbox.connection.pendingSubtitle"),
      disconnected,
      pendingQr,
      connecting,
      connected,
    };
  }

  return {
    level: "healthy",
    title: i18n.t("inbox.connection.connectedTitle"),
    subtitle: i18n.t("inbox.connection.connectedSubtitle", {
      count: connected.length,
    }),
    disconnected,
    pendingQr,
    connecting,
    connected,
  };
};

const ConnectionHealthBanner = () => {
  const classes = useStyles();
  const history = useHistory();
  const { whatsApps, loading } = useContext(WhatsAppsContext);
  const [reconnectingId, setReconnectingId] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedWhatsApp, setSelectedWhatsApp] = useState(null);

  const health = useMemo(() => getHealthState(whatsApps), [whatsApps]);

  const handleReconnect = async (whatsApp) => {
    setReconnectingId(whatsApp.id);
    try {
      if (whatsApp.status === "qrcode") {
        setSelectedWhatsApp(whatsApp);
        setQrModalOpen(true);
        return;
      }
      await api.post(`/whatsappsession/${whatsApp.id}`);
      toast.info(i18n.t("connections.toasts.connecting"));
    } catch (err) {
      toastError(err);
    } finally {
      setReconnectingId(null);
    }
  };

  const handleRequestQr = async (whatsApp) => {
    setReconnectingId(whatsApp.id);
    try {
      await api.put(`/whatsappsession/${whatsApp.id}`);
      setSelectedWhatsApp(whatsApp);
      setQrModalOpen(true);
      toast.info(i18n.t("connections.toasts.requestingQr"));
    } catch (err) {
      toastError(err);
    } finally {
      setReconnectingId(null);
    }
  };

  const primaryActionWhatsApp =
    health.disconnected?.[0] || health.pendingQr?.[0] || health.connecting?.[0];

  const levelClass =
    health.level === "healthy"
      ? classes.healthy
      : health.level === "warning"
      ? classes.warning
      : classes.error;

  const dotClass =
    health.level === "healthy"
      ? classes.dotHealthy
      : health.level === "warning"
      ? classes.dotWarning
      : classes.dotError;

  const StatusIcon =
    health.level === "healthy"
      ? CheckCircleOutlineIcon
      : SignalCellularConnectedNoInternet0BarIcon;

  return (
    <>
      <Box className={`${classes.root} ${levelClass}`}>
        <Box className={classes.statusRow}>
          {loading ? (
            <CircularProgress size={16} />
          ) : (
            <>
              <span className={`${classes.dot} ${dotClass}`} />
              <StatusIcon
                fontSize="small"
                color={health.level === "healthy" ? "primary" : "error"}
              />
            </>
          )}
          <Box minWidth={0}>
            <Typography className={classes.title} noWrap>
              {health.title}
            </Typography>
            <Typography className={classes.subtitle} noWrap>
              {health.subtitle}
            </Typography>
          </Box>
        </Box>

        <Box className={classes.actions}>
          {health.level !== "healthy" && primaryActionWhatsApp ? (
            <>
              <Button
                size="small"
                variant="contained"
                color="primary"
                className={classes.cta}
                disabled={reconnectingId === primaryActionWhatsApp.id}
                onClick={() => handleReconnect(primaryActionWhatsApp)}
              >
                {reconnectingId === primaryActionWhatsApp.id ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  i18n.t("inbox.connection.reconnectCta")
                )}
              </Button>
              {primaryActionWhatsApp.status === "DISCONNECTED" && (
                <IconButton
                  size="small"
                  aria-label={i18n.t("connections.buttons.newQr")}
                  onClick={() => handleRequestQr(primaryActionWhatsApp)}
                >
                  <CropFreeIcon fontSize="small" />
                </IconButton>
              )}
            </>
          ) : (
            <IconButton
              size="small"
              aria-label={i18n.t("inbox.connection.refresh")}
              onClick={() => history.push("/connections")}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {selectedWhatsApp && (
        <QrcodeModal
          open={qrModalOpen}
          onClose={() => {
            setQrModalOpen(false);
            setSelectedWhatsApp(null);
          }}
          whatsAppId={selectedWhatsApp.id}
        />
      )}
    </>
  );
};

export default ConnectionHealthBanner;
