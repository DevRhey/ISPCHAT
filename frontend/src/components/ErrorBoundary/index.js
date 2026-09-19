import React from "react";
import { Button, Typography, Paper } from "@material-ui/core";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Paper
          elevation={0}
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 32,
            background: "#F8FAFC"
          }}
        >
          <Typography variant="h5" style={{ color: "#0F172A", fontWeight: 700 }}>
            Algo deu errado
          </Typography>
          <Typography style={{ color: "#64748B", maxWidth: 420, textAlign: "center" }}>
            A interface encontrou um erro inesperado. Você pode recarregar a página
            sem perder o trabalho salvo no servidor.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={this.handleReload}
            style={{ background: "#2563EB", color: "#fff" }}
          >
            Recarregar
          </Button>
        </Paper>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
