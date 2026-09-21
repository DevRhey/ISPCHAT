import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import qs from "query-string";

import {
  Add as AddIcon,
  DoneAll as DoneAllIcon,
  Group as GroupIcon,
  History as HistoryIcon,
  Android as AndroidIcon,
  HourglassEmpty as HourglassEmptyIcon,
  HeadsetMic as HeadsetMicIcon,
} from "@material-ui/icons";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import SearchIcon from "@material-ui/icons/Search";
import InputBase from "@material-ui/core/InputBase";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Badge from "@material-ui/core/Badge";
import PlaylistAddCheckOutlinedIcon from "@material-ui/icons/PlaylistAddCheckOutlined";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { Snackbar, IconButton } from "@material-ui/core";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import NewTicketModal from "../NewTicketModal";
import TicketsList from "../TicketsListCustom";
import TicketsListGroup from "../TicketsListGroup";
import TabPanel from "../TabPanel";
import ConnectionHealthBanner from "../ConnectionHealthBanner";
import TicketsFilterDrawer from "../TicketsFilterDrawer";
import HistoricalClientSearchModal from "../HistoricalClientSearchModal";

import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../Can";
import { Button } from "@material-ui/core";

const BUCKETS = {
  ANDAMENTO: "andamento",
  ESPERA: "espera",
  AUTOMACAO: "automacao",
  CLOSED: "closed",
  GROUP: "group",
};

const parseIdList = (value) => {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => Number(item))
    .filter(Boolean);
};

const useStyles = makeStyles((theme) => ({
  ticketsWrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  tabsHeader: {
    flex: "none",
    backgroundColor: theme.palette.background.default,
  },
  ticketOptionsBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(1),
    gap: theme.spacing(0.5),
    flexWrap: "wrap",
  },
  searchInputWrapper: {
    flex: 1,
    minWidth: 180,
    backgroundColor: theme.palette.background.default,
    display: "flex",
    borderRadius: 40,
    padding: 4,
  },
  searchIcon: {
    color: theme.palette.primary.main,
    marginLeft: 6,
    marginRight: 6,
    alignSelf: "center",
  },
  searchInput: {
    flex: 1,
    border: "none",
    borderRadius: 25,
    outline: "none",
  },
  actionsRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    flexShrink: 0,
  },
  snackbar: {
    display: "flex",
    justifyContent: "space-between",
    backgroundColor: theme.palette.secondary.main,
    color: "white",
    borderRadius: 30,
  },
  yesButton: {
    backgroundColor: "#FFF",
    color: "rgba(0, 100, 0, 1)",
    padding: "4px 4px",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginRight: theme.spacing(1),
    borderRadius: 30,
  },
  noButton: {
    backgroundColor: "#FFF",
    color: "rgba(139, 0, 0, 1)",
    padding: "4px 4px",
    fontWeight: "bold",
    textTransform: "uppercase",
    borderRadius: 30,
  },
  badge: {
    right: -10,
  },
  bucketTab: {
    minHeight: 48,
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.8125rem",
  },
}));

const TicketsManagerTabs = () => {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const searchInputRef = useRef();
  const searchTimeoutRef = useRef(null);

  const [isHoveredResolve, setIsHoveredResolve] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [historicalOpen, setHistoricalOpen] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const { user } = useContext(AuthContext);
  const { profile } = user;

  const [openCount, setOpenCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [automationCount, setAutomationCount] = useState(0);

  const userQueueIds = user.queues.map((q) => q.id);

  const query = qs.parse(location.search);

  const [bucket, setBucket] = useState(query.bucket || BUCKETS.ANDAMENTO);
  const [searchParam, setSearchParam] = useState(query.q || "");
  const [selectedQueueIds, setSelectedQueueIds] = useState(
    parseIdList(query.queues).length ? parseIdList(query.queues) : userQueueIds
  );
  const [selectedTags, setSelectedTags] = useState(parseIdList(query.tags));
  const [selectedUsers, setSelectedUsers] = useState(parseIdList(query.users));
  const [selectedWhatsappIds, setSelectedWhatsappIds] = useState(
    parseIdList(query.channels)
  );

  const [setClosedBox, setClosed] = useState(false);
  const [setGroupBox, setGroup] = useState(false);

  const bucketConfig = useMemo(
    () => ({
      [BUCKETS.ANDAMENTO]: {
        status: "open",
        chatbot: "false",
        emptyTitle: i18n.t("inbox.empty.andamentoTitle"),
        emptyMessage: i18n.t("inbox.empty.andamentoMessage"),
      },
      [BUCKETS.ESPERA]: {
        status: "pending",
        chatbot: "false",
        emptyTitle: i18n.t("inbox.empty.esperaTitle"),
        emptyMessage: i18n.t("inbox.empty.esperaMessage"),
      },
      [BUCKETS.AUTOMACAO]: {
        status: undefined,
        chatbot: "true",
        emptyTitle: i18n.t("inbox.empty.automacaoTitle"),
        emptyMessage: i18n.t("inbox.empty.automacaoMessage"),
        emptyCtaLabel: i18n.t("inbox.empty.automacaoCta"),
        emptyCtaPath: "/flows",
      },
      [BUCKETS.CLOSED]: {
        status: "closed",
        chatbot: undefined,
        emptyTitle: i18n.t("inbox.empty.closedTitle"),
        emptyMessage: i18n.t("inbox.empty.closedMessage"),
      },
    }),
    []
  );

  const syncQueryString = (nextState) => {
    const params = {};
    if (nextState.bucket && nextState.bucket !== BUCKETS.ANDAMENTO) {
      params.bucket = nextState.bucket;
    }
    if (nextState.searchParam) params.q = nextState.searchParam;
    if (nextState.selectedQueueIds?.length) {
      params.queues = nextState.selectedQueueIds.join(",");
    }
    if (nextState.selectedTags?.length) {
      params.tags = nextState.selectedTags.join(",");
    }
    if (nextState.selectedUsers?.length) {
      params.users = nextState.selectedUsers.join(",");
    }
    if (nextState.selectedWhatsappIds?.length) {
      params.channels = nextState.selectedWhatsappIds.join(",");
    }

    history.replace({
      pathname: location.pathname,
      search: qs.stringify(params),
    });
  };

  useEffect(() => {
    syncQueryString({
      bucket,
      searchParam,
      selectedQueueIds,
      selectedTags,
      selectedUsers,
      selectedWhatsappIds,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    bucket,
    searchParam,
    selectedQueueIds,
    selectedTags,
    selectedUsers,
    selectedWhatsappIds,
  ]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await api.get("/settings/");
        const settingIndex = data.filter((s) => s.key === "viewclosed");
        if (settingIndex[0]?.value === "enabled") {
          setClosed(true);
        } else {
          setClosed(user.profile === "admin");
        }
      } catch (err) {
        toastError(err);
      }
    }
    fetchData();
  }, [user.profile]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await api.get("/settings/");
        const settingIndex = data.filter((s) => s.key === "viewgroups");
        if (settingIndex[0]?.value === "enabled") {
          setGroup(true);
        } else {
          setGroup(user.profile === "admin");
        }
      } catch (err) {
        toastError(err);
      }
    }
    fetchData();
  }, [user.profile]);

  useEffect(() => {
    if (profile.toUpperCase() === "ADMIN") {
      setShowAllTickets(true);
    }
  }, [profile]);

  const handleSearch = (event) => {
    const searchedTerm = event.target.value;
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchParam(searchedTerm.trim().toLowerCase());
    }, 400);
  };

  const handleChangeBucket = (_event, newValue) => {
    setBucket(newValue);
  };

  const handleCloseOrOpenTicket = (ticket) => {
    setNewTicketModalOpen(false);
    if (ticket?.uuid) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const CloseAllTicket = async () => {
    try {
      const statusToClose =
        bucket === BUCKETS.ESPERA
          ? "pending"
          : bucket === BUCKETS.ANDAMENTO
          ? "open"
          : "open";
      await api.post("/tickets/closeAll", {
        status: statusToClose,
        selectedQueueIds,
      });
      setSnackbarOpen(false);
    } catch (err) {
      console.log("Error: ", err);
    }
  };

  const activeBucket = bucketConfig[bucket] || bucketConfig[BUCKETS.ANDAMENTO];
  const isOperationalBucket = [
    BUCKETS.ANDAMENTO,
    BUCKETS.ESPERA,
    BUCKETS.AUTOMACAO,
  ].includes(bucket);

  const sharedListProps = {
    searchParam,
    tags: selectedTags,
    users: selectedUsers,
    whatsappIds: selectedWhatsappIds,
    selectedQueueIds,
    showAll: showAllTickets,
    chatbot: activeBucket.chatbot,
    emptyTitle: activeBucket.emptyTitle,
    emptyMessage: activeBucket.emptyMessage,
    emptyCtaLabel: activeBucket.emptyCtaLabel,
    emptyCtaPath: activeBucket.emptyCtaPath,
  };

  return (
    <Paper elevation={0} variant="outlined" className={classes.ticketsWrapper}>
      <ConnectionHealthBanner />

      <NewTicketModal
        modalOpen={newTicketModalOpen}
        onClose={handleCloseOrOpenTicket}
      />

      <HistoricalClientSearchModal
        open={historicalOpen}
        onClose={() => setHistoricalOpen(false)}
      />

      <Paper square elevation={0} className={classes.ticketOptionsBox}>
        <div className={classes.searchInputWrapper}>
          <SearchIcon className={classes.searchIcon} />
          <InputBase
            className={classes.searchInput}
            inputRef={searchInputRef}
            defaultValue={searchParam}
            placeholder={i18n.t("inbox.search.placeholder")}
            type="search"
            onChange={handleSearch}
          />
        </div>

        <div className={classes.actionsRow}>
          <TicketsFilterDrawer
            selectedQueueIds={selectedQueueIds}
            userQueues={user?.queues}
            onQueueChange={setSelectedQueueIds}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            selectedUsers={selectedUsers}
            onUsersChange={setSelectedUsers}
            selectedWhatsapps={selectedWhatsappIds}
            onWhatsappsChange={setSelectedWhatsappIds}
            showUsersFilter={profile === "admin"}
          />

          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<HistoryIcon />}
            onClick={() => setHistoricalOpen(true)}
            style={{ borderRadius: 20, textTransform: "none", fontWeight: 600 }}
          >
            {i18n.t("inbox.historical.button")}
          </Button>

          <IconButton
            aria-label={i18n.t("Novo")}
            onClick={() => setNewTicketModalOpen(true)}
          >
            <AddIcon />
          </IconButton>

          {profile === "admin" && isOperationalBucket && (
            <>
              <Snackbar
                open={snackbarOpen}
                onClose={() => setSnackbarOpen(false)}
                message={i18n.t("tickets.inbox.closedAllTickets")}
                ContentProps={{ className: classes.snackbar }}
                action={
                  <>
                    <Button
                      className={classes.yesButton}
                      size="small"
                      onClick={CloseAllTicket}
                    >
                      {i18n.t("tickets.inbox.yes")}
                    </Button>
                    <Button
                      className={classes.noButton}
                      size="small"
                      onClick={() => setSnackbarOpen(false)}
                    >
                      {i18n.t("tickets.inbox.no")}
                    </Button>
                  </>
                }
              />
              <IconButton
                aria-label={i18n.t("tickets.inbox.closedAll")}
                onMouseEnter={() => setIsHoveredResolve(true)}
                onMouseLeave={() => setIsHoveredResolve(false)}
                onClick={() => setSnackbarOpen(true)}
              >
                <PlaylistAddCheckOutlinedIcon
                  style={{ color: isHoveredResolve ? "#15803D" : "green" }}
                />
              </IconButton>
            </>
          )}

          <Can
            role={user.profile}
            perform="tickets-manager:showall"
            yes={() => (
              <FormControlLabel
                label={i18n.t("tickets.buttons.showAll")}
                labelPlacement="start"
                control={
                  <Switch
                    size="small"
                    checked={showAllTickets}
                    onChange={() => setShowAllTickets((prev) => !prev)}
                    name="showAllTickets"
                    color="primary"
                  />
                }
              />
            )}
          />
        </div>
      </Paper>

      <Paper elevation={0} square className={classes.tabsHeader}>
        <Tabs
          value={bucket}
          onChange={handleChangeBucket}
          variant="scrollable"
          scrollButtons="auto"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            className={classes.bucketTab}
            value={BUCKETS.ANDAMENTO}
            icon={<HeadsetMicIcon fontSize="small" />}
            label={
              <Badge className={classes.badge} badgeContent={openCount} color="primary">
                {i18n.t("inbox.buckets.andamento")}
              </Badge>
            }
          />
          <Tab
            className={classes.bucketTab}
            value={BUCKETS.ESPERA}
            icon={<HourglassEmptyIcon fontSize="small" />}
            label={
              <Badge
                className={classes.badge}
                badgeContent={pendingCount}
                color="primary"
              >
                {i18n.t("inbox.buckets.espera")}
              </Badge>
            }
          />
          <Tab
            className={classes.bucketTab}
            value={BUCKETS.AUTOMACAO}
            icon={<AndroidIcon fontSize="small" />}
            label={
              <Badge
                className={classes.badge}
                badgeContent={automationCount}
                color="primary"
              >
                {i18n.t("inbox.buckets.automacao")}
              </Badge>
            }
          />
          {setClosedBox && (
            <Tab
              className={classes.bucketTab}
              value={BUCKETS.CLOSED}
              icon={<DoneAllIcon fontSize="small" />}
              label={i18n.t("inbox.buckets.closed")}
            />
          )}
          {setGroupBox && (
            <Tab
              className={classes.bucketTab}
              value={BUCKETS.GROUP}
              icon={<GroupIcon fontSize="small" />}
              label={i18n.t("inbox.buckets.groups")}
            />
          )}
        </Tabs>
      </Paper>

      <TabPanel value={bucket} name={BUCKETS.ANDAMENTO} className={classes.ticketsWrapper}>
        <TicketsList
          {...sharedListProps}
          status="open"
          chatbot="false"
          updateCount={setOpenCount}
        />
      </TabPanel>

      <TabPanel value={bucket} name={BUCKETS.ESPERA} className={classes.ticketsWrapper}>
        <TicketsList
          {...sharedListProps}
          status="pending"
          chatbot="false"
          updateCount={setPendingCount}
        />
      </TabPanel>

      <TabPanel value={bucket} name={BUCKETS.AUTOMACAO} className={classes.ticketsWrapper}>
        <TicketsList
          {...sharedListProps}
          status={undefined}
          chatbot="true"
          updateCount={setAutomationCount}
        />
      </TabPanel>

      <TabPanel value={bucket} name={BUCKETS.CLOSED} className={classes.ticketsWrapper}>
        <TicketsList {...sharedListProps} status="closed" showAll chatbot={undefined} />
        {setGroupBox && (
          <TicketsListGroup
            status="closed"
            showAll
            selectedQueueIds={selectedQueueIds}
          />
        )}
      </TabPanel>

      <TabPanel value={bucket} name={BUCKETS.GROUP} className={classes.ticketsWrapper}>
        <TicketsListGroup
          status="open"
          showAll={showAllTickets}
          selectedQueueIds={selectedQueueIds}
        />
        <TicketsListGroup
          status="pending"
          selectedQueueIds={selectedQueueIds}
        />
      </TabPanel>
    </Paper>
  );
};

export default TicketsManagerTabs;
