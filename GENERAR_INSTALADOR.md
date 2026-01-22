# Generar Instalador de Aserradero App

## Pasos para Crear el Instalador Windows

### 1. Preparar el Build de React

Primero, necesitas generar la versión de producción de React:

```bash
npm run build
```

Esto creará una carpeta `build/` con los archivos optimizados de React.

### 2. Verificar Archivos Necesarios

Asegúrate de tener:
- ✅ Icono de la app en `build/icon.ico` (formato ICO para Windows)
- ✅ `main.js` (archivo principal de Electron)
- ✅ `preload.js` (script de preload)
- ✅ `package.json` con configuración de `electron-builder`

### 3. Generar el Instalador

Ejecuta el comando para generar el instalador:

```bash
npm run build:electron
```

Esto creará el instalador en la carpeta `dist/` con el nombre:
- `Aserradero App-1.0.0-Setup.exe`

### 4. Tiempo Estimado

- **Build de React**: 2-5 minutos
- **Generación del instalador**: 5-15 minutos (primera vez puede ser más lento)
- **Total**: ~10-20 minutos

---

## Estructura del Instalador

El instalador NSIS generado incluye:

✅ **Instalación estándar de Windows**
- Asistente de instalación paso a paso
- Opción para elegir directorio de instalación
- Opción para crear acceso directo en escritorio
- Opción para crear entrada en menú de inicio

✅ **Archivos incluidos**:
- Aplicación Electron completa
- Archivos de React compilados
- Node modules necesarios
- Configuración de Supabase

---

## Requisitos Previos

### En tu PC de desarrollo:
- ✅ Node.js instalado
- ✅ Windows 10/11
- ✅ Al menos 2GB de espacio libre
- ✅ Conexión a internet (para descargar dependencias)

### En las PCs del cliente:
- ✅ Windows 10 o superior
- ✅ Al menos 500MB de espacio libre
- ✅ Conexión a internet (para usar Supabase)

---

## Instalación en la PC del Cliente

### Opción 1: Instalación Estándar

1. Ejecutar `Aserradero App-1.0.0-Setup.exe`
2. Seguir el asistente de instalación
3. Elegir directorio de instalación (opcional)
4. Crear acceso directo en escritorio (recomendado)
5. Finalizar instalación

### Opción 2: Instalación Silenciosa (Para múltiples PCs)

```bash
Aserradero-App-1.0.0-Setup.exe /S /D=C:\Program Files\AserraderoApp
```

Parámetros:
- `/S`: Instalación silenciosa (sin interfaz)
- `/D`: Directorio de instalación (opcional)

---

## Configuración Post-Instalación

### Importante: Configurar Supabase

Después de instalar, necesitas configurar las credenciales de Supabase:

1. **Opción A**: Editar archivo de configuración
   - Ubicación: `C:\Program Files\AserraderoApp\resources\app.asar.unpacked\src\config\supabase.js`
   - Reemplazar con las credenciales del cliente

2. **Opción B**: Variables de entorno (recomendado para versión 2.0)
   - Crear archivo `.env` con las credenciales
   - El instalador puede configurarlo automáticamente

### Primera Ejecución

1. El usuario ejecuta la app desde el acceso directo o menú inicio
2. La app se conecta automáticamente a Supabase
3. Si es la primera vez, puede pedir configuración inicial

---

## Distribución del Instalador

### Para entrega al cliente:

1. **Crear carpeta de distribución**:
   ```
   Distribucion/
   ├── Aserradero-App-1.0.0-Setup.exe
   ├── README_INSTALACION.txt
   ├── MANUAL_USUARIO.pdf
   └── Configuracion_Supabase.txt (con credenciales)
   ```

2. **README_INSTALACION.txt** debe incluir:
   - Requisitos del sistema
   - Pasos de instalación
   - Configuración inicial
   - Contacto de soporte

3. **Entregar**:
   - Por USB
   - Por correo electrónico (si el archivo no es muy grande)
   - Por Google Drive / Dropbox
   - Por instalación remota (si tienes acceso)

---

## Troubleshooting

### Error: "No se puede encontrar el módulo"
**Solución**: Ejecutar `npm install` antes de generar el instalador

### Error: "Icono no encontrado"
**Solución**: Crear `build/icon.ico` desde `build/icon.png` usando un conversor online

### Instalador muy grande (>200MB)
**Solución**: Normal, incluye Node.js y todas las dependencias. Considerar:
- Usar dependencias más ligeras
- Excluir dependencias innecesarias en `package.json` → `build.files`

### La app no se conecta a Supabase después de instalar
**Solución**: Verificar que las credenciales en `src/config/supabase.js` sean correctas

---

## Comandos Útiles

```bash
# Limpiar builds anteriores
rm -rf build dist

# Build completo desde cero
npm run build
npm run build:electron

# Solo generar instalador (si ya tienes build)
npm run build:electron

# Ver tamaño del instalador
dir dist\*.exe

# Probar instalador localmente
dist\Aserradero-App-1.0.0-Setup.exe
```

---

## Notas Importantes

⚠️ **Antes de generar el instalador para distribuir**:
1. ✅ Probar la app completamente en modo producción
2. ✅ Verificar que todas las funcionalidades funcionen
3. ✅ Eliminar credenciales de prueba de Supabase
4. ✅ Verificar que el icono esté incluido
5. ✅ Probar el instalador en una PC limpia

⚠️ **Después de generar**:
1. ✅ Probar la instalación completa en una PC de prueba
2. ✅ Verificar que la app se ejecute correctamente
3. ✅ Verificar que se conecte a Supabase
4. ✅ Probar todas las funcionalidades principales

---

*Guía creada: Noviembre 2024*

