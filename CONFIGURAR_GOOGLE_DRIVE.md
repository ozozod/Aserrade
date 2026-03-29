# 📁 Configurar Backup Automático con Google Drive

## 🎯 Objetivo

Configurar el sistema para que:
1. ✅ Genere el backup automáticamente todos los días a las 22:00
2. ✅ Lo guarde en tu carpeta de Google Drive
3. ✅ Google Drive lo suba automáticamente a la nube
4. ✅ Todo sin intervención manual

---

## 📋 Paso 1: Verificar Google Drive Desktop

### ¿Tienes Google Drive Desktop instalado?

**Si NO lo tienes:**
1. Descarga e instala desde: https://www.google.com/drive/download/
2. Inicia sesión con tu cuenta de Google
3. Sincroniza una carpeta (por defecto: `C:\Users\TuUsuario\Google Drive`)

**Si YA lo tienes:**
- Asegúrate de que esté ejecutándose (deberías ver el ícono en la bandeja del sistema)
- Verifica que la carpeta `Google Drive` existe en tu usuario

---

## 🔧 Paso 2: Configurar la Carpeta

### Opción A: Automática (Recomendado)

Ejecuta el script de configuración:

```bash
# Abre PowerShell en la carpeta del proyecto
node scripts/configurar-google-drive.js
```

Este script:
- ✅ Busca automáticamente tu carpeta de Google Drive
- ✅ Crea la carpeta `Backups_Aserradero` dentro de Google Drive
- ✅ Configura el archivo `.env` automáticamente

### Opción B: Manual

1. Abre tu archivo `.env` en la raíz del proyecto
2. Agrega esta línea (ajusta la ruta si es diferente):

```env
BACKUP_DESTINO=C:\Users\TuUsuario\Google Drive\Backups_Aserradero
```

**Para encontrar tu carpeta de Google Drive:**
- Por defecto está en: `C:\Users\TuUsuario\Google Drive`
- O busca el ícono de Google Drive en el Explorador de Archivos

---

## ✅ Paso 3: Probar el Backup

Ejecuta el script manualmente para verificar que funciona:

```bash
# En PowerShell, desde la carpeta del proyecto
node scripts/backup-con-google-drive.js
```

**Deberías ver:**
- ✅ "Google Drive Desktop detectado"
- ✅ "El archivo se subirá automáticamente a Google Drive"
- ✅ Un archivo `.sql` creado en `Google Drive\Backups_Aserradero\`

**Verifica:**
1. Abre tu carpeta de Google Drive
2. Busca la carpeta `Backups_Aserradero`
3. Deberías ver el archivo de backup
4. Espera unos segundos y verifica que aparezca en Google Drive web

---

## ⏰ Paso 4: Configurar Ejecución Automática (Task Scheduler)

### 4.1 Abrir Task Scheduler

1. Presiona `Win + R`
2. Escribe: `taskschd.msc`
3. Presiona Enter

### 4.2 Crear Tarea Básica

1. **Clic derecho** en "Task Scheduler Library" → **"Create Basic Task"**

2. **General:**
   - Name: `Backup Diario Aserradero - Google Drive`
   - Description: `Genera backup automático todos los días a las 22:00 y lo sube a Google Drive`

3. **Trigger (Desencadenador):**
   - Trigger: `Daily` (Diario)
   - Start date: Hoy
   - Start time: `22:00` (10:00 PM)
   - Recur every: `1 days`

4. **Action (Acción):**
   - Action: `Start a program`
   - Program/script: `node`
   - Add arguments: `scripts\backup-con-google-drive.js`
   - Start in: `C:\Users\TuUsuario\Documents\aserradero` 
     *(Reemplaza con la ruta completa de tu proyecto)*

5. **Finalizar:**
   - ✅ Marca "Open the Properties dialog..."
   - Clic en "Finish"

### 4.3 Configurar Propiedades

En la ventana de propiedades que se abrió:

1. **Pestaña "General":**
   - ✅ Run whether user is logged on or not
   - ✅ Run with highest privileges
   - Configure for: `Windows 10` (o tu versión)

2. **Pestaña "Settings":**
   - ✅ Allow task to be run on demand
   - ✅ Run task as soon as possible after a scheduled start is missed
   - ✅ If the task fails, restart every: `10 minutes`
   - Stop the task if it runs longer than: `1 hour`

3. **Clic en "OK"**
   - Ingresa tu contraseña de Windows si te la pide

---

## 🧪 Paso 5: Probar la Tarea Programada

1. En Task Scheduler, busca "Backup Diario Aserradero - Google Drive"
2. **Clic derecho** → **"Run"**
3. Espera 10-30 segundos
4. Verifica:
   - ✅ En "History" debería aparecer "Task completed successfully"
   - ✅ En tu carpeta de Google Drive debería aparecer el archivo de backup
   - ✅ En Google Drive web debería aparecer el archivo (puede tardar unos minutos)

---

## 📁 Estructura de Archivos

Después de configurar, tendrás:

```
Google Drive/
  └── Backups_Aserradero/
      ├── backup_2025-11-27_220000.sql
      ├── backup_2025-11-28_220000.sql
      └── backup_2025-11-29_220000.sql
```

Estos archivos se sincronizan automáticamente con Google Drive en la nube.

---

## 🔍 Verificar que Funciona

### Verificar Task Scheduler:

1. Abre Task Scheduler
2. Busca tu tarea
3. Ve a la pestaña **"History"**
4. Deberías ver ejecuciones exitosas todos los días a las 22:00

### Verificar Archivos:

1. Abre `Google Drive\Backups_Aserradero\`
2. Deberías ver archivos `.sql` con fecha y hora
3. Abre Google Drive web (drive.google.com)
4. Busca la carpeta `Backups_Aserradero`
5. Deberías ver los mismos archivos

---

## 🛠️ Solución de Problemas

### ❌ Error: "Google Drive Desktop no detectado"

**Solución:**
1. Instala Google Drive Desktop
2. O configura manualmente `BACKUP_DESTINO` en `.env` apuntando a cualquier carpeta

### ❌ Los archivos no aparecen en Google Drive web

**Solución:**
1. Verifica que Google Drive Desktop esté ejecutándose (ícono en bandeja)
2. Verifica que la carpeta esté sincronizada (clic derecho → "Sync now")
3. Espera unos minutos (la sincronización puede tardar)

### ❌ La tarea no se ejecuta

**Solución:**
1. Verifica que la PC esté encendida a las 22:00
2. Verifica que la tarea esté habilitada
3. Prueba ejecutar manualmente: Clic derecho → Run
4. Revisa los logs en Task Scheduler → History

### ❌ Error: "Variables de entorno no configuradas"

**Solución:**
1. Verifica conectividad a MySQL (el script usa `mysql2`; la configuración está en `database/mysqlService.js` o en el propio script según versión)
2. Si usás carpeta personalizada, definí `BACKUP_DESTINO` en `.env` (opcional)
3. Ejecutá el script manualmente desde la carpeta del proyecto para ver el error real en consola

---

## 📊 Resumen del Flujo

```
22:00 (Automático)
    ↓
Task Scheduler ejecuta script
    ↓
Script genera backup SQL
    ↓
Guarda en: Google Drive\Backups_Aserradero\
    ↓
Google Drive Desktop detecta el archivo
    ↓
Sincroniza automáticamente con Google Drive web
    ↓
✅ Backup disponible en la nube
```

---

## ✅ Checklist Final

- [ ] Google Drive Desktop instalado y ejecutándose
- [ ] Carpeta `Backups_Aserradero` creada en Google Drive
- [ ] Script de configuración ejecutado (`configurar-google-drive.js`)
- [ ] Backup probado manualmente y funciona
- [ ] Archivo aparece en Google Drive web
- [ ] Task Scheduler configurado
- [ ] Tarea probada manualmente
- [ ] Verificado que se ejecuta automáticamente

---

## 🎉 ¡Listo!

Ahora el sistema:
- ✅ Genera backups automáticamente todos los días a las 22:00
- ✅ Los guarda en Google Drive
- ✅ Los sube automáticamente a la nube
- ✅ Todo sin intervención manual

**Solo necesitas:**
- Tener la PC encendida a las 22:00 (o configurar para que se encienda)
- Tener Google Drive Desktop ejecutándose
- ¡Eso es todo!

---

**¿Necesitas ayuda?** Ejecuta el script de configuración y sigue las instrucciones en pantalla.

