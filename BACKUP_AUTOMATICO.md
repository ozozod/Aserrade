# 🔄 Configurar Backup Automático Diario

## 📋 Opciones Disponibles

Tienes 3 formas de generar backups automáticos:

1. **🖥️ Script Automático en PC** (Recomendado) - Se ejecuta solo todos los días a las 22:00
2. **📱 Página Web desde Celular** - Abres una página y haces clic
3. **⚙️ Manual desde Terminal** - Ejecutas el comando cuando quieras

---

## 🖥️ Opción 1: Backup Automático en PC (Task Scheduler)

### Paso 1: Preparar el Script

1. Abre el archivo `.env` en la raíz del proyecto
2. Asegúrate de tener estas variables:
   ```env
   REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   BACKUP_DESTINO=C:\Users\TuUsuario\Google Drive\Backups_Aserradero
   ```
   (Opcional: Cambia `BACKUP_DESTINO` a tu carpeta de Google Drive)

### Paso 2: Probar el Script Manualmente

1. Abre PowerShell o CMD en la carpeta del proyecto
2. Ejecuta:
   ```bash
   node scripts/backup-automatico.js
   ```
3. Verifica que se cree el archivo en la carpeta de destino

### Paso 3: Configurar Task Scheduler (Windows)

1. **Abrir Task Scheduler:**
   - Presiona `Win + R`
   - Escribe: `taskschd.msc`
   - Presiona Enter

2. **Crear Tarea Básica:**
   - Clic derecho en "Task Scheduler Library" → "Create Basic Task"
   - Nombre: `Backup Diario Aserradero`
   - Descripción: `Genera backup automático todos los días a las 22:00`

3. **Configurar Trigger (Desencadenador):**
   - Trigger: `Daily` (Diario)
   - Start date: Hoy
   - Start time: `22:00` (10:00 PM)
   - Recur every: `1 days`

4. **Configurar Action (Acción):**
   - Action: `Start a program`
   - Program/script: `node`
   - Add arguments: `scripts\backup-automatico.js`
   - Start in: `C:\Users\TuUsuario\Documents\aserradero` (ruta completa de tu proyecto)

5. **Finalizar:**
   - Marca "Open the Properties dialog..."
   - En la pestaña "General":
     - ✅ Run whether user is logged on or not
     - ✅ Run with highest privileges
   - En la pestaña "Settings":
     - ✅ Allow task to be run on demand
     - ✅ Run task as soon as possible after a scheduled start is missed
   - Clic en "OK" y ingresa tu contraseña de Windows

### Paso 4: Probar la Tarea

1. En Task Scheduler, busca "Backup Diario Aserradero"
2. Clic derecho → "Run"
3. Espera unos segundos
4. Verifica que se haya creado el archivo en la carpeta de destino

### ✅ Listo!

Ahora el backup se generará automáticamente todos los días a las 22:00.

---

## 📱 Opción 2: Backup desde Celular (Página Web)

### Paso 1: Subir la Página Web

1. Tienes dos opciones:
   
   **Opción A: Servidor Local Simple**
   - Instala un servidor HTTP simple (ej: `http-server` de npm)
   - O usa Python: `python -m http.server 8000`
   - Abre `http://tu-ip-local:8000/scripts/backup-web.html` desde tu celular
   
   **Opción B: Hosting Gratuito**
   - Sube `backup-web.html` a:
     - GitHub Pages (gratis)
     - Netlify (gratis)
     - Vercel (gratis)
     - O cualquier hosting que tengas

### Paso 2: Usar desde el Celular

1. Abre la página en tu navegador del celular
2. Ingresa:
   - **URL de Supabase**: Tu URL de Supabase
   - **Clave Anónima**: Tu clave anónima de Supabase
3. Clic en "💾 Generar Backup Ahora"
4. El archivo se descargará automáticamente
5. Súbelo a Google Drive desde tu celular

### ✅ Listo!

Ahora puedes generar backups desde cualquier lugar con tu celular.

---

## ⚙️ Opción 3: Backup Manual desde Terminal

### Uso Simple

```bash
# Desde la carpeta del proyecto
node scripts/backup-automatico.js
```

### Con Carpeta Personalizada

```bash
# Windows (PowerShell)
$env:BACKUP_DESTINO="C:\Google Drive\Backups"; node scripts\backup-automatico.js

# Linux/Mac
BACKUP_DESTINO=/ruta/carpeta node scripts/backup-automatico.js
```

### Usar el Script .bat (Windows)

```bash
# Doble clic en:
scripts\ejecutar-backup.bat
```

---

## 📁 Dónde se Guardan los Backups

### Por Defecto:
- **Windows**: `C:\Users\TuUsuario\Downloads\Backups_Aserradero\`
- **Linux/Mac**: `~/Downloads/Backups_Aserradero/`

### Personalizado:
Configura la variable `BACKUP_DESTINO` en tu `.env`:
```env
BACKUP_DESTINO=C:\Users\TuUsuario\Google Drive\Backups_Aserradero
```

### Estructura de Archivos:
```
Backups_Aserradero/
  ├── backup_2025-11-27_220000.sql
  ├── backup_2025-11-28_220000.sql
  └── backup_2025-11-29_220000.sql
```

---

## 🔍 Verificar que Funciona

### Verificar Task Scheduler:

1. Abre Task Scheduler
2. Busca "Backup Diario Aserradero"
3. Ve a la pestaña "History"
4. Deberías ver ejecuciones exitosas

### Verificar Archivos:

1. Ve a la carpeta de destino
2. Deberías ver archivos `.sql` con fecha y hora
3. Abre uno y verifica que tenga datos

### Verificar Logs:

El script muestra en consola:
- ✅ Si todo está bien
- ❌ Si hay errores

---

## 🛠️ Solución de Problemas

### Error: "Variables de entorno no configuradas"

**Solución:**
- Verifica que el archivo `.env` existe
- Verifica que tiene `REACT_APP_SUPABASE_URL` y `REACT_APP_SUPABASE_ANON_KEY`

### Error: "No se puede conectar a Supabase"

**Solución:**
- Verifica que la URL y la clave son correctas
- Verifica tu conexión a internet

### La tarea no se ejecuta automáticamente

**Solución:**
1. Verifica que la PC esté encendida a las 22:00
2. Verifica que la tarea esté habilitada en Task Scheduler
3. Verifica los logs en Task Scheduler → History
4. Prueba ejecutar manualmente: Clic derecho → Run

### No se crean los archivos

**Solución:**
- Verifica que la carpeta de destino existe
- Verifica que tienes permisos de escritura
- Verifica la ruta en `BACKUP_DESTINO`

---

## 📊 Recomendaciones

1. **Carpeta de Google Drive:**
   - Configura `BACKUP_DESTINO` apuntando a tu carpeta de Google Drive
   - Así los backups se suben automáticamente a la nube

2. **Retención:**
   - Mantén los últimos 30-90 días de backups
   - Elimina los más antiguos manualmente

3. **Verificación:**
   - Una vez por semana, verifica que los backups se están generando
   - Prueba restaurar un backup para asegurarte que funciona

4. **Notificaciones (Opcional):**
   - Puedes configurar un webhook para recibir notificaciones cuando se complete el backup
   - O revisar la carpeta periódicamente

---

## 🎯 Resumen Rápido

**Para automatización completa:**
1. ✅ Configura `.env` con tus credenciales
2. ✅ Prueba el script manualmente
3. ✅ Configura Task Scheduler para ejecutar diariamente a las 22:00
4. ✅ Configura `BACKUP_DESTINO` a tu carpeta de Google Drive
5. ✅ Listo! Los backups se generan solos todos los días

**Para uso desde celular:**
1. ✅ Sube `backup-web.html` a un hosting
2. ✅ Abre desde tu celular
3. ✅ Ingresa credenciales (se guardan automáticamente)
4. ✅ Clic en "Generar Backup"
5. ✅ Descarga y sube a Google Drive

---

**¿Necesitas ayuda?** Revisa los logs o ejecuta el script manualmente para ver qué error aparece.

