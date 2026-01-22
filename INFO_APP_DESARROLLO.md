# 📝 Información de la App de Desarrollo

## 📂 Ubicación
- **Carpeta**: `C:\Users\ozozo\Documents\aserradero-v2`
- **Tipo**: App de desarrollo
- **Base de datos**: `aserradero_dev` (desarrollo en Hostinger)

## 🔧 Configuración Actual

### Base de Datos
- **Servidor**: Hostinger MySQL
- **Host**: `31.97.246.42`
- **Puerto**: `3306`
- **Usuario**: `aserradero_user`
- **Contraseña**: `Aserradero2025#`
- **Base de datos**: `aserradero_dev` (DESARROLLO - NO producción)

### Archivo de Configuración
- **Archivo**: `src/services/databaseService.js`
- **USE_HOSTINGER**: `true` (usa MySQL Hostinger)
- **Base de datos**: `aserradero_dev` (definida en `database/mysqlService.js`)

### Diferencias con Producción
- **Producción** (`aserradero`): usa `aserradero_db`
- **Desarrollo** (`aserradero-v2`): usa `aserradero_dev`

## ⚠️ IMPORTANTE
- **NO mezclar** datos de desarrollo con producción
- **NO cambiar** `aserradero_dev` por `aserradero_db` en desarrollo
- Esta app es para **probar cambios** antes de llevarlos a producción

## 📍 Archivos Clave
- `database/mysqlService.js` - Configuración MySQL (línea 12: `database: 'aserradero_dev'`)
- `src/services/databaseService.js` - Selector de servicio (línea 5: `USE_HOSTINGER = true`)
- `src/services/hostingerService.js` - Servicio de Hostinger

## 🔄 Para Cambiar a Producción
Si necesitas cambiar temporalmente a producción (NO recomendado):
1. Editar `database/mysqlService.js`
2. Cambiar `database: 'aserradero_dev'` a `database: 'aserradero_db'`

## 📌 Notas
- Las imágenes siguen usando Supabase Storage (no MySQL base64)
- Esta app está separada de producción para evitar conflictos



