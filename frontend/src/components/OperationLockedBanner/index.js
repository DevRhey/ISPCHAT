import React, { useContext } from "react";
import { Paper, Typography } from "@material-ui/core";
import { AuthContext } from "../../context/Auth/AuthContext";

const OperationLockedBanner = () => {
  const { user } = useContext(AuthContext);
  if (user?.super) return null;

  const company = user?.company;
  if (!company) return null;

  const due = company.dueDate ? new Date(company.dueDate) : null;
  const expired =
    due && !Number.isNaN(due.getTime())
      ? (() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          due.setHours(0, 0, 0, 0);
          return today > due;
        })()
      : false;

  const locked =
    company.operationEnabled === false ||
    company.activationState === "pending" ||
    company.activationState === "blocked" ||
    expired;

  if (!locked) return null;

  let text =
    "O operador ainda não liberou a operação (WhatsApp e fluxos) desta empresa.";
  if (expired) {
    text =
      "O teste ou a assinatura venceu. Pague a fatura em Minha assinatura para reativar.";
  } else if (company.activationState === "pending") {
    text = "Cadastro recebido. Aguarde o operador ativar o período de teste.";
  }

  return (
    <Paper
      elevation={0}
      style={{
        marginBottom: 16,
        padding: "12px 16px",
        background: "#FEF2F2",
        border: "1px solid #FECACA"
      }}
    >
      <Typography style={{ fontSize: 14, color: "#0F172A" }}>{text}</Typography>
    </Paper>
  );
};

export default OperationLockedBanner;
