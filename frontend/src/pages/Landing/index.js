import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { makeStyles, Button, Typography, Box, Container, Grid } from "@material-ui/core";

const useStyles = makeStyles(() => ({
  root: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 600px at 10% -10%, #DBEAFE 0%, transparent 55%), radial-gradient(900px 500px at 100% 0%, #D1FAE5 0%, transparent 50%), #F8FAFC",
    color: "#0F172A"
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 0"
  },
  brand: {
    fontWeight: 800,
    fontSize: 22,
    letterSpacing: "-0.02em",
    color: "#2563EB"
  },
  hero: {
    padding: "64px 0 48px",
    maxWidth: 720
  },
  headline: {
    fontWeight: 800,
    fontSize: "clamp(2rem, 4vw, 3.2rem)",
    lineHeight: 1.15,
    marginBottom: 16
  },
  sub: {
    fontSize: 18,
    color: "#475569",
    marginBottom: 28,
    maxWidth: 560
  },
  ctaPrimary: {
    background: "#059669",
    color: "#fff",
    fontWeight: 700,
    padding: "10px 22px",
    marginRight: 12,
    "&:hover": { background: "#047857" }
  },
  ctaSecondary: {
    borderColor: "#2563EB",
    color: "#2563EB",
    fontWeight: 600
  },
  section: {
    padding: "48px 0 72px"
  },
  cardTitle: {
    fontWeight: 700,
    marginBottom: 8
  },
  cardBody: {
    color: "#64748B"
  },
  price: {
    fontWeight: 800,
    fontSize: 32,
    color: "#0F172A"
  },
  footer: {
    borderTop: "1px solid #E2E8F0",
    padding: "24px 0",
    color: "#64748B",
    fontSize: 13
  }
}));

const Landing = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Container maxWidth="lg">
        <nav className={classes.nav}>
          <div className={classes.brand}>ISPCHAT</div>
          <Box>
            <Button component={RouterLink} to="/login" style={{ marginRight: 8 }}>
              Entrar
            </Button>
            <Button
              component={RouterLink}
              to="/signup"
              variant="contained"
              className={classes.ctaPrimary}
            >
              Começar trial
            </Button>
          </Box>
        </nav>

        <section className={classes.hero}>
          <Typography className={classes.headline}>
            Atendimento WhatsApp feito para provedores de internet
          </Typography>
          <Typography className={classes.sub}>
            Chatbot com jornadas financeiras, técnicas e comerciais — boleto, ONU,
            visita, cobertura e retenção — com editor gráfico e conectores IXC/SGP/Hubsoft.
          </Typography>
          <Button
            component={RouterLink}
            to="/signup"
            variant="contained"
            className={classes.ctaPrimary}
          >
            Testar grátis
          </Button>
          <Button
            component={RouterLink}
            to="/login"
            variant="outlined"
            className={classes.ctaSecondary}
          >
            Já tenho conta
          </Button>
        </section>

        <section className={classes.section}>
          <Grid container spacing={4}>
            {[
              {
                t: "Fluxos ISP prontos",
                b: "2ª via, desbloqueio, agendamento e transferência humana em um fluxo master."
              },
              {
                t: "Editor estilo Z-PRO",
                b: "Nós ≠ conexões: auto, default e keyword. Simule antes de publicar."
              },
              {
                t: "Conectores ERP",
                b: "IXC, SGP e Hubsoft com teste de conexão na interface."
              }
            ].map(item => (
              <Grid item xs={12} md={4} key={item.t}>
                <Typography className={classes.cardTitle}>{item.t}</Typography>
                <Typography className={classes.cardBody}>{item.b}</Typography>
              </Grid>
            ))}
          </Grid>
        </section>

        <section className={classes.section} id="pricing">
          <Typography variant="h5" style={{ fontWeight: 800, marginBottom: 24 }}>
            Planos
          </Typography>
          <Grid container spacing={3}>
            {[
              { name: "Starter", price: "Sob consulta", desc: "1 conexão · filas · fluxo ISP" },
              { name: "Pro", price: "Sob consulta", desc: "Multi-conexão · campanhas · conectores" },
              { name: "Enterprise", price: "Sob consulta", desc: "White-label · Cloud API · SLA" }
            ].map(p => (
              <Grid item xs={12} md={4} key={p.name}>
                <Box
                  style={{
                    padding: 24,
                    border: "1px solid #E2E8F0",
                    borderRadius: 12,
                    background: "#fff"
                  }}
                >
                  <Typography style={{ fontWeight: 700 }}>{p.name}</Typography>
                  <Typography className={classes.price}>{p.price}</Typography>
                  <Typography className={classes.cardBody}>{p.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </section>

        <footer className={classes.footer}>
          ISPCHAT · atendimento para ISPs · WhatsApp via Baileys (não oficial) ou Meta Cloud API
          (quando habilitada). Consulte a política de canais antes do go-live.
        </footer>
      </Container>
    </div>
  );
};

export default Landing;
