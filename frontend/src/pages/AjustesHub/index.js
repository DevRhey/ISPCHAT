import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  Box,
  Grid,
  Paper,
  Typography,
  makeStyles,
} from "@material-ui/core";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import DeviceHubOutlined from "@material-ui/icons/DeviceHubOutlined";
import BlurCircular from "@material-ui/icons/BlurCircular";
import ThumbUpOutlinedIcon from "@material-ui/icons/ThumbUpOutlined";
import AttachFile from "@material-ui/icons/AttachFile";
import LocalAtmIcon from "@material-ui/icons/LocalAtm";
import AllInclusive from "@material-ui/icons/AllInclusive";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import AutorenewIcon from "@material-ui/icons/Autorenew";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import { AJUSTES_HUB_CARDS } from "../../layout/navigationConfig";
import { AuthContext } from "../../context/Auth/AuthContext";
import usePlans from "../../hooks/usePlans";

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.palette.type === "dark" ? "#0F172A" : "#F1F5F9",
    minHeight: "100%",
  },
  intro: {
    color: theme.palette.type === "dark" ? "#94A3B8" : "#64748B",
    maxWidth: 720,
    marginBottom: theme.spacing(3),
    lineHeight: 1.6,
  },
  card: {
    padding: theme.spacing(2.5),
    borderRadius: 12,
    cursor: "pointer",
    height: "100%",
    minHeight: 148,
    display: "flex",
    flexDirection: "column",
    border: `1px solid ${theme.palette.type === "dark" ? "#334155" : "#E2E8F0"}`,
    transition: "box-shadow 0.2s ease, transform 0.2s ease",
    "&:hover": {
      boxShadow: theme.shadows[4],
      transform: "translateY(-2px)",
    },
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing(1.5),
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.type === "dark" ? "#1E293B" : "#F8FAFC",
    color: theme.palette.type === "dark" ? "#94A3B8" : "#64748B",
  },
  cardTitle: {
    fontWeight: 600,
    color: "#2563EB",
    marginBottom: theme.spacing(0.5),
  },
  cardDescription: {
    color: theme.palette.type === "dark" ? "#94A3B8" : "#64748B",
    fontSize: "0.875rem",
    lineHeight: 1.5,
    flex: 1,
  },
  linkIcon: {
    color: theme.palette.type === "dark" ? "#64748B" : "#CBD5E1",
    fontSize: 18,
  },
}));

const ICON_MAP = {
  settings: SettingsOutlinedIcon,
  users: PeopleAltOutlinedIcon,
  queues: AccountTreeOutlinedIcon,
  integrations: DeviceHubOutlined,
  ispConnectors: BlurCircular,
  satisfaction: ThumbUpOutlinedIcon,
  files: AttachFile,
  financeiro: LocalAtmIcon,
  prompts: AllInclusive,
  api: CodeRoundedIcon,
  logs: AutorenewIcon,
};

const AjustesHub = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user } = useContext(AuthContext);
  const { getPlanCompany } = usePlans();
  const [planFlags, setPlanFlags] = useState({});

  useEffect(() => {
    async function loadPlan() {
      const companyId = user?.companyId || localStorage.getItem("companyId");
      if (!companyId) return;
      try {
        const planConfigs = await getPlanCompany(undefined, companyId);
        if (planConfigs?.plan) {
          setPlanFlags(planConfigs.plan);
        }
      } catch (err) {
        console.warn("Falha ao carregar plano:", err?.message);
      }
    }
    loadPlan();
  }, [user?.companyId, getPlanCompany]);

  const visibleCards = AJUSTES_HUB_CARDS.filter((card) => {
    if (card.superOnly && !user?.super) return false;
    if (card.planKey && !planFlags[card.planKey]) return false;
    return true;
  });

  return (
    <MainContainer className={classes.root}>
      <MainHeader>
        <Title>Ajustes</Title>
      </MainHeader>
      <Box px={1} pb={4}>
        <Typography className={classes.intro}>
          Acesse e ajuste os módulos de acordo com suas necessidades, para melhor
          atender seu cliente.
        </Typography>
        <Grid container spacing={2}>
          {visibleCards.map((card) => {
            const Icon = ICON_MAP[card.icon] || SettingsOutlinedIcon;
            return (
              <Grid item xs={12} sm={6} md={4} key={card.id}>
                <Paper
                  elevation={0}
                  className={classes.card}
                  onClick={() => history.push(card.to)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      history.push(card.to);
                    }
                  }}
                >
                  <div className={classes.cardHeader}>
                    <div className={classes.iconWrap}>
                      <Icon fontSize="small" />
                    </div>
                    <OpenInNewIcon className={classes.linkIcon} />
                  </div>
                  <Typography variant="subtitle1" className={classes.cardTitle}>
                    {card.title}
                  </Typography>
                  <Typography className={classes.cardDescription}>
                    {card.description}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </MainContainer>
  );
};

export default AjustesHub;
