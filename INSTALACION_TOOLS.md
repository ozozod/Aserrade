# Instalación de Herramientas Necesarias

Para que `better-sqlite3` funcione, necesitas instalar Visual Studio Build Tools.

## Opción 1: Instalar Visual Studio Build Tools (Recomendado)

1. Descargar Visual Studio Build Tools desde:
   https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

2. Ejecutar el instalador

3. Seleccionar la carga de trabajo **"Desarrollo para el escritorio con C++"**

4. Instalar

5. Reiniciar la terminal y ejecutar:
   ```bash
   npm install
   ```

## Opción 2: Instalar Visual Studio Community (Alternativa)

1. Descargar Visual Studio Community desde:
   https://visualstudio.microsoft.com/es/vs/community/

2. Durante la instalación, seleccionar:
   - **Desarrollo para el escritorio con C++**

3. Instalar

4. Reiniciar y ejecutar `npm install`

## Después de Instalar

Una vez instalado Visual Studio Build Tools, ejecuta:

```bash
npm install
npm run dev
```

## Nota

Si prefieres evitar instalar estas herramientas, podemos cambiar a una base de datos que no requiera compilación (como sql.js), pero requerirá ajustar el código de la base de datos.

