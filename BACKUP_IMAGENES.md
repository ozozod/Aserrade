# 📸 Backup de imágenes / fotos de remitos (MySQL)

> **Modelo actual:** las fotos suelen guardarse en MySQL como **data URL/base64** en `remitos.foto_path`.  
> Eso implica que un backup **SQL completo** normalmente **incluye** las imágenes, pero el `.sql` puede ser **muy pesado**.

## ✅ Recomendación práctica

- **Backup principal:** export SQL (desde la app con `exportBackupSQL` / IPC `mysql:exportBackupSQL`, o `mysqldump` en el servidor).
- **Frecuencia:** diaria/semanal según volumen.
- **Off-site:** copiá el `.sql` a Drive/OneDrive/NAS (lo importante es que quede fuera de la PC única).

## 🧪 Verificación

- Restaurá en un entorno de prueba y abrí remitos con foto.
- Si el SQL es enorme, preferí backup en servidor por SSH.

## 🗂️ Scripts en `scripts/`

- `scripts/backup-con-google-drive.js`: orientado a generar SQL y guardarlo en una carpeta local sincronizable.
- `scripts/backup-completo-con-imagenes.js`: **deprecado** (antes asumía storage cloud). No lo uses como fuente de verdad.

## 🧹 Reset / limpieza

Para borrar datos, usá SQL administrado (con backup previo). Ver `GUIA_ELIMINAR_TODO.md`.
