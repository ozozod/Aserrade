# 📸 Sistema de Backup de Imágenes

## 🎯 ¿Por qué hacer backup de imágenes?

Las imágenes de los remitos están almacenadas en **Supabase Storage** (bucket `remitos-fotos`), no en la base de datos. Cuando haces backup solo de la base de datos SQL, las imágenes **NO se incluyen** automáticamente.

Por eso necesitas hacer backup de las imágenes por separado.

---

## 📋 Opciones de Backup

### Opción 1: Backup Completo (SQL + Imágenes) - ⭐ Recomendado

**Script:** `scripts/backup-completo-con-imagenes.js`

Este script hace backup de TODO:
- ✅ Base de datos SQL (todas las tablas)
- ✅ Todas las imágenes del bucket `remitos-fotos`
- ✅ Información del backup (JSON)
- ✅ Organizado en una carpeta por fecha/hora

**Estructura del backup:**
```
Backups_Aserradero/
  └── backup_completo_2025-11-27_223000/
      ├── backup_database.sql
      ├── info_backup.json
      └── imagenes/
          ├── remito_001.jpg
          ├── remito_002.jpg
          └── ...
```

**Cómo usar:**
```bash
node scripts/backup-completo-con-imagenes.js
```

**Ventajas:**
- ✅ Todo en un solo lugar
- ✅ Fácil de restaurar
- ✅ Incluye metadatos del backup
- ✅ Se guarda en Google Drive automáticamente

---

### Opción 2: Backup Solo SQL

**Script:** `scripts/backup-con-google-drive.js`

Solo hace backup de la base de datos, sin imágenes.

**Cuándo usar:**
- Backup rápido de solo datos
- Si las imágenes ya están respaldadas en otro lado
- Si no hay imágenes en el sistema

**Cómo usar:**
```bash
node scripts/backup-con-google-drive.js
```

---

## 🔧 Configuración

### 1. Configurar Carpeta de Destino

El backup se guarda automáticamente en:
- `Google Drive\Backups_Aserradero\` (si tienes Google Drive Desktop)
- `Downloads\Backups_Aserradero\` (si no tienes Google Drive)

O puedes configurar una carpeta personalizada en `.env`:
```env
BACKUP_DESTINO=C:\Users\TuUsuario\Google Drive\Backups_Aserradero
```

### 2. Configurar Credenciales

El script lee automáticamente las credenciales desde:
1. `.env` (si tiene `REACT_APP_SUPABASE_URL` y `REACT_APP_SUPABASE_ANON_KEY`)
2. `config.json` (usado por Electron)
3. Valores por defecto (solo desarrollo)

---

## 📦 Restaurar Backup

### Restaurar Base de Datos SQL

1. Abre Supabase Dashboard → SQL Editor
2. Copia y pega el contenido de `backup_database.sql`
3. Ejecuta el script

### Restaurar Imágenes

Las imágenes se pueden restaurar manualmente subiéndolas al bucket `remitos-fotos` en Supabase Storage.

**Script para restaurar imágenes** (próximamente):
```bash
node scripts/restaurar-imagenes.js backup_completo_2025-11-27_223000/imagenes
```

---

## ⏰ Backup Automático Diario

Para hacer backup completo (SQL + imágenes) automáticamente todos los días:

### Configurar Task Scheduler

1. Abre Task Scheduler (`Win + R` → `taskschd.msc`)
2. Crea una nueva tarea:
   - **Nombre:** `Backup Completo Diario Aserradero`
   - **Trigger:** Diario a las 22:00
   - **Acción:** `node scripts\backup-completo-con-imagenes.js`
   - **Start in:** Ruta completa de tu proyecto

**Nota:** El backup completo puede tardar más tiempo dependiendo de la cantidad de imágenes.

---

## 📊 Información del Backup

Cada backup completo incluye un archivo `info_backup.json` con:

```json
{
  "fecha": "2025-11-27T22:30:00.000Z",
  "fecha_legible": "27/11/2025, 22:30:00",
  "sql": {
    "archivo": "backup_database.sql",
    "tamaño_bytes": 225280,
    "tablas": ["clientes", "articulos", "remitos", "remito_articulos", "pagos"],
    "total_registros": 785
  },
  "imagenes": {
    "total": 45,
    "descargadas": 45,
    "errores": [],
    "carpeta": "imagenes"
  }
}
```

---

## 🚨 Solución de Problemas

### Error: "Bucket not found"

**Causa:** El bucket `remitos-fotos` no existe en Supabase Storage.

**Solución:**
1. Abre Supabase Dashboard → Storage
2. Crea el bucket `remitos-fotos` si no existe
3. Configura permisos públicos para lectura

### Error: "Error descargando imagen"

**Causa:** Algunas imágenes pueden estar corruptas o inaccesibles.

**Solución:**
- El script continúa aunque algunas imágenes fallen
- Revisa `info_backup.json` para ver qué imágenes no se pudieron descargar
- Intenta descargar esas imágenes manualmente

### El backup tarda mucho

**Causa:** Muchas imágenes o imágenes muy grandes.

**Solución:**
- Es normal que tarde si hay muchas imágenes
- Puedes hacer backup solo de SQL si las imágenes ya están respaldadas
- Considera comprimir las imágenes antes de subirlas

---

## 💡 Recomendaciones

1. **Haz backup completo semanalmente** (o diariamente si hay muchos cambios)
2. **Haz backup solo SQL diariamente** (más rápido)
3. **Verifica que las imágenes se descargaron** revisando `info_backup.json`
4. **Mantén varios backups** (no solo el más reciente)
5. **Prueba restaurar un backup** de vez en cuando para asegurarte de que funciona

---

## 📝 Resumen de Scripts

| Script | Qué hace | Cuándo usar |
|--------|----------|-------------|
| `backup-completo-con-imagenes.js` | SQL + Imágenes | ⭐ Backup completo, semanal |
| `backup-con-google-drive.js` | Solo SQL | Backup rápido, diario |
| `limpiar-todo-con-imagenes.js` | Borra todo | Limpieza completa |

---

**¿Necesitas ayuda?** Revisa los logs del script para ver qué está pasando.

