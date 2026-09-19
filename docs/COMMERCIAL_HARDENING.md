# Hardening comercial (Sprint 0+)

## Variáveis obrigatórias em produção

```bash
NODE_ENV=production
JWT_SECRET=<min 16 chars>
JWT_REFRESH_SECRET=<min 16 chars>
COOKIE_SECURE=true
ALLOW_ISP_DEMO=false
GERENCIANET_WEBHOOK_SECRET=<token compartilhado>
GERENCIANET_PIX_KEY=<chave pix>
```

## WhatsApp Cloud API (opcional)

```bash
WHATSAPP_CLOUD_ENABLED=true
WHATSAPP_CLOUD_PHONE_NUMBER_ID=
WHATSAPP_CLOUD_ACCESS_TOKEN=
WHATSAPP_CLOUD_WABA_ID=
WHATSAPP_CLOUD_VERIFY_TOKEN=
WHATSAPP_CLOUD_API_VERSION=v19.0
```

## Endpoints novos

| Método | Path | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/ready` | público | DB + Redis readiness |
| GET | `/whatsapp-cloud/status` | JWT | Status adapter Meta |
| POST | `/whatsapp-cloud/send` | JWT | Envio texto Cloud API |
| GET/POST | `/whatsapp-cloud/webhook` | verify token | Webhook Meta |
| POST | `/forgetpassword` | público | Body `{ email }` (sem SQLi) |
| POST | `/resetpasswords` | público | Body `{ email, token, password }` |

## Correções de segurança aplicadas

- Reset de senha com Sequelize (sem SQL interpolado)
- Invoices sempre filtradas por `companyId` + auth em `/list`
- Subscription usa `Company.findByPk(companyId)`; webhook exige `GERENCIANET_WEBHOOK_SECRET`
- ISP demo bloqueado em produção (exceto `ALLOW_ISP_DEMO=true`)
- Login bloqueia empresa inativa / vencida (+3 dias grace)
- JWT sem defaults fracos em produção
- Settings públicas só white-label; demais exigem tenant
- Audit log em billing / cloud send
