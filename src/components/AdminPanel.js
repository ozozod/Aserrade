import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getUnresolvedErrors, markErrorAsResolved } from '../services/errorReportingService';
import * as databaseService from '../services/databaseService';
import { alertNoBloqueante, confirmNoBloqueante } from '../utils/notificaciones';

function AdminPanel({ usuario, onClose }) {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState('errores');
  const [errores, setErrores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAuditoria, setLoadingAuditoria] = useState(false);
  const [filtrosAuditoria, setFiltrosAuditoria] = useState({
    tabla: '',
    usuarioId: '',
    accion: '',
    fechaDesde: '',
    fechaHasta: '',
    registroId: ''
  });
  const [auditoriaSeleccionados, setAuditoriaSeleccionados] = useState(new Set());
  
  // Estado para nuevo usuario
  const [showNuevoUsuario, setShowNuevoUsuario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    username: '',
    password: '',
    nombre_completo: '',
    email: '',
    rol: 'usuario'
  });

  useEffect(() => {
    if (activeSection === 'errores') cargarErrores();
    if (activeSection === 'usuarios') cargarUsuarios();
    if (activeSection === 'auditoria') {
      cargarAuditoria();
      if (usuarios.length === 0) cargarUsuarios(); // Cargar usuarios para el filtro
    }
  }, [activeSection]);


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

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      if (window.electronAPI && window.electronAPI.invoke) {
        const data = await window.electronAPI.invoke('mysql:getUsuarios');
        setUsuarios(data || []);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarAuditoria = async () => {
    setLoadingAuditoria(true);
    setAuditoriaSeleccionados(new Set());
    try {
      if (window.electronAPI && window.electronAPI.invoke) {
        const params = { limit: 2000 };
        if (filtrosAuditoria.tabla) params.tabla = filtrosAuditoria.tabla;
        if (filtrosAuditoria.usuarioId) params.usuario_id = parseInt(filtrosAuditoria.usuarioId, 10);
        if (filtrosAuditoria.accion) params.accion = filtrosAuditoria.accion;
        if (filtrosAuditoria.fechaDesde) params.fechaDesde = filtrosAuditoria.fechaDesde;
        if (filtrosAuditoria.fechaHasta) params.fechaHasta = filtrosAuditoria.fechaHasta;
        if (filtrosAuditoria.registroId) params.registro_id = parseInt(filtrosAuditoria.registroId);
        const data = await window.electronAPI.invoke('mysql:getAuditoria', params);
        setAuditoria(data || []);
      }
    } catch (error) {
      console.error('Error cargando auditoría:', error);
    } finally {
      setLoadingAuditoria(false);
    }
  };

  const handleEliminarAuditoria = async (auditoriaId) => {
    confirmNoBloqueante('¿Estás seguro de eliminar este registro de auditoría?\n\nEsta acción es solo para pruebas y no se puede deshacer.').then(async (confirmado) => {
      if (!confirmado) return;
      
      try {
        if (window.electronAPI && window.electronAPI.mysql && window.electronAPI.mysql.deleteAuditoria) {
          await window.electronAPI.mysql.deleteAuditoria(auditoriaId);
          alertNoBloqueante('Registro de auditoría eliminado', 'success');
          cargarAuditoria();
        } else {
          alertNoBloqueante('Servicio no disponible', 'error');
        }
      } catch (error) {
        console.error('Error eliminando auditoría:', error);
        alertNoBloqueante('Error al eliminar auditoría: ' + (error.message || 'Error desconocido'), 'error');
      }
    });
  };

  const toggleAuditoriaSeleccionado = (id) => {
    setAuditoriaSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const seleccionarTodosAuditoria = (checked) => {
    if (checked) setAuditoriaSeleccionados(new Set(auditoria.map(log => log.id)));
    else setAuditoriaSeleccionados(new Set());
  };

  const handleBorrarAuditoriaSeleccionadas = async () => {
    if (auditoriaSeleccionados.size === 0) {
      alertNoBloqueante('Seleccioná al menos un registro', 'warning');
      return;
    }
    const confirmado = await confirmNoBloqueante(
      `¿Eliminar ${auditoriaSeleccionados.size} registro(s) de auditoría?\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmado) return;
    try {
      if (window.electronAPI && window.electronAPI.mysql && window.electronAPI.mysql.deleteAuditoriaBulk) {
        const result = await window.electronAPI.mysql.deleteAuditoriaBulk(Array.from(auditoriaSeleccionados));
        if (result && result.success) {
          alertNoBloqueante(`Eliminados ${result.deleted || auditoriaSeleccionados.size} registro(s)`, 'success');
          setAuditoriaSeleccionados(new Set());
          cargarAuditoria();
        } else {
          alertNoBloqueante(result?.error || 'Error al eliminar', 'error');
        }
      } else {
        alertNoBloqueante('Servicio no disponible', 'error');
      }
    } catch (error) {
      console.error('Error eliminando auditoría en lote:', error);
      alertNoBloqueante('Error: ' + (error.message || 'Error desconocido'), 'error');
    }
  };

  const handleResolverError = async (errorId) => {
    try {
      await markErrorAsResolved(errorId, usuario.nombre_completo, 'Resuelto desde panel admin');
      setErrores(errores.filter(e => e.id !== errorId));
    } catch (error) {
      console.error('Error resolviendo:', error);
    }
  };

  const handleCrearUsuario = async () => {
    if (!nuevoUsuario.username || !nuevoUsuario.password || !nuevoUsuario.nombre_completo) {
      alertNoBloqueante('Completa todos los campos obligatorios (Usuario, Contraseña y Nombre completo)', 'warning');
      return;
    }
    
    try {
      if (window.electronAPI && window.electronAPI.invoke) {
        await window.electronAPI.invoke('mysql:createUsuario', nuevoUsuario);
        setShowNuevoUsuario(false);
        setNuevoUsuario({ username: '', password: '', nombre_completo: '', email: '', rol: 'usuario' });
        cargarUsuarios();
        alertNoBloqueante('✅ Usuario creado. Deberá cambiar su contraseña en el primer login.', 'success');
      }
    } catch (error) {
      console.error('Error creando usuario:', error);
      alertNoBloqueante('Error al crear usuario: ' + (error.message || 'Error desconocido'), 'error');
    }
  };

  const handleToggleUsuario = async (userId, activo) => {
    try {
      if (window.electronAPI && window.electronAPI.invoke) {
        await window.electronAPI.invoke('mysql:toggleUsuario', { userId, activo: !activo });
        cargarUsuarios();
      }
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      alertNoBloqueante('Error al actualizar usuario: ' + (error.message || 'Error desconocido'), 'error');
    }
  };

  const handleEliminarUsuario = async (userId, nombreUsuario) => {
    confirmNoBloqueante(`¿Estás seguro de que deseas eliminar al usuario "${nombreUsuario}"?\n\nEsta acción no se puede deshacer.`).then(async (confirmado) => {
      if (!confirmado) return;
      
      try {
        if (window.electronAPI && window.electronAPI.invoke) {
          await window.electronAPI.invoke('mysql:deleteUsuario', userId);
          cargarUsuarios();
          alertNoBloqueante('Usuario eliminado exitosamente', 'success');
        }
      } catch (error) {
        console.error('Error eliminando usuario:', error);
        alertNoBloqueante('Error al eliminar usuario: ' + (error.message || 'Error desconocido'), 'error');
      }
    });
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-AR');
  };

  const sectionStyle = (section) => ({
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: activeSection === section 
      ? (theme === 'dark' ? '#667eea' : '#667eea')
      : (theme === 'dark' ? '#3a3a3a' : '#f0f0f0'),
    color: activeSection === section ? 'white' : (theme === 'dark' ? '#ccc' : '#555'),
    cursor: 'pointer',
    fontWeight: activeSection === section ? '600' : '400',
    transition: 'all 0.2s'
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: theme === 'dark' ? '#1a1a2e' : '#fff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '1100px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 25px',
          borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div>
            <h2 style={{ margin: 0, color: 'white', fontSize: '22px' }}>
              ⚙️ Panel de Administración
            </h2>
            <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
              Bienvenido, {usuario.nombre_completo}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Navigation */}
        <div style={{
          padding: '15px 25px',
          borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`,
          display: 'flex',
          gap: '10px',
          backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f8f9fa'
        }}>
          <button style={sectionStyle('errores')} onClick={() => setActiveSection('errores')}>
            🐛 Errores ({errores.length})
          </button>
          <button style={sectionStyle('usuarios')} onClick={() => setActiveSection('usuarios')}>
            👥 Usuarios
          </button>
          <button style={sectionStyle('auditoria')} onClick={() => setActiveSection('auditoria')}>
            📋 Auditoría
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '25px',
          overflowY: 'auto',
          maxHeight: 'calc(90vh - 180px)',
          backgroundColor: theme === 'dark' ? '#1a1a2e' : '#fff'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: theme === 'dark' ? '#999' : '#666' }}>
              ⏳ Cargando...
            </div>
          ) : (
            <>
              {/* SECCIÓN ERRORES */}
              {activeSection === 'errores' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                      Errores Reportados
                    </h3>
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
                  </div>
                  
                  {errores.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: theme === 'dark' ? '#999' : '#666' }}>
                      <div style={{ fontSize: '48px', marginBottom: '15px' }}>✅</div>
                      <p>No hay errores pendientes</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {errores.map((error) => (
                        <div
                          key={error.id}
                          style={{
                            backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff5f5',
                            borderRadius: '8px',
                            padding: '15px',
                            border: `1px solid ${theme === 'dark' ? '#444' : '#ffcccc'}`
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: '#dc3545', fontWeight: '600', marginBottom: '5px' }}>
                                {error.error_type}: {error.error_message?.substring(0, 80)}...
                              </div>
                              <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666' }}>
                                📍 {error.component_name} | 📅 {formatearFecha(error.created_at)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleResolverError(error.id)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ✓ Resolver
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SECCIÓN USUARIOS */}
              {activeSection === 'usuarios' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                      Gestión de Usuarios
                    </h3>
                    <button
                      onClick={() => setShowNuevoUsuario(true)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      ➕ Nuevo Usuario
                    </button>
                  </div>

                  {/* Modal nuevo usuario */}
                  {showNuevoUsuario && (
                    <div style={{
                      backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
                      borderRadius: '10px',
                      padding: '20px',
                      marginBottom: '20px',
                      border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`
                    }}>
                      <h4 style={{ margin: '0 0 15px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                        Crear Nuevo Usuario
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <input
                          type="text"
                          placeholder="Usuario *"
                          value={nuevoUsuario.username}
                          onChange={(e) => setNuevoUsuario({...nuevoUsuario, username: e.target.value})}
                          style={{
                            padding: '10px',
                            borderRadius: '6px',
                            border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                            backgroundColor: theme === 'dark' ? '#3a3a3a' : '#fff',
                            color: theme === 'dark' ? '#e0e0e0' : '#333'
                          }}
                        />
                        <input
                          type="password"
                          placeholder="Contraseña *"
                          value={nuevoUsuario.password}
                          onChange={(e) => setNuevoUsuario({...nuevoUsuario, password: e.target.value})}
                          style={{
                            padding: '10px',
                            borderRadius: '6px',
                            border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                            backgroundColor: theme === 'dark' ? '#3a3a3a' : '#fff',
                            color: theme === 'dark' ? '#e0e0e0' : '#333'
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Nombre completo *"
                          value={nuevoUsuario.nombre_completo}
                          onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre_completo: e.target.value})}
                          style={{
                            padding: '10px',
                            borderRadius: '6px',
                            border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                            backgroundColor: theme === 'dark' ? '#3a3a3a' : '#fff',
                            color: theme === 'dark' ? '#e0e0e0' : '#333'
                          }}
                        />
                        <input
                          type="email"
                          placeholder="Email (opcional)"
                          value={nuevoUsuario.email}
                          onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
                          style={{
                            padding: '10px',
                            borderRadius: '6px',
                            border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                            backgroundColor: theme === 'dark' ? '#3a3a3a' : '#fff',
                            color: theme === 'dark' ? '#e0e0e0' : '#333'
                          }}
                        />
                        <select
                          value={nuevoUsuario.rol}
                          onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}
                          style={{
                            padding: '10px',
                            borderRadius: '6px',
                            border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                            backgroundColor: theme === 'dark' ? '#3a3a3a' : '#fff',
                            color: theme === 'dark' ? '#e0e0e0' : '#333'
                          }}
                        >
                          <option value="usuario">Usuario</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                      <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                        <button
                          onClick={handleCrearUsuario}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          ✓ Crear
                        </button>
                        <button
                          onClick={() => setShowNuevoUsuario(false)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          ✕ Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Lista de usuarios */}
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>Usuario</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>Nombre</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>Rol</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>Último Login</th>
                        <th style={{ padding: '12px', textAlign: 'center', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>Estado</th>
                        <th style={{ padding: '12px', textAlign: 'center', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((u) => (
                        <tr key={u.id} style={{ borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#eee'}` }}>
                          <td style={{ padding: '12px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                            {u.username}
                          </td>
                          <td style={{ padding: '12px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                            {u.nombre_completo}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              backgroundColor: u.rol === 'admin' ? '#667eea' : '#17a2b8',
                              color: 'white'
                            }}>
                              {u.rol === 'admin' ? '👑 Admin' : '👤 Usuario'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: theme === 'dark' ? '#999' : '#666', fontSize: '13px' }}>
                            {formatearFecha(u.ultimo_login)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              backgroundColor: u.activo ? '#28a745' : '#dc3545',
                              color: 'white'
                            }}>
                              {u.activo ? '✓ Activo' : '✕ Inactivo'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleToggleUsuario(u.id, u.activo)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: u.activo ? '#dc3545' : '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                {u.activo ? 'Desactivar' : 'Activar'}
                              </button>
                              <button
                                onClick={() => handleEliminarUsuario(u.id, u.nombre_completo)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                🗑️ Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SECCIÓN AUDITORÍA */}
              {activeSection === 'auditoria' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                      Registro de Auditoría
                    </h3>
                    <button
                      onClick={cargarAuditoria}
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
                  </div>

                  {/* Filtros - solo para admin */}
                  {usuario && usuario.rol === 'admin' && (
                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: theme === 'dark' ? '#252525' : '#f0f0f0', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>🔍 Filtros</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Categoría</label>
                          <select
                            value={filtrosAuditoria.tabla}
                            onChange={e => setFiltrosAuditoria({ ...filtrosAuditoria, tabla: e.target.value })}
                            style={{ width: '100%', padding: '6px', backgroundColor: theme === 'dark' ? '#404040' : '#fff', color: theme === 'dark' ? '#e0e0e0' : 'inherit', border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}` }}
                          >
                            <option value="">Todas</option>
                            <option value="clientes">Clientes</option>
                            <option value="articulos">Artículos</option>
                            <option value="remitos">Remitos</option>
                            <option value="pagos">Pagos</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Usuario (app)</label>
                          <select
                            value={filtrosAuditoria.usuarioId}
                            onChange={e => setFiltrosAuditoria({ ...filtrosAuditoria, usuarioId: e.target.value })}
                            style={{ width: '100%', padding: '6px', backgroundColor: theme === 'dark' ? '#404040' : '#fff', color: theme === 'dark' ? '#e0e0e0' : 'inherit', border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}` }}
                          >
                            <option value="">Todos</option>
                            {usuarios.map(u => (
                              <option key={u.id} value={String(u.id)}>{u.nombre_completo || u.username || 'Usuario ' + u.id}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Acción</label>
                          <select
                            value={filtrosAuditoria.accion}
                            onChange={e => setFiltrosAuditoria({ ...filtrosAuditoria, accion: e.target.value })}
                            style={{ width: '100%', padding: '6px', backgroundColor: theme === 'dark' ? '#404040' : '#fff', color: theme === 'dark' ? '#e0e0e0' : 'inherit', border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}` }}
                          >
                            <option value="">Todas</option>
                            <option value="crear">Crear</option>
                            <option value="editar">Editar</option>
                            <option value="eliminar">Eliminar</option>
                            <option value="INSERT">INSERT</option>
                            <option value="UPDATE">UPDATE</option>
                            <option value="DELETE">DELETE</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Fecha Desde</label>
                          <input type="date" value={filtrosAuditoria.fechaDesde} onChange={e => setFiltrosAuditoria({ ...filtrosAuditoria, fechaDesde: e.target.value })} style={{ width: '100%', padding: '6px', backgroundColor: theme === 'dark' ? '#404040' : '#fff', color: theme === 'dark' ? '#e0e0e0' : 'inherit', border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}` }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Fecha Hasta</label>
                          <input type="date" value={filtrosAuditoria.fechaHasta} onChange={e => setFiltrosAuditoria({ ...filtrosAuditoria, fechaHasta: e.target.value })} style={{ width: '100%', padding: '6px', backgroundColor: theme === 'dark' ? '#404040' : '#fff', color: theme === 'dark' ? '#e0e0e0' : 'inherit', border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}` }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>ID Registro</label>
                          <input type="number" value={filtrosAuditoria.registroId} onChange={e => setFiltrosAuditoria({ ...filtrosAuditoria, registroId: e.target.value })} placeholder="ID" style={{ width: '100%', padding: '6px', backgroundColor: theme === 'dark' ? '#404040' : '#fff', color: theme === 'dark' ? '#e0e0e0' : 'inherit', border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}` }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                          <button onClick={cargarAuditoria} disabled={loadingAuditoria} style={{ padding: '6px 14px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingAuditoria ? 'not-allowed' : 'pointer', opacity: loadingAuditoria ? 0.7 : 1 }}>{loadingAuditoria ? '...' : 'Aplicar'}</button>
                          <button onClick={() => { setFiltrosAuditoria({ tabla: '', usuarioId: '', accion: '', fechaDesde: '', fechaHasta: '', registroId: '' }); }} style={{ padding: '6px 12px', backgroundColor: theme === 'dark' ? '#555' : '#ddd', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Limpiar</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Borrar seleccionadas - solo admin */}
                  {usuario && usuario.rol === 'admin' && auditoriaSeleccionados.size > 0 && (
                    <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={handleBorrarAuditoriaSeleccionadas}
                        style={{ padding: '8px 14px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                      >
                        🗑️ Borrar seleccionadas ({auditoriaSeleccionados.size})
                      </button>
                      <span style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666' }}>Solo para limpiar pruebas</span>
                    </div>
                  )}

                  {usuario && usuario.rol === 'admin' && auditoria.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                        <input type="checkbox" checked={auditoria.every(r => auditoriaSeleccionados.has(r.id))} onChange={e => seleccionarTodosAuditoria(e.target.checked)} />
                        Seleccionar todos
                      </label>
                    </div>
                  )}

                  {loadingAuditoria ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: theme === 'dark' ? '#999' : '#666' }}>
                      <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
                      <p>Cargando...</p>
                    </div>
                  ) : auditoria.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: theme === 'dark' ? '#999' : '#666' }}>
                      <div style={{ fontSize: '48px', marginBottom: '15px' }}>📋</div>
                      <p>No hay registros de auditoría</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {auditoria.map((log) => {
                        // Parsear datos anteriores y nuevos
                        let datosAnteriores = null;
                        let datosNuevos = null;
                        
                        try {
                          if (log.datos_anteriores) {
                            datosAnteriores = typeof log.datos_anteriores === 'string' 
                              ? JSON.parse(log.datos_anteriores) 
                              : log.datos_anteriores;
                          }
                          if (log.datos_nuevos) {
                            datosNuevos = typeof log.datos_nuevos === 'string' 
                              ? JSON.parse(log.datos_nuevos) 
                              : log.datos_nuevos;
                          }
                        } catch (e) {
                          console.error('Error parseando datos de auditoría:', e);
                        }
                        
                        // Detectar cambios específicos
                        const cambiosDetectados = [];
                        if (datosAnteriores && datosNuevos) {
                          // Comparar campos principales
                          Object.keys(datosNuevos).forEach(key => {
                            if (key !== 'articulos' && datosAnteriores[key] !== datosNuevos[key]) {
                              const valorAnt = datosAnteriores[key] || 'N/A';
                              const valorNuevo = datosNuevos[key] || 'N/A';
                              cambiosDetectados.push(`${key}: ${valorAnt} → ${valorNuevo}`);
                            }
                          });
                          
                          // Comparar artículos si existen
                          if (datosAnteriores.articulos && datosNuevos.articulos) {
                            const artsAnt = datosAnteriores.articulos;
                            const artsNuevo = datosNuevos.articulos;
                            artsNuevo.forEach((artNuevo, idx) => {
                              const artAnt = artsAnt[idx];
                              if (artAnt) {
                                if (artAnt.precio_unitario !== artNuevo.precio_unitario) {
                                  cambiosDetectados.push(`Art.${idx + 1} precio: ${artAnt.precio_unitario} → ${artNuevo.precio_unitario}`);
                                }
                                if (artAnt.cantidad !== artNuevo.cantidad) {
                                  cambiosDetectados.push(`Art.${idx + 1} cantidad: ${artAnt.cantidad} → ${artNuevo.cantidad}`);
                                }
                              }
                            });
                          }
                        }
                        
                        return (
                          <div
                            key={log.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '12px',
                              backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
                              borderRadius: '8px',
                              padding: '15px',
                              border: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`
                            }}
                          >
                            {usuario && usuario.rol === 'admin' && (
                              <div style={{ flex: '0 0 24px', paddingTop: '2px' }} onClick={e => e.stopPropagation()}>
                                <input type="checkbox" checked={auditoriaSeleccionados.has(log.id)} onChange={() => toggleAuditoriaSeleccionado(log.id)} title="Seleccionar para borrar" />
                              </div>
                            )}
                            <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: cambiosDetectados.length > 0 ? '10px' : '0' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                  <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    backgroundColor: getAccionColor(log.accion),
                                    color: 'white'
                                  }}>
                                    {log.accion}
                                  </span>
                                  <span style={{ color: theme === 'dark' ? '#e0e0e0' : '#333', fontWeight: '500' }}>
                                    {log.descripcion || `${log.tabla_afectada || 'Registro'} #${log.registro_id}`}
                                  </span>
                                </div>
                                {cambiosDetectados.length > 0 && (
                                  <div style={{ 
                                    marginTop: '8px', 
                                    padding: '8px 12px', 
                                    backgroundColor: theme === 'dark' ? '#1a1a2e' : '#e7f3ff',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                  }}>
                                    <strong style={{ color: theme === 'dark' ? '#5dade2' : '#0066cc' }}>Cambios detectados:</strong>
                                    <ul style={{ margin: '5px 0 0 20px', padding: 0, color: theme === 'dark' ? '#ccc' : '#333' }}>
                                      {cambiosDetectados.map((cambio, idx) => (
                                        <li key={idx} style={{ marginBottom: '3px' }}>{cambio}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', textAlign: 'right' }}>
                                <div>👤 {log.usuario_nombre || 'Sistema'}</div>
                                <div>📅 {formatearFecha(log.created_at)}</div>
                                {/* Botón eliminar solo para admin */}
                                {usuario && usuario.rol === 'admin' && (
                                  <button
                                    onClick={() => handleEliminarAuditoria(log.id)}
                                    style={{
                                      marginTop: '8px',
                                      padding: '4px 8px',
                                      backgroundColor: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '11px'
                                    }}
                                    title="Eliminar registro (solo pruebas)"
                                  >
                                    🗑️ Eliminar
                                  </button>
                                )}
                              </div>
                            </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper para colores de acciones
function getAccionColor(accion) {
  const a = (accion || '').toString();
  const colores = {
    'CREATE': '#28a745', 'crear': '#28a745',
    'UPDATE': '#ffc107', 'editar': '#ffc107',
    'DELETE': '#dc3545', 'eliminar': '#dc3545',
    'LOGIN': '#17a2b8', 'LOGOUT': '#6c757d'
  };
  return colores[a] || '#667eea';
}

export default AdminPanel;
