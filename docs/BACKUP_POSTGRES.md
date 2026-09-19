# Backup e restore Postgres (ISPCHAT / Docker)

## Backup (dev compose)

```powershell
cd C:\Users\reyca\Desktop\whaticket-saas-main
docker compose -f docker/docker-compose-dev.yml exec -T postgres pg_dump -U postgres -d whaticket > backup_$(Get-Date -Format yyyyMMdd_HHmm).sql
```

Ajuste usuário/DB conforme `docker/docker-compose-dev.yml` e `.env`.

## Restore

```powershell
Get-Content .\backup_YYYYMMDD_HHMM.sql | docker compose -f docker/docker-compose-dev.yml exec -T postgres psql -U postgres -d whaticket
```

## Produção

1. Agendar `pg_dump` diário (cron/Task Scheduler) para disco externo ou S3.
2. Testar restore mensalmente.
3. Não versionar dumps no Git.
4. Incluir Redis só se houver estado crítico fora do Postgres (sessões Baileys costumam estar em volume/arquivo — backup do volume também).

## Checklist pós-restore

- [ ] API `/health` ou `/ready` OK
- [ ] Login admin
- [ ] Conexão WhatsApp (pode precisar escanear QR de novo)
- [ ] Filas e fluxo/langgraph ativos
