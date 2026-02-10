# 🔄 GUÍA COMPLETA DE ACTUALIZACIONES AUTOMÁTICAS

## 📚 ÍNDICE
1. [Configuración Inicial](#configuración-inicial)
2. [Flujo de Actualización](#flujo-de-actualización)
3. [Publicar Nuevo Parche](#publicar-nuevo-parche)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

---

## 🛠️ CONFIGURACIÓN INICIAL

### 1. Instalar Dependencias

```bash
cd "C:\Users\ozozo\Documents\aaaav2 audi"
npm install electron-updater electron-log --save
```

### 2. Configurar package.json

Ya está configurado con:
- `version`: Número de versión actual
- `repository`: URL de GitHub
- `build`: Configuración de electron-builder con `publish`

### 3. Crear Repositorio en GitHub

```bash
# Inicializar Git (si no existe)
git init

# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "feat: Configuración inicial de actualizaciones automáticas"

# Crear repositorio en GitHub:
# https://github.com/new
# Nombre: aserradero-v2

# Conectar con GitHub
git remote add origin https://github.com/TU_USUARIO/aserradero-v2.git
git branch -M main
git push -u origin main
```

---

## 🔄 FLUJO DE ACTUALIZACIÓN

### Cómo Funciona

1. **App arranca** → `autoUpdater.checkForUpdates()`
2. **Verifica GitHub Releases** → ¿Hay versión nueva?
3. **Descarga en segundo plano** → Sin interrumpir al usuario
4. **Notifica al usuario** → "Actualización disponible"
5. **Usuario confirma** → Reinicia e instala
6. **Listo** → App actualizada

### Eventos del Ciclo

```
checking-for-update
  ↓
update-available (hay nueva)
  ↓
download-progress (descargando...)
  ↓
update-downloaded (lista!)
  ↓
quitAndInstall() → Reinicia e instala
```

---

## 📦 PUBLICAR NUEVO PARCHE

### Paso 1: Hacer Cambios en el Código

```bash
# Trabajar en rama de desarrollo
git checkout -b feature/fix-fechas

# Hacer tus cambios...
# Guardar archivos...

# Commit
git add .
git commit -m "fix: Corregir bug de filtrado de fechas"
```

### Paso 2: Actualizar Versión y Changelog

```bash
# Editar package.json → aumentar version
# Ejemplo: "2.0.1" → "2.0.2"

# Editar CHANGELOG.md → documentar cambios
# Agregar nueva sección con fecha de hoy
```

### Paso 3: Mergear a Main

```bash
git checkout main
git merge feature/fix-fechas
git push origin main
```

### Paso 4: Build de Producción

```bash
# Generar instaladores para distribución
npm run build:win
```

**Archivos generados:**
- `dist/Aserradero.App-2.0.4-Setup.exe` (instalador)
- `dist/latest.yml` (metadata para electron-updater)

### Paso 4b: Publicar a GitHub (subir el instalador para actualización automática)

1. **Crear token en GitHub:** Settings → Developer settings → Personal access tokens → Generate new token (classic), permiso **repo**. Copiar el token.
2. **Si PowerShell da error con npx** ("la ejecución de scripts está deshabilitada"), usar **CMD** o ejecutar con node:
   - **Opción A – CMD:** Abrir CMD (no PowerShell), luego:
     ```cmd
     cd "C:\Users\ozozo\Documents\aaaav2 audi"
     set GH_TOKEN=tu_token_aqui
     node node_modules\electron-builder\cli.js --win -p always
     ```
   - **Opción B – PowerShell (habilitar scripts una vez):** Ejecutar como administrador: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. Luego:
     ```powershell
     cd "C:\Users\ozozo\Documents\aaaav2 audi"
     $env:GH_TOKEN = "tu_token_aqui"
     npm run publish:github
     ```
3. Reemplazar `tu_token_aqui` por el token real. Tras publicar, la app instalada detectará la nueva versión al iniciar.

### Paso 5: Crear GitHub Release (si no usaste Paso 4b)

#### Opción A: Desde GitHub Web
1. Ir a: `https://github.com/TU_USUARIO/aserradero-v2/releases/new`
2. **Tag version**: `v2.0.2` (con "v")
3. **Release title**: `v2.0.2 - Corrección de filtros de fecha`
4. **Description**: Copiar del CHANGELOG.md
5. **Attach binaries**: Subir archivos de `dist/`:
   - `Aserradero-Setup-2.0.2.exe`
   - `latest.yml`
6. Click **Publish release**

#### Opción B: Desde Terminal (con GitHub CLI)

```bash
# Instalar GitHub CLI: https://cli.github.com/

# Login
gh auth login

# Crear release automáticamente
gh release create v2.0.2 \
  --title "v2.0.2 - Corrección de filtros de fecha" \
  --notes-file CHANGELOG.md \
  "dist/Aserradero-Setup-2.0.2.exe" \
  "dist/latest.yml"
```

### Paso 6: Verificar

- Abrir la app instalada (versión anterior)
- Esperar 1-2 minutos
- Debería aparecer notificación de actualización
- Click en "Descargar e instalar"
- La app se reinicia con la nueva versión

---

## 🧪 TESTING

### Probar Actualizaciones Localmente

```bash
# 1. Build versión 2.0.1
npm run build:win

# 2. Instalar esa versión
# Ejecutar: dist/Aserradero-Setup-2.0.1.exe

# 3. Cambiar código, actualizar a 2.0.2
# Editar package.json → "version": "2.0.2"

# 4. Build nueva versión
npm run build:win

# 5. Publicar en GitHub Release (v2.0.2)

# 6. Abrir app instalada (2.0.1)
# Debería detectar actualización automáticamente
```

### Verificar Logs

Los logs se guardan en:
```
Windows: C:\Users\ozozo\AppData\Roaming\aserradero\logs\main.log
```

---

## 🐛 TROUBLESHOOTING

### ❌ "No se detecta actualización"

**Causas:**
- GitHub Release no tiene `latest.yml`
- Tag mal formateado (debe ser `v2.0.2`, con "v")
- Repository URL incorrecta en package.json
- Versión en package.json es igual o mayor que Release

**Solución:**
```bash
# Verificar configuración
cat package.json | grep -A 5 "repository"
cat package.json | grep "version"

# Ver logs
Get-Content "$env:APPDATA\aserradero\logs\main.log" -Tail 50
```

### ❌ "Error al descargar actualización"

**Causas:**
- Archivo .exe no subido a GitHub Release
- Release marcado como "Draft" o "Pre-release"
- Sin conexión a internet

**Solución:**
1. Ir a GitHub Releases
2. Verificar que el Release esté **Published**
3. Verificar que `Aserradero-Setup-X.Y.Z.exe` esté en Assets
4. Verificar que `latest.yml` esté en Assets

### ❌ "Actualización descargada pero no se instala"

**Causa:**
- App no tiene permisos de administrador
- Antivirus bloqueando instalación

**Solución:**
```bash
# Ejecutar como administrador
# O desactivar temporalmente antivirus
```

---

## 📊 MONITOREO DE VERSIONES

### Ver Versiones de Usuarios

Puedes agregar telemetría básica (opcional):
```javascript
// En main.js, después de app.whenReady()
const version = app.getVersion();
console.log('App version:', version);

// Enviar a servidor de analytics (opcional)
fetch('https://api.tudominio.com/analytics', {
  method: 'POST',
  body: JSON.stringify({ version, userId: 'xxx' })
});
```

---

## 🔐 SEGURIDAD

### Firmar Actualizaciones (Recomendado)

Para Windows, se recomienda firma digital:

1. **Obtener certificado** (Digicert, Sectigo, etc)
2. **Configurar en package.json:**

```json
"build": {
  "win": {
    "certificateFile": "./certs/cert.pfx",
    "certificatePassword": "TU_PASSWORD",
    "certificateSubjectName": "Tu Empresa"
  }
}
```

---

## 📝 CHECKLIST DE PUBLICACIÓN

Antes de publicar cada parche, verificar:

- [ ] Versión actualizada en `package.json`
- [ ] Cambios documentados en `CHANGELOG.md`
- [ ] Tests pasando
- [ ] Build exitoso (`npm run build:win`)
- [ ] Tag de Git creado (`git tag v2.0.X`)
- [ ] GitHub Release publicado con:
  - [ ] `Aserradero-Setup-X.Y.Z.exe`
  - [ ] `latest.yml`
  - [ ] Notas del changelog
- [ ] Probado en máquina con versión anterior
- [ ] Actualización funciona correctamente

---

## 🎯 ALTERNATIVA: HOSTINGER

Si prefieres usar Hostinger en lugar de GitHub:

1. **Subir archivos a Hostinger:**
   - `/public_html/aserradero/updates/latest.yml`
   - `/public_html/aserradero/updates/Aserradero-Setup-2.0.2.exe`

2. **Configurar URL custom en autoUpdater:**
   ```javascript
   autoUpdater.setFeedURL({
     provider: 'generic',
     url: 'https://tudominio.com/aserradero/updates'
   });
   ```

**Ventajas:** Control total
**Desventajas:** Manual, sin versionado automático

---

## 📞 SOPORTE

Si hay problemas:
1. Revisar logs: `C:\Users\ozozo\AppData\Roaming\aserradero\logs\main.log`
2. Verificar GitHub Releases
3. Probar manualmente descargando .exe del Release
