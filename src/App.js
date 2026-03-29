import React, { useState, useEffect } from 'react';
import './App.css';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { DataCacheProvider } from './context/DataCacheContext';
import ErrorBoundary from './components/ErrorBoundary';
import { reportError } from './services/errorReportingService';
import { promptNoBloqueante, alertNoBloqueante } from './utils/notificaciones';
import Header from './components/Header';
import Remitos from './components/Remitos';
import Clientes from './components/Clientes';
import Articulos from './components/Articulos';
import Pagos from './components/Pagos';
import Reportes from './components/Reportes';
import Resumen from './components/Resumen';
import Login from './components/Login';
import HistorialAuditoria from './components/HistorialAuditoria';
import ErrorViewer from './components/ErrorViewer';
import AdminPanel from './components/AdminPanel';
import CambiarPassword from './components/CambiarPassword';
import ModalReportarError from './components/ModalReportarError';
import UpdateChecker from './components/UpdateChecker';
import { useDataCache } from './context/DataCacheContext';

// Contexto para usuario logueado
export const UsuarioContext = React.createContext(null);

function AppContent() {
  const [activeTab, setActiveTab] = useState('remitos');
  const [appReady, setAppReady] = useState(false);
  
  // Estado de autenticación
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  
  // Estado de verificación de actualizaciones
  const [verificandoActualizaciones, setVerificandoActualizaciones] = useState(true);
  
  // Historial
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [historialTabla, setHistorialTabla] = useState(null);
  const [historialTitulo, setHistorialTitulo] = useState('');
  
  // Ver errores
  const [mostrarErrores, setMostrarErrores] = useState(false);
  // Admin usuarios
  const [mostrarAdminPanel, setMostrarAdminPanel] = useState(false);
  // Cambiar contraseña
  const [mostrarCambiarPassword, setMostrarCambiarPassword] = useState(false);
  // Modal reportar error
  const [mostrarModalReportarError, setMostrarModalReportarError] = useState(false);
  
  const { theme } = useTheme();
  const {
    loadClientes: loadClientesCache,
    loadArticulos: loadArticulosCache,
    loadRemitos: loadRemitosCache,
    loadPagos: loadPagosCache
  } = useDataCache();

  // Verificar si hay sesión guardada
  useEffect(() => {
    const restaurarSesion = async () => {
      const sesionGuardada = localStorage.getItem('aserradero_usuario');
      if (sesionGuardada) {
        try {
          const usuario = JSON.parse(sesionGuardada);
          setUsuarioLogueado(usuario);
          
          // Establecer usuario actual en el servicio de base de datos para auditoría
          if (window.electronAPI && window.electronAPI.mysql) {
            try {
              await window.electronAPI.mysql.setUsuarioActual(usuario);
            } catch (error) {
              console.warn('Error estableciendo usuario actual al restaurar sesión:', error);
            }
          }
        } catch (e) {
          console.error('Error parseando sesión guardada:', e);
          localStorage.removeItem('aserradero_usuario');
        }
      }
      setCargandoSesion(false);
    };
    
    restaurarSesion();
  }, []);

  // La app usa MySQL vía Electron (IPC).
  useEffect(() => {
    setAppReady(true);
  }, []);

  // Configurar capturador global de errores
  useEffect(() => {
    const handleError = (event) => {
      const error = event.error || new Error(event.message);
      reportError(error, {
        componentName: 'GlobalErrorHandler',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        source: 'window.onerror',
        usuario: usuarioLogueado?.username
      });
    };

    const handleUnhandledRejection = (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      reportError(error, {
        componentName: 'UnhandledPromiseRejection',
        source: 'unhandledrejection',
        usuario: usuarioLogueado?.username
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [usuarioLogueado]);

  // Recargar datos al cambiar de pestaña
  useEffect(() => {
    if (!appReady || !usuarioLogueado) return;
    
    const recargarDatosPestaña = async () => {
      try {
        switch (activeTab) {
          case 'remitos':
            await Promise.all([
              loadRemitosCache(true),
              loadClientesCache(true),
              loadArticulosCache(true)
            ]);
            break;
          case 'clientes':
            await loadClientesCache(true);
            break;
          case 'articulos':
            await Promise.all([
              loadArticulosCache(true),
              loadClientesCache(true)
            ]);
            break;
          case 'pagos':
            await Promise.all([
              loadPagosCache(true),
              loadRemitosCache(true),
              loadClientesCache(true)
            ]);
            break;
          case 'reportes':
            await loadClientesCache(true);
            break;
          case 'resumen':
            await loadRemitosCache(true);
            break;
          default:
            break;
        }
      } catch (error) {
        console.warn('Error recargando datos al cambiar pestaña:', error);
      }
    };

    recargarDatosPestaña();
  }, [activeTab, appReady, usuarioLogueado]);

  // Recargar datos cuando la ventana recupera el foco
  useEffect(() => {
    if (!appReady || !usuarioLogueado) return;

    const handleFocus = async () => {
      try {
        await Promise.all([
          loadClientesCache(true),
          loadArticulosCache(true),
          loadRemitosCache(true),
          loadPagosCache(true)
        ]);
      } catch (error) {
        console.warn('Error recargando datos al recuperar foco:', error);
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [appReady, usuarioLogueado]);

  // Funciones de autenticación
  const handleLogin = async (usuario) => {
    setUsuarioLogueado(usuario);
    localStorage.setItem('aserradero_usuario', JSON.stringify(usuario));
    
    // Establecer usuario actual en el servicio de base de datos para auditoría
    if (window.electronAPI && window.electronAPI.mysql) {
      try {
        await window.electronAPI.mysql.setUsuarioActual(usuario);
      } catch (error) {
        console.warn('Error estableciendo usuario actual:', error);
      }
    }
  };

  const handleLogout = () => {
    setUsuarioLogueado(null);
    localStorage.removeItem('aserradero_usuario');
  };

  // Función para abrir historial de una tabla específica
  const abrirHistorial = (tabla, titulo) => {
    setHistorialTabla(tabla);
    setHistorialTitulo(titulo);
    setMostrarHistorial(true);
  };

  // Mostrar pantalla de verificación de actualizaciones primero
  if (verificandoActualizaciones) {
    return (
      <UpdateChecker 
        onUpdateComplete={() => {
          setVerificandoActualizaciones(false);
        }} 
      />
    );
  }
  
  // Pantalla de carga inicial
  if (cargandoSesion) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
          : 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>⏳ Cargando...</div>
      </div>
    );
  }

  // Pantalla de login si no hay usuario
  if (!usuarioLogueado) {
    return <Login onLogin={handleLogin} />;
  }

  // Esperar a que termine la inicialización mínima del frontend
  if (!appReady) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '18px' }}>Cargando aplicación...</div>
        <div style={{ fontSize: '14px', opacity: 0.7 }}>Preparando la aplicación...</div>
      </div>
    );
  }

  // Mapeo de pestañas a tablas de auditoría
  const tablasPorPestaña = {
    remitos: { tabla: 'remitos', titulo: 'Remitos' },
    clientes: { tabla: 'clientes', titulo: 'Clientes' },
    articulos: { tabla: 'articulos', titulo: 'Artículos' },
    pagos: { tabla: 'pagos', titulo: 'Pagos' }
  };

  return (
    <UsuarioContext.Provider value={usuarioLogueado}>
    <ErrorBoundary componentName="App">
      <div className={`App ${theme}`}>
          <Header 
            onUsuariosClick={() => setMostrarAdminPanel(true)}
            onCambiarPassword={() => setMostrarCambiarPassword(true)}
            onLogout={handleLogout}
          />

        <div className="main-container">
          <div className="sidebar">
            <nav className="nav-menu">
              <button 
                className={activeTab === 'remitos' ? 'active' : ''}
                onClick={() => setActiveTab('remitos')}
              >
                📋 Remitos
              </button>
              <button 
                className={activeTab === 'clientes' ? 'active' : ''}
                onClick={() => setActiveTab('clientes')}
              >
                👥 Clientes
              </button>
              <button 
                className={activeTab === 'articulos' ? 'active' : ''}
                onClick={() => setActiveTab('articulos')}
              >
                📦 Artículos
              </button>
              <button 
                className={activeTab === 'pagos' ? 'active' : ''}
                onClick={() => setActiveTab('pagos')}
              >
                💰 Pagos
              </button>
              <button 
                className={activeTab === 'reportes' ? 'active' : ''}
                onClick={() => setActiveTab('reportes')}
              >
                📊 Reportes
              </button>
              <button 
                className={activeTab === 'resumen' ? 'active' : ''}
                onClick={() => setActiveTab('resumen')}
              >
                📈 Resumen General
              </button>
            </nav>
          </div>
          <div className="content">
              {/* Botón de Historial integrado - solo para pestañas con auditoría */}
              {tablasPorPestaña[activeTab] && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: '15px',
                  paddingRight: '10px'
                }}>
                  <button
                    onClick={() => abrirHistorial(
                      tablasPorPestaña[activeTab].tabla,
                      tablasPorPestaña[activeTab].titulo
                    )}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: theme === 'dark' ? '#3a3a3a' : '#e8e8e8',
                      color: theme === 'dark' ? '#e0e0e0' : '#333',
                      border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = theme === 'dark' ? '#4a4a4a' : '#d0d0d0';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = theme === 'dark' ? '#3a3a3a' : '#e8e8e8';
                    }}
                  >
                    📋 Historial
                  </button>
                </div>
              )}
              
            <ErrorBoundary componentName="Remitos">
                {activeTab === 'remitos' && (
                  <Remitos 
                    onAbrirHistorial={() => abrirHistorial('remitos', 'Remitos')} 
                  />
                )}
            </ErrorBoundary>
            <ErrorBoundary componentName="Clientes">
                {activeTab === 'clientes' && (
                  <Clientes 
                    onNavigate={setActiveTab}
                    onAbrirHistorial={() => abrirHistorial('clientes', 'Clientes')} 
                  />
                )}
            </ErrorBoundary>
            <ErrorBoundary componentName="Articulos">
                {activeTab === 'articulos' && (
                  <Articulos 
                    onAbrirHistorial={() => abrirHistorial('articulos', 'Artículos')} 
                  />
                )}
            </ErrorBoundary>
            <ErrorBoundary componentName="Pagos">
                {activeTab === 'pagos' && (
                  <Pagos 
                    onAbrirHistorial={() => abrirHistorial('pagos', 'Pagos')} 
                  />
                )}
            </ErrorBoundary>
            <ErrorBoundary componentName="Reportes">
              {activeTab === 'reportes' && <Reportes />}
            </ErrorBoundary>
            <ErrorBoundary componentName="Resumen">
              {activeTab === 'resumen' && <Resumen />}
            </ErrorBoundary>
            </div>
          </div>

          {/* Modal de reportar error */}
          {mostrarModalReportarError && (
            <ModalReportarError onClose={() => setMostrarModalReportarError(false)} />
          )}

          {/* Botones de errores en esquina inferior izquierda */}
          <div style={{
            position: 'fixed',
            bottom: '15px',
            left: '15px',
            display: 'flex',
            gap: '8px',
            zIndex: 1000
          }}>
        <button
          onClick={() => setMostrarModalReportarError(true)}
          style={{
            padding: '6px 12px',
            fontSize: '11px',
                backgroundColor: theme === 'dark' ? 'rgba(100, 100, 100, 0.5)' : 'rgba(200, 200, 200, 0.6)',
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)',
                border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
            borderRadius: '4px',
            cursor: 'pointer',
                transition: 'all 0.2s',
            fontFamily: 'inherit'
          }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(100, 100, 100, 0.7)' : 'rgba(200, 200, 200, 0.8)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(100, 100, 100, 0.5)' : 'rgba(200, 200, 200, 0.6)'}
          title="Reportar un error o problema"
        >
              🐛 Reportar
            </button>
            
            {/* Ver Errores - Solo para Admin */}
            {usuarioLogueado?.rol === 'admin' && (
              <button
                onClick={() => setMostrarErrores(true)}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  backgroundColor: theme === 'dark' ? 'rgba(220, 53, 69, 0.4)' : 'rgba(220, 53, 69, 0.3)',
                  color: theme === 'dark' ? 'rgba(255, 150, 150, 0.9)' : 'rgba(180, 40, 40, 0.9)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(220, 53, 69, 0.4)' : 'rgba(220, 53, 69, 0.4)'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(220, 53, 69, 0.6)' : 'rgba(220, 53, 69, 0.5)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(220, 53, 69, 0.4)' : 'rgba(220, 53, 69, 0.3)'}
                title="Ver errores reportados"
              >
                📋 Ver Errores
        </button>
            )}
          </div>
          
          {/* Modal de historial */}
          {mostrarHistorial && (
            <HistorialAuditoria 
              tabla={historialTabla}
              titulo={historialTitulo}
              onClose={() => setMostrarHistorial(false)} 
            />
          )}
          
          {/* Modal de ver errores */}
          {mostrarErrores && (
            <ErrorViewer onClose={() => setMostrarErrores(false)} />
          )}
          
          {mostrarAdminPanel && (
            <AdminPanel 
              usuario={usuarioLogueado} 
              onClose={() => setMostrarAdminPanel(false)} 
              onLogout={handleLogout}
            />
          )}
          
          {/* Modal de cambiar contraseña */}
          {mostrarCambiarPassword && usuarioLogueado && (
            <CambiarPassword
              usuario={usuarioLogueado}
              onClose={() => setMostrarCambiarPassword(false)}
              onSuccess={() => {
                alertNoBloqueante('✅ Contraseña cambiada exitosamente', 'success');
              }}
            />
          )}
      </div>
    </ErrorBoundary>
    </UsuarioContext.Provider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <DataCacheProvider>
        <AppContent />
      </DataCacheProvider>
    </ThemeProvider>
  );
}

export default App;
