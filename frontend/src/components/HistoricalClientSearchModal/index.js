import React, { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import HistoryIcon from "@material-ui/icons/History";
import CloseIcon from "@material-ui/icons/Close";
import { useHistory } from "react-router-dom";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  searchField: {
    marginBottom: theme.spacing(2),
  },
  hint: {
    color: theme.palette.text.secondary,
    fontSize: "0.875rem",
    marginBottom: theme.spacing(1),
  },
  empty: {
    textAlign: "center",
    padding: theme.spacing(3, 1),
    color: theme.palette.text.secondary,
  },
}));

const HistoricalClientSearchModal = ({ open, onClose }) => {
  const classes = useStyles();
  const history = useHistory();
  const [searchParam, setSearchParam] = useState("");
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const term = searchParam.trim();
    if (term.length < 3) return;

    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get("/contacts", {
        params: { searchParam: term, pageNumber: 1 },
      });
      setContacts(data.contacts || []);
    } catch (err) {
      toastError(err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContact = async (contact) => {
    setSelectedContact(contact);
    setLoading(true);
    try {
      const { data } = await api.get("/ticket/reports", {
        params: {
          contactId: contact.id,
          page: 1,
          pageSize: 20,
        },
      });
      setTickets(data.tickets || []);
    } catch (err) {
      toastError(err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTicket = (ticket) => {
    if (ticket?.uuid) {
      history.push(`/tickets/${ticket.uuid}`);
      handleClose();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleClose = () => {
    setSearchParam("");
    setContacts([]);
    setTickets([]);
    setSelectedContact(null);
    setSearched(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle disableTypography>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gridGap={8}>
            <HistoryIcon color="primary" />
            <Typography variant="h6">
              {i18n.t("inbox.historical.title")}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Typography className={classes.hint}>
          {i18n.t("inbox.historical.hint")}
        </Typography>

        <TextField
          fullWidth
          variant="outlined"
          size="small"
          className={classes.searchField}
          placeholder={i18n.t("inbox.historical.placeholder")}
          value={searchParam}
          onChange={(e) => setSearchParam(e.target.value)}
          onKeyDown={handleKeyDown}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label={i18n.t("inbox.historical.search")}
                  onClick={handleSearch}
                  disabled={searchParam.trim().length < 3 || loading}
                >
                  {loading ? <CircularProgress size={18} /> : <SearchIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {loading && (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!loading && searched && contacts.length === 0 && (
          <Typography className={classes.empty}>
            {i18n.t("inbox.historical.empty")}
          </Typography>
        )}

        {!loading && !selectedContact && contacts.length > 0 && (
          <List disablePadding>
            {contacts.map((contact) => (
              <ListItem
                key={contact.id}
                button
                divider
                onClick={() => handleSelectContact(contact)}
              >
                <ListItemText
                  primary={contact.name}
                  secondary={contact.number}
                />
              </ListItem>
            ))}
          </List>
        )}

        {selectedContact && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              {i18n.t("inbox.historical.resultsFor", {
                name: selectedContact.name,
              })}
            </Typography>
            {!loading && tickets.length === 0 && (
              <Typography className={classes.empty}>
                {i18n.t("inbox.historical.noTickets")}
              </Typography>
            )}
            {!loading && tickets.length > 0 && (
              <List disablePadding>
                {tickets.map((ticket) => (
                  <ListItem
                    key={ticket.id}
                    button
                    divider
                    onClick={() => handleOpenTicket(ticket)}
                  >
                    <ListItemText
                      primary={`#${ticket.id} — ${ticket.status}`}
                      secondary={ticket.lastMessage || ticket.updatedAt}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            <Button
              size="small"
              onClick={() => {
                setSelectedContact(null);
                setTickets([]);
              }}
              style={{ marginTop: 8 }}
            >
              {i18n.t("inbox.historical.backToContacts")}
            </Button>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>{i18n.t("inbox.historical.close")}</Button>
        <Button
          color="primary"
          variant="contained"
          onClick={() => {
            history.push("/relatorios");
            handleClose();
          }}
        >
          {i18n.t("inbox.historical.openReports")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HistoricalClientSearchModal;
