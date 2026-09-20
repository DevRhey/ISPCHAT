import React, { useEffect, useState } from "react";
import { Button, Paper, Typography } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import api from "../../services/api";

const ErpRequiredBanner = () => {
  const history = useHistory();
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .get("/isp-connectors")
      .then(({ data }) => {
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        const ready = list.some(c => c.active !== false && c.baseUrl);
        setMissing(!ready);
      })
      .catch(() => {
        if (alive) setMissing(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!missing) return null;

  return (
    <Paper
      elevation={0}
      style={{
        marginBottom: 16,
        padding: "12px 16px",
        background: "#FFF7ED",
        border: "1px solid #FDBA74",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12
      }}
    >
      <Typography style={{ fontSize: 14, color: "#0F172A" }}>
        Piloto comercial: cadastre um conector ERP (IXC/SGP/Hubsoft) com URL.
        Sem isso o chatbot não emite boleto nem consulta cliente real.
      </Typography>
      <Button
        size="small"
        variant="contained"
        style={{ background: "#EA580C", color: "#fff", whiteSpace: "nowrap" }}
        onClick={() => history.push("/isp-connectors")}
      >
        Conectores
      </Button>
    </Paper>
  );
};

export default ErpRequiredBanner;
