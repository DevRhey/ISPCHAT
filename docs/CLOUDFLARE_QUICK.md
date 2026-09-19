# Cloudflare Quick Tunnel — sessão atual

**App (front):** https://gdp-mutual-differently-occasionally.trycloudflare.com  
**API:** https://actual-tennessee-within-pathology.trycloudflare.com  

Login: `admin@admin.com` / `123456`

## Por que o login falhava
1. Front no túnel é **HTTPS**; se `REACT_APP_BACKEND_URL` aponta para `http://localhost:8080`, o browser bloqueia (mixed content).
2. Cookies `sameSite=lax` não atravessam dois subdomínios `*.trycloudflare.com` diferentes — agora usam `None`+`Secure` com `COOKIE_SECURE=true`.

## Subir de novo (túneis mudam a cada restart)

```powershell
# terminais separados:
cloudflared tunnel --url http://127.0.0.1:8080
cloudflared tunnel --url http://127.0.0.1:3000

# frontend com a URL da API do túnel:
$env:REACT_APP_BACKEND_URL="https://<API>.trycloudflare.com"
cd frontend; npm start
```

Ou copie `frontend/.env.cloudflare` → `.env` e reinicie o CRA.
