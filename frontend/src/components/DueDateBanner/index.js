import React, { useContext, useMemo } from "react";
import { Button, Paper, Typography } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import { AuthContext } from "../../context/Auth/AuthContext";

const DueDateBanner = () => {
  const { user } = useContext(AuthContext);
  const history = useHistory();

  const info = useMemo(() => {
    const due = user?.company?.dueDate;
    if (!due || user?.super) return null;
    const dueDate = new Date(due);
    if (Number.isNaN(dueDate.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((dueDate - today) / 86400000);
    if (diffDays > 7) return null;
    return { diffDays, due };
  }, [user]);

  if (!info) return null;

  const overdue = info.diffDays < 0;

  return (
    <Paper
      elevation={0}
      style={{
        margin: "8px 16px 0",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        background: overdue ? "#FEF2F2" : "#FFFBEB",
        border: `1px solid ${overdue ? "#FECACA" : "#FDE68A"}`
      }}
    >
      <Typography style={{ color: "#0F172A", fontSize: 14 }}>
        {overdue
          ? "Sua assinatura venceu. Regularize para continuar usando o ISPCHAT."
          : `Sua assinatura vence em ${info.diffDays} dia(s).`}
      </Typography>
      <Button
        size="small"
        variant="contained"
        style={{ background: "#059669", color: "#fff" }}
        onClick={() => history.push("/financeiro")}
      >
        Ver 2ª via
      </Button>
    </Paper>
  );
};

export default DueDateBanner;
