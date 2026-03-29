# 🔐 Credenciales y configuración (MySQL / Electron)

## Qué cambió

La app **no usa** `config.json` para credenciales de base de datos. La conexión MySQL vive en el proceso principal:

- `database/mysqlService.js` (pool `mysql2`)

`config.json` / `config.json.example` son **opcionales** y solo para metadata futura (ver `main.js` → `config:get`).

## Seguridad

- **No commitees** passwords en documentación.
- Preferí **variables de entorno** o secretos fuera del repo.
- Recordá que el renderer (React) **no** debería contener credenciales DB.

## Producción vs desarrollo

- Mantener bases separadas (`aserradero_db` vs `aserradero_db_dev`) y rotar credenciales si hubo exposición.
