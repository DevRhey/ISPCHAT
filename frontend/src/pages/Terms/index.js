import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Container, Typography, Button, Box } from "@material-ui/core";

const Terms = () => (
  <Container maxWidth="md" style={{ padding: "48px 16px 80px", color: "#0F172A" }}>
    <Typography variant="h4" style={{ fontWeight: 800, marginBottom: 16 }}>
      Termos de uso
    </Typography>
    <Typography paragraph>
      O ISPCHAT é uma licença de uso da operação da sua provedora. A plataforma
      é do operador. Você não pode revender, sublicenciar nem oferecer o produto
      a terceiros.
    </Typography>
    <Typography variant="h6" style={{ fontWeight: 700, marginTop: 24 }}>
      WhatsApp
    </Typography>
    <Typography paragraph>
      O canal padrão usa integração não oficial (Baileys). Existe risco de
      bloqueio pela Meta. Cloud API oficial só entra quando o dono da plataforma
      habilitar. O uso do canal é por sua conta e risco operacional.
    </Typography>
    <Typography variant="h6" style={{ fontWeight: 700, marginTop: 24 }}>
      Plano e limites
    </Typography>
    <Typography paragraph>
      Usuários, conexões WhatsApp e filas são limitados pelo plano. Ampliação
      somente com o dono da plataforma (upgrade). Uma empresa = um workspace.
    </Typography>
    <Typography variant="h6" style={{ fontWeight: 700, marginTop: 24 }}>
      ERP
    </Typography>
    <Typography paragraph>
      Boletos e consultas reais exigem conector IXC, SGP ou Hubsoft. Não use
      dados de demonstração com clientes finais.
    </Typography>
    <Box mt={3}>
      <Button component={RouterLink} to="/signup" variant="contained" color="primary">
        Voltar ao cadastro
      </Button>
      <Button component={RouterLink} to="/" style={{ marginLeft: 8 }}>
        Início
      </Button>
    </Box>
  </Container>
);

export default Terms;
