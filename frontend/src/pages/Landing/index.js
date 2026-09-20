import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { makeStyles, Button, Typography, Box, Container, Grid } from "@material-ui/core";
import { openApi } from "../../services/api";

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

const fallbackPlans = [
  {
    name: "Básico",
    value: 349,
    users: 10,
    connections: 3,
    queues: 8,
    useOpenAi: false
  },
  {
    name: "IA",
    value: 549,
    users: 10,
    connections: 3,
    queues: 8,
    useOpenAi: true
  }
];

const Landing = () => {
  const classes = useStyles();
  const [plans, setPlans] = useState(fallbackPlans);

  useEffect(() => {
    openApi
      .get("/plans/register")
      .then(({ data }) => {
        if (Array.isArray(data) && data.length) {
          setPlans(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className={classes.root}>
      <Container maxWidth="lg">
        <nav className={classes.nav}>
          <div className={classes.brand}>ISPCHAT</div>
          <Box>
            <Button component={RouterLink} to="/termos" style={{ marginRight: 8 }}>
              Termos
            </Button>
            <Button component={RouterLink} to="/login" style={{ marginRight: 8 }}>
              Entrar
            </Button>
            <Button
              component={RouterLink}
              to="/signup"
              variant="contained"
              className={classes.ctaPrimary}
            >
              Cadastrar
            </Button>
          </Box>
        </nav>

        <section className={classes.hero}>
          <Typography className={classes.headline}>
            Atendimento WhatsApp da sua provedora
          </Typography>
          <Typography className={classes.sub}>
            Você usa. Nós operamos a plataforma. Sem revenda do produto.
            Você cadastra a provedora; o dono libera os dias de teste e a operação.
            Depois do teste, o pagamento ativa o plano. Upgrade só com o operador.
          </Typography>
          <Button
            component={RouterLink}
            to="/signup"
            variant="contained"
            className={classes.ctaPrimary}
          >
            Criar conta da provedora
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
                b: "2ª via, desbloqueio, agendamento e transferência humana."
              },
              {
                t: "ERP obrigatório no piloto",
                b: "IXC, SGP ou Hubsoft com teste de conexão. Sem mock para cliente real."
              },
              {
                t: "Canal com aviso claro",
                b: "Baileys não oficial (risco Meta) ou Cloud API quando o dono habilitar."
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
          <Typography variant="h5" style={{ fontWeight: 800, marginBottom: 8 }}>
            Planos
          </Typography>
          <Typography className={classes.cardBody} style={{ marginBottom: 24 }}>
            10 atendentes em ambos. O plano IA inclui agentes e OpenAI. Ampliação só com o operador.
          </Typography>
          <Grid container spacing={3}>
            {plans.map(p => (
              <Grid item xs={12} md={6} key={p.name}>
                <Box
                  style={{
                    padding: 24,
                    border: "1px solid #E2E8F0",
                    borderRadius: 12,
                    background: "#fff"
                  }}
                >
                  <Typography style={{ fontWeight: 700 }}>{p.name}</Typography>
                  <Typography className={classes.price}>
                    R$ {Number(p.value || 0).toLocaleString("pt-BR")}
                    <Typography component="span" style={{ fontSize: 14, fontWeight: 500, color: "#64748B" }}>
                      /mês
                    </Typography>
                  </Typography>
                  <Typography className={classes.cardBody}>
                    {p.users} atendentes · {p.connections} conexão(ões) · {p.queues} filas
                  </Typography>
                  <Typography className={classes.cardBody} style={{ marginTop: 8 }}>
                    {p.useOpenAi
                      ? "Inclui agentes de IA, OpenAI e automações inteligentes."
                      : "Atendimento humano e fluxos ISP. Sem agentes de IA."}
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/signup"
                    fullWidth
                    style={{ marginTop: 16, background: "#2563EB", color: "#fff" }}
                  >
                    Começar
                  </Button>
                </Box>
              </Grid>
            ))}
          </Grid>
        </section>

        <footer className={classes.footer}>
          Licença de uso, sem revenda.{" "}
          <RouterLink to="/termos" style={{ color: "#2563EB" }}>
            Termos
          </RouterLink>
          . WhatsApp via Baileys (não oficial) ou Cloud API.
        </footer>
      </Container>
    </div>
  );
};

export default Landing;
