# 💾 Backups (modelo actual: MySQL)

## Qué se backup-ea

- Base de datos MySQL en un archivo **`.sql`**.
- Si hay fotos como data URL en columnas, van **dentro** del SQL.

## Cómo automatizar

- **Recomendado:** cron/Task Scheduler + `mysqldump` (ver `hostinger/BACKUP_HOSTINGER.md`).
- Alternativa: export manual desde la app.

## Qué NO usar

- Cualquier flujo que mencione clientes JS cloud para DB en el día a día (histórico del repo).
