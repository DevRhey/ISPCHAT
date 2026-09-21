import React, { useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Drawer,
  IconButton,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import FilterListIcon from "@material-ui/icons/FilterList";
import CloseIcon from "@material-ui/icons/Close";

import { TagsFilter } from "../TagsFilter";
import { UsersFilter } from "../UsersFilter";
import { WhatsappsFilter } from "../WhatsappsFilter";
import TicketsQueueSelect from "../TicketsQueueSelect";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  trigger: {
    borderRadius: 20,
    textTransform: "none",
    fontWeight: 600,
  },
  drawerPaper: {
    width: 320,
    maxWidth: "90vw",
    padding: theme.spacing(2),
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(2),
  },
  section: {
    marginBottom: theme.spacing(2),
  },
  sectionLabel: {
    fontWeight: 600,
    fontSize: "0.8125rem",
    marginBottom: theme.spacing(0.75),
    color: theme.palette.text.secondary,
  },
  footer: {
    display: "flex",
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
}));

const TicketsFilterDrawer = ({
  selectedQueueIds,
  userQueues,
  onQueueChange,
  selectedTags,
  onTagsChange,
  selectedUsers,
  onUsersChange,
  selectedWhatsapps,
  onWhatsappsChange,
  showUsersFilter = true,
}) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);

  const activeCount = useMemo(() => {
    let count = 0;
    if (selectedTags?.length) count += 1;
    if (selectedUsers?.length) count += 1;
    if (selectedWhatsapps?.length) count += 1;
    if (
      Array.isArray(selectedQueueIds) &&
      Array.isArray(userQueues) &&
      selectedQueueIds.length !== userQueues.length
    ) {
      count += 1;
    }
    return count;
  }, [selectedQueueIds, userQueues, selectedTags, selectedUsers, selectedWhatsapps]);

  const handleClear = () => {
    onTagsChange([]);
    onUsersChange([]);
    onWhatsappsChange([]);
    onQueueChange(userQueues?.map((q) => q.id) || []);
  };

  return (
    <>
      <Badge color="secondary" badgeContent={activeCount} invisible={activeCount === 0}>
        <Button
          size="small"
          variant="outlined"
          color="primary"
          className={classes.trigger}
          startIcon={<FilterListIcon />}
          onClick={() => setOpen(true)}
        >
          {i18n.t("inbox.filters.button")}
        </Button>
      </Badge>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box className={classes.drawerPaper}>
          <Box className={classes.header}>
            <Typography variant="h6">{i18n.t("inbox.filters.title")}</Typography>
            <IconButton size="small" onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box className={classes.section}>
            <Typography className={classes.sectionLabel}>
              {i18n.t("inbox.filters.departments")}
            </Typography>
            <TicketsQueueSelect
              selectedQueueIds={selectedQueueIds}
              userQueues={userQueues}
              onChange={onQueueChange}
            />
          </Box>

          <Box className={classes.section}>
            <Typography className={classes.sectionLabel}>
              {i18n.t("inbox.filters.channels")}
            </Typography>
            <WhatsappsFilter
              initialWhatsapps={selectedWhatsapps}
              onFiltered={(items) =>
                onWhatsappsChange(items.map((item) => item.id))
              }
            />
          </Box>

          <Box className={classes.section}>
            <Typography className={classes.sectionLabel}>
              {i18n.t("inbox.filters.tags")}
            </Typography>
            <TagsFilter
              onFiltered={(items) => onTagsChange(items.map((item) => item.id))}
            />
          </Box>

          {showUsersFilter && (
            <Box className={classes.section}>
              <Typography className={classes.sectionLabel}>
                {i18n.t("inbox.filters.agents")}
              </Typography>
              <UsersFilter
                onFiltered={(items) => onUsersChange(items.map((item) => item.id))}
              />
            </Box>
          )}

          <Box className={classes.footer}>
            <Button fullWidth variant="outlined" onClick={handleClear}>
              {i18n.t("inbox.filters.clear")}
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => setOpen(false)}
            >
              {i18n.t("inbox.filters.apply")}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default TicketsFilterDrawer;
