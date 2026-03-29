# Hostinger / MySQL (operación actual)

Este directorio contiene **SQL y documentación** para el esquema MySQL en Hostinger.

## Estado del proyecto

- La app usa **MySQL** como backend en runtime.
- Los datos viven en **MySQL** y el acceso desde la app es vía **Electron IPC** (`mysql:*`) implementado en `database/mysqlService.js`.

## Archivos útiles

- `create_tables_mysql.sql` — crear tablas en MySQL
- `config.example.json` — ejemplo de configuración (solo MySQL)
- Documentación adicional: `MIGRACION_HOSTINGER.md`, `BACKUP_HOSTINGER.md` (puede contener notas históricas; priorizá el flujo actual: **SQL + mysqldump**)

## Migración histórica

Los scripts automáticos de migración con credenciales embebidas fueron **eliminados del repo** a propósito. Hoy la migración debe hacerse con **SQL controlado** (ver `MIGRACION_HOSTINGER.md`).

## Backups recomendados hoy

- Desde la app: generar **`.sql`** vía `exportBackupSQL` / IPC `mysql:exportBackupSQL`
- En servidor: `mysqldump` + copia de seguridad off-site (Drive/OneDrive)
