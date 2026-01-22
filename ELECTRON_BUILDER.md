# Guía de Empaquetado para Distribución

## Configuración de Electron Builder

La aplicación está configurada para crear un instalador de Windows usando Electron Builder.

## Requisitos

- Node.js instalado
- Todas las dependencias instaladas (`npm install`)

## Proceso de Empaquetado

### 1. Construir la aplicación React

```bash
npm run build
```

Esto crea una carpeta `build/` con los archivos optimizados de React.

### 2. Crear el instalador

```bash
npm run build:electron
```

Esto generará:
- Un instalador `.exe` en la carpeta `dist/`
- Archivos necesarios para la instalación

## Estructura del Instalador

El instalador permitirá:
- Instalación en la carpeta que el usuario elija
- Creación de acceso directo en el escritorio y menú de inicio
- Desinstalación limpia

## Ubicación de Archivos

Después de la instalación:
- **Ejecutable**: Carpeta de instalación seleccionada
- **Base de datos**: `%APPDATA%\aserradero-app\database\`
- **Configuración**: `%APPDATA%\aserradero-app\`

## Distribución

Para distribuir la aplicación:
1. Empaquetar como se indica arriba
2. Comprimir la carpeta `dist/` o solo el instalador `.exe`
3. El cliente ejecuta el instalador
4. La aplicación se instalará y podrá ejecutarse desde el menú de inicio

## Notas

- La primera vez que se empaqueta puede tardar más (descarga de herramientas)
- Asegurarse de tener espacio en disco suficiente
- El instalador puede requerir permisos de administrador según la configuración

