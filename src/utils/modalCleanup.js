// Solución definitiva para liberar inputs después de cerrar modales en Electron
// Este módulo fuerza la limpieza completa cuando se cierra cualquier modal

export const forzarCierreModalCompleto = () => {
  // SOLUCIÓN DEFINITIVA - Ejecutar limpieza múltiples veces para Electron
  const limpiar = () => {
    try {
      // 1. FORZAR OCULTACIÓN DE OVERLAYS - NO eliminar del DOM (React los gestiona)
      // Solo ocultarlos y deshabilitar pointer-events
      const overlaysPorAtributo = document.querySelectorAll('[data-modal-overlay]');
      overlaysPorAtributo.forEach(overlay => {
        try {
          // Forzar display none y pointer-events none
          if (overlay.style) {
            overlay.style.display = 'none';
            overlay.style.pointerEvents = 'none';
            overlay.style.visibility = 'hidden';
            overlay.style.opacity = '0';
            // Marcar para que no interfiera
            overlay.setAttribute('data-modal-closed', 'true');
          }
        } catch (e) {
          // Ignorar errores
        }
      });
      
      // 2. Buscar overlays por posición fixed y z-index alto - SOLO OCULTAR, NO ELIMINAR
      document.querySelectorAll('div').forEach(div => {
        try {
          const style = window.getComputedStyle(div);
          // Si es un overlay (position fixed, z-index alto, background rgba)
          if (style.position === 'fixed' && 
              parseInt(style.zIndex || '0') >= 1000 &&
              style.backgroundColor.includes('rgba')) {
            // Solo ocultar, NO eliminar (React lo gestiona)
            if (div.style) {
              div.style.display = 'none';
              div.style.pointerEvents = 'none';
              div.style.visibility = 'hidden';
              div.style.opacity = '0';
            }
          }
        } catch (e) {
          // Ignorar errores
        }
      });
      
      // 3. Forzar blur de TODOS los elementos activos
      if (document.activeElement && document.activeElement !== document.body) {
        try {
          document.activeElement.blur();
        } catch (e) {}
      }
      
      // 4. Remover atributos bloqueantes de TODOS los inputs
      document.querySelectorAll('input, textarea, select, button').forEach(element => {
        try {
          // Forzar blur
          if (document.activeElement === element) {
            element.blur();
          }
          // Remover readonly/disabled que puedan estar bloqueando
          if (element.hasAttribute('readonly')) {
            element.removeAttribute('readonly');
          }
          if (element.hasAttribute('disabled') && !element.disabled) {
            element.removeAttribute('disabled');
          }
          // Remover tabIndex negativo
          if (element.hasAttribute('tabindex') && parseInt(element.getAttribute('tabindex')) < 0) {
            element.removeAttribute('tabindex');
          }
          // Forzar que el elemento pueda recibir focus
          if (element instanceof HTMLInputElement || 
              element instanceof HTMLTextAreaElement || 
              element instanceof HTMLSelectElement) {
            element.removeAttribute('tabindex');
          }
        } catch (e) {
          // Ignorar errores individuales
        }
      });
      
      // 5. Forzar focus al body Y luego liberarlo - AGRESIVO
      if (document.body) {
        try {
          // Asegurar pointer-events PRIMERO
          document.body.style.pointerEvents = 'auto';
          document.body.style.userSelect = 'none';
          
          // Blur del body primero
          if (document.body.blur) {
            document.body.blur();
          }
          
          // Focus al body
          if (document.body.focus) {
            document.body.focus();
          }
          
          // Múltiples clicks en body para liberar focus
          if (document.body.click) {
            document.body.click();
            setTimeout(() => {
              document.body.click();
            }, 10);
          }
          
          // Forzar que el body sea el elemento activo
          document.body.setAttribute('tabindex', '-1');
          document.body.focus();
          document.body.removeAttribute('tabindex');
        } catch (e) {
          console.error('Error en limpieza de body:', e);
        }
      }
      
      // 5.5. Forzar que TODOS los inputs puedan recibir focus
      document.querySelectorAll('input, textarea, select').forEach(input => {
        try {
          // Asegurar que el input no tenga tabindex negativo
          if (input.hasAttribute('tabindex')) {
            const tabIndex = parseInt(input.getAttribute('tabindex'));
            if (tabIndex < 0) {
              input.removeAttribute('tabindex');
            }
          }
          // Asegurar pointer-events
          input.style.pointerEvents = 'auto';
          // Remover cualquier estilo bloqueante
          input.style.userSelect = 'text';
        } catch (e) {
          // Ignorar
        }
      });
      
      // 6. Forzar un evento de click en el document para liberar cualquier focus trap
      try {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          buttons: 0
        });
        document.dispatchEvent(clickEvent);
      } catch (e) {
        // Ignorar si falla
      }
      
      // 7. Asegurar que ningún elemento tenga focus
      setTimeout(() => {
        if (document.activeElement && document.activeElement !== document.body) {
          try {
            document.activeElement.blur();
            document.body.focus();
          } catch (e) {}
        }
      }, 10);
      
    } catch (error) {
      console.error('Error en limpieza completa de modal:', error);
    }
  };
  
  // Ejecutar INMEDIATAMENTE
  limpiar();
  
  // Ejecutar después de requestAnimationFrame (para que React termine de renderizar)
  requestAnimationFrame(() => {
    limpiar();
    // Ejecutar otra vez después de un pequeño delay
    setTimeout(() => {
      limpiar();
      // Ejecutar otra vez para asegurar
      requestAnimationFrame(() => {
        limpiar();
      });
    }, 50);
  });
  
  // Ejecutar después de más tiempo para asegurar (múltiples veces)
  setTimeout(() => {
    limpiar();
    requestAnimationFrame(() => {
      limpiar();
    });
  }, 100);
  
  setTimeout(() => {
    limpiar();
  }, 200);
  
  // Última ejecución después de más tiempo
  setTimeout(() => {
    limpiar();
  }, 400);
};

