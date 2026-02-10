import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

function UpdateChecker({ onUpdateComplete }) {
  const { theme } = useTheme();
  const [updateStatus, setUpdateStatus] = useState({
    checking: true,
    message: 'Verificando actualizaciones...',
    progress: 0
  });

  useEffect(() => {
    // Escuchar eventos de actualización desde el proceso principal
    if (window.electronAPI) {
      const handleUpdateStatus = (event, data) => {
        const { event: eventType, data: eventData } = data;
        
        switch (eventType) {
          case 'checking-for-update':
            setUpdateStatus({
              checking: true,
              message: 'Verificando actualizaciones...',
              progress: 0
            });
            break;
            
          case 'update-available':
            setUpdateStatus({
              checking: true,
              message: `Actualización disponible: ${eventData?.version || ''}`,
              progress: 0
            });
            break;
            
          case 'update-not-available':
            setUpdateStatus({
              checking: false,
              message: 'Aplicación actualizada',
              progress: 100
            });
            // Esperar un momento y luego continuar
            setTimeout(() => {
              if (onUpdateComplete) {
                onUpdateComplete();
              }
            }, 1000);
            break;
            
          case 'download-progress':
            const percent = eventData?.percent || 0;
            setUpdateStatus({
              checking: true,
              message: `Descargando actualización: ${percent.toFixed(0)}%`,
              progress: percent
            });
            break;
            
          case 'update-downloaded':
            setUpdateStatus({
              checking: true,
              message: 'Instalando actualización...',
              progress: 100
            });
            // La app se reiniciará automáticamente
            break;
            
          case 'error':
            setUpdateStatus({
              checking: false,
              message: 'Listo',
              progress: 100
            });
            setTimeout(() => {
              if (onUpdateComplete) {
                onUpdateComplete();
              }
            }, 800);
            break;
            
          default:
            break;
        }
      };

      // Timeout de seguridad: si no recibimos ningún evento en 15 segundos, continuar
      let timeout = setTimeout(() => {
        console.warn('Timeout esperando verificación de actualizaciones, continuando...');
        setUpdateStatus({
          checking: false,
          message: 'Aplicación lista',
          progress: 100
        });
        setTimeout(() => {
          if (onUpdateComplete) {
            onUpdateComplete();
          }
        }, 500);
      }, 15000);
      
      // Wrapper para limpiar timeout cuando recibamos respuesta
      const wrappedHandler = (event, data) => {
        clearTimeout(timeout);
        handleUpdateStatus(event, data);
      };
      
      window.electronAPI.onUpdateStatus(wrappedHandler);

      return () => {
        clearTimeout(timeout);
        if (window.electronAPI && window.electronAPI.removeUpdateStatusListener) {
          window.electronAPI.removeUpdateStatusListener(wrappedHandler);
        }
      };
    } else {
      // Si no hay electronAPI, continuar inmediatamente
      setTimeout(() => {
        if (onUpdateComplete) {
          onUpdateComplete();
        }
      }, 1000);
    }
  }, [onUpdateComplete]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        maxWidth: '500px'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px'
        }}>
          🔄
        </div>
        
        <h2 style={{
          color: theme === 'dark' ? '#e0e0e0' : '#333',
          marginBottom: '20px',
          fontSize: '24px'
        }}>
          {updateStatus.message}
        </h2>
        
        {updateStatus.checking && (
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: theme === 'dark' ? '#333' : '#ddd',
            borderRadius: '4px',
            overflow: 'hidden',
            marginTop: '20px'
          }}>
            <div style={{
              width: `${updateStatus.progress}%`,
              height: '100%',
              backgroundColor: '#3498db',
              transition: 'width 0.3s ease',
              borderRadius: '4px'
            }} />
          </div>
        )}
        
        {!updateStatus.checking && (
          <p style={{
            color: theme === 'dark' ? '#999' : '#666',
            marginTop: '20px',
            fontSize: '14px'
          }}>
            Iniciando aplicación...
          </p>
        )}
      </div>
    </div>
  );
}

export default UpdateChecker;
