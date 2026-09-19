import React from "react";
import { Box, Button, Typography, Paper } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useHistory } from "react-router-dom";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: theme.spacing(6, 3),
    minHeight: 280,
    background: "transparent",
    gap: theme.spacing(1.5)
  },
  title: {
    fontWeight: 700,
    color: theme.palette.type === "dark" ? "#F8FAFC" : "#0F172A"
  },
  body: {
    color: theme.palette.type === "dark" ? "#94A3B8" : "#64748B",
    maxWidth: 420
  },
  cta: {
    marginTop: theme.spacing(1),
    background: "#2563EB",
    color: "#fff",
    "&:hover": { background: "#1D4ED8" }
  }
}));

/**
 * Empty state comercial com CTA real (não só logo).
 */
const EmptyState = ({
  title = "Nada por aqui ainda",
  description = "Comece configurando o essencial para operar.",
  ctaLabel,
  ctaPath,
  onCta
}) => {
  const classes = useStyles();
  const history = useHistory();

  const handleCta = () => {
    if (onCta) onCta();
    else if (ctaPath) history.push(ctaPath);
  };

  return (
    <Paper elevation={0} className={classes.root}>
      <Typography variant="h6" className={classes.title}>
        {title}
      </Typography>
      <Typography className={classes.body}>{description}</Typography>
      {ctaLabel && (ctaPath || onCta) ? (
        <Button className={classes.cta} variant="contained" onClick={handleCta}>
          {ctaLabel}
        </Button>
      ) : null}
    </Paper>
  );
};

export default EmptyState;
