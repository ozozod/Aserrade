# ⏰ Backups automáticos (MySQL)

> Reemplaza guías viejas basadas en webhooks/cloud. Hoy el backup “correcto” es **SQL** (app o `mysqldump`).

## Opción A — Programar `mysqldump` (servidor/VPS)

Usá cron en Linux o Task Scheduler en Windows para ejecutar:

```bash
mysqldump -h HOST -u USER -p DB > /ruta/backups/aserradero_$(date +%F).sql
```

## Opción B — Export desde la app

La app puede generar un `.sql` vía IPC (`mysql:exportBackupSQL`). Si querés automatizarlo, lo más robusto suele ser **servidor** (Opción A).

## Off-site

Copiá el `.sql` a Drive/OneDrive/NAS.
