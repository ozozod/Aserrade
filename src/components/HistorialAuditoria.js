import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { formatearValorAuditoria, getNombreCampo } from '../utils/formatoAuditoria';
import { formatearMoneda, formatearCantidadDecimal } from '../utils/formatoMoneda';

function HistorialAuditoria({ tabla, titulo, onClose }) {
  const { theme } = useTheme();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [registrosExpandidos, setRegistrosExpandidos] = useState(new Set());

  useEffect(() => {
    cargarRegistros();
  }, [tabla]);

  const cargarRegistros = async () => {
    setLoading(true);
    try {
      if (window.electronAPI && window.electronAPI.mysql && window.electronAPI.mysql.getAuditoria) {
        const data = await window.electronAPI.mysql.getAuditoria({ 
          limit: 200, 
          offset: 0,
          tabla_afectada: tabla 
        });
        // Filtrar por tabla si se especificó (por si acaso)
        const filtrados = tabla 
          ? (data || []).filter(r => (r.tabla_afectada === tabla || r.tabla === tabla))
          : (data || []);
        setRegistros(filtrados);
      } else {
        console.error('electronAPI.mysql.getAuditoria no disponible');
      }
    } catch (error) {
      console.error('Error cargando auditoría:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAccionColor = (accion) => {
    const accionUpper = accion?.toUpperCase();
    const colores = {
      'CREATE': '#28a745',
      'CREAR': '#28a745',
      'UPDATE': '#ffc107',
      'EDITAR': '#ffc107',
      'MODIFICAR': '#ffc107',
      'DELETE': '#dc3545',
      'ELIMINAR': '#dc3545',
      'LOGIN': '#17a2b8',
      'LOGOUT': '#6c757d'
    };
    return colores[accionUpper] || colores[accion] || '#667eea';
  };

  const getAccionTexto = (accion) => {
    const accionLower = accion?.toLowerCase();
    const textos = {
      'create': '➕ Creó',
      'crear': '➕ Creó',
      'update': '✏️ Modificó',
      'editar': '✏️ Modificó',
      'modificar': '✏️ Modificó',
      'delete': '🗑️ Eliminó',
      'eliminar': '🗑️ Eliminó',
      'login': '🔐 Inició sesión',
      'logout': '🚪 Cerró sesión'
    };
    return textos[accionLower] || textos[accion] || accion;
  };

  const toggleExpandir = (registroId) => {
    setRegistrosExpandidos(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(registroId)) {
        nuevo.delete(registroId);
      } else {
        nuevo.add(registroId);
      }
      return nuevo;
    });
  };

  // Función para formatear datos numéricos recursivamente
  const formatearDatosParaMostrar = (datos) => {
    if (!datos || typeof datos !== 'object') return datos;
    const formateados = Array.isArray(datos) ? [] : {};
    
    for (const [key, value] of Object.entries(datos)) {
      if (key === 'articulos' && Array.isArray(value)) {
        formateados[key] = value.map(art => ({
          ...art,
          cantidad: formatearCantidadDecimal(art.cantidad),
          precio_unitario: `$${formatearMoneda(art.precio_unitario || 0)}`,
          precio_total: `$${formatearMoneda(art.precio_total || 0)}`
        }));
      } else if (typeof value === 'number') {
        if (key.includes('precio') || key.includes('monto') || key.includes('total')) {
          formateados[key] = `$${formatearMoneda(value)}`;
        } else if (key.includes('cantidad')) {
          formateados[key] = formatearCantidadDecimal(value);
        } else {
          formateados[key] = value;
        }
      } else if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
        const numValor = parseFloat(value.replace(/\./g, '').replace(',', '.'));
        if (!isNaN(numValor)) {
          if (key.includes('precio') || key.includes('monto') || key.includes('total')) {
            formateados[key] = `$${formatearMoneda(numValor)}`;
          } else if (key.includes('cantidad')) {
            formateados[key] = formatearCantidadDecimal(numValor);
          } else {
            formateados[key] = value;
          }
        } else {
          formateados[key] = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        formateados[key] = formatearDatosParaMostrar(value);
      } else {
        formateados[key] = value;
      }
    }
    return formateados;
  };

  // Función para renderizar datos eliminados/creados
  const renderizarDatosEliminados = (datos, theme) => {
    if (!datos || typeof datos !== 'object') {
      return <div style={{ color: theme === 'dark' ? '#999' : '#666' }}>No hay datos disponibles</div>;
    }
    
    const datosFormateados = formatearDatosParaMostrar(datos);
    
    // Si es un remito (tiene articulos), mostrar de forma especial
    if (datosFormateados.articulos && Array.isArray(datosFormateados.articulos)) {
      return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            {datosFormateados.numero && (
              <div>
                <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Número:</strong>
                <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>#{datosFormateados.numero}</div>
              </div>
            )}
            {datosFormateados.fecha && (
              <div>
                <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Fecha:</strong>
                <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                  {new Date(datosFormateados.fecha).toLocaleDateString('es-AR')}
                </div>
              </div>
            )}
            {datosFormateados.cliente_nombre && (
              <div>
                <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Cliente:</strong>
                <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333', fontWeight: 'bold' }}>
                  {datosFormateados.cliente_nombre}
                </div>
              </div>
            )}
            {datosFormateados.precio_total !== undefined && (
              <div>
                <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Total:</strong>
                <div style={{ marginTop: '5px', color: theme === 'dark' ? '#51cf66' : '#28a745', fontSize: '18px', fontWeight: 'bold' }}>
                  {typeof datosFormateados.precio_total === 'string' ? datosFormateados.precio_total : `$${formatearMoneda(datosFormateados.precio_total || 0)}`}
                </div>
              </div>
            )}
            {datosFormateados.estado_pago && (
              <div>
                <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Estado:</strong>
                <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{datosFormateados.estado_pago}</div>
              </div>
            )}
            {datosFormateados.observaciones && (
              <div style={{ gridColumn: '1 / -1' }}>
                <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Observaciones:</strong>
                <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{datosFormateados.observaciones}</div>
              </div>
            )}
          </div>
          <div style={{ marginTop: '20px' }}>
            <h5 style={{ margin: '0 0 15px 0', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>Artículos:</h5>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: theme === 'dark' ? '#1a1a2e' : '#e9ecef', borderBottom: `2px solid ${theme === 'dark' ? '#444' : '#ddd'}` }}>
                  <th style={{ textAlign: 'left', padding: '10px', color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Artículo</th>
                  <th style={{ textAlign: 'right', padding: '10px', color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Cantidad</th>
                  <th style={{ textAlign: 'right', padding: '10px', color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Precio Unit.</th>
                  <th style={{ textAlign: 'right', padding: '10px', color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {datosFormateados.articulos.map((art, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd' }` }}>
                    <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{art.articulo_nombre || '-'}</td>
                    <td style={{ textAlign: 'right', padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                      {typeof art.cantidad === 'string' ? art.cantidad : formatearCantidadDecimal(art.cantidad || 0)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                      {typeof art.precio_unitario === 'string' ? art.precio_unitario : `$${formatearMoneda(art.precio_unitario || 0)}`}
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333', fontWeight: 'bold' }}>
                      {typeof art.precio_total === 'string' ? art.precio_total : `$${formatearMoneda(art.precio_total || 0)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}`, backgroundColor: theme === 'dark' ? '#252525' : '#e9ecef' }}>
                  <td colSpan="3" style={{ textAlign: 'right', padding: '15px', color: theme === 'dark' ? '#e0e0e0' : '#333', fontWeight: 'bold', fontSize: '15px' }}>
                    TOTAL:
                  </td>
                  <td style={{ textAlign: 'right', padding: '15px', color: theme === 'dark' ? '#51cf66' : '#28a745', fontWeight: 'bold', fontSize: '16px' }}>
                    {(() => {
                      const total = datosFormateados.articulos.reduce((sum, art) => {
                        const precioTotal = typeof art.precio_total === 'string' 
                          ? parseFloat(String(art.precio_total).replace(/\./g, '').replace(',', '.').replace('$', '').trim()) 
                          : (art.precio_total || 0);
                        return sum + precioTotal;
                      }, 0);
                      return `$${formatearMoneda(total)}`;
                    })()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      );
    }
    
    // Si es un pago, mostrar de forma especial
    if (datosFormateados.monto !== undefined || datosFormateados.remito_id !== undefined) {
      return (
        <div style={{ 
          backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
          padding: '15px',
          borderRadius: '5px',
          border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {datosFormateados.fecha && (
              <div>
                <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Fecha:</strong>
                <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{datosFormateados.fecha}</div>
              </div>
            )}
            {datosFormateados.monto !== undefined && (
              <div>
                <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Monto:</strong>
                <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333', fontSize: '16px', fontWeight: 'bold' }}>
                  {typeof datosFormateados.monto === 'string' ? datosFormateados.monto : `$${formatearMoneda(datosFormateados.monto || 0)}`}
                </div>
              </div>
            )}
            {datosFormateados.remito_id && (
              <div>
                <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Remito:</strong>
                <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>#{datosFormateados.remito_id}</div>
              </div>
            )}
            {datosFormateados.es_cheque !== undefined && (
              <div>
                <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Tipo:</strong>
                <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                  {datosFormateados.es_cheque ? '✓ Cheque' : 'Efectivo'}
                </div>
              </div>
            )}
            {datosFormateados.observaciones && (() => {
              // Parsear observaciones para extraer REMITOS_DETALLE si existe
              const obs = String(datosFormateados.observaciones);
              const partes = obs.split(' | REMITOS_DETALLE:');
              const textoObservaciones = partes[0] || obs;
              let remitosDetalle = null;
              
              if (partes.length > 1) {
                try {
                  remitosDetalle = JSON.parse(partes[1]);
                } catch (e) {
                  console.warn('Error parseando REMITOS_DETALLE:', e);
                }
              }
              
              return (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Observaciones:</strong>
                  {textoObservaciones && textoObservaciones.trim() !== '' && (
                    <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                      {textoObservaciones}
                    </div>
                  )}
                  {remitosDetalle && Array.isArray(remitosDetalle) && remitosDetalle.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                      <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff', fontSize: '13px' }}>
                        Remitos Asociados:
                      </strong>
                      <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ backgroundColor: theme === 'dark' ? '#1a1a2e' : '#e9ecef', borderBottom: `2px solid ${theme === 'dark' ? '#444' : '#ddd'}` }}>
                            <th style={{ textAlign: 'left', padding: '8px', color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Remito</th>
                            <th style={{ textAlign: 'right', padding: '8px', color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {remitosDetalle.map((remito, idx) => (
                            <tr key={idx} style={{ borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}` }}>
                              <td style={{ padding: '8px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                                #{remito.remito_numero || remito.remito_id || '-'}
                              </td>
                              <td style={{ textAlign: 'right', padding: '8px', color: theme === 'dark' ? '#e0e0e0' : '#333', fontWeight: 'bold' }}>
                                {typeof remito.monto === 'string' ? remito.monto : `$${formatearMoneda(remito.monto || 0)}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}`, backgroundColor: theme === 'dark' ? '#252525' : '#e9ecef' }}>
                            <td style={{ textAlign: 'right', padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333', fontWeight: 'bold' }}>
                              TOTAL:
                            </td>
                            <td style={{ textAlign: 'right', padding: '10px', color: theme === 'dark' ? '#51cf66' : '#28a745', fontWeight: 'bold' }}>
                              {(() => {
                                const total = remitosDetalle.reduce((sum, r) => sum + (parseFloat(r.monto) || 0), 0);
                                return `$${formatearMoneda(total)}`;
                              })()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      );
    }
    
    // Para otros tipos de datos, mostrar en formato tabla
    return (
      <div style={{ 
        backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
        padding: '15px',
        borderRadius: '5px',
        border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {Object.entries(datosFormateados).map(([key, value]) => {
            if (key === 'articulos' || Array.isArray(value)) return null;
            const nombreCampo = getNombreCampo(key);
            return (
              <div key={key}>
                <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>{nombreCampo}:</strong>
                <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                  {formatearValorAuditoria(key, value, theme)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Filtrar registros
  const registrosFiltrados = registros.filter(r => {
    // Filtro por usuario
    if (filtroUsuario && !r.usuario_nombre?.toLowerCase().includes(filtroUsuario.toLowerCase())) {
      return false;
    }
    // Filtro por búsqueda en descripción
    if (filtroBusqueda && !r.descripcion?.toLowerCase().includes(filtroBusqueda.toLowerCase())) {
      return false;
    }
    // Filtro por fecha desde
    if (filtroFechaDesde) {
      const fechaRegistro = new Date(r.created_at);
      const fechaDesde = new Date(filtroFechaDesde);
      if (fechaRegistro < fechaDesde) return false;
    }
    // Filtro por fecha hasta
    if (filtroFechaHasta) {
      const fechaRegistro = new Date(r.created_at);
      const fechaHasta = new Date(filtroFechaHasta + 'T23:59:59');
      if (fechaRegistro > fechaHasta) return false;
    }
    return true;
  });

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
    backgroundColor: theme === 'dark' ? '#3a3a3a' : '#fff',
    color: theme === 'dark' ? '#e0e0e0' : '#333',
    fontSize: '13px'
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
        borderRadius: '16px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '85vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: theme === 'dark' 
            ? 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)'
            : 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)'
        }}>
          <div>
            <h2 style={{ margin: 0, color: 'white', fontSize: '20px' }}>
              📋 Historial - {titulo}
            </h2>
            <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              {registrosFiltrados.length} registros encontrados
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
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

        {/* Filtros */}
        <div style={{
          padding: '15px 20px',
          borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}`,
          backgroundColor: theme === 'dark' ? '#1a1a2e' : '#f8f9fa',
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div>
            <label style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', display: 'block', marginBottom: '4px' }}>
              Buscar
            </label>
            <input
              type="text"
              placeholder="Buscar en descripción..."
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              style={{ ...inputStyle, width: '180px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', display: 'block', marginBottom: '4px' }}>
              Usuario
            </label>
            <input
              type="text"
              placeholder="Filtrar por usuario..."
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              style={{ ...inputStyle, width: '140px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', display: 'block', marginBottom: '4px' }}>
              Desde
            </label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', display: 'block', marginBottom: '4px' }}>
              Hasta
            </label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={cargarRegistros}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                marginTop: '18px'
              }}
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div style={{
          padding: '20px',
          overflowY: 'auto',
          maxHeight: 'calc(85vh - 200px)'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: theme === 'dark' ? '#999' : '#666' }}>
              ⏳ Cargando historial...
            </div>
          ) : registrosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: theme === 'dark' ? '#999' : '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📋</div>
              <h3 style={{ margin: 0, color: theme === 'dark' ? '#ccc' : '#555' }}>Sin registros</h3>
              <p>No hay cambios registrados {tabla ? `en ${titulo}` : ''}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {registrosFiltrados.map((registro) => (
                <div
                  key={registro.id}
                  style={{
                    backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f8f9fa',
                    borderRadius: '10px',
                    padding: '15px',
                    border: `1px solid ${theme === 'dark' ? '#444' : '#eee'}`,
                    borderLeft: `4px solid ${getAccionColor(registro.accion)}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '15px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: getAccionColor(registro.accion),
                          color: 'white'
                        }}>
                          {getAccionTexto(registro.accion)}
                        </span>
                        <span style={{ 
                          color: theme === 'dark' ? '#e0e0e0' : '#333',
                          fontWeight: '500'
                        }}>
                          {registro.descripcion || `Registro #${registro.registro_id}`}
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: theme === 'dark' ? '#999' : '#666',
                        display: 'flex',
                        gap: '20px'
                      }}>
                        <span>👤 {registro.usuario_nombre || 'Sistema'}</span>
                        <span>📅 {formatearFecha(registro.created_at)}</span>
                        {registro.tabla_afectada && !tabla && (
                          <span>📁 {registro.tabla_afectada}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Mostrar cambios si hay datos */}
                  {(() => {
                    // Parsear datos
                    let datosAnt = null;
                    let datosNuevo = null;
                    try {
                      if (registro.datos_anteriores) {
                        datosAnt = typeof registro.datos_anteriores === 'string' 
                          ? JSON.parse(registro.datos_anteriores) 
                          : registro.datos_anteriores;
                      }
                      if (registro.datos_nuevos) {
                        datosNuevo = typeof registro.datos_nuevos === 'string' 
                          ? JSON.parse(registro.datos_nuevos) 
                          : registro.datos_nuevos;
                      }
                    } catch (e) {
                      console.error('Error parseando datos:', e);
                    }
                    
                    // Detectar tipo de acción
                    const accion = registro.accion || '';
                    const esDelete = accion === 'DELETE' || accion === 'eliminar';
                    const esInsert = accion === 'INSERT' || accion === 'crear';
                    const esUpdate = accion === 'UPDATE' || accion === 'editar';
                    
                    // Verificar si hay datos para mostrar
                    const tieneDatos = (esDelete && datosAnt) || (esInsert && datosNuevo) || (esUpdate && datosAnt && datosNuevo);
                    const estaExpandido = registrosExpandidos.has(registro.id);
                    
                    if (!tieneDatos) return null;
                    
                    return (
                      <div style={{ marginTop: '15px' }}>
                        <button
                          onClick={() => toggleExpandir(registro.id)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f0f0f0',
                            color: theme === 'dark' ? '#e0e0e0' : '#333',
                            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            justifyContent: 'space-between'
                          }}
                        >
                          <span>
                            {estaExpandido ? '▼' : '▶'} {esDelete ? 'Ver detalles del registro eliminado' : esInsert ? 'Ver detalles del registro creado' : 'Ver cambios realizados'}
                          </span>
                        </button>
                        
                        {estaExpandido && (
                          <div style={{ 
                            marginTop: '10px',
                            padding: '15px',
                            backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                            borderRadius: '8px',
                            fontSize: '13px',
                            border: `1px solid ${theme === 'dark' ? '#444' : '#e0e0e0'}`
                          }}>
                            {/* Para DELETE, mostrar datos eliminados */}
                            {esDelete && datosAnt && (
                              <>
                                <div style={{ 
                                  color: theme === 'dark' ? '#dc3545' : '#dc3545',
                                  fontWeight: 'bold',
                                  marginBottom: '15px',
                                  fontSize: '14px'
                                }}>
                                  📄 Detalle Completo del Registro Eliminado:
                                </div>
                                {renderizarDatosEliminados(datosAnt, theme)}
                              </>
                            )}
                            
                            {/* Para INSERT, mostrar datos creados */}
                            {esInsert && datosNuevo && (
                              <>
                                <div style={{ 
                                  color: theme === 'dark' ? '#28a745' : '#28a745',
                                  fontWeight: 'bold',
                                  marginBottom: '15px',
                                  fontSize: '14px'
                                }}>
                                  📝 Detalle Completo del Registro Creado:
                                </div>
                                {renderizarDatosEliminados(datosNuevo, theme)}
                              </>
                            )}
                            
                            {/* Para UPDATE, mostrar cambios */}
                            {esUpdate && datosAnt && datosNuevo && (() => {
                              // Detectar cambios específicos
                              const cambios = [];
                              Object.keys(datosNuevo).forEach(key => {
                                if (key !== 'articulos' && datosAnt[key] !== datosNuevo[key]) {
                                  const ant = datosAnt[key] !== null && datosAnt[key] !== undefined ? String(datosAnt[key]) : 'N/A';
                                  const nuevo = datosNuevo[key] !== null && datosNuevo[key] !== undefined ? String(datosNuevo[key]) : 'N/A';
                                  cambios.push({ campo: key, anterior: ant, nuevo: nuevo });
                                }
                              });
                              
                              // Comparar artículos
                              if (datosAnt.articulos && datosNuevo.articulos) {
                                datosNuevo.articulos.forEach((artNuevo, idx) => {
                                  const artAnt = datosAnt.articulos[idx];
                                  if (artAnt) {
                                    if (artAnt.precio_unitario !== artNuevo.precio_unitario) {
                                      cambios.push({ 
                                        campo: `Artículo ${idx + 1} - Precio`, 
                                        anterior: String(artAnt.precio_unitario || 0), 
                                        nuevo: String(artNuevo.precio_unitario || 0) 
                                      });
                                    }
                                    if (artAnt.cantidad !== artNuevo.cantidad) {
                                      cambios.push({ 
                                        campo: `Artículo ${idx + 1} - Cantidad`, 
                                        anterior: String(artAnt.cantidad || 0), 
                                        nuevo: String(artNuevo.cantidad || 0) 
                                      });
                                    }
                                    if (artAnt.articulo_nombre !== artNuevo.articulo_nombre) {
                                      cambios.push({ 
                                        campo: `Artículo ${idx + 1} - Nombre`, 
                                        anterior: String(artAnt.articulo_nombre || ''), 
                                        nuevo: String(artNuevo.articulo_nombre || '') 
                                      });
                                    }
                                  }
                                });
                              }
                              
                              return (
                                <>
                                  <div style={{ 
                                    color: theme === 'dark' ? '#5dade2' : '#0066cc',
                                    fontWeight: 'bold',
                                    marginBottom: '12px',
                                    fontSize: '14px'
                                  }}>
                                    🔄 Cambios Realizados:
                                  </div>
                                  {cambios.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {cambios.map((cambio, idx) => (
                                        <div key={idx} style={{
                                          padding: '10px',
                                          backgroundColor: theme === 'dark' ? '#1a1a2e' : '#f0f8ff',
                                          borderRadius: '4px',
                                          border: `1px solid ${theme === 'dark' ? '#444' : '#cce5ff'}`
                                        }}>
                                          <div style={{ 
                                            fontWeight: '600', 
                                            marginBottom: '5px',
                                            color: theme === 'dark' ? '#5dade2' : '#0066cc',
                                            fontSize: '13px'
                                          }}>
                                            {cambio.campo}
                                          </div>
                                          <div style={{ display: 'flex', gap: '15px', fontSize: '12px' }}>
                                            <div style={{ flex: 1 }}>
                                              <span style={{ color: '#dc3545', fontWeight: '500' }}>❌ Antes: </span>
                                              <span style={{ color: theme === 'dark' ? '#999' : '#666' }}>{cambio.anterior}</span>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                              <span style={{ color: '#28a745', fontWeight: '500' }}>✅ Ahora: </span>
                                              <span style={{ color: theme === 'dark' ? '#e0e0e0' : '#333', fontWeight: '500' }}>{cambio.nuevo}</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div style={{ color: theme === 'dark' ? '#999' : '#666', fontSize: '12px', fontStyle: 'italic' }}>
                                      Sin cambios específicos detectados
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistorialAuditoria;
