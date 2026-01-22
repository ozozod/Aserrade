import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { reportError } from '../services/errorReportingService';
import { alertNoBloqueante } from '../utils/notificaciones';
import * as supabaseService from '../services/databaseService';

function ModalReportarError({ onClose }) {
  const { theme } = useTheme();
  const [mensaje, setMensaje] = useState('');
  const [imagen, setImagen] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const handleSeleccionarImagen = async () => {
    try {
      if (window.electronAPI && window.electronAPI.selectImage) {
        const selectedPath = await window.electronAPI.selectImage();
        if (selectedPath) {
          setImagen(selectedPath);
          setImagenPreview(`file://${selectedPath.replace(/\\/g, '/')}`);
        }
      } else {
        // Fallback para navegador
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setImagenPreview(event.target.result);
              setImagen(file);
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      alertNoBloqueante('Error al seleccionar imagen: ' + error.message, 'error');
    }
  };

  const handleEliminarImagen = () => {
    setImagen(null);
    setImagenPreview(null);
  };

  const handleEnviar = async () => {
    if (!mensaje.trim()) {
      alertNoBloqueante('Por favor, describe el error o problema', 'warning');
      return;
    }

    setEnviando(true);
    try {
      let imagenUrl = null;
      
      // Si hay imagen, subirla primero
      if (imagen) {
        try {
          if (typeof imagen === 'string' && window.electronAPI && window.electronAPI.compressImage) {
            // Es una ruta de archivo en Electron
            const imagenComprimida = await window.electronAPI.compressImage(imagen, `error_${Date.now()}`);
            imagenUrl = await supabaseService.uploadRemitoImage(imagenComprimida.buffer, imagenComprimida.filename);
          } else if (imagen instanceof File) {
            // Es un archivo del navegador
            imagenUrl = await supabaseService.uploadRemitoImage(imagen, `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
          } else if (typeof imagen === 'string' && imagen.startsWith('data:image')) {
            // Ya es base64
            imagenUrl = imagen;
          }
        } catch (imgError) {
          console.warn('Error subiendo imagen del error:', imgError);
          // Continuar sin imagen
        }
      }

      // Reportar el error
      await reportError(new Error(mensaje), {
        componentName: 'ManualReport',
        source: 'user_report',
        userMessage: mensaje,
        imagenUrl: imagenUrl
      });

      alertNoBloqueante('✅ Error reportado exitosamente. ¡Gracias por tu ayuda!', 'success');
      onClose();
    } catch (error) {
      console.error('Error al reportar:', error);
      alertNoBloqueante('❌ No se pudo enviar el reporte. Intenta más tarde.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
          borderRadius: '12px',
          padding: '25px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          border: theme === 'dark' ? '1px solid #555' : 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : '#333', fontSize: '20px' }}>
            🐛 Reportar Error o Problema
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              color: theme === 'dark' ? '#999' : '#666',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            color: theme === 'dark' ? '#ccc' : '#555', 
            fontSize: '14px', 
            fontWeight: '500' 
          }}>
            Describe el error o problema: *
          </label>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Ej: Al intentar guardar un remito, aparece un error de conexión..."
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px',
              borderRadius: '8px',
              border: `2px solid ${theme === 'dark' ? '#444' : '#e0e0e0'}`,
              backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f8f9fa',
              color: theme === 'dark' ? '#e0e0e0' : '#333',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            color: theme === 'dark' ? '#ccc' : '#555', 
            fontSize: '14px', 
            fontWeight: '500' 
          }}>
            Imagen (opcional):
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleSeleccionarImagen}
              style={{
                padding: '10px 20px',
                backgroundColor: theme === 'dark' ? '#5dade2' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📷 {imagen ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
            </button>
            {imagen && (
              <button
                onClick={handleEliminarImagen}
                style={{
                  padding: '10px 20px',
                  backgroundColor: theme === 'dark' ? '#dc3545' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🗑️ Eliminar
              </button>
            )}
          </div>
          {imagenPreview && (
            <div style={{ marginTop: '15px' }}>
              <img
                src={imagenPreview}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  borderRadius: '8px',
                  border: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px' }}>
          <button
            onClick={onClose}
            disabled={enviando}
            style={{
              padding: '12px 24px',
              backgroundColor: theme === 'dark' ? '#555' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: enviando ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: enviando ? 0.6 : 1
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleEnviar}
            disabled={enviando || !mensaje.trim()}
            style={{
              padding: '12px 24px',
              backgroundColor: enviando || !mensaje.trim() ? '#999' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: enviando || !mensaje.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {enviando ? '⏳ Enviando...' : '✅ Enviar Reporte'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalReportarError;

