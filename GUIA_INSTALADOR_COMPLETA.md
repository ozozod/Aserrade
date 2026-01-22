# Guía Completa para Generar el Instalador - Aserradero App

## Estado Actual: ✅ LISTO

Los iconos están en su lugar:
- ✅ `build/icon.ico` (para el instalador Windows)
- ✅ `build/icon.png` (para la aplicación)
- ✅ `package.json` configurado correctamente

---

## Pasos para Generar el Instalador

### 1. Compilar React para Producción

Ejecuta el siguiente comando para generar la versión optimizada de React:

```bash
npm run build
```

**Tiempo estimado**: 2-5 minutos

**Qué hace**:
- Compila React en modo producción
- Optimiza los archivos (minifica, comprime)
- Genera carpeta `build/` con archivos listos

### 2. Verificar que el Build se Completó

Verifica que la carpeta `build/` contenga:
- ✅ `index.html`
- ✅ Carpeta `static/` con archivos JavaScript y CSS
- ✅ `icon.ico`
- ✅ `icon.png`

### 3. Generar el Instalador

Ejecuta el siguiente comando:

```bash
npm run build:electron
```

**Tiempo estimado**: 5-15 minutos (primera vez puede tardar más)

**Qué hace**:
- Empaqueta la aplicación Electron
- Incluye todos los archivos necesarios
- Genera el instalador NSIS de Windows
- Crea el archivo `Aserradero-App-1.0.0-Setup.exe` en la carpeta `dist/`

### 4. Verificar el Instalador

Después de generar, verifica:
- ✅ Archivo `dist/Aserradero-App-1.0.0-Setup.exe` existe
- ✅ Tamaño del archivo: aproximadamente 150-250 MB
- ✅ El instalador se puede ejecutar

### 5. Probar el Instalador (Opcional pero Recomendado)

1. Ejecutar `dist/Aserradero-App-1.0.0-Setup.exe`
2. Seguir el asistente de instalación
3. Instalar en una carpeta de prueba (ej: `C:\Program Files\AserraderoApp`)
4. Verificar que la app se ejecute correctamente
5. Desinstalar después de probar

---

## Comandos Rápidos

### Generar Todo de Una Vez:

```bash
npm run build && npm run build:electron
```

### Limpiar y Generar desde Cero:

```bash
# Limpiar builds anteriores
rmdir /s /q build dist

# Compilar React
npm run build

# Generar instalador
npm run build:electron
```

### Solo Generar Instalador (si ya tienes build):

```bash
npm run build:electron
```

---

## Estructura del Instalador Generado

El instalador NSIS incluye:

✅ **Aplicación Electron completa**
✅ **Archivos React compilados**
✅ **Node modules necesarios** (ya compilados)
✅ **Configuración de Supabase**
✅ **Icono personalizado**
✅ **Asistente de instalación Windows**
✅ **Acceso directo en escritorio** (opcional)
✅ **Entrada en menú de inicio** (opcional)
✅ **Desinstalador** (para desinstalar fácilmente)

---

## Características del Instalador

### Durante la Instalación:
- ✅ Asistente paso a paso en español
- ✅ Opción para elegir directorio de instalación
- ✅ Opción para crear acceso directo en escritorio
- ✅ Opción para crear entrada en menú de inicio
- ✅ Barra de progreso durante la instalación
- ✅ Información sobre la aplicación

### Después de la Instalación:
- ✅ Aplicación ejecutable en el directorio elegido
- ✅ Acceso directo en escritorio (si se eligió)
- ✅ Entrada en menú de inicio (si se eligió)
- ✅ Desinstalador en Panel de Control

---

## Tamaño del Instalador

**Tamaño estimado**: 150-250 MB

**Incluye**:
- Electron runtime (~100 MB)
- Node.js dependencies (~50-100 MB)
- Aplicación React compilada (~10-20 MB)
- Otros archivos (~10-30 MB)

**Nota**: El tamaño es normal para aplicaciones Electron. Es similar a otras aplicaciones de escritorio modernas.

---

## Distribución del Instalador

### Opciones de Entrega:

1. **Por USB**:
   - Copiar `dist/Aserradero-App-1.0.0-Setup.exe` a USB
   - Entregar USB al cliente

2. **Por Internet**:
   - Subir a Google Drive / Dropbox / OneDrive
   - Compartir enlace con el cliente
   - El cliente descarga e instala

3. **Por Correo Electrónico**:
   - Si el archivo es < 25 MB (probablemente no)
   - Como enlace de descarga si es más grande

4. **Instalación Remota**:
   - Si tienes acceso remoto a las PCs del cliente
   - Puedes instalar directamente

### Carpeta de Distribución Recomendada:

```
Distribucion_Aserradero_App/
├── Aserradero-App-1.0.0-Setup.exe
├── README_INSTALACION.txt
├── MANUAL_USUARIO.pdf (opcional)
└── Configuracion_Supabase.txt (con credenciales)
```

---

## Troubleshooting

### Error: "No se puede encontrar el módulo"

**Solución**: Ejecutar `npm install` antes de generar el instalador

### Error: "Icono no encontrado"

**Solución**: Verificar que `build/icon.ico` existe. Si no, copiarlo desde la raíz:
```bash
copy icono.ico build\icon.ico
```

### Instalador muy grande (>300MB)

**Solución**: Normal. Considerar:
- Usar dependencias más ligeras (a futuro)
- Excluir dependencias innecesarias en `package.json`

### La app no se conecta a Supabase después de instalar

**Solución**: Verificar que las credenciales en `src/config/supabase.js` sean correctas

### Error al ejecutar el instalador

**Solución**: 
- Verificar que sea Windows 10 o superior
- Ejecutar como administrador si es necesario
- Verificar espacio en disco (necesita ~500 MB libres)

---

## Próximos Pasos Después de Generar el Instalador

1. ✅ **Probar el instalador** en una PC limpia
2. ✅ **Verificar que la app funcione** correctamente
3. ✅ **Probar todas las funcionalidades** principales
4. ✅ **Verificar la conexión a Supabase**
5. ✅ **Documentar problemas** encontrados
6. ✅ **Preparar carpeta de distribución** con documentación

---

## Lista de Verificación Pre-Instalador

Antes de generar el instalador para distribuir:

- [ ] Iconos en `build/icon.ico` y `build/icon.png`
- [ ] Aplicación probada completamente en desarrollo
- [ ] Todas las funcionalidades funcionan correctamente
- [ ] Credenciales de Supabase correctas
- [ ] Sin errores en la consola
- [ ] Documentación del usuario lista
- [ ] README de instalación actualizado

---

## Lista de Verificación Post-Instalador

Después de generar el instalador:

- [ ] Instalador generado correctamente
- [ ] Instalador probado en PC limpia
- [ ] App se ejecuta correctamente
- [ ] Conexión a Supabase funciona
- [ ] Todas las funcionalidades probadas
- [ ] Icono aparece correctamente
- [ ] Acceso directo funciona
- [ ] Desinstalador funciona

---

*Guía creada: Noviembre 2024*
*Versión: 1.0.0*

