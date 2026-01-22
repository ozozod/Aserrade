// Utilidad para limpiar focus de manera agresiva después de cerrar modales
// Especialmente importante para Electron donde el focus puede quedar atrapado

export const limpiarFocusAgresivo = () => {
  // Ejecutar múltiples veces para asegurar que funcione en Electron
  const limpiar = () => {
    try {
      // 1. Blur del elemento activo actual
      if (document.activeElement && document.activeElement !== document.body) {
        if (typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }
      }
      
      // 2. Remover atributos bloqueantes de TODOS los inputs
      document.querySelectorAll('input, textarea, select, button').forEach(element => {
        try {
          // Remover readonly si existe
          if (element.hasAttribute('readonly')) {
            element.removeAttribute('readonly');
          }
          // Remover disabled si existe y no está realmente deshabilitado
          if (element.hasAttribute('disabled') && !element.disabled) {
            element.removeAttribute('disabled');
          }
          // Si el elemento tiene focus, forzar blur
          if (document.activeElement === element) {
            if (typeof element.blur === 'function') {
              element.blur();
            }
          }
          // Remover cualquier tabIndex negativo que pueda estar bloqueando
          if (element.hasAttribute('tabindex') && parseInt(element.getAttribute('tabindex')) < 0) {
            element.removeAttribute('tabindex');
          }
        } catch (e) {
          // Ignorar errores individuales
        }
      });
      
      // 3. ELIMINAR OVERLAYS FANTASMA - SOLUCIÓN PARA ELECTRON
      // Los overlays pueden quedar invisibles pero bloqueando clicks (overlay fantasma)
      
      // Buscar overlays por atributo data-modal-overlay
      document.querySelectorAll('[data-modal-overlay]').forEach(overlay => {
        try {
          const style = window.getComputedStyle(overlay);
          // Si el overlay tiene display none, visibility hidden, opacity 0, o pointer-events none
          // pero aún está en el DOM, ES UN FANTASMA y debe eliminarse completamente
          if (style.display === 'none' || 
              style.visibility === 'hidden' || 
              style.opacity === '0' ||
              parseFloat(style.opacity || '1') === 0 ||
              style.pointerEvents === 'none') {
            // ELIMINAR completamente del DOM
            overlay.remove();
          }
        } catch (e) {
          // Si hay error leyendo el estilo, eliminar igual por seguridad
          overlay.remove();
        }
      });
      
      // Buscar overlays por posición fixed y z-index alto que puedan ser fantasmas
      document.querySelectorAll('div[style*="position: fixed"]').forEach(div => {
        try {
          const style = window.getComputedStyle(div);
          // Si es un overlay (position fixed, z-index alto, background rgba)
          if (style.position === 'fixed' && 
              parseInt(style.zIndex || '0') >= 1000 &&
              (style.backgroundColor.includes('rgba') || div.hasAttribute('data-modal-overlay'))) {
            // Si no es visible pero sigue en el DOM, es un fantasma - ELIMINAR
            if (style.display === 'none' || 
                style.visibility === 'hidden' || 
                parseFloat(style.opacity || '1') === 0 ||
                style.pointerEvents === 'none') {
              div.remove();
            }
          }
        } catch (e) {
          // Ignorar errores
        }
      });
      
      // Forzar que TODOS los overlays tengan pointer-events correcto
      document.querySelectorAll('[data-modal-overlay]').forEach(overlay => {
        try {
          const style = window.getComputedStyle(overlay);
          // Si el overlay está visible pero muy transparente, puede ser un fantasma
          if (style.display !== 'none' && parseFloat(style.opacity || '1') < 0.1) {
            overlay.remove();
          }
        } catch (e) {
          // Ignorar
        }
      });
      
      // 4. Forzar focus al body
      if (document.body) {
        if (typeof document.body.focus === 'function') {
          document.body.focus();
        }
        // Forzar click en body para liberar cualquier overlay
        if (typeof document.body.click === 'function') {
          // Crear un evento de click sintético
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          document.body.dispatchEvent(clickEvent);
        }
      }
      
      // 5. Asegurar que el body sea clickeable
      document.body.style.pointerEvents = 'auto';
      
      // 6. Remover cualquier listener de focus que pueda estar bloqueando
      // Esto es difícil de hacer sin saber qué listeners hay, pero podemos
      // asegurar que el body sea el elemento activo
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
        setTimeout(() => {
          document.body.focus();
        }, 10);
      }
      
    } catch (error) {
      console.error('Error en limpieza de focus:', error);
    }
  };
  
  // Ejecutar inmediatamente
  limpiar();
  
  // Ejecutar después de un pequeño delay
  setTimeout(() => {
    limpiar();
  }, 50);
  
  // Ejecutar después de requestAnimationFrame
  requestAnimationFrame(() => {
    setTimeout(() => {
      limpiar();
    }, 50);
  });
  
  // Ejecutar una última vez después de más tiempo
  setTimeout(() => {
    limpiar();
  }, 200);
};

