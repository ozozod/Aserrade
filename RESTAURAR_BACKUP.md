# 🔄 Guía para Restaurar Backups Completos

## 📋 Índice

1. [Restaurar Backup Completo (SQL + Imágenes)](#restaurar-backup-completo)
2. [Restaurar Solo Base de Datos SQL](#restaurar-solo-sql)
3. [Restaurar Solo Imágenes](#restaurar-solo-imágenes)
4. [Solución de Problemas](#solución-de-problemas)

---

## 🔄 Restaurar Backup Completo

### Opción 1: Script Automático (Recomendado)

**Script:** `scripts/restaurar-backup-completo.js`

**Cómo usar:**

```bash
# Con ruta como argumento
node scripts/restaurar-backup-completo.js "C:\Users\ozozo\Google Drive\Backups_Aserradero\backup_completo_2025-11-27_223000"

# O sin argumentos (te preguntará la ruta)
node scripts/restaurar-backup-completo.js
```

**El script:**
1. ✅ Te muestra información del backup
2. ✅ Te pide confirmación (escribe "SI" para confirmar)
3. ✅ Te guía para ejecutar el SQL manualmente
4. ✅ Sube todas las imágenes automáticamente

---

### Opción 2: Manual (Paso a Paso)

#### Paso 1: Restaurar Base de Datos SQL

1. **Abre Supabase Dashboard**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Abre SQL Editor**
   - Clic en "SQL Editor" en el menú lateral

3. **Preparar el SQL**
   - Abre el archivo `backup_database.sql` de tu backup
   - Copia TODO el contenido

4. **Ejecutar el SQL**
   - Pega el contenido en el SQL Editor
   - **IMPORTANTE:** Antes de ejecutar, si quieres mantener datos actuales, haz un backup primero
   - Clic en "Run" o presiona `F5`

5. **Verificar**
   - Deberías ver mensajes de éxito
   - Verifica que las tablas tengan datos

#### Paso 2: Restaurar Imágenes

**Opción A: Usar el Script**

```bash
node scripts/restaurar-backup-completo.js "ruta/al/backup"
```

Cuando te pregunte si ya ejecutaste el SQL, responde "s" y el script subirá las imágenes automáticamente.

**Opción B: Manual (Subir una por una)**

1. **Abre Supabase Dashboard → Storage**
2. **Selecciona el bucket `remitos-fotos`**
3. **Sube cada imagen** desde la carpeta `imagenes/` de tu backup

---

## 📦 Restaurar Solo SQL

Si solo necesitas restaurar la base de datos (sin imágenes):

1. Abre Supabase Dashboard → SQL Editor
2. Copia y pega el contenido de `backup_database.sql`
3. Ejecuta el script

**Nota:** Las imágenes seguirán en el Storage, pero las referencias en la base de datos se restaurarán.

---

## 📸 Restaurar Solo Imágenes

Si solo necesitas restaurar las imágenes (sin tocar la base de datos):

```bash
# Usar el script pero cancelar cuando pregunte por SQL
node scripts/restaurar-backup-completo.js "ruta/al/backup"
# Cuando pregunte si ejecutaste el SQL, responde "n"
# Luego el script solo subirá las imágenes
```

O manualmente:
1. Abre Supabase Dashboard → Storage
2. Ve al bucket `remitos-fotos`
3. Sube las imágenes desde la carpeta `imagenes/` de tu backup

---

## ⚠️ Advertencias Importantes

### Antes de Restaurar

1. **Haz un backup del estado actual**
   ```bash
   node scripts/backup-completo-con-imagenes.js
   ```

2. **Verifica que tienes el backup correcto**
   - Revisa la fecha en `info_backup.json`
   - Verifica que tiene las tablas que necesitas

3. **Ten en cuenta que:**
   - ✅ Se eliminarán TODOS los datos actuales
   - ✅ Se restaurarán los datos del backup
   - ✅ Las imágenes se reemplazarán (si usas `upsert: true`)

### Durante la Restauración

- ⏸️ **No cierres la aplicación** mientras se restaura
- ⏸️ **No uses la app** mientras se restaura
- ⏸️ **Espera a que termine** completamente

---

## 🔍 Verificar Restauración

Después de restaurar, verifica:

1. **Base de Datos:**
   - Abre la app y verifica que los clientes aparecen
   - Verifica que los remitos están restaurados
   - Verifica que los pagos están restaurados

2. **Imágenes:**
   - Abre un remito que debería tener imagen
   - Verifica que la imagen se muestra correctamente

3. **Sincronizar Secuencias:**
   - Ejecuta `supabase/sincronizar_secuencias.sql` para asegurar que los contadores estén correctos

---

## 🚨 Solución de Problemas

### Error: "La carpeta de backup no existe"

**Causa:** La ruta del backup es incorrecta.

**Solución:**
- Verifica la ruta completa
- En Windows, usa comillas dobles: `"C:\Users\ozozo\Google Drive\Backups_Aserradero\backup_completo_2025-11-27_223000"`
- O usa barras invertidas escapadas: `C:\\Users\\ozozo\\Google Drive\\Backups_Aserradero\\backup_completo_2025-11-27_223000`

### Error: "No se encontró backup_database.sql"

**Causa:** El backup está incompleto o corrupto.

**Solución:**
- Verifica que la carpeta de backup tiene:
  - `backup_database.sql`
  - `info_backup.json`
  - `imagenes/` (carpeta)
- Si falta algo, usa otro backup

### Error: "duplicate key value violates unique constraint"

**Causa:** Los contadores (secuencias) están desincronizados.

**Solución:**
1. Ejecuta `supabase/sincronizar_secuencias.sql` en Supabase SQL Editor
2. Intenta crear un registro nuevo para verificar

### Las imágenes no se muestran

**Causa:** Las imágenes no se subieron correctamente o las rutas no coinciden.

**Solución:**
1. Verifica que las imágenes están en Supabase Storage → `remitos-fotos`
2. Verifica que los `foto_path` en la base de datos coinciden con los nombres de archivo
3. Re-sube las imágenes si es necesario

### El SQL no se ejecuta

**Causa:** Puede haber errores de sintaxis o permisos.

**Solución:**
1. Revisa los errores en el SQL Editor
2. Ejecuta el SQL por partes (tabla por tabla)
3. Verifica que tienes permisos de administrador en Supabase

---

## 📝 Ejemplo Completo

```bash
# 1. Hacer backup del estado actual (por si acaso)
node scripts/backup-completo-con-imagenes.js

# 2. Restaurar backup anterior
node scripts/restaurar-backup-completo.js "C:\Users\ozozo\Google Drive\Backups_Aserradero\backup_completo_2025-11-27_223000"

# 3. Cuando pregunte, escribe "SI" para confirmar

# 4. Ejecuta el SQL en Supabase SQL Editor (el script te lo indicará)

# 5. Cuando pregunte si ya ejecutaste el SQL, escribe "s"

# 6. El script subirá las imágenes automáticamente

# 7. Sincronizar secuencias (opcional pero recomendado)
# Ejecuta supabase/sincronizar_secuencias.sql en Supabase SQL Editor
```

---

## ✅ Checklist de Restauración

- [ ] Backup del estado actual hecho
- [ ] Ruta del backup verificada
- [ ] SQL ejecutado en Supabase SQL Editor
- [ ] Imágenes subidas (automático o manual)
- [ ] Secuencias sincronizadas (`sincronizar_secuencias.sql`)
- [ ] Datos verificados en la app
- [ ] Imágenes verificadas en la app

---

## 💡 Tips

1. **Nombra tus backups descriptivamente:**
   - `backup_completo_2025-11-27_223000` (fecha y hora)
   - `backup_antes_de_migracion` (descripción)

2. **Guarda múltiples backups:**
   - No borres backups antiguos inmediatamente
   - Mantén al menos 3-5 backups recientes

3. **Prueba la restauración:**
   - De vez en cuando, prueba restaurar un backup en un entorno de prueba
   - Así sabrás que tus backups funcionan

---

**¿Necesitas ayuda?** Revisa los logs del script para ver qué está pasando.

