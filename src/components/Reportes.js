import React, { useState, useEffect } from 'react';
import * as supabaseService from '../services/databaseService';
import { exportCuentaCorrientePDF, exportResumenGeneralPDF } from '../utils/exportPDF';
import { exportCuentaCorrienteExcel, exportResumenGeneralExcel } from '../utils/exportExcel';
import { formatearMoneda, formatearMonedaConSimbolo, formatearCantidad, formatearCantidadDecimal, sumarPagosSaldoAFavorAplicado } from '../utils/formatoMoneda';
import { useTheme } from '../context/ThemeContext';
import { useDataCache } from '../context/DataCacheContext';

function Reportes({ clienteIdFromClientes }) {
  const { theme } = useTheme();
  const { 
    clientes: clientesCache,
    loadClientes: loadClientesCache,
    invalidateCache,
    refreshRelated
  } = useDataCache();
  
  const [clientes, setClientes] = useState(clientesCache);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [selectedCliente, setSelectedCliente] = useState('');
  const [cuentaCorriente, setCuentaCorriente] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagenModal, setImagenModal] = useState({ abierto: false, url: null, remitoNumero: null });
  const [hoveredRemitoId, setHoveredRemitoId] = useState(null);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina] = useState(30);
  const [filtrosRemitos, setFiltrosRemitos] = useState({
    fechaDesde: '',
    fechaHasta: '',
    estadoPago: '',
    busqueda: '' // Buscar por número de remito o artículo
  });
  const [articulosCliente, setArticulosCliente] = useState([]);
  const [productosExpandidos, setProductosExpandidos] = useState(new Set()); // Para expandir/contraer productos
  const [remitosExpandidos, setRemitosExpandidos] = useState(new Set()); // Para expandir/contraer remitos
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormato, setExportFormato] = useState('pdf');
  const [exportFechaDesde, setExportFechaDesde] = useState('');
  const [exportFechaHasta, setExportFechaHasta] = useState('');
  const [exportando, setExportando] = useState(false);

  // Sincronizar datos del caché con estado local
  useEffect(() => {
    setClientes(clientesCache);
    setClientesFiltrados(clientesCache);
  }, [clientesCache]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadClientesCache();
        
        // Si viene un clienteId desde localStorage (navegación desde Clientes), cargarlo
        const clienteIdFromStorage = localStorage.getItem('selectedClienteId');
        if (clienteIdFromStorage) {
          setSelectedCliente(clienteIdFromStorage);
          loadCuentaCorriente(clienteIdFromStorage);
          localStorage.removeItem('selectedClienteId'); // Limpiar después de usar
        }
      } catch (error) {
        console.error('Error cargando clientes:', error);
        alert('Error al cargar clientes: ' + error.message);
      }
    };
    loadData();
  }, []);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [filtrosRemitos.fechaDesde, filtrosRemitos.fechaHasta, filtrosRemitos.estadoPago, filtrosRemitos.busqueda]);

  const getEstadoBadge = (estado) => {
    const badges = {
      'Pagado': 'badge-success',
      'Pendiente': 'badge-danger',
      'Pago Parcial': 'badge-warning'
    };
    return badges[estado] || 'badge-secondary';
  };

  const toggleExpandirRemito = (remitoId) => {
    const nuevosExpandidos = new Set(remitosExpandidos);
    if (nuevosExpandidos.has(remitoId)) {
      nuevosExpandidos.delete(remitoId);
    } else {
      nuevosExpandidos.add(remitoId);
    }
    setRemitosExpandidos(nuevosExpandidos);
  };

  const loadCuentaCorriente = async (clienteId, forzarRecarga = false) => {
    if (!clienteId) return;
    
    setLoading(true);
    try {
      
      // Si se solicita forzar recarga, invalidar caché primero
      if (forzarRecarga) {
        await invalidateCache('remitos');
        await invalidateCache('pagos');
        await refreshRelated('remitos');
        await refreshRelated('pagos');
      }
      // Invalidar caché antes de cargar para asegurar datos frescos
      await invalidateCache('pagos');
      await invalidateCache('remitos');
      
      const data = await supabaseService.getCuentaCorriente(clienteId);
      console.log('Cuenta corriente cargada:', {
        clienteId,
        totalRemitos: data.remitos?.length || 0,
        totalPagos: data.pagos?.length || 0,
        pagos: data.pagos?.slice(0, 5) // Primeros 5 pagos para debug
      });
      setCuentaCorriente(data);
      
      // Cargar artículos del cliente
      const articulos = await supabaseService.getArticulos();
      const articulosClienteFiltrados = articulos.filter(a => 
        a.cliente_id === parseInt(clienteId) || (a.cliente_id === null)
      );
      // Si hay artículos específicos del cliente, mostrar solo esos; sino, mostrar universales
      const articulosEspecificos = articulosClienteFiltrados.filter(a => a.cliente_id === parseInt(clienteId));
      const articulosFinales = articulosEspecificos.length > 0 ? articulosEspecificos : articulosClienteFiltrados;
      setArticulosCliente(articulosFinales);
    } catch (error) {
      console.error('Error cargando cuenta corriente:', error);
      alert('Error al cargar cuenta corriente: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  const [exportandoPDF, setExportandoPDF] = useState(false);
  
  // Abrir modal de exportación
  const handleExportPDF = () => {
    if (!selectedCliente) {
      alert('⚠️ Por favor, selecciona un cliente primero');
      return;
    }
    setExportFormato('pdf');
    setExportFechaDesde('');
    setExportFechaHasta('');
    setShowExportModal(true);
  };

  const handleExportExcel = () => {
    if (!selectedCliente) {
      alert('⚠️ Por favor, selecciona un cliente primero');
      return;
    }
    setExportFormato('excel');
    setExportFechaDesde('');
    setExportFechaHasta('');
    setShowExportModal(true);
  };

  // Ejecutar exportación con filtros de fecha
  const ejecutarExportacion = async () => {
    const cliente = clientes.find(c => c.id === parseInt(selectedCliente));
    if (!cliente) {
      alert('⚠️ Cliente no encontrado');
      return;
    }
    
    setExportando(true);
    try {
      // Helpers de fechas (evitan corrimientos por zona horaria)
      const parseDateOnly = (value) => {
        if (!value) return null;
        if (value instanceof Date) {
          return new Date(value.getFullYear(), value.getMonth(), value.getDate());
        }
        if (typeof value === 'string') {
          const fechaStr = value.includes('T') ? value.split('T')[0] : value; // YYYY-MM-DD
          const [y, m, d] = fechaStr.split('-').map(Number);
          if (!y || !m || !d) return null;
          return new Date(y, m - 1, d);
        }
        const d = new Date(value);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      };

      // Cargar cuenta corriente del cliente
      let cuentaCorrienteData = await supabaseService.getCuentaCorriente(parseInt(selectedCliente));
      if (!cuentaCorrienteData.saldoInicial) {
        try {
          const si = await supabaseService.getSaldoInicialCliente(parseInt(selectedCliente));
          if (si) cuentaCorrienteData = { ...cuentaCorrienteData, saldoInicial: si };
        } catch (e) { /* ignorar */ }
      }
      const montoSI = cuentaCorrienteData.saldoInicial ? parseFloat(cuentaCorrienteData.saldoInicial.monto || 0) : 0;
      const sumaSAF = sumarPagosSaldoAFavorAplicado(cuentaCorrienteData.pagos || []);
      const creditoRestante = Math.max(0, montoSI - sumaSAF);
      
      // Cargar artículos del cliente
      const articulos = await supabaseService.getArticulos();
      const articulosDelCliente = articulos.filter(a => a.cliente_id === cliente.id);
      
      // Totales: total_pendiente = remitos - pagado - crédito restante (no saldo inicial completo)
      const totalesGenerales = {
        ...(cuentaCorrienteData.totales || { total_remitos: 0, total_pagado: 0, total_pendiente: 0 }),
        total_pendiente: (cuentaCorrienteData.totales?.total_remitos ?? 0) - (cuentaCorrienteData.totales?.total_pagado ?? 0) - creditoRestante
      };
      
      // Filtrar por fechas si se especificaron
      let cuentaFiltrada = { ...cuentaCorrienteData };
      
      if (exportFechaDesde || exportFechaHasta) {
        const desde = parseDateOnly(exportFechaDesde);
        const hasta = parseDateOnly(exportFechaHasta);
        
        // Filtrar remitos por fecha
        if (cuentaCorrienteData.remitos) {
          cuentaFiltrada.remitos = cuentaCorrienteData.remitos.filter(r => {
            const fechaRemito = parseDateOnly(r.fecha);
            if (!fechaRemito) return false;
            if (desde && fechaRemito < desde) return false;
            if (hasta && fechaRemito > hasta) return false;
            return true;
          });
        }
        
        // Filtrar pagos por fecha
        if (cuentaCorrienteData.pagos) {
          cuentaFiltrada.pagos = cuentaCorrienteData.pagos.filter(p => {
            if (!p.fecha) return false;

            const fechaPago = parseDateOnly(p.fecha);
            if (!fechaPago) return false;
            if (desde && fechaPago < desde) return false;
            if (hasta && fechaPago > hasta) return false;
            return true;
          });
        }
      }
      
      // Mantener totales generales (historial completo) para el resumen financiero
      cuentaFiltrada.totales = totalesGenerales;
      
      // Guardar listas completas para cálculo de saldos en export (DEBE correcto)
      cuentaFiltrada.remitosHistorico = cuentaCorrienteData.remitos || [];
      cuentaFiltrada.pagosHistorico = cuentaCorrienteData.pagos || [];
      
      // Agregar artículos y rango de fechas al objeto
      cuentaFiltrada.articulosCliente = articulosDelCliente;
      cuentaFiltrada.rangoFechas = {
        desde: exportFechaDesde || null,
        hasta: exportFechaHasta || null
      };
      
      if (exportFormato === 'pdf') {
        await exportCuentaCorrientePDF(cliente, cuentaFiltrada);
        alert('✅ PDF generado correctamente');
      } else if (exportFormato === 'excel') {
        await exportCuentaCorrienteExcel(cliente, cuentaFiltrada);
        alert('✅ Excel generado correctamente');
      }
      
      setShowExportModal(false);
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('❌ Error al generar reporte: ' + error.message);
    } finally {
      setExportando(false);
    }
  };

  const cliente = clientes.find(c => c.id === parseInt(selectedCliente));

  // Calcular remitosFiltrados antes del return para usarlo en la paginación
  const calcularRemitosFiltrados = () => {
    if (!cuentaCorriente || !cuentaCorriente.remitos) return [];
    
    let remitosFiltrados = cuentaCorriente.remitos || [];
    
    // Filtro por búsqueda
    if (filtrosRemitos.busqueda) {
      const busqueda = filtrosRemitos.busqueda.toLowerCase();
      remitosFiltrados = remitosFiltrados.filter(remito => {
        const numeroMatch = (remito.numero || '').toLowerCase().includes(busqueda) || 
                          (`#${remito.id}`).includes(busqueda);
        const articulosMatch = (remito.articulos || []).some(a => 
          (a.articulo_nombre || '').toLowerCase().includes(busqueda)
        );
        return numeroMatch || articulosMatch;
      });
    }
    
    // Filtro por fecha desde
    if (filtrosRemitos.fechaDesde) {
      const fechaDesde = new Date(filtrosRemitos.fechaDesde);
      remitosFiltrados = remitosFiltrados.filter(remito => {
        const fechaRemito = new Date(remito.fecha);
        return fechaRemito >= fechaDesde;
      });
    }
    
    // Filtro por fecha hasta
    if (filtrosRemitos.fechaHasta) {
      const fechaHasta = new Date(filtrosRemitos.fechaHasta);
      fechaHasta.setHours(23, 59, 59, 999);
      remitosFiltrados = remitosFiltrados.filter(remito => {
        const fechaRemito = new Date(remito.fecha);
        return fechaRemito <= fechaHasta;
      });
    }
    
    // Filtro por estado de pago
    if (filtrosRemitos.estadoPago) {
      remitosFiltrados = remitosFiltrados.filter(remito => 
        remito.estado_pago === filtrosRemitos.estadoPago
      );
    }
    
    return remitosFiltrados;
  };

  // Calcular remitosFiltrados - siempre debe estar definido
  const remitosFiltrados = calcularRemitosFiltrados();

  return (
    <div>
      {/* Modal de Exportación con filtros de fecha */}
      {showExportModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => !exportando && setShowExportModal(false)}
        >
          <div 
            style={{
              backgroundColor: theme === 'dark' ? '#2d2d2d' : 'white',
              padding: '25px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '450px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {exportFormato === 'pdf' ? '📄' : '📊'} Exportar Reporte
            </h3>
            
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f0f7ff', borderRadius: '8px', fontSize: '13px' }}>
              <strong>💡 Tip:</strong> Dejá las fechas vacías para exportar el historial completo.
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                📅 Desde (opcional):
              </label>
              <input
                type="date"
                value={exportFechaDesde}
                onChange={(e) => setExportFechaDesde(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                  backgroundColor: theme === 'dark' ? '#404040' : 'white',
                  color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                📅 Hasta (opcional):
              </label>
              <input
                type="date"
                value={exportFechaHasta}
                onChange={(e) => setExportFechaHasta(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                  backgroundColor: theme === 'dark' ? '#404040' : 'white',
                  color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                  fontSize: '14px'
                }}
              />
            </div>
            
            {(exportFechaDesde || exportFechaHasta) && (
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: theme === 'dark' ? '#2a3a2a' : '#e8f5e9', borderRadius: '6px', fontSize: '12px' }}>
                📋 Se exportarán remitos y pagos 
                {exportFechaDesde && (() => {
                  // Formatear fecha sin problemas de zona horaria (formato YYYY-MM-DD a DD/MM/YYYY)
                  const [year, month, day] = exportFechaDesde.split('-');
                  return ` desde ${day}/${month}/${year}`;
                })()}
                {exportFechaHasta && (() => {
                  // Formatear fecha sin problemas de zona horaria (formato YYYY-MM-DD a DD/MM/YYYY)
                  const [year, month, day] = exportFechaHasta.split('-');
                  return ` hasta ${day}/${month}/${year}`;
                })()}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                disabled={exportando}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: theme === 'dark' ? '#555' : '#e0e0e0',
                  color: theme === 'dark' ? '#e0e0e0' : '#333',
                  cursor: exportando ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarExportacion}
                disabled={exportando}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: exportFormato === 'pdf' ? '#dc3545' : '#28a745',
                  color: 'white',
                  cursor: exportando ? 'wait' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {exportando ? (
                  <>⏳ Generando...</>
                ) : (
                  <>{exportFormato === 'pdf' ? '📄 Generar PDF' : '📊 Generar Excel'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Reportes - Cuenta Corriente</h2>

      {/* Sección de reporte detallado */}
      <div style={{ 
        marginTop: '20px',
        color: theme === 'dark' ? '#e0e0e0' : 'inherit'
      }}>
        <h3 style={{ color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Reporte Detallado</h3>
        
        <div className="form-group" style={{ marginTop: '20px', position: 'relative', maxWidth: '500px' }}>
          <label>🔍 Buscar y Seleccionar Cliente *</label>
          <input
            type="text"
            value={selectedCliente ? (clientes.find(c => c.id === parseInt(selectedCliente))?.nombre || '') : busquedaCliente}
            onChange={(e) => {
              const valor = e.target.value;
              setBusquedaCliente(valor);
              
              // Solo limpiar selección si el valor está vacío o es diferente al nombre del cliente seleccionado
              if (valor === '') {
                setSelectedCliente('');
                setClientesFiltrados(clientes);
                setMostrarLista(true);
              } else {
                // Si hay un cliente seleccionado y el texto coincide, mantener la selección
                // Si no, limpiar selección y buscar
                const clienteSeleccionadoActual = clientes.find(c => c.id === parseInt(selectedCliente));
                if (!clienteSeleccionadoActual || !clienteSeleccionadoActual.nombre.toLowerCase().includes(valor.toLowerCase())) {
                  setSelectedCliente('');
                }
                
                const filtrados = clientes.filter(cliente => 
                  cliente.nombre.toLowerCase().includes(valor.toLowerCase()) ||
                  (cliente.telefono && cliente.telefono.toLowerCase().includes(valor.toLowerCase())) ||
                  (cliente.direccion && cliente.direccion.toLowerCase().includes(valor.toLowerCase())) ||
                  (cliente.email && cliente.email.toLowerCase().includes(valor.toLowerCase()))
                );
                setClientesFiltrados(filtrados);
                setMostrarLista(true);
              }
            }}
            onFocus={() => {
              // Cuando se hace clic, mostrar todos los clientes si no hay búsqueda activa
              setMostrarLista(true);
              if (!busquedaCliente || busquedaCliente === '') {
                setClientesFiltrados(clientes);
              }
            }}
            onBlur={(e) => {
              // Ocultar la lista cuando se pierde el foco, pero con un pequeño delay
              // para permitir que el clic en un item funcione
              setTimeout(() => {
                setMostrarLista(false);
                // Solo ocultar si no hay cliente seleccionado
                if (!selectedCliente) {
                  setClientesFiltrados([]);
                }
              }, 200);
            }}
            placeholder="Haz clic o escribe para buscar y seleccionar cliente..."
            style={{ 
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
              fontSize: '14px',
              backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit'
            }}
          />
          {mostrarLista && !selectedCliente && clientesFiltrados.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '5px',
              backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
              border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
              borderRadius: '5px',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 1000,
              boxShadow: theme === 'dark' ? '0 4px 6px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {clientesFiltrados.map(cliente => (
                <div
                  key={cliente.id}
                  onMouseDown={(e) => {
                    // Prevenir que el blur oculte la lista antes del click
                    e.preventDefault();
                  }}
                  onClick={() => {
                    setBusquedaCliente('');
                    setSelectedCliente(cliente.id.toString());
                    loadCuentaCorriente(cliente.id, true); // Forzar recarga de datos
                    setClientesFiltrados([]); // Ocultar lista al seleccionar
                    setMostrarLista(false);
                  }}
                  style={{
                    padding: '10px 15px',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}`,
                    color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#333' : '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{cliente.nombre}</div>
                  <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', marginTop: '3px' }}>
                    {cliente.telefono && `📞 ${cliente.telefono}`}
                    {cliente.direccion && ` | 📍 ${cliente.direccion}`}
                  </div>
                </div>
              ))}
            </div>
          )}
          {busquedaCliente && !selectedCliente && clientesFiltrados.length === 0 && clientes.length > 0 && (
            <div style={{ 
              fontSize: '12px', 
              color: theme === 'dark' ? '#999' : '#666', 
              marginTop: '5px' 
            }}>
              No se encontraron clientes que coincidan con "{busquedaCliente}"
            </div>
          )}
          {selectedCliente && (
            <div style={{ 
              fontSize: '12px', 
              color: theme === 'dark' ? '#28a745' : '#28a745', 
              marginTop: '5px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              ✅ Cliente seleccionado: {clientes.find(c => c.id === parseInt(selectedCliente))?.nombre}
              <button
                onClick={() => {
                  setSelectedCliente('');
                  setBusquedaCliente('');
                  setCuentaCorriente(null);
                  setClientesFiltrados(clientes);
                }}
                style={{
                  marginLeft: '10px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  backgroundColor: theme === 'dark' ? '#dc3545' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                ✕ Limpiar
              </button>
            </div>
          )}
        </div>
      </div>
      </div>

      {loading && (
        <div className="card">
          <p style={{ color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Cargando...</p>
        </div>
      )}

      {cuentaCorriente && cliente && (
        <>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit', fontSize: '16px' }}>
              📤 Exportar Reporte
            </h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-danger" 
                style={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  padding: '10px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: exportandoPDF ? 0.6 : 1,
                  cursor: exportandoPDF ? 'wait' : 'pointer'
                }}
                onClick={handleExportPDF}
                disabled={exportandoPDF}
              >
                {exportandoPDF ? '⏳ Generando PDF...' : '📄 Exportar PDF'}
              </button>
              <button 
                className="btn btn-success" 
                style={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  padding: '10px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onClick={handleExportExcel}
              >
                📊 Exportar Excel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  padding: '10px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: exportando ? 0.6 : 1,
                  cursor: exportando ? 'wait' : 'pointer'
                }}
                onClick={async () => {
                  const cliente = clientes.find(c => c.id === parseInt(selectedCliente));
                  if (!cliente) {
                    alert('⚠️ Por favor, selecciona un cliente primero');
                    return;
                  }
                  
                  setExportando(true);
                  try {
                    // Cargar cuenta corriente del cliente
                    let cuentaCorrienteData = await supabaseService.getCuentaCorriente(parseInt(selectedCliente));
                    if (!cuentaCorrienteData.saldoInicial) {
                      try {
                        const si = await supabaseService.getSaldoInicialCliente(parseInt(selectedCliente));
                        if (si) cuentaCorrienteData = { ...cuentaCorrienteData, saldoInicial: si };
                      } catch (e) { /* ignorar */ }
                    }
                    const montoSI = cuentaCorrienteData.saldoInicial ? parseFloat(cuentaCorrienteData.saldoInicial.monto || 0) : 0;
                    const sumaSAF = sumarPagosSaldoAFavorAplicado(cuentaCorrienteData.pagos || []);
                    const creditoRestante = Math.max(0, montoSI - sumaSAF);
                    
                    // Cargar artículos del cliente
                    const articulos = await supabaseService.getArticulos();
                    const articulosDelCliente = articulos.filter(a => a.cliente_id === cliente.id);
                    
                    // Totales: total_pendiente = remitos - pagado - crédito restante
                    const totalesGenerales = {
                      ...(cuentaCorrienteData.totales || { total_remitos: 0, total_pagado: 0, total_pendiente: 0 }),
                      total_pendiente: (cuentaCorrienteData.totales?.total_remitos ?? 0) - (cuentaCorrienteData.totales?.total_pagado ?? 0) - creditoRestante
                    };
                    
                    // Preparar datos sin filtros de fecha (exportar todo)
                    const cuentaFiltrada = { 
                      ...cuentaCorrienteData,
                      totales: totalesGenerales,
                      articulosCliente: articulosDelCliente,
                      rangoFechas: {
                        desde: null,
                        hasta: null
                      }
                    };
                    
                    // Exportar PDF
                    await exportCuentaCorrientePDF(cliente, cuentaFiltrada);
                    
                    // Pequeña pausa para que el navegador procese el primer archivo
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Exportar Excel
                    await exportCuentaCorrienteExcel(cliente, cuentaFiltrada);
                    
                    alert('✅ Reportes exportados correctamente (PDF y Excel)');
                  } catch (error) {
                    console.error('Error exportando:', error);
                    alert('❌ Error al exportar reportes: ' + error.message);
                  } finally {
                    setExportando(false);
                  }
                }}
                disabled={exportando}
              >
                {exportando ? '⏳ Exportando...' : '📦 Exportar Ambos'}
              </button>
            </div>
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f0f0f0', 
              borderRadius: '6px',
              fontSize: '12px',
              color: theme === 'dark' ? '#999' : '#666'
            }}>
              💡 <strong>Tip:</strong> Puedes exportar el reporte en formato PDF, Excel o ambos formatos simultáneamente.
            </div>
          </div>

          <div style={{ 
            backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f9f9f9', 
            padding: '20px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            color: theme === 'dark' ? '#e0e0e0' : 'inherit'
          }}>
            <h3 style={{ color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Información del Cliente</h3>
            <p><strong>Nombre:</strong> {cliente.nombre}</p>
            {cliente.telefono && <p><strong>Teléfono:</strong> {cliente.telefono}</p>}
            {cliente.direccion && <p><strong>Dirección:</strong> {cliente.direccion}</p>}
            {cliente.email && <p><strong>Email:</strong> {cliente.email}</p>}
          </div>

          {/* Sección de Productos del Cliente */}
          {articulosCliente && articulosCliente.length > 0 && (
            <div style={{ 
              backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f9f9f9', 
              padding: '20px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit'
            }}>
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const nuevosExpandidos = new Set(productosExpandidos);
                  if (nuevosExpandidos.has('productos')) {
                    nuevosExpandidos.delete('productos');
                  } else {
                    nuevosExpandidos.add('productos');
                  }
                  setProductosExpandidos(nuevosExpandidos);
                }}
              >
                <h3 style={{ 
                  margin: 0, 
                  color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span>{productosExpandidos.has('productos') ? '▼' : '▶'}</span>
                  📦 Productos del Cliente ({articulosCliente.length})
                </h3>
              </div>
              
              {productosExpandidos.has('productos') && (
                <div style={{ marginTop: '15px' }}>
                  <table style={{ width: '100%', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ 
                        backgroundColor: theme === 'dark' ? '#2d2d2d' : '#e0e0e0',
                        color: theme === 'dark' ? '#e0e0e0' : '#333'
                      }}>
                        <th style={{ padding: '10px', textAlign: 'center', width: '40px' }}></th>
                        <th style={{ padding: '10px', textAlign: 'center', width: '80px' }}>Código</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Nombre</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Descripción</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Precio Base</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articulosCliente.map((articulo, index) => {
                        const estaExpandido = productosExpandidos.has(`articulo-${articulo.id}`);
                        const tieneDetalles = articulo.medida || articulo.cabezal || articulo.costado || articulo.fondo || articulo.taco || articulo.esquinero || articulo.despeje;
                        const toggleArticuloExpandido = (articuloId) => {
                          const nuevosExpandidos = new Set(productosExpandidos);
                          const key = `articulo-${articuloId}`;
                          if (nuevosExpandidos.has(key)) {
                            nuevosExpandidos.delete(key);
                          } else {
                            nuevosExpandidos.add(key);
                          }
                          setProductosExpandidos(nuevosExpandidos);
                        };
                        
                        return (
                          <React.Fragment key={articulo.id}>
                            <tr 
                              style={{ 
                                backgroundColor: theme === 'dark' 
                                  ? (index % 2 === 0 ? '#2d2d2d' : '#333')
                                  : (index % 2 === 0 ? '#ffffff' : '#f9f9f9'),
                                color: theme === 'dark' ? '#e0e0e0' : '#333',
                                cursor: tieneDetalles ? 'pointer' : 'default'
                              }}
                              onClick={() => tieneDetalles && toggleArticuloExpandido(articulo.id)}
                            >
                              <td style={{ textAlign: 'center', width: '40px', padding: '10px' }}>
                                {tieneDetalles && (
                                  <button
                                    className="btn btn-sm"
                                    style={{ 
                                      padding: '2px 6px', 
                                      fontSize: '12px',
                                      border: 'none',
                                      background: 'transparent',
                                      cursor: 'pointer',
                                      color: theme === 'dark' ? '#5dade2' : '#007bff'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleArticuloExpandido(articulo.id);
                                    }}
                                    title={estaExpandido ? 'Contraer' : 'Expandir'}
                                  >
                                    {estaExpandido ? '▼' : '▶'}
                                  </button>
                                )}
                              </td>
                              <td style={{ 
                                padding: '10px', 
                                textAlign: 'center',
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                color: theme === 'dark' ? '#5dade2' : '#007bff'
                              }}>
                                {articulo.codigo || '-'}
                              </td>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>{articulo.nombre}</td>
                              <td style={{ padding: '10px' }}>{articulo.descripcion || '-'}</td>
                              <td style={{ padding: '10px', textAlign: 'right' }}>{formatearMonedaConSimbolo(articulo.precio_base || 0)}</td>
                            </tr>
                            {estaExpandido && tieneDetalles && (
                              <tr style={{ backgroundColor: theme === 'dark' ? '#333' : '#f9f9f9' }}>
                                <td colSpan="5" style={{ padding: '15px', paddingLeft: '50px' }}>
                                  <div style={{ marginLeft: '20px' }}>
                                    <h4 style={{ margin: '0 0 15px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit', fontSize: '16px' }}>
                                      📐 Detalles de la Caja
                                    </h4>
                                    <div style={{ 
                                      display: 'grid', 
                                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                                      gap: '15px',
                                      backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                                      padding: '15px',
                                      borderRadius: '8px',
                                      border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
                                    }}>
                                      {articulo.medida && (
                                        <div>
                                          <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Medida:</strong>
                                          <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{articulo.medida}</div>
                                        </div>
                                      )}
                                      {articulo.cabezal && (
                                        <div>
                                          <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Cabezal:</strong>
                                          <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : 'inherit', whiteSpace: 'pre-wrap' }}>{articulo.cabezal}</div>
                                        </div>
                                      )}
                                      {articulo.costado && (
                                        <div>
                                          <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Costado:</strong>
                                          <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : 'inherit', whiteSpace: 'pre-wrap' }}>{articulo.costado}</div>
                                        </div>
                                      )}
                                      {articulo.fondo && (
                                        <div>
                                          <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Fondo:</strong>
                                          <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{articulo.fondo}</div>
                                        </div>
                                      )}
                                      {articulo.taco && (
                                        <div>
                                          <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Taco:</strong>
                                          <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{articulo.taco}</div>
                                        </div>
                                      )}
                                      {articulo.esquinero && (
                                        <div>
                                          <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Esquinero:</strong>
                                          <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{articulo.esquinero}</div>
                                        </div>
                                      )}
                                      {articulo.despeje && (
                                        <div>
                                          <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Despeje:</strong>
                                          <div style={{ marginTop: '5px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{articulo.despeje}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Resumen mejorado con cálculo correcto de total pagado */}
          {(() => {
            const totalRemitosReal = remitosFiltrados.reduce((sum, remito) => {
              return sum + parseFloat(remito.precio_total || 0);
            }, 0);
            
            // Saldo inicial: en contra se suma a Total Pendiente; no se suma a Total Pagado (Total Pagado = solo pagos reales)
            const montoSI = cuentaCorriente.saldoInicial ? parseFloat(cuentaCorriente.saldoInicial.monto || 0) : 0;
            const pagosReales = remitosFiltrados.reduce((sum, remito) => {
              return sum + parseFloat(remito.monto_pagado || 0);
            }, 0);
            const totalPagadoReal = pagosReales;
            
            let totalChequesRebotados = 0;
            if (cuentaCorriente.pagos) {
              cuentaCorriente.pagos.forEach(pago => {
                if (pago.cheque_rebotado && parseFloat(pago.monto || 0) > 0) {
                  const obs = pago.observaciones || '';
                  if (!(parseFloat(pago.monto || 0) === 0 && obs.includes('REMITOS_DETALLE:'))) {
                    totalChequesRebotados += parseFloat(pago.monto || 0);
                  }
                }
              });
            }
            
            // Total pendiente = remitos - pagado - crédito restante (saldo inicial menos lo ya aplicado)
            const sumaAplicadoSaldoFavor = sumarPagosSaldoAFavorAplicado(cuentaCorriente.pagos);
            const creditoRestante = Math.max(0, montoSI - sumaAplicadoSaldoFavor);
            const totalPendienteReal = totalRemitosReal - pagosReales - creditoRestante;
            const saldoAFavorMostrar = totalPendienteReal < 0
              ? Math.max(0, Math.abs(totalPendienteReal) - sumaAplicadoSaldoFavor)
              : 0;
            
            return (
              <div className="card" style={{ 
                marginBottom: '20px',
                border: `2px solid ${theme === 'dark' ? '#5dade2' : '#007bff'}`,
                backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e7f3ff'
              }}>
                <h3 style={{ 
                  margin: '0 0 20px 0', 
                  color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                  fontSize: '18px',
                  borderBottom: `2px solid ${theme === 'dark' ? '#5dade2' : '#007bff'}`,
                  paddingBottom: '10px'
                }}>
                  💰 Resumen Financiero
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '20px' 
                }}>
                  <div style={{
                    padding: '15px',
                    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
                  }}>
                    <div style={{ 
                      fontSize: '13px', 
                      color: theme === 'dark' ? '#999' : '#666',
                      marginBottom: '5px'
                    }}>
                      Total Remitos
                    </div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold',
                      color: theme === 'dark' ? '#e0e0e0' : '#333'
                    }}>
                      {formatearMonedaConSimbolo(totalRemitosReal)}
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '15px',
                    backgroundColor: totalChequesRebotados > 0
                      ? (theme === 'dark' ? '#4a2020' : '#f8d7da')
                      : (theme === 'dark' ? '#1e4a1e' : '#d4edda'),
                    borderRadius: '8px',
                    border: `1px solid ${totalChequesRebotados > 0 ? '#dc3545' : (theme === 'dark' ? '#28a745' : '#28a745')}`
                  }}>
                    <div style={{ 
                      fontSize: '13px', 
                      color: totalChequesRebotados > 0
                        ? (theme === 'dark' ? '#ff6b6b' : '#721c24')
                        : (theme === 'dark' ? '#90ee90' : '#155724'),
                      marginBottom: '5px'
                    }}>
                      Total Pagado{totalChequesRebotados > 0 ? ' (con cheques rebotados)' : ''}
                    </div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold',
                      color: totalChequesRebotados > 0
                        ? '#dc3545'
                        : (theme === 'dark' ? '#90ee90' : '#155724')
                    }}>
                      {formatearMonedaConSimbolo(totalPagadoReal)}
                      {totalChequesRebotados > 0 && (
                        <div style={{ 
                          fontSize: '11px', 
                          marginTop: '5px',
                          color: '#dc3545',
                          fontWeight: 'normal'
                        }}>
                          ⚠️ Cheques rebotados: {formatearMonedaConSimbolo(totalChequesRebotados)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '15px',
                    backgroundColor: totalPendienteReal > 0 
                      ? (theme === 'dark' ? '#4a2020' : '#f8d7da')
                      : totalPendienteReal < 0
                        ? (theme === 'dark' ? '#1e3a5f' : '#d1ecf1')
                        : (theme === 'dark' ? '#1e4a1e' : '#d4edda'),
                    borderRadius: '8px',
                    border: `1px solid ${
                      totalPendienteReal > 0 
                        ? '#dc3545'
                        : totalPendienteReal < 0
                          ? '#17a2b8'
                          : '#28a745'
                    }`
                  }}>
                    <div style={{ 
                      fontSize: '13px', 
                      color: theme === 'dark' 
                        ? (totalPendienteReal > 0 ? '#ff6b6b' : totalPendienteReal < 0 ? '#5dade2' : '#90ee90')
                        : (totalPendienteReal > 0 ? '#721c24' : totalPendienteReal < 0 ? '#0c5460' : '#155724'),
                      marginBottom: '5px'
                    }}>
                      {totalPendienteReal < 0 ? 'Saldo a Favor' : 'Total Pendiente'}
                    </div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold',
                      color: totalPendienteReal > 0 
                        ? '#dc3545' 
                        : totalPendienteReal < 0 
                          ? '#17a2b8' 
                          : '#28a745'
                    }}>
                      {totalPendienteReal < 0
                        ? formatearMonedaConSimbolo(saldoAFavorMostrar)
                        : formatearMonedaConSimbolo(totalPendienteReal)
                      }
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Filtros avanzados para remitos */}
          <div style={{ 
            marginTop: '20px', 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f9f9f9', 
            borderRadius: '8px',
            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>🔍 Filtros de Remitos</h3>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setFiltrosRemitos({
                    fechaDesde: '',
                    fechaHasta: '',
                    estadoPago: '',
                    busqueda: ''
                  });
                  setPaginaActual(1);
                }}
                style={{ padding: '5px 15px', fontSize: '12px' }}
              >
                ✕ Limpiar Filtros
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div className="form-group">
                <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Buscar (número/artículo)</label>
                <input
                  type="text"
                  value={filtrosRemitos.busqueda}
                  onChange={(e) => {
                    setFiltrosRemitos({ ...filtrosRemitos, busqueda: e.target.value });
                    setPaginaActual(1);
                  }}
                  placeholder="Buscar..."
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
                <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Fecha desde</label>
                <input
                  type="date"
                  value={filtrosRemitos.fechaDesde}
                  onChange={(e) => {
                    setFiltrosRemitos({ ...filtrosRemitos, fechaDesde: e.target.value });
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
                <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Fecha hasta</label>
                <input
                  type="date"
                  value={filtrosRemitos.fechaHasta}
                  onChange={(e) => {
                    setFiltrosRemitos({ ...filtrosRemitos, fechaHasta: e.target.value });
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
                <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Estado de pago</label>
                <select
                  value={filtrosRemitos.estadoPago}
                  onChange={(e) => {
                    setFiltrosRemitos({ ...filtrosRemitos, estadoPago: e.target.value });
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
                  <option value="">Todos</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Pago Parcial">Pago Parcial</option>
                </select>
              </div>
            </div>
          </div>

          {/* Controles de paginación ARRIBA */}
          {(() => {
            if (!remitosFiltrados || remitosFiltrados.length === 0) return null;
            const totalPaginas = Math.ceil(remitosFiltrados.length / registrosPorPagina);
            if (totalPaginas <= 1) return null;
            return (
              <div style={{ 
                marginTop: '20px',
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f9f9f9',
                borderRadius: '8px',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
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
                    opacity: paginaActual === 1 ? 0.5 : 1,
                    cursor: paginaActual === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ← Anterior
                </button>
                <span style={{ color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                  disabled={paginaActual === totalPaginas}
                  style={{ 
                    padding: '5px 15px', 
                    fontSize: '12px',
                    opacity: paginaActual === totalPaginas ? 0.5 : 1,
                    cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer'
                  }}
                >
                  Siguiente →
                </button>
              </div>
            );
          })()}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Fecha</th>
                  <th>Número</th>
                  <th>Código</th>
                  <th>Artículo</th>
                  <th style={{ minWidth: '100px' }}>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Total Artículo</th>
                  <th>Precio Total</th>
                  <th>Estado</th>
                  <th>Pagado</th>
                  <th>Pendiente</th>
                  <th>Imagen</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // remitosFiltrados ya está calculado arriba
                  if (!remitosFiltrados || remitosFiltrados.length === 0) {
                    return (
                      <tr>
                        <td colSpan="12" style={{
                          padding: '40px 20px',
                          textAlign: 'center',
                          color: theme === 'dark' ? '#999' : '#666',
                          fontSize: '14px',
                          fontStyle: 'italic'
                        }}>
                          {cuentaCorriente.remitos.length === 0 
                            ? '📋 No hay remitos para este cliente'
                            : '🔍 No hay remitos que coincidan con los filtros'}
                        </td>
                      </tr>
                    );
                  }
                  
                  // Paginación simple: 1 remito = 1 fila
                  const totalPaginas = Math.ceil(remitosFiltrados.length / registrosPorPagina);
                  const inicioIndex = (paginaActual - 1) * registrosPorPagina;
                  const finIndex = inicioIndex + registrosPorPagina;
                  const remitosPaginados = remitosFiltrados.slice(inicioIndex, finIndex);
                  
                  return (
                    <>
                      {remitosPaginados.map((remito, remitoIndex) => {
                        const articulos = remito.articulos || [];
                        const precioTotal = parseFloat(remito.precio_total || 0);
                        // Usar directamente el monto_pagado calculado en el backend
                        const montoPagadoReal = parseFloat(remito.monto_pagado || 0);
                        const saldoPendiente = precioTotal - montoPagadoReal;
                        
                        // Calcular estado del remito basado en pagos reales
                        let estadoRemitoReal = 'Pendiente';
                        if (precioTotal > 0 && montoPagadoReal >= precioTotal) {
                          estadoRemitoReal = 'Pagado';
                        } else if (montoPagadoReal > 0 && precioTotal > 0) {
                          estadoRemitoReal = 'Pago Parcial';
                        } else if (montoPagadoReal > 0 && precioTotal === 0) {
                          estadoRemitoReal = 'Pagado';
                        } else {
                          estadoRemitoReal = 'Pendiente';
                        }
                        
                        // Color alternado por remito
                        const originalIndex = cuentaCorriente.remitos.findIndex(r => r.id === remito.id);
                        const remitoBackgroundColor = theme === 'dark' 
                          ? (originalIndex % 2 === 0 ? '#2d2d2d' : '#333')
                          : (originalIndex % 2 === 0 ? '#ffffff' : '#f9f9f9');
                        
                        const borderColor = theme === 'dark' ? '#444' : '#e0e0e0';
                        
                        const estaExpandido = remitosExpandidos.has(remito.id);
                        
                        return (
                          <React.Fragment key={remito.id}>
                            <tr 
                            style={{ 
                              backgroundColor: remitoBackgroundColor,
                              color: theme === 'dark' ? '#e0e0e0' : '#333',
                              cursor: 'pointer',
                              borderTop: `1px solid ${borderColor}`,
                              borderBottom: `1px solid ${borderColor}`
                            }}
                            onMouseEnter={() => setHoveredRemitoId(remito.id)}
                            onMouseLeave={() => setHoveredRemitoId(null)}
                            onClick={() => toggleExpandirRemito(remito.id)}
                          >
                            <td style={{ 
                              padding: '10px', 
                              textAlign: 'center',
                              borderRight: `1px solid ${borderColor}`
                            }}>
                              <button
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: theme === 'dark' ? '#5dade2' : '#007bff',
                                  fontSize: '14px',
                                  padding: '0'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpandirRemito(remito.id);
                                }}
                                title={estaExpandido ? 'Contraer' : 'Expandir'}
                              >
                                {estaExpandido ? '▼' : '▶'}
                              </button>
                            </td>
                            <td style={{ 
                              padding: '10px', 
                              color: theme === 'dark' ? '#e0e0e0' : '#333',
                              fontWeight: 'bold',
                              borderRight: `1px solid ${borderColor}`
                            }}>
                              {new Date(remito.fecha).toLocaleDateString('es-AR')}
                            </td>
                            <td style={{ 
                              padding: '10px', 
                              color: theme === 'dark' ? '#5dade2' : '#007bff',
                              fontWeight: 'bold',
                              borderRight: `1px solid ${borderColor}`
                            }}>
                              {remito.numero || remito.id}
                            </td>
                            <td style={{ 
                              padding: '10px',
                              borderRight: `1px solid ${borderColor}`,
                              verticalAlign: 'top'
                            }}>
                              {articulos.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                  {articulos.map((art, idx) => (
                                    <div 
                                      key={idx}
                                      style={{
                                        fontFamily: 'monospace',
                                        fontWeight: 'bold',
                                        color: theme === 'dark' ? '#5dade2' : '#007bff',
                                        fontSize: '13px'
                                      }}
                                    >
                                      {art.articulo_codigo || '-'}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: theme === 'dark' ? '#999' : '#666' }}>-</span>
                              )}
                            </td>
                            <td style={{ 
                              padding: '10px',
                              borderRight: `1px solid ${borderColor}`,
                              verticalAlign: 'top'
                            }}>
                              {articulos.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                  {articulos.map((art, idx) => (
                                    <div key={idx} style={{ fontSize: '13px' }}>
                                      {art.articulo_nombre || '-'}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: theme === 'dark' ? '#999' : '#666' }}>-</span>
                              )}
                            </td>
                            <td style={{ 
                              padding: '10px',
                              textAlign: 'right',
                              borderRight: `1px solid ${borderColor}`,
                              verticalAlign: 'top',
                              minWidth: '100px'
                            }}>
                              {articulos.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
                                  {articulos.map((art, idx) => (
                                    <div key={idx} style={{ fontSize: '13px' }}>
                                      {formatearCantidadDecimal(art.cantidad || 0)}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: theme === 'dark' ? '#999' : '#666' }}>-</span>
                              )}
                            </td>
                            <td style={{ 
                              padding: '10px',
                              textAlign: 'right',
                              borderRight: `1px solid ${borderColor}`,
                              verticalAlign: 'top'
                            }}>
                              {articulos.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
                                  {articulos.map((art, idx) => (
                                    <div key={idx} style={{ fontSize: '13px' }}>
                                      {formatearMonedaConSimbolo(art.precio_unitario || 0)}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: theme === 'dark' ? '#999' : '#666' }}>-</span>
                              )}
                            </td>
                            <td style={{ 
                              padding: '10px',
                              textAlign: 'right',
                              borderRight: `1px solid ${borderColor}`,
                              verticalAlign: 'top'
                            }}>
                              {articulos.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
                                  {articulos.map((art, idx) => {
                                    const totalArticulo = parseFloat(art.precio_total || (art.cantidad || 0) * (art.precio_unitario || 0));
                                    return (
                                      <div key={idx} style={{ fontSize: '13px', fontWeight: 'bold' }}>
                                        {formatearMonedaConSimbolo(totalArticulo)}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span style={{ color: theme === 'dark' ? '#999' : '#666' }}>-</span>
                              )}
                            </td>
                            <td style={{ 
                              padding: '10px',
                              textAlign: 'right',
                              fontWeight: 'bold',
                              borderRight: `1px solid ${borderColor}`,
                              verticalAlign: 'middle'
                            }}>
                              {formatearMonedaConSimbolo(precioTotal)}
                            </td>
                            <td style={{ 
                              padding: '10px',
                              textAlign: 'center',
                              borderRight: `1px solid ${borderColor}`,
                              verticalAlign: 'middle'
                            }}>
                              <span className={`badge ${getEstadoBadge(estadoRemitoReal)}`}>
                                {estadoRemitoReal}
                              </span>
                            </td>
                            <td style={{ 
                              padding: '10px',
                              textAlign: 'right',
                              color: theme === 'dark' ? '#e0e0e0' : '#333',
                              fontWeight: 'bold',
                              borderRight: `1px solid ${borderColor}`,
                              verticalAlign: 'middle'
                            }}>
                              {formatearMonedaConSimbolo(montoPagadoReal)}
                            </td>
                            <td style={{ 
                              padding: '10px',
                              textAlign: 'right',
                              color: saldoPendiente > 0 ? '#dc3545' : (saldoPendiente < 0 ? '#28a745' : (theme === 'dark' ? '#e0e0e0' : '#333')),
                              fontWeight: 'bold',
                              borderRight: `1px solid ${borderColor}`,
                              verticalAlign: 'middle'
                            }}>
                              {formatearMonedaConSimbolo(saldoPendiente)}
                            </td>
                            <td style={{ 
                              textAlign: 'center',
                              padding: '10px',
                              verticalAlign: 'middle'
                            }}>
                              {remito.foto_path ? (
                                <button 
                                  className="btn btn-primary" 
                                  style={{ 
                                    padding: '5px 10px', 
                                    fontSize: '12px',
                                    color: 'white',
                                    fontWeight: 'bold'
                                  }} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const imageUrl = supabaseService.getPublicImageUrl(remito.foto_path);
                                    setImagenModal({ abierto: true, url: imageUrl, remitoNumero: remito.numero || `Remito #${remito.id}` });
                                  }}
                                  title="Ver imagen del remito"
                                >
                                  📷 Ver
                                </button>
                              ) : (
                                <span style={{ color: '#999', fontSize: '12px' }}>-</span>
                              )}
                            </td>
                          </tr>
                          {estaExpandido && (
                            <tr style={{ backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f0f0f0' }}>
                              <td colSpan="13" style={{ padding: '20px' }}>
                                <div style={{
                                  backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                                  padding: '15px',
                                  borderRadius: '8px',
                                  border: `1px solid ${borderColor}`
                                }}>
                                  <h4 style={{ 
                                    marginTop: 0, 
                                    marginBottom: '15px',
                                    color: theme === 'dark' ? '#e0e0e0' : '#333'
                                  }}>
                                    📋 Detalles del Remito {remito.numero || `#${remito.id}`}
                                  </h4>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                      <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Fecha:</strong> {new Date(remito.fecha).toLocaleDateString('es-AR')}
                                    </div>
                                    <div>
                                      <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Cliente:</strong> {cuentaCorriente.cliente?.nombre || '-'}
                                    </div>
                                    <div>
                                      <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Precio Total:</strong> {formatearMonedaConSimbolo(precioTotal)}
                                    </div>
                                    <div>
                                      <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Pagado:</strong> {formatearMonedaConSimbolo(montoPagadoReal)}
                                    </div>
                                    <div>
                                      <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Pendiente:</strong> {formatearMonedaConSimbolo(saldoPendiente)}
                                    </div>
                                    <div>
                                      <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Estado:</strong> 
                                      <span className={`badge ${getEstadoBadge(estadoRemitoReal)}`} style={{ marginLeft: '10px' }}>
                                        {estadoRemitoReal}
                                      </span>
                                    </div>
                                  </div>
                                  {articulos.length > 0 && (
                                    <div style={{ marginTop: '20px' }}>
                                      <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>Artículos:</strong>
                                      <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
                                        <thead>
                                          <tr style={{ borderBottom: `2px solid ${borderColor}` }}>
                                            <th style={{ padding: '8px', textAlign: 'left' }}>Código</th>
                                            <th style={{ padding: '8px', textAlign: 'left' }}>Artículo</th>
                                            <th style={{ padding: '8px', textAlign: 'right' }}>Cantidad</th>
                                            <th style={{ padding: '8px', textAlign: 'right' }}>Precio Unit.</th>
                                            <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {articulos.map((art, idx) => {
                                            const totalArticulo = parseFloat(art.precio_total || (art.cantidad || 0) * (art.precio_unitario || 0));
                                            return (
                                              <tr key={idx} style={{ borderBottom: `1px solid ${borderColor}` }}>
                                                <td style={{ padding: '8px' }}>{art.articulo_codigo || '-'}</td>
                                                <td style={{ padding: '8px' }}>{art.articulo_nombre || '-'}</td>
                                                <td style={{ padding: '8px', textAlign: 'right' }}>{formatearCantidadDecimal(art.cantidad || 0)}</td>
                                                <td style={{ padding: '8px', textAlign: 'right' }}>{formatearMonedaConSimbolo(art.precio_unitario || 0)}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{formatearMonedaConSimbolo(totalArticulo)}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                          </React.Fragment>
                        );
                      })}
                      
                      {/* Controles de paginación */}
                      {totalPaginas > 1 && (
                        <tr>
                          <td colSpan="12" style={{ 
                            padding: '15px', 
                            backgroundColor: theme === 'dark' ? '#404040' : '#e9ecef',
                            borderTop: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}`
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '10px'
                            }}>
                              <div style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>
                                Mostrando {inicioIndex + 1} - {Math.min(finIndex, remitosFiltrados.length)} de {remitosFiltrados.length} remito(s)
                                {remitosFiltrados && cuentaCorriente && remitosFiltrados.length !== cuentaCorriente.remitos.length && (
                                  <span style={{ color: theme === 'dark' ? '#5dade2' : '#007bff', marginLeft: '10px' }}>
                                    (filtrados de {cuentaCorriente.remitos.length} remito(s))
                                  </span>
                                )}
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                                  disabled={paginaActual === 1}
                                  style={{ 
                                    padding: '5px 15px', 
                                    fontSize: '12px',
                                    opacity: paginaActual === 1 ? 0.5 : 1,
                                    cursor: paginaActual === 1 ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  ← Anterior
                                </button>
                                <span style={{ color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                                  Página {paginaActual} de {totalPaginas}
                                </span>
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                                  disabled={paginaActual === totalPaginas}
                                  style={{ 
                                    padding: '5px 15px', 
                                    fontSize: '12px',
                                    opacity: paginaActual === totalPaginas ? 0.5 : 1,
                                    cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  Siguiente →
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })()}
              </tbody>
              <tfoot>
                {(() => {
                  const totalRemitosReal = remitosFiltrados.reduce((sum, remito) => {
                    return sum + parseFloat(remito.precio_total || 0);
                  }, 0);
                  
                  const montoSI = cuentaCorriente?.saldoInicial ? parseFloat(cuentaCorriente.saldoInicial.monto || 0) : 0;
                  const pagosReales = remitosFiltrados.reduce((sum, remito) => {
                    return sum + parseFloat(remito.monto_pagado || 0);
                  }, 0);
                  const totalPagadoReal = pagosReales;
                  const sumaAplicadoSaldoFavor = sumarPagosSaldoAFavorAplicado(cuentaCorriente?.pagos);
                  const creditoRestante = Math.max(0, montoSI - sumaAplicadoSaldoFavor);
                  const totalPendienteReal = totalRemitosReal - pagosReales - creditoRestante;
                  const saldoAFavorMostrar = totalPendienteReal < 0
                    ? Math.max(0, Math.abs(totalPendienteReal) - sumaAplicadoSaldoFavor)
                    : 0;
                  
                  return (
                    <tr style={{ 
                      backgroundColor: theme === 'dark' ? '#404040' : '#e9ecef',
                      fontWeight: 'bold',
                      borderTop: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}`
                    }}>
                      <td colSpan="8" style={{
                        padding: '12px',
                        textAlign: 'right',
                        color: theme === 'dark' ? '#e0e0e0' : '#333',
                        fontSize: '15px'
                      }}>
                        TOTALES:
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'right',
                        color: theme === 'dark' ? '#e0e0e0' : '#333',
                        fontSize: '15px',
                        fontWeight: 'bold'
                      }}>
                        {formatearMonedaConSimbolo(totalRemitosReal)}
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'right',
                        color: theme === 'dark' ? '#e0e0e0' : '#333',
                        fontSize: '15px',
                        fontWeight: 'bold'
                      }}>
                        {formatearMonedaConSimbolo(totalPagadoReal)}
                      </td>
                      <td style={{ 
                        padding: '12px',
                        textAlign: 'right',
                        color: totalPendienteReal > 0 
                          ? '#dc3545' 
                          : totalPendienteReal < 0 
                            ? '#17a2b8' 
                            : (theme === 'dark' ? '#e0e0e0' : '#333'),
                        fontSize: '15px',
                        fontWeight: 'bold'
                      }}>
                        {totalPendienteReal < 0
                          ? formatearMonedaConSimbolo(saldoAFavorMostrar)
                          : formatearMonedaConSimbolo(totalPendienteReal)
                        }
                      </td>
                      <td style={{
                        padding: '12px'
                      }}></td>
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </>
      )}

      {!selectedCliente && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: theme === 'dark' ? '#999' : '#666' 
        }}>
          Selecciona un cliente para ver su cuenta corriente
        </div>
      )}

      {/* Modal para ver imagen - Mejorado para evitar scroll horizontal */}
      {imagenModal.abierto && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            padding: '20px',
            overflow: 'auto'
          }}
          onClick={() => setImagenModal({ abierto: false, url: null, remitoNumero: null })}
        >
          <div 
            style={{
              backgroundColor: theme === 'dark' ? '#1a1a1a' : 'white',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '95vw',
              maxHeight: '95vh',
              width: '100%',
              position: 'relative',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit',
              border: theme === 'dark' ? '1px solid #444' : 'none',
              boxShadow: theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexShrink: 0 }}>
              <h3 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : 'inherit', fontSize: '18px' }}>📷 Imagen del Remito: {imagenModal.remitoNumero}</h3>
              <button 
                className="btn btn-danger"
                onClick={() => setImagenModal({ abierto: false, url: null, remitoNumero: null })}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                ✕ Cerrar
              </button>
            </div>
            <div style={{ 
              backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5', 
              padding: '15px', 
              borderRadius: '8px',
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'auto',
              minHeight: 0
            }}>
              <img 
                src={imagenModal.url} 
                alt={`Remito ${imagenModal.remitoNumero}`}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: 'calc(95vh - 150px)', 
                  width: 'auto',
                  height: 'auto',
                  borderRadius: '8px',
                  display: 'block',
                  objectFit: 'contain',
                  border: theme === 'dark' ? '2px solid #444' : '1px solid #ddd',
                  backgroundColor: theme === 'dark' ? '#1a1a1a' : 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
                onError={(e) => {
                  console.error('Error cargando imagen:', e);
                  e.target.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.style.cssText = 'color: red; text-align: center; padding: 20px;';
                  errorDiv.textContent = '❌ Error al cargar la imagen';
                  e.target.parentElement.appendChild(errorDiv);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reportes;

