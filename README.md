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

- ✅ Funciona **offline** (no requiere conexión a internet)
- ✅ Base de datos SQLite local
- ✅ Interfaz simple e intuitiva para usuarios no técnicos
- ✅ Exportación a PDF y Excel
- ✅ Cálculo automático de precios y saldos
- ✅ Gestión completa de cuentas corrientes

## Tecnologías

- **Electron**: Framework para aplicaciones de escritorio
- **React**: Librería para la interfaz de usuario
- **SQLite (better-sqlite3)**: Base de datos local
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
- `Aserradero App-1.0.0-Setup.exe`

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
└── database/            # Base de datos
    └── db.js           # Lógica de base de datos SQLite
```

## Base de Datos

La base de datos SQLite se guarda automáticamente en:
- **Windows**: `%APPDATA%\aserradero-app\database\aserradero.db`
- **macOS**: `~/Library/Application Support/aserradero-app/database/aserradero.db`
- **Linux**: `~/.config/aserradero-app/database/aserradero.db`

### Esquema de Base de Datos

- **clientes**: Información de clientes
- **remitos**: Registro de remitos
- **pagos**: Registro de pagos por remito

## Soporte y Mantenimiento

Para reportar errores o solicitar actualizaciones, contactar al desarrollador.

## Versión

1.0.0 - Versión inicial

