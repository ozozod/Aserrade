# 🔄 Restaurar backups (MySQL / Hostinger)

> **Estado actual (2026):** la app usa **MySQL** como base única. Los backups “buenos” son archivos **`.sql`** (export desde la app o `mysqldump`).

## ✅ Antes de empezar

- Hacé un **backup del estado actual** (por si necesitás volver atrás).
- Confirmá **qué base** vas a pisar (`aserradero_db`, dev, prod, etc.).

## 1) Restaurar un `.sql` (recomendado)

### Opción A — phpMyAdmin

1. Entrá a phpMyAdmin
2. Seleccioná la base de datos
3. Pestaña **Importar**
4. Elegí el archivo `.sql` y ejecutá

### Opción B — consola `mysql`

```bash
mysql -h HOST -u USER -p NOMBRE_BD < ruta/al/backup.sql
```

## 2) Imágenes / `foto_path`

- Si `remitos.foto_path` contiene **data URLs** (`data:image/...;base64,...`), esas imágenes van **dentro del SQL**.
- Si tenés registros históricos con URLs externas, tratá esos casos como excepción.

## 3) Verificación rápida

- Abrí la app y verificá listas (clientes/remitos/pagos)
- Probá abrir un remito con foto
- Revisá conteos básicos con SQL (`SELECT COUNT(*) ...`)

## 4) Problemas comunes

- **Timeout / tamaño**: usá import por consola (SSH) en vez de phpMyAdmin
- **Errores de FK / orden**: asegurate de importar un dump consistente (o desactivá checks solo si sabés lo que hacés)
