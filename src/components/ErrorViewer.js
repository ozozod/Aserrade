import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getUnresolvedErrors, markErrorAsResolved } from '../services/errorReportingService';
function ErrorViewer({ onClose }) {
  const { theme } = useTheme();
  const [errores, setErrores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorExpandido, setErrorExpandido] = useState(null);
  const [resolviendo, setResolviendo] = useState(null);

  useEffect(() => {
    cargarErrores();
  }, []);

  const cargarErrores = async () => {
    setLoading(true);
    try {
      const data = await getUnresolvedErrors();
      setErrores(data || []);
    } catch (error) {
      console.error('Error cargando errores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolver = async (errorId) => {
    setResolviendo(errorId);
    try {
      const exito = await markErrorAsResolved(errorId, 'Admin', 'Resuelto desde la app');
      if (exito) {
        setErrores(errores.filter(e => e.id !== errorId));
      }
    } catch (error) {
      console.error('Error resolviendo:', error);
    } finally {
      setResolviendo(null);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-AR');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme === 'dark' ? '#1a1a2e' : '#f8f9fa'
        }}>
          <h2 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
            🐛 Errores Reportados ({errores.length})
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={cargarErrores}
              style={{
                padding: '8px 16px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🔄 Actualizar
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ✕ Cerrar
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '20px',
          overflowY: 'auto',
          maxHeight: 'calc(80vh - 80px)'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: theme === 'dark' ? '#999' : '#666' }}>
              ⏳ Cargando errores...
            </div>
          ) : errores.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px', 
              color: theme === 'dark' ? '#999' : '#666' 
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
              <h3>¡Sin errores pendientes!</h3>
              <p>No hay errores reportados por resolver.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {errores.map((error) => (
                <div
                  key={error.id}
                  style={{
                    backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f8f9fa',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                    overflow: 'hidden'
                  }}
                >
                  {/* Error Header */}
                  <div
                    onClick={() => setErrorExpandido(errorExpandido === error.id ? null : error.id)}
                    style={{
                      padding: '15px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: theme === 'dark' ? '#4a2020' : '#fff3f3',
                      borderBottom: errorExpandido === error.id ? `1px solid ${theme === 'dark' ? '#555' : '#ddd'}` : 'none'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: '#dc3545',
                        marginBottom: '5px'
                      }}>
                        ❌ {error.error_type}: {error.error_message?.substring(0, 100)}
                        {error.error_message?.length > 100 ? '...' : ''}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: theme === 'dark' ? '#999' : '#666',
                        display: 'flex',
                        gap: '20px'
                      }}>
                        <span>📍 {error.component_name}</span>
                        <span>📅 {formatearFecha(error.created_at || error.timestamp)}</span>
                        <span>📱 v{error.app_version}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolver(error.id);
                        }}
                        disabled={resolviendo === error.id}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: resolviendo === error.id ? 'wait' : 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {resolviendo === error.id ? '⏳' : '✓ Resolver'}
                      </button>
                      <span style={{ color: theme === 'dark' ? '#999' : '#666' }}>
                        {errorExpandido === error.id ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>

                  {/* Error Details (expandido) */}
                  {errorExpandido === error.id && (
                    <div style={{ padding: '15px' }}>
                      {/* Stack Trace */}
                      {error.error_stack && (
                        <div style={{ marginBottom: '15px' }}>
                          <strong style={{ color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                            📋 Stack Trace:
                          </strong>
                          <pre style={{
                            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f1f1f1',
                            padding: '10px',
                            borderRadius: '4px',
                            overflow: 'auto',
                            maxHeight: '200px',
                            fontSize: '11px',
                            color: theme === 'dark' ? '#ff6b6b' : '#c0392b',
                            marginTop: '5px'
                          }}>
                            {error.error_stack}
                          </pre>
                        </div>
                      )}

                      {/* Info adicional */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '10px',
                        fontSize: '13px'
                      }}>
                        <div>
                          <strong>🌐 URL:</strong><br />
                          <span style={{ color: theme === 'dark' ? '#999' : '#666' }}>
                            {error.url || '-'}
                          </span>
                        </div>
                        <div>
                          <strong>💻 User Agent:</strong><br />
                          <span style={{ 
                            color: theme === 'dark' ? '#999' : '#666',
                            fontSize: '11px',
                            wordBreak: 'break-all'
                          }}>
                            {error.user_agent?.substring(0, 100) || '-'}
                          </span>
                        </div>
                        {/* Imagen del error si existe */}
                        {error.additional_data?.imagenUrl && (
                          <div style={{ gridColumn: '1 / -1', marginBottom: '15px' }}>
                            <strong style={{ color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                              📷 Imagen del Error:
                            </strong>
                            <div style={{ marginTop: '10px' }}>
                              <img
                                src={error.additional_data.imagenUrl}
                                alt="Imagen del error reportado"
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '400px',
                                  borderRadius: '8px',
                                  border: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                  cursor: 'pointer',
                                  objectFit: 'contain'
                                }}
                                onClick={() => {
                                  // Abrir imagen en modal grande
                                  const modal = document.createElement('div');
                                  modal.style.cssText = `
                                    position: fixed;
                                    top: 0;
                                    left: 0;
                                    right: 0;
                                    bottom: 0;
                                    backgroundColor: rgba(0,0,0,0.9);
                                    display: flex;
                                    justifyContent: center;
                                    alignItems: center;
                                    zIndex: 10000;
                                    cursor: pointer;
                                  `;
                                  const img = document.createElement('img');
                                  img.src = error.additional_data.imagenUrl;
                                  img.style.cssText = `
                                    maxWidth: 95vw;
                                    maxHeight: 95vh;
                                    objectFit: contain;
                                    borderRadius: 8px;
                                  `;
                                  modal.appendChild(img);
                                  modal.onclick = () => document.body.removeChild(modal);
                                  document.body.appendChild(modal);
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const errorDiv = document.createElement('div');
                                  errorDiv.textContent = '❌ Error al cargar la imagen';
                                  errorDiv.style.cssText = `
                                    padding: 20px;
                                    color: ${theme === 'dark' ? '#ff6b6b' : '#c0392b'};
                                    textAlign: center;
                                  `;
                                  e.target.parentNode.appendChild(errorDiv);
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {error.additional_data && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <strong>📊 Datos Adicionales:</strong>
                            <pre style={{
                              backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f1f1f1',
                              padding: '10px',
                              borderRadius: '4px',
                              overflow: 'auto',
                              maxHeight: '150px',
                              fontSize: '11px',
                              marginTop: '5px'
                            }}>
                              {JSON.stringify(error.additional_data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorViewer;

