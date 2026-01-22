# 🎯 INSTRUCCIONES FINALES - SISTEMA DE ACTUALIZACIONES AUTOMÁTICAS

## ✅ YA ESTÁ INSTALADO

```
✅ electron-updater
✅ electron-log  
✅ package.json configurado
✅ autoUpdater.js creado
✅ main.js integrado
✅ Scripts helper creados
✅ CHANGELOG iniciado
✅ .gitignore configurado
```

---

## 📋 PRÓXIMOS PASOS (HAZLOS EN ORDEN)

### PASO 1: Crear Repositorio en GitHub

1. Abre: https://github.com/new
2. **Repository name**: `aserradero-v2`
3. **Description**: "Sistema de gestión para aserradero"
4. **Visibility**: ✅ Private (recomendado para app interna)
5. Click **Create repository**

**ANOTA TU USERNAME DE GITHUB:** ________________

---

### PASO 2: Actualizar package.json con tu Usuario

Abre `C:\Users\ozozo\Documents\aaaav2 audi\package.json`

**Línea 7** - Cambiar:
```json
"url": "https://github.com/TU_USUARIO/aserradero-v2.git"
```
Por:
```json
"url": "https://github.com/USUARIO_REAL/aserradero-v2.git"
```

**Línea 122** - Cambiar:
```json
"owner": "TU_USUARIO",
```
Por:
```json
"owner": "USUARIO_REAL",
```

---

### PASO 3: Conectar Proyecto con GitHub

Abre **PowerShell** en la carpeta del proyecto y ejecuta:

```powershell
cd "C:\Users\ozozo\Documents\aaaav2 audi"

# Configurar Git (cambiar por tus datos)
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"

# Inicializar repositorio
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "feat: Sistema de actualizaciones automáticas v2.0.1"

# Conectar con GitHub (CAMBIAR TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/aserradero-v2.git

# Subir a GitHub
git branch -M main
git push -u origin main
```

---

### PASO 4: Instalar GitHub CLI

**Opción A** - Descargar instalador:
https://cli.github.com/

**Opción B** - Con PowerShell (si tienes winget):
```powershell
winget install --id GitHub.cli
```

**Configurar:**
```powershell
gh auth login
# Seleccionar:
# > GitHub.com
# > HTTPS
# > Yes (authenticate)
# > Login with a browser
```

---

### PASO 5: Publicar Primera Versión (v2.0.1)

```powershell
# 1. Build de producción
npm run build:win

# 2. Publicar en GitHub
node scripts/publish-release.js
```

**Esto crea:**
- GitHub Release v2.0.1
- Instalador: `Aserradero App-2.0.1-Setup.exe`
- Archivo de metadata: `latest.yml`

---

## 🔄 DE AHORA EN ADELANTE (Publicar Parches)

### Cuando corrijas un bug o agregues algo:

```powershell
# 1. Incrementar versión (2.0.1 → 2.0.2)
node scripts/bump-version.js patch

# 2. Editar CHANGELOG.md (documentar cambios)
# El script ya creó la sección, solo completar

# 3. Commit y push
git add .
git commit -m "fix: Descripción del cambio"
git push

# 4. Build
npm run build:win

# 5. Publicar
node scripts/publish-release.js
```

**¡Automático!** Los usuarios recibirán notificación para actualizar.

---

## 🎬 EXPERIENCIA DEL USUARIO

### Primera instalación:
1. Usuario ejecuta: `Aserradero App-2.0.1-Setup.exe`
2. Instala en `C:\Program Files\Aserradero App`
3. Abre la app → Versión 2.0.1

### Cuando publiques v2.0.2:
1. Usuario abre la app (todavía v2.0.1)
2. **10 segundos después:** App verifica actualizaciones en segundo plano
3. **Si hay nueva versión:** Aparece diálogo:
   ```
   ┌────────────────────────────────────────┐
   │ 🎉 Actualización Disponible            │
   │                                        │
   │ Nueva versión 2.0.2 disponible         │
   │                                        │
   │ ¿Deseas descargar e instalar ahora?   │
   │ La app se reiniciará después.          │
   │                                        │
   │  [Descargar e Instalar]  [Más Tarde]  │
   └────────────────────────────────────────┘
   ```

4. **Si acepta:**
   - Descarga en segundo plano (con barra de progreso)
   - Cuando termina, ofrece reiniciar
   - Reinicia → Nueva versión instalada ✅

5. **Si dice "Más Tarde":**
   - Volverá a preguntar en 6 horas
   - Puede seguir trabajando normalmente

---

## 📊 VERSIONADO SEMÁNTICO (SemVer)

### Formato: X.Y.Z

- **X (Major)** - Cambios grandes → `3.0.0`
  - Ejemplo: Rediseño completo de la app
  
- **Y (Minor)** - Nuevas funciones → `2.1.0`
  - Ejemplo: Agregar módulo de inventario
  
- **Z (Patch)** - Correcciones → `2.0.2`
  - Ejemplo: Arreglar bug de fechas

### Comandos:

```bash
node scripts/bump-version.js patch  # 2.0.1 → 2.0.2
node scripts/bump-version.js minor  # 2.0.1 → 2.1.0
node scripts/bump-version.js major  # 2.0.1 → 3.0.0
```

---

## 🔍 VERIFICAR ACTUALIZACIONES MANUALMENTE

### En la App (Opcional):

Puedes agregar un botón "Buscar actualizaciones" que llame a:
```javascript
window.electronAPI.invoke('check-for-updates')
```

### En GitHub:

Ver todas las versiones publicadas:
https://github.com/TU_USUARIO/aserradero-v2/releases

---

## 📝 REGISTRO DE PARCHES APLICADOS

Todo queda documentado automáticamente en:

1. **CHANGELOG.md** - Historial completo
2. **GitHub Releases** - Cada versión publicada
3. **Git commits** - Cada cambio rastreado
4. **Logs de la app** - En `C:\Users\USUARIO\AppData\Roaming\aserradero\logs\`

---

## 🎯 CHECKLIST DE VERIFICACIÓN

Antes de publicar cada parche:

- [ ] Código probado localmente
- [ ] Versión incrementada (`bump-version.js`)
- [ ] CHANGELOG.md documentado
- [ ] Commit y push a GitHub
- [ ] Build exitoso (`npm run build:win`)
- [ ] Archivos generados en `dist/`:
  - [ ] `Aserradero App-X.Y.Z-Setup.exe`
  - [ ] `latest.yml`
- [ ] Release publicado (`publish-release.js`)
- [ ] Probado la actualización en otra máquina

---

## ⚡ RESUMEN ULTRA-RÁPIDO

### Setup Inicial (1 vez):
```bash
1. Crear repo en GitHub
2. Editar package.json (tu usuario)
3. git init && git push
4. gh auth login
```

### Publicar Parche:
```bash
node scripts/bump-version.js patch
# Editar CHANGELOG
git add . && git commit -m "fix: cambio" && git push
npm run build:win
node scripts/publish-release.js
```

**Listo!** 🎉

---

## 📞 SOPORTE

**Si algo falla:**

1. Ver logs: 
   ```powershell
   Get-Content "$env:APPDATA\aserradero\logs\main.log" -Tail 50
   ```

2. Revisar GitHub Releases:
   https://github.com/TU_USUARIO/aserradero-v2/releases

3. Consultar guía completa:
   `docs/GUIA_ACTUALIZACIONES.md`

---

## 🌟 LO MEJOR DE ESTE SISTEMA

- **Sin servidor propio:** Todo en GitHub (gratis)
- **Automático:** Los usuarios se actualizan solos
- **Profesional:** Versionado estándar de la industria
- **Documentado:** TODO queda registrado
- **Seguro:** Solo tu repositorio oficial
- **Simple:** 5 comandos para publicar un parche

---

**🚀 ¡Todo listo para empezar!**

**Primer paso:** Crear el repositorio en GitHub y conectarlo.

**¿Necesitas ayuda con algún paso?** Lee las guías creadas:
- `INICIO_RAPIDO.txt` - Guía visual
- `README_ACTUALIZACIONES.md` - Resumen
- `docs/GUIA_ACTUALIZACIONES.md` - Guía completa
