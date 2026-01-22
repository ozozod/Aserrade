# Instrucciones para Iniciar la Aplicación

## ⚠️ IMPORTANTE: Cerrar el Navegador

Cuando ejecutes `npm run dev`, React se abrirá automáticamente en tu navegador en `http://localhost:3000`. 

**DEBES CERRAR ESAS PESTAÑAS DEL NAVEGADOR** porque la aplicación necesita ejecutarse dentro de Electron, no en el navegador normal.

## Pasos Correctos:

1. **Abrir una terminal en la carpeta del proyecto**

2. **Ejecutar:**
   ```bash
   npm run dev
   ```

3. **Esperar a que React compile** (verás un mensaje "Compiled successfully!")

4. **Si se abre el navegador automáticamente, CIERRA esas pestañas**

5. **Electron debería abrirse automáticamente** después de unos segundos

6. **Si Electron no se abre automáticamente**, abre otra terminal y ejecuta:
   ```bash
   npm run electron
   ```

## ¿Por qué?

- React corre en `http://localhost:3000`
- Electron necesita cargar esa URL para mostrar la interfaz
- El **preload script** (que expone `window.electronAPI`) solo funciona cuando la página se carga dentro de Electron
- Si abres `http://localhost:3000` en el navegador normal, el preload NO se ejecuta

## Verificar que Funciona:

Cuando Electron se abra, deberías ver en la consola de Electron (DevTools):
- ✓ "Preload script cargado"
- ✓ "electronAPI expuesto correctamente"
- ✓ "window.electronAPI disponible: true"

Si ves estos mensajes, ¡la aplicación está funcionando correctamente!

## Problema Común:

Si ves el mensaje "electronAPI no está disponible", significa que estás viendo la app en el navegador normal, no en Electron. **Cierra el navegador y espera a que Electron se abra.**

