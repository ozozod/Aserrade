import React, { useState, useEffect } from 'react';
import * as supabaseService from '../services/databaseService';
import { useTheme } from '../context/ThemeContext';
import { formatearMoneda, formatearCantidadDecimal } from '../utils/formatoMoneda';
import { formatearValorAuditoria, getNombreCampo } from '../utils/formatoAuditoria';

// Función para formatear datos antes de mostrarlos (especialmente para DELETE)
const formatearDatosParaMostrar = (datos) => {
  if (!datos || typeof datos !== 'object') return datos;
  
  const formateados = { ...datos };
  
  // Formatear valores numéricos en el objeto principal
  Object.keys(formateados).forEach(key => {
    const valor = formateados[key];
    
    // Si es un número, formatearlo
    if (typeof valor === 'number') {
      if (key.includes('precio') || key.includes('monto')) {
        formateados[key] = `$${formatearMoneda(valor)}`;
      } else if (key.includes('cantidad')) {
        formateados[key] = formatearCantidadDecimal(valor);
      } else {
        formateados[key] = formatearCantidadDecimal(valor);
      }
    }
    
    // Si es string numérico, convertir y formatear
    if (typeof valor === 'string' && valor.trim() !== '') {
      // Limpiar formato y parsear
      const valorLimpio = valor.replace(/\./g, '').replace(',', '.');
      const numValor = parseFloat(valorLimpio);
      if (!isNaN(numValor)) {
        if (key.includes('precio') || key.includes('monto')) {
          formateados[key] = `$${formatearMoneda(numValor)}`;
        } else if (key.includes('cantidad')) {
          formateados[key] = formatearCantidadDecimal(numValor);
        }
      }
    }
    
    // Si es un array de artículos, formatear cada artículo
    if (Array.isArray(valor) && key === 'articulos') {
      formateados[key] = valor.map(art => {
        const artFormateado = { ...art };
        if (typeof art.cantidad === 'number') {
          artFormateado.cantidad = formatearCantidadDecimal(art.cantidad);
        } else if (typeof art.cantidad === 'string') {
          const cantLimpia = String(art.cantidad).replace(/\./g, '').replace(',', '.');
          const cantNum = parseFloat(cantLimpia);
          if (!isNaN(cantNum)) {
            artFormateado.cantidad = formatearCantidadDecimal(cantNum);
          }
        }
        if (typeof art.precio_unitario === 'number') {
          artFormateado.precio_unitario = `$${formatearMoneda(art.precio_unitario)}`;
        } else if (typeof art.precio_unitario === 'string') {
          const precioLimpio = String(art.precio_unitario).replace(/\./g, '').replace(',', '.');
          const precioNum = parseFloat(precioLimpio);
          if (!isNaN(precioNum)) {
            artFormateado.precio_unitario = `$${formatearMoneda(precioNum)}`;
          }
        }
        if (typeof art.precio_total === 'number') {
          artFormateado.precio_total = `$${formatearMoneda(art.precio_total)}`;
        } else if (typeof art.precio_total === 'string') {
          const totalLimpio = String(art.precio_total).replace(/\./g, '').replace(',', '.');
          const totalNum = parseFloat(totalLimpio);
          if (!isNaN(totalNum)) {
            artFormateado.precio_total = `$${formatearMoneda(totalNum)}`;
          }
        }
        return artFormateado;
      });
    }
  });
  
  return formateados;
};

// Función para renderizar datos eliminados de forma detallada y clara
const renderizarDatosEliminados = (datos, theme) => {
  if (!datos) {
    return <div style={{ color: theme === 'dark' ? '#999' : '#666', fontStyle: 'italic' }}>No hay datos disponibles</div>;
  }
  
  // Si es string, intentar parsearlo
  let datosParsed = datos;
  if (typeof datos === 'string') {
    try {
      datosParsed = JSON.parse(datos);
    } catch (e) {
      console.warn('Error parseando datos en renderizarDatosEliminados:', e);
      return <div style={{ color: theme === 'dark' ? '#999' : '#666', fontStyle: 'italic' }}>Error al parsear los datos</div>;
    }
  }
  
  if (!datosParsed || typeof datosParsed !== 'object') {
    return <div style={{ color: theme === 'dark' ? '#999' : '#666', fontStyle: 'italic' }}>No hay datos disponibles</div>;
  }
  
  const datosFormateados = formatearDatosParaMostrar(datosParsed);
  
  // Si es un remito con artículos, mostrar de forma especial
  if (datosFormateados.articulos && Array.isArray(datosFormateados.articulos) && datosFormateados.articulos.length > 0) {
    return (
      <div>
        {/* Información del remito */}
        <div style={{ marginBottom: '20px' }}>
          <h5 style={{ margin: '0 0 15px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit', fontSize: '16px', borderBottom: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}`, paddingBottom: '10px' }}>
            📋 Información del Remito
          </h5>
          <div style={{ 
            backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
            padding: '15px',
            borderRadius: '5px',
            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              {datosFormateados.cliente_nombre && (
                <div>
                  <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Cliente:</strong>
                  <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333', fontSize: '15px', fontWeight: 'bold' }}>
                    {datosFormateados.cliente_nombre}
                  </div>
                </div>
              )}
              {datosFormateados.numero && (
                <div>
                  <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Número de Remito:</strong>
                  <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>#{datosFormateados.numero}</div>
                </div>
              )}
              {datosFormateados.fecha && (
                <div>
                  <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Fecha:</strong>
                  <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{datosFormateados.fecha}</div>
                </div>
              )}
              {datosFormateados.estado_pago && (
                <div>
                  <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Estado de Pago:</strong>
                  <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{datosFormateados.estado_pago}</div>
                </div>
              )}
              {datosFormateados.precio_total !== undefined && (
                <div>
                  <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Total del Remito:</strong>
                  <div style={{ marginTop: '5px', color: theme === 'dark' ? '#51cf66' : '#28a745', fontSize: '18px', fontWeight: 'bold' }}>
                    {typeof datosFormateados.precio_total === 'string' ? datosFormateados.precio_total : `$${formatearMoneda(datosFormateados.precio_total || 0)}`}
                  </div>
                </div>
              )}
              {datosFormateados.monto_pagado !== undefined && (
                <div>
                  <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Monto Pagado:</strong>
                  <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                    {typeof datosFormateados.monto_pagado === 'string' ? datosFormateados.monto_pagado : `$${formatearMoneda(datosFormateados.monto_pagado || 0)}`}
                  </div>
                </div>
              )}
              {datosFormateados.observaciones && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Observaciones:</strong>
                  <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{datosFormateados.observaciones || 'Sin observaciones'}</div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Artículos del remito */}
        <div>
          <h5 style={{ margin: '0 0 15px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit', fontSize: '16px', borderBottom: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}`, paddingBottom: '10px' }}>
            📦 Artículos ({datosFormateados.articulos.length})
          </h5>
          <div style={{ 
            backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
            padding: '15px',
            borderRadius: '5px',
            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}` }}>
                  <th style={{ textAlign: 'left', padding: '10px', color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Artículo</th>
                  <th style={{ textAlign: 'right', padding: '10px', color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Cantidad</th>
                  <th style={{ textAlign: 'right', padding: '10px', color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Precio Unitario</th>
                  <th style={{ textAlign: 'right', padding: '10px', color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {datosFormateados.articulos.map((art, index) => (
                  <tr key={index} style={{ borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}` }}>
                    <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{art.articulo_nombre || 'Sin nombre'}</td>
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
                {datosFormateados.es_cheque 
                  ? (datosFormateados.cheque_rebotado ? '🚫 Cheque Rebotado' : '✓ Cheque')
                  : 'Efectivo'}
              </div>
            </div>
          )}
          {datosFormateados.cheque_rebotado !== undefined && datosFormateados.cheque_rebotado && (
            <div>
              <strong style={{ color: theme === 'dark' ? '#ff6b6b' : '#dc3545' }}>Estado del Cheque:</strong>
              <div style={{ marginTop: '5px', color: theme === 'dark' ? '#ff6b6b' : '#dc3545', fontWeight: 'bold' }}>
                🚫 Rebotado
              </div>
            </div>
          )}
          {datosFormateados.observaciones && (
            <div style={{ gridColumn: '1 / -1' }}>
              <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Observaciones:</strong>
              <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{datosFormateados.observaciones}</div>
            </div>
          )}
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

function Auditoria() {
  const { theme } = useTheme();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina] = useState(50);
  const [filtros, setFiltros] = useState({
    tabla: '',
    accion: '',
    fechaDesde: '',
    fechaHasta: '',
    registroId: '',
    busqueda: ''
  });
  const [registroExpandido, setRegistroExpandido] = useState(null);

  useEffect(() => {
    cargarAuditoria();
  }, [filtros]);

  const cargarAuditoria = async () => {
    setLoading(true);
    try {
      const filtrosAuditoria = {};
      if (filtros.tabla) filtrosAuditoria.tabla = filtros.tabla;
      if (filtros.accion) filtrosAuditoria.accion = filtros.accion;
      if (filtros.registroId) filtrosAuditoria.registro_id = parseInt(filtros.registroId);
      if (filtros.fechaDesde) filtrosAuditoria.fechaDesde = filtros.fechaDesde;
      if (filtros.fechaHasta) filtrosAuditoria.fechaHasta = filtros.fechaHasta;
      filtrosAuditoria.limit = 1000; // Límite alto para obtener todos los registros

      const data = await supabaseService.getAuditoria(filtrosAuditoria);
      setRegistros(data || []);
    } catch (error) {
      console.error('Error cargando auditoría:', error);
      alert('Error al cargar auditoría: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getBadgeColor = (accion) => {
    switch (accion) {
      case 'INSERT':
      case 'crear':
        return theme === 'dark' ? '#28a745' : '#28a745';
      case 'UPDATE':
      case 'editar':
        return theme === 'dark' ? '#ffc107' : '#ffc107';
      case 'DELETE':
      case 'eliminar':
        return theme === 'dark' ? '#dc3545' : '#dc3545';
      default:
        return theme === 'dark' ? '#6c757d' : '#6c757d';
    }
  };
  
  const getBadgeText = (accion) => {
    switch (accion) {
      case 'INSERT':
      case 'crear':
        return 'Creó';
      case 'UPDATE':
      case 'editar':
        return 'Modificó';
      case 'DELETE':
      case 'eliminar':
        return 'Eliminó';
      default:
        return accion;
    }
  };

  const getTablaNombre = (tabla) => {
    const nombres = {
      'clientes': 'Clientes',
      'articulos': 'Artículos',
      'remitos': 'Remitos',
      'pagos': 'Pagos'
    };
    return nombres[tabla] || tabla;
  };

  const toggleExpandir = (id) => {
    const nuevoEstado = registroExpandido === id ? null : id;
    console.log('🔄 [Auditoria] toggleExpandir:', id, '→', nuevoEstado);
    setRegistroExpandido(nuevoEstado);
  };

  // Filtrar registros localmente (ya están filtrados por la API, pero agregamos búsqueda de texto)
  const registrosFiltrados = registros.filter(registro => {
    if (!filtros.busqueda) return true;
    const busquedaLower = filtros.busqueda.toLowerCase();
    const observaciones = (registro.observaciones || registro.descripcion || '').toLowerCase();
    const usuario = (registro.usuario_nombre || registro.usuario || '').toLowerCase();
    return observaciones.includes(busquedaLower) || usuario.includes(busquedaLower);
  });
  const totalPaginas = Math.ceil(registrosFiltrados.length / registrosPorPagina);
  const inicioIndex = (paginaActual - 1) * registrosPorPagina;
  const finIndex = inicioIndex + registrosPorPagina;
  const registrosPaginados = registrosFiltrados.slice(inicioIndex, finIndex);

  return (
    <div>
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>📋 Auditoría de Cambios</h2>
        <p style={{ margin: '10px 0 0 0', color: theme === 'dark' ? '#999' : '#666', fontSize: '14px' }}>
          Registro completo de todos los cambios realizados en la aplicación
        </p>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>🔍 Filtros</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px' 
        }}>
          <div className="form-group">
            <label style={{ fontSize: '13px' }}>Tabla</label>
            <select
              value={filtros.tabla}
              onChange={(e) => {
                setFiltros({ ...filtros, tabla: e.target.value });
                setPaginaActual(1);
              }}
              style={{ 
                width: '100%', 
                padding: '6px',
                backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
              }}
            >
              <option value="">Todas</option>
              <option value="clientes">Clientes</option>
              <option value="articulos">Artículos</option>
              <option value="remitos">Remitos</option>
              <option value="pagos">Pagos</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px' }}>Acción</label>
            <select
              value={filtros.accion}
              onChange={(e) => {
                setFiltros({ ...filtros, accion: e.target.value });
                setPaginaActual(1);
              }}
              style={{ 
                width: '100%', 
                padding: '6px',
                backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
              }}
            >
              <option value="">Todas</option>
              <option value="INSERT">Crear</option>
              <option value="UPDATE">Actualizar</option>
              <option value="DELETE">Eliminar</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px' }}>Buscar</label>
            <input
              type="text"
              value={filtros.busqueda}
              onChange={(e) => {
                setFiltros({ ...filtros, busqueda: e.target.value });
                setPaginaActual(1);
              }}
              placeholder="Buscar en observaciones, usuario..."
              style={{ 
                width: '100%', 
                padding: '6px',
                backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
              }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px' }}>ID Registro</label>
            <input
              type="number"
              value={filtros.registroId}
              onChange={(e) => {
                setFiltros({ ...filtros, registroId: e.target.value });
                setPaginaActual(1);
              }}
              placeholder="ID del registro"
              style={{ 
                width: '100%', 
                padding: '6px',
                backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
              }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px' }}>Fecha Desde</label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => {
                setFiltros({ ...filtros, fechaDesde: e.target.value });
                setPaginaActual(1);
              }}
              style={{ 
                width: '100%', 
                padding: '6px',
                backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
              }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px' }}>Fecha Hasta</label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => {
                setFiltros({ ...filtros, fechaHasta: e.target.value });
                setPaginaActual(1);
              }}
              style={{ 
                width: '100%', 
                padding: '6px',
                backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
              }}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setFiltros({
                  tabla: '',
                  accion: '',
                  fechaDesde: '',
                  fechaHasta: '',
                  registroId: '',
                  busqueda: ''
                });
                setPaginaActual(1);
              }}
              style={{ padding: '6px 15px', width: '100%' }}
            >
              ✕ Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Auditoría */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: theme === 'dark' ? '#999' : '#666' }}>
            Cargando registros de auditoría...
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: theme === 'dark' ? '#999' : '#666' }}>
            No hay registros de auditoría que coincidan con los filtros
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Fecha/Hora</th>
                    <th>Tabla</th>
                    <th>ID Registro</th>
                    <th>Acción</th>
                    <th>Usuario</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosPaginados.map((registro) => {
                                  const estaExpandido = registroExpandido === registro.id;
                    // Verificar cambios usando diferentes nombres de campo posibles (compatibilidad)
                    let cambios = registro.cambios;
                    if (typeof cambios === 'string') {
                      try {
                        cambios = JSON.parse(cambios);
                      } catch (e) {
                        cambios = null;
                      }
                    }
                    
                    // Parsear datos ANTES de cualquier verificación
                    let oldData = registro.datos_anteriores || registro.old_data;
                    if (oldData && typeof oldData === 'string') {
                      try {
                        oldData = JSON.parse(oldData);
                      } catch (e) {
                        console.warn('Error parseando oldData:', e);
                        oldData = null;
                      }
                    }
                    
                    let newData = registro.datos_nuevos || registro.new_data;
                    if (newData && typeof newData === 'string') {
                      try {
                        newData = JSON.parse(newData);
                      } catch (e) {
                        console.warn('Error parseando newData:', e);
                        newData = null;
                      }
                    }
                    
                    // Verificar si oldData o newData tienen contenido válido
                    const tieneOldData = oldData !== null && oldData !== undefined && oldData !== '';
                    const tieneNewData = newData !== null && newData !== undefined && newData !== '';
                    
                    // Para DELETE, SIEMPRE mostrar botón de expandir si hay oldData
                    // Para INSERT, SIEMPRE mostrar botón de expandir si hay newData
                    // Para UPDATE, mostrar si hay cambios o datos
                    const accionRegistro = registro.accion || '';
                    const esDelete = accionRegistro === 'DELETE' || accionRegistro === 'eliminar';
                    const esInsert = accionRegistro === 'INSERT' || accionRegistro === 'crear';
                    const esUpdate = accionRegistro === 'UPDATE' || accionRegistro === 'editar';
                    
                    // SIEMPRE mostrar detalles si es DELETE/INSERT y hay datos
                    const tieneDetalles = 
                      (esDelete && tieneOldData) ||
                      (esInsert && tieneNewData) ||
                      (esUpdate && (cambios || tieneOldData || tieneNewData));
                    
                    // DEBUG: Log para TODOS los registros DELETE (siempre, no solo cuando se renderiza)
                    if (esDelete) {
                      console.log('🔍 [Auditoria Frontend] Registro DELETE detectado:');
                      console.log('- ID:', registro.id);
                      console.log('- Accion:', registro.accion);
                      console.log('- registro.datos_anteriores existe:', !!registro.datos_anteriores);
                      console.log('- registro.datos_anteriores tipo:', typeof registro.datos_anteriores);
                      console.log('- oldData parseado:', oldData);
                      console.log('- oldData tipo:', typeof oldData);
                      console.log('- tieneOldData:', tieneOldData);
                      console.log('- tieneDetalles:', tieneDetalles);
                      if (oldData && typeof oldData === 'object') {
                        console.log('- oldData keys:', Object.keys(oldData));
                        console.log('- Tiene articulos:', !!oldData.articulos);
                        console.log('- Cantidad articulos:', oldData.articulos?.length || 0);
                      } else {
                        console.warn('⚠️ oldData no es un objeto válido:', oldData);
                      }
                    }
                    
                    return (
                      <React.Fragment key={registro.id}>
                        <tr 
                          style={{ cursor: tieneDetalles ? 'pointer' : 'default' }}
                          onClick={() => tieneDetalles && toggleExpandir(registro.id)}
                        >
                          <td style={{ textAlign: 'center' }}>
                            {tieneDetalles && (
                              <button
                                className="btn btn-sm"
                                style={{ 
                                  padding: '2px 6px', 
                                  fontSize: '12px',
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  color: theme === 'dark' ? '#5dade2' : 'inherit'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpandir(registro.id);
                                }}
                              >
                                {estaExpandido ? '▼' : '▶'}
                              </button>
                            )}
                          </td>
                          <td>{formatearFecha(registro.created_at || registro.fecha_hora)}</td>
                          <td><strong>{getTablaNombre(registro.tabla || registro.tabla_afectada)}</strong></td>
                          <td>{registro.registro_id}</td>
                          <td>
                            <span 
                              className="badge"
                              style={{ 
                                backgroundColor: getBadgeColor(registro.accion),
                                color: '#fff'
                              }}
                            >
                              {getBadgeText(registro.accion)}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666' }}>
                            {registro.usuario_nombre || registro.usuario || 'Sistema'}
                          </td>
                          <td>{registro.observaciones || registro.descripcion || '-'}</td>
                        </tr>
                        {(() => {
                          // DEBUG: Verificar condiciones ANTES de renderizar
                          const debeMostrar = estaExpandido && tieneDetalles;
                          if (esDelete) {
                            console.log('🔍 [Auditoria] Verificando renderizado DELETE:');
                            console.log('- Registro ID:', registro.id);
                            console.log('- estaExpandido:', estaExpandido);
                            console.log('- tieneDetalles:', tieneDetalles);
                            console.log('- debeMostrar:', debeMostrar);
                            console.log('- registroExpandido actual:', registroExpandido);
                          }
                          
                          if (!debeMostrar) return null;
                          
                          return (
                            <tr style={{ backgroundColor: theme === 'dark' ? '#333' : '#f9f9f9' }}>
                              <td colSpan="7" style={{ padding: '20px' }}>
                                <div style={{ marginLeft: '20px' }}>
                                  {(() => {
                                    // Parsear datos DENTRO de la función de expansión para asegurar que estén disponibles
                                    let oldDataLocal = registro.datos_anteriores || registro.old_data;
                                    if (oldDataLocal && typeof oldDataLocal === 'string') {
                                      try {
                                        oldDataLocal = JSON.parse(oldDataLocal);
                                      } catch (e) {
                                        console.warn('Error parseando oldDataLocal:', e);
                                        oldDataLocal = null;
                                      }
                                    }
                                    
                                    let newDataLocal = registro.datos_nuevos || registro.new_data;
                                    if (newDataLocal && typeof newDataLocal === 'string') {
                                      try {
                                        newDataLocal = JSON.parse(newDataLocal);
                                      } catch (e) {
                                        console.warn('Error parseando newDataLocal:', e);
                                        newDataLocal = null;
                                      }
                                    }
                                    
                                    console.log('🎨 [Auditoria] EXPANDIENDO REGISTRO:');
                                    console.log('- Registro ID:', registro.id);
                                    console.log('- Accion:', registro.accion);
                                    console.log('- estaExpandido:', estaExpandido);
                                    console.log('- tieneDetalles:', tieneDetalles);
                                    console.log('- oldDataLocal:', oldDataLocal);
                                    console.log('- newDataLocal:', newDataLocal);
                                    
                                    // PRIMERO: Verificar si es DELETE o INSERT para mostrar datos completos
                                    const accion = registro.accion || '';
                                    const esDelete = accion === 'DELETE' || accion === 'eliminar';
                                    const esInsert = accion === 'INSERT' || accion === 'crear';
                                    
                                    console.log('- esDelete:', esDelete);
                                    console.log('- esInsert:', esInsert);
                                    
                                    // Para DELETE, SIEMPRE mostrar oldData si existe
                                    if (esDelete) {
                                      console.log('🎯 [Auditoria] PROCESANDO DELETE');
                                      console.log('- oldDataLocal existe:', !!oldDataLocal);
                                      console.log('- oldDataLocal tipo:', typeof oldDataLocal);
                                      
                                      if (!oldDataLocal) {
                                        console.warn('⚠️ [Auditoria] DELETE pero oldDataLocal es null/undefined');
                                        return (
                                          <div style={{ color: theme === 'dark' ? '#999' : '#666', fontStyle: 'italic', padding: '20px' }}>
                                            No hay datos disponibles del registro eliminado
                                          </div>
                                        );
                                      }
                                      
                                      console.log('✅ [Auditoria] oldDataLocal tiene:', Object.keys(oldDataLocal));
                                      console.log('✅ [Auditoria] Tiene articulos:', !!oldDataLocal.articulos);
                                      if (oldDataLocal.articulos) {
                                        console.log('✅ [Auditoria] Cantidad articulos:', oldDataLocal.articulos.length);
                                      }
                                      
                                      return (
                                        <div style={{ marginBottom: '20px' }}>
                                          <h4 style={{ margin: '0 0 15px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit', fontSize: '18px' }}>
                                            📄 Detalle Completo del Registro Eliminado
                                          </h4>
                                          {renderizarDatosEliminados(oldDataLocal, theme)}
                                        </div>
                                      );
                                    }
                                  
                                  // Para INSERT, SIEMPRE mostrar newData si existe
                                  if (esInsert && newDataLocal) {
                                    return (
                                      <div>
                                        <h4 style={{ margin: '0 0 15px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit', fontSize: '18px' }}>
                                          📝 Detalle Completo del Registro Creado
                                        </h4>
                                        {renderizarDatosEliminados(newDataLocal, theme)}
                                      </div>
                                    );
                                  }
                                  
                                  // Si es DELETE o INSERT pero no hay datos, mostrar mensaje
                                  if (esDelete || esInsert) {
                                    return (
                                      <div style={{ color: theme === 'dark' ? '#999' : '#666', fontStyle: 'italic', padding: '20px' }}>
                                        {esDelete ? 'No hay datos disponibles del registro eliminado' : 'No hay datos disponibles del registro creado'}
                                      </div>
                                    );
                                  }
                                  
                                  // SEGUNDO: Para UPDATE, mostrar cambios si existen
                                  // Parsear cambios si es string
                                  let cambiosParsed = cambios;
                                  if (typeof cambios === 'string') {
                                    try {
                                      cambiosParsed = JSON.parse(cambios);
                                    } catch (e) {
                                      cambiosParsed = null;
                                    }
                                  }
                                  
                                  // Si hay cambios específicos, mostrarlos
                                  if (cambiosParsed && typeof cambiosParsed === 'object' && Object.keys(cambiosParsed).length > 0) {
                                    return (
                                      <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ margin: '0 0 10px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                                          🔄 Campos Modificados ({Object.keys(cambiosParsed).length})
                                        </h4>
                                        <div style={{ 
                                          backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                                          padding: '15px',
                                          borderRadius: '5px',
                                          border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
                                        }}>
                                          {Object.entries(cambiosParsed).map(([campo, valores]) => {
                                            const valorAnterior = valores?.anterior !== undefined ? valores.anterior : (valores?.old !== undefined ? valores.old : valores);
                                            const valorNuevo = valores?.nuevo !== undefined ? valores.nuevo : (valores?.new !== undefined ? valores.new : valores);
                                            const nombreCampo = getNombreCampo(campo);
                                            
                                            return (
                                              <div key={campo} style={{ 
                                                marginBottom: '15px', 
                                                padding: '12px', 
                                                paddingBottom: '15px', 
                                                borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}`,
                                                backgroundColor: theme === 'dark' ? '#252525' : '#f8f9fa',
                                                borderRadius: '5px'
                                              }}>
                                                <div style={{ 
                                                  fontSize: '14px', 
                                                  fontWeight: 'bold',
                                                  color: theme === 'dark' ? '#5dade2' : '#007bff',
                                                  marginBottom: '10px',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '8px'
                                                }}>
                                                  <span>📝</span>
                                                  <span>{nombreCampo}</span>
                                                </div>
                                                <div style={{ marginTop: '8px', fontSize: '13px' }}>
                                                  <div style={{ 
                                                    marginBottom: '8px',
                                                    padding: '8px',
                                                    backgroundColor: theme === 'dark' ? '#2d1f1f' : '#ffe6e6',
                                                    borderRadius: '4px',
                                                    borderLeft: `3px solid ${theme === 'dark' ? '#ff6b6b' : '#dc3545'}`
                                                  }}>
                                                    <div style={{ 
                                                      color: theme === 'dark' ? '#ff6b6b' : '#dc3545', 
                                                      fontWeight: 'bold',
                                                      marginBottom: '5px',
                                                      fontSize: '12px'
                                                    }}>
                                                      ❌ Valor Anterior:
                                                    </div>
                                                    <div style={{ color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                                                      {formatearValorAuditoria(campo, valorAnterior, theme)}
                                                    </div>
                                                  </div>
                                                  <div style={{ 
                                                    padding: '8px',
                                                    backgroundColor: theme === 'dark' ? '#1f2d1f' : '#e6ffe6',
                                                    borderRadius: '4px',
                                                    borderLeft: `3px solid ${theme === 'dark' ? '#51cf66' : '#28a745'}`
                                                  }}>
                                                    <div style={{ 
                                                      color: theme === 'dark' ? '#51cf66' : '#28a745', 
                                                      fontWeight: 'bold',
                                                      marginBottom: '5px',
                                                      fontSize: '12px'
                                                    }}>
                                                      ✅ Valor Nuevo:
                                                    </div>
                                                    <div style={{ color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                                                      {formatearValorAuditoria(campo, valorNuevo, theme)}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  }
                                  
                                  // Si no hay cambios específicos pero hay datos anteriores y nuevos, mostrar solo los campos diferentes
                                  const accionUpdate = registro.accion || '';
                                  if (!cambiosParsed && oldData && newData && (accionUpdate === 'UPDATE' || accionUpdate === 'editar')) {
                                    const cambiosAuto = {};
                                    const camposIgnorar = ['id', 'created_at', 'updated_at', 'fecha_hora'];
                                    
                                    Object.keys(newData).forEach(key => {
                                      // Ignorar campos automáticos
                                      if (camposIgnorar.includes(key)) return;
                                      
                                      // Comparar valores de forma más robusta
                                      const valorAnt = oldData[key] ?? null;
                                      const valorNuevo = newData[key] ?? null;
                                      
                                      // Convertir a JSON para comparar objetos/arrays
                                      const valorAntStr = JSON.stringify(valorAnt);
                                      const valorNuevoStr = JSON.stringify(valorNuevo);
                                      
                                      if (valorAntStr !== valorNuevoStr) {
                                        cambiosAuto[key] = { anterior: valorAnt, nuevo: valorNuevo };
                                      }
                                    });
                                    
                                    if (Object.keys(cambiosAuto).length > 0) {
                                      return (
                                        <div style={{ marginBottom: '20px' }}>
                                          <h4 style={{ margin: '0 0 10px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                                            🔄 Campos Modificados ({Object.keys(cambiosAuto).length})
                                          </h4>
                                          <div style={{ 
                                            backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                                            padding: '15px',
                                            borderRadius: '5px',
                                            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
                                          }}>
                                            {Object.entries(cambiosAuto).map(([campo, valores]) => {
                                              const nombreCampo = getNombreCampo(campo);
                                              
                                              return (
                                                <div key={campo} style={{ 
                                                  marginBottom: '15px', 
                                                  padding: '12px', 
                                                  paddingBottom: '15px', 
                                                  borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}`,
                                                  backgroundColor: theme === 'dark' ? '#252525' : '#f8f9fa',
                                                  borderRadius: '5px'
                                                }}>
                                                  <div style={{ 
                                                    fontSize: '14px', 
                                                    fontWeight: 'bold',
                                                    color: theme === 'dark' ? '#5dade2' : '#007bff',
                                                    marginBottom: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                  }}>
                                                    <span>📝</span>
                                                    <span>{nombreCampo}</span>
                                                  </div>
                                                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                                                    <div style={{ 
                                                      marginBottom: '8px',
                                                      padding: '8px',
                                                      backgroundColor: theme === 'dark' ? '#2d1f1f' : '#ffe6e6',
                                                      borderRadius: '4px',
                                                      borderLeft: `3px solid ${theme === 'dark' ? '#ff6b6b' : '#dc3545'}`
                                                    }}>
                                                      <div style={{ 
                                                        color: theme === 'dark' ? '#ff6b6b' : '#dc3545', 
                                                        fontWeight: 'bold',
                                                        marginBottom: '5px',
                                                        fontSize: '12px'
                                                      }}>
                                                        ❌ Valor Anterior:
                                                      </div>
                                                      <div style={{ color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                                                        {formatearValorAuditoria(campo, valores.anterior, theme)}
                                                      </div>
                                                    </div>
                                                    <div style={{ 
                                                      padding: '8px',
                                                      backgroundColor: theme === 'dark' ? '#1f2d1f' : '#e6ffe6',
                                                      borderRadius: '4px',
                                                      borderLeft: `3px solid ${theme === 'dark' ? '#51cf66' : '#28a745'}`
                                                    }}>
                                                      <div style={{ 
                                                        color: theme === 'dark' ? '#51cf66' : '#28a745', 
                                                        fontWeight: 'bold',
                                                        marginBottom: '5px',
                                                        fontSize: '12px'
                                                      }}>
                                                        ✅ Valor Nuevo:
                                                      </div>
                                                      <div style={{ color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                                                        {formatearValorAuditoria(campo, valores.nuevo, theme)}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    }
                                  }
                                  
                                  // Si llegamos aquí y es UPDATE sin cambios, mostrar mensaje
                                  return (
                                    <div style={{ color: theme === 'dark' ? '#999' : '#666', fontStyle: 'italic' }}>
                                      No hay detalles adicionales disponibles
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>
                          </tr>
                          );
                        })()}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div style={{ 
                marginTop: '20px',
                padding: '10px',
                backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f9f9f9',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px'
              }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                  disabled={paginaActual === 1}
                  style={{ 
                    padding: '5px 15px', 
                    fontSize: '12px',
                    opacity: paginaActual === 1 ? 0.5 : 1
                  }}
                >
                  ← Anterior
                </button>
                <span style={{ color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                  Página {paginaActual} de {totalPaginas} ({registrosFiltrados.length} registros)
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                  disabled={paginaActual === totalPaginas}
                  style={{ 
                    padding: '5px 15px', 
                    fontSize: '12px',
                    opacity: paginaActual === totalPaginas ? 0.5 : 1
                  }}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Auditoria;

