// Utilidad para mostrar notificaciones no bloqueantes
// Evita que los alerts bloqueen los inputs en Electron

let notificationQueue = [];
let isShowingNotification = false;

export const mostrarNotificacion = (mensaje, tipo = 'info', duracion = 3000) => {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.id = `notification-${Date.now()}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 400px;
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
    pointer-events: auto;
    cursor: pointer;
  `;
  
  // Colores según tipo
  const colores = {
    success: { bg: '#28a745', color: '#fff' },
    error: { bg: '#dc3545', color: '#fff' },
    warning: { bg: '#ffc107', color: '#000' },
    info: { bg: '#17a2b8', color: '#fff' }
  };
  
  const color = colores[tipo] || colores.info;
  notification.style.backgroundColor = color.bg;
  notification.style.color = color.color;
  notification.textContent = mensaje;
  
  // Cerrar al hacer click
  notification.onclick = () => {
    notification.remove();
  };
  
  document.body.appendChild(notification);
  
  // Auto-cerrar después de duracion
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }
  }, duracion);
};

// Wrapper para alert que no bloquea en Electron
export const alertNoBloqueante = (mensaje, tipo = 'info') => {
  // Limpiar focus primero
  const activeElement = document.activeElement;
  if (activeElement && activeElement.blur) {
    try {
      activeElement.blur();
    } catch (e) {
      console.log('Error en blur:', e);
    }
  }
  
  // Mostrar notificación
  mostrarNotificacion(mensaje, tipo, 5000);
  
  // También hacer blur después para asegurar
  setTimeout(() => {
    if (document.activeElement && document.activeElement.blur) {
      try {
        document.activeElement.blur();
      } catch (e) {}
    }
    // Remover atributos bloqueantes
    document.querySelectorAll('input, textarea, select').forEach(input => {
      if (input.hasAttribute('readonly') && !input.readOnly) {
        input.removeAttribute('readonly');
      }
      if (input.hasAttribute('disabled') && !input.disabled) {
        input.removeAttribute('disabled');
      }
    });
    document.body.focus();
  }, 100);
};

// Wrapper para confirm que no bloquea en Electron
// Retorna una Promise que se resuelve con true/false
export const confirmNoBloqueante = (mensaje) => {
  return new Promise((resolve) => {
    // Limpiar focus primero
    const activeElement = document.activeElement;
    if (activeElement && activeElement.blur) {
      try {
        activeElement.blur();
      } catch (e) {}
    }
    
    // Crear modal de confirmación
    const modal = document.createElement('div');
    // Detectar tema oscuro: puede estar en body.className como 'dark-theme' o en localStorage
    const bodyHasDark = document.body.classList.contains('dark-theme') || document.body.classList.contains('dark');
    const htmlHasDark = document.documentElement.classList.contains('dark');
    const localStorageTheme = localStorage.getItem('appTheme');
    const isDark = bodyHasDark || htmlHasDark || localStorageTheme === 'dark';
    
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10001;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: ${isDark ? '#3a3a3a' : 'white'};
      padding: 30px;
      border-radius: 12px;
      max-width: 400px;
      width: 90%;
      box-shadow: ${isDark ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.4)'};
      z-index: 10002;
      color: ${isDark ? '#e0e0e0' : '#333'};
      border: ${isDark ? '1px solid #555' : 'none'};
    `;
    
    dialog.innerHTML = `
      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${isDark ? '#e0e0e0' : '#333'}; line-height: 1.5;">${mensaje}</p>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="confirm-cancel" style="
          padding: 10px 20px; 
          background: ${isDark ? '#555' : '#6c757d'}; 
          color: white; 
          border: none; 
          border-radius: 5px; 
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s;
        " onmouseover="this.style.background='${isDark ? '#666' : '#5a6268'}'" onmouseout="this.style.background='${isDark ? '#555' : '#6c757d'}'">Cancelar</button>
        <button id="confirm-ok" style="
          padding: 10px 20px; 
          background: #dc3545; 
          color: white; 
          border: none; 
          border-radius: 5px; 
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s;
        " onmouseover="this.style.background='#c82333'" onmouseout="this.style.background='#dc3545'">Confirmar</button>
      </div>
    `;
    
    modal.appendChild(dialog);
    document.body.appendChild(modal);
    
    const cleanup = () => {
      modal.remove();
      // Limpiar focus después de cerrar
      setTimeout(() => {
        if (document.activeElement && document.activeElement.blur) {
          try {
            document.activeElement.blur();
          } catch (e) {}
        }
        document.body.focus();
      }, 100);
    };
    
    dialog.querySelector('#confirm-ok').onclick = () => {
      cleanup();
      resolve(true);
    };
    
    dialog.querySelector('#confirm-cancel').onclick = () => {
      cleanup();
      resolve(false);
    };
    
    modal.onclick = (e) => {
      if (e.target === modal) {
        cleanup();
        resolve(false);
      }
    };
  });
};

// Agregar estilos CSS para animaciones
if (!document.getElementById('notification-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Wrapper para prompt que no bloquea en Electron
// Retorna una Promise que se resuelve con el texto ingresado o null si se cancela
export const promptNoBloqueante = (mensaje, valorPorDefecto = '') => {
  return new Promise((resolve) => {
    // Limpiar focus primero
    const activeElement = document.activeElement;
    if (activeElement && activeElement.blur) {
      try {
        activeElement.blur();
      } catch (e) {}
    }
    
    // Crear modal de prompt
    const modal = document.createElement('div');
    // Detectar tema oscuro
    const bodyHasDark = document.body.classList.contains('dark-theme') || document.body.classList.contains('dark');
    const htmlHasDark = document.documentElement.classList.contains('dark');
    const localStorageTheme = localStorage.getItem('appTheme');
    const isDark = bodyHasDark || htmlHasDark || localStorageTheme === 'dark';
    
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10001;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: ${isDark ? '#3a3a3a' : 'white'};
      padding: 30px;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      box-shadow: ${isDark ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.4)'};
      z-index: 10002;
      color: ${isDark ? '#e0e0e0' : '#333'};
      border: ${isDark ? '1px solid #555' : 'none'};
    `;
    
    const inputId = `prompt-input-${Date.now()}`;
    dialog.innerHTML = `
      <p style="margin: 0 0 15px 0; font-size: 16px; color: ${isDark ? '#e0e0e0' : '#333'}; line-height: 1.5;">${mensaje}</p>
      <input 
        id="${inputId}" 
        type="text" 
        value="${valorPorDefecto}"
        style="
          width: 100%;
          padding: 10px;
          margin-bottom: 20px;
          border: 1px solid ${isDark ? '#555' : '#ddd'};
          border-radius: 5px;
          background: ${isDark ? '#2a2a2a' : 'white'};
          color: ${isDark ? '#e0e0e0' : '#333'};
          font-size: 14px;
          box-sizing: border-box;
        "
        autofocus
      />
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="prompt-cancel" style="
          padding: 10px 20px; 
          background: ${isDark ? '#555' : '#6c757d'}; 
          color: white; 
          border: none; 
          border-radius: 5px; 
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s;
        " onmouseover="this.style.background='${isDark ? '#666' : '#5a6268'}'" onmouseout="this.style.background='${isDark ? '#555' : '#6c757d'}'">Cancelar</button>
        <button id="prompt-ok" style="
          padding: 10px 20px; 
          background: #007bff; 
          color: white; 
          border: none; 
          border-radius: 5px; 
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s;
        " onmouseover="this.style.background='#0056b3'" onmouseout="this.style.background='#007bff'">Aceptar</button>
      </div>
    `;
    
    modal.appendChild(dialog);
    document.body.appendChild(modal);
    
    const input = dialog.querySelector(`#${inputId}`);
    input.focus();
    input.select();
    
    const cleanup = () => {
      modal.remove();
      // Limpiar focus después de cerrar
      setTimeout(() => {
        if (document.activeElement && document.activeElement.blur) {
          try {
            document.activeElement.blur();
          } catch (e) {}
        }
        document.body.focus();
      }, 100);
    };
    
    const handleOk = () => {
      const valor = input.value.trim();
      cleanup();
      resolve(valor || null);
    };
    
    const handleCancel = () => {
      cleanup();
      resolve(null);
    };
    
    dialog.querySelector('#prompt-ok').onclick = handleOk;
    dialog.querySelector('#prompt-cancel').onclick = handleCancel;
    
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleOk();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };
    
    modal.onclick = (e) => {
      if (e.target === modal) {
        handleCancel();
      }
    };
  });
};

