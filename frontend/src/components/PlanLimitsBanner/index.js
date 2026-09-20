import React, { useEffect, useState, useContext } from "react";
import { Paper, Typography } from "@material-ui/core";
import { AuthContext } from "../../context/Auth/AuthContext";
import usePlans from "../../hooks/usePlans";

const PlanLimitsBanner = () => {
  const { user } = useContext(AuthContext);
  const { getPlanCompany } = usePlans();
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    const companyId = user?.companyId || localStorage.getItem("companyId");
    if (!companyId) return;
    let alive = true;
    getPlanCompany(undefined, companyId)
      .then(data => {
        if (alive) setPlan(data?.plan || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user?.companyId]);

  if (!plan) return null;

  return (
    <Paper
      elevation={0}
      style={{
        marginBottom: 16,
        padding: "10px 14px",
        background: "#EFF6FF",
        border: "1px solid #BFDBFE"
      }}
    >
      <Typography style={{ fontSize: 13, color: "#0F172A" }}>
        Plano <strong>{plan.name}</strong>: {plan.users} usuários · {plan.connections}{" "}
        conexão(ões) · {plan.queues} filas. Ampliação só com o dono do ISPCHAT.
      </Typography>
    </Paper>
  );
};

export default PlanLimitsBanner;
