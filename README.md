# Aserradero App

Aplicación de escritorio para gestión de remitos y cuentas corrientes de un aserradero que fabrica cajones de verdura.

## Descripción

Esta aplicación permite gestionar:
- **Remitos**: Registro completo de remitos con fecha, cliente, artículo, cantidad, precios y estado de pago
- **Clientes**: Base de datos de clientes con información de contacto
- **Pagos**: Registro de pagos por remito con actualización automática de estado
- **Reportes**: Exportación de cuentas corrientes en PDF y Excel
- **Resumen General**: Vista general de toda la operación

## Características

- ✅ Aplicación de escritorio con **Electron**
- ✅ Base de datos **MySQL** centralizada (Hostinger) accedida vía **IPC** desde el proceso principal
- ✅ Fotos de remitos: compresión en Electron + almacenamiento en MySQL (data URL/base64)
- ✅ Interfaz simple e intuitiva para usuarios no técnicos
- ✅ Exportación a PDF y Excel
- ✅ Cálculo automático de precios y saldos
- ✅ Gestión completa de cuentas corrientes
- ✅ Actualizaciones automáticas (GitHub Releases / `electron-updater`)

## Tecnologías

- **Electron**: Framework para aplicaciones de escritorio
- **React**: Librería para la interfaz de usuario
- **MySQL + mysql2**: Base de datos remota (servicio en `database/mysqlService.js`)
- **jsPDF + jspdf-autotable**: Generación de PDFs
- **xlsx**: Generación de archivos Excel

## Instalación y Desarrollo

### Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn
- Windows 10/11 (para generar el instalador)

### Instalación

1. Clonar o descargar el proyecto
2. Instalar dependencias:

```bash
npm install
```

### Generar Instalador Windows

Para crear el instalador ejecutable (.exe) de la aplicación:

**Opción 1: Script automatizado (Recomendado)**
```bash
# PowerShell
powershell -ExecutionPolicy Bypass -File generar-instalador.ps1

# O simplemente hacer doble clic en:
generar-instalador.bat
```

**Opción 2: Manual**
```bash
# 1. Compilar React
npm run build

# 2. Generar instalador
npm run build:electron
```

El instalador se generará en la carpeta `dist/` con el nombre:
- `Aserradero.App-2.1.3-Setup.exe` (según `version` en `package.json` / NSIS)

**Nota:** El proceso completo puede tardar 10-20 minutos la primera vez.

### Desarrollo

Para ejecutar la aplicación en modo desarrollo:

```bash
npm run dev
```

Esto iniciará tanto el servidor de React como la aplicación Electron.

### Construcción para Producción

Para crear el instalador de Windows:

```bash
npm run build
npm run build:electron
```

El instalador se generará en la carpeta `dist/`.

### Publicar nueva versión (actualizaciones automáticas)

Para que los usuarios reciban la actualización al abrir la app (electron-updater + GitHub Releases):

1. **Subir versión** en `package.json` (ej. `"version": "2.0.6"`).
2. **Build:** `npm run build`
3. **Publicar a GitHub:** `npm run publish:github`  
   Requiere la variable de entorno `GH_TOKEN` con un Personal Access Token de GitHub (permiso `repo`).  
   Esto genera el instalador, crea/actualiza el release (ej. v2.0.6) y sube el .exe y `latest.yml` para que el auto-update funcione.

Guía detallada: ver `docs/GUIA_ACTUALIZACIONES.md`.

## Uso

### Iniciar la Aplicación

Una vez instalada, la aplicación se puede iniciar desde el menú de inicio de Windows o haciendo doble clic en el ejecutable.

### Gestión de Clientes

1. Ir a la sección **Clientes**
2. Clic en **Nuevo Cliente**
3. Completar los datos del cliente
4. Guardar

### Crear un Remito

1. Ir a la sección **Remitos**
2. Clic en **Nuevo Remito**
3. Seleccionar cliente
4. Completar:
   - Fecha
   - Número de remito (opcional)
   - Artículo (tipo de cajón)
   - Cantidad
   - Precio unitario
   - El precio total se calcula automáticamente
5. Seleccionar estado de pago:
   - **Pendiente**: No se ha pagado
   - **Pago Parcial**: Se pagó una parte
   - **Pagado**: Completamente pagado
6. Si es parcial o pagado, indicar el monto pagado
7. Guardar

### Registrar un Pago

1. Ir a la sección **Pagos**
2. Clic en **Nuevo Pago**
3. Seleccionar el remito pendiente
4. Indicar fecha y monto a pagar
5. El estado del remito se actualiza automáticamente

### Exportar Reportes

1. Ir a la sección **Reportes**
2. Seleccionar un cliente
3. Ver la cuenta corriente completa
4. Clic en **Exportar PDF** o **Exportar Excel**

### Ver Resumen General

1. Ir a la sección **Resumen General**
2. Ver estadísticas generales de la operación
3. Exportar si es necesario

## Estructura de Archivos

```
aserradero-app/
├── main.js              # Proceso principal de Electron
├── preload.js           # Script de preload para seguridad
├── package.json         # Configuración del proyecto
├── public/              # Archivos públicos
│   └── index.html
├── src/                 # Código fuente React
│   ├── components/      # Componentes React
│   │   ├── Header.js
│   │   ├── Remitos.js
│   │   ├── Clientes.js
│   │   ├── Pagos.js
│   │   ├── Reportes.js
│   │   └── Resumen.js
│   ├── utils/           # Utilidades
│   │   ├── exportPDF.js
│   │   └── exportExcel.js
│   ├── App.js
│   └── index.js
└── database/            # Base de datos (MySQL en proceso principal)
    └── mysqlService.js  # Pool/conexión + queries MySQL (Hostinger)
```

## Base de Datos

La app usa **MySQL** centralizado. La conexión y consultas viven en el proceso principal de Electron:

- `database/mysqlService.js`
- IPC: `main.js` expone handlers `mysql:*` y `preload.js` los publica como `window.electronAPI.mysql`

> Nota: configurá **dev/prod** con cuidado (host/usuario/base) en `database/mysqlService.js`.

### Esquema de Base de Datos

- **clientes**: Información de clientes
- **remitos**: Registro de remitos
- **pagos**: Registro de pagos por remito

## Soporte y Mantenimiento

Para reportar errores o solicitar actualizaciones, contactar al desarrollador.

## Versión

Ver `package.json` → campo `version` (fuente de verdad para builds/instalador).

