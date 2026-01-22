import React, { useState, useEffect, useMemo } from 'react';
import * as supabaseService from '../services/databaseService';
import { formatearMonedaConSimbolo } from '../utils/formatoMoneda';
import { exportResumenGeneralPDF } from '../utils/exportPDF';
import { exportResumenGeneralExcel } from '../utils/exportExcel';
import { useTheme } from '../context/ThemeContext';
import { useDataCache } from '../context/DataCacheContext';
import { alertNoBloqueante } from '../utils/notificaciones';

function Resumen() {
  const { theme } = useTheme();
  const { 
    remitos: remitosCache,
    clientes: clientesCache,
    loadRemitos: loadRemitosCache,
    loadClientes: loadClientesCache
  } = useDataCache();
  
  const [remitos, setRemitos] = useState(remitosCache);
  const [resumen, setResumen] = useState(null);
  const [resumenAnterior, setResumenAnterior] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [deudasClientes, setDeudasClientes] = useState([]);
  
  // Estados para filtros de período
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('hoy');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Sincronizar datos del caché con estado local
  useEffect(() => {
    setRemitos(remitosCache);
  }, [remitosCache]);

  // Cargar deudas de clientes para exportación
  useEffect(() => {
    const cargarDeudas = async () => {
      try {
        if (!clientesCache || clientesCache.length === 0) {
          await loadClientesCache();
        }
        const clientes = clientesCache || [];
        const deudas = await Promise.all(clientes.map(async (cliente) => {
          try {
            const cuenta = await supabaseService.getCuentaCorriente(cliente.id);
            return {
              nombre: cliente.nombre,
              deuda: cuenta.totalPendiente || 0
            };
          } catch {
            return { nombre: cliente.nombre, deuda: 0 };
          }
        }));
        setDeudasClientes(deudas.sort((a, b) => b.deuda - a.deuda));
      } catch (error) {
        console.error('Error cargando deudas:', error);
      }
    };
    cargarDeudas();
  }, [clientesCache, loadClientesCache]);

  // Calcular fechas según el período seleccionado
  const calcularFechasPeriodo = (periodo) => {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    
    let desde = new Date();
    desde.setHours(0, 0, 0, 0);
    
    switch(periodo) {
      case 'hoy':
        desde = new Date();
        desde.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        desde = new Date(hoy);
        desde.setDate(hoy.getDate() - 6);
        desde.setHours(0, 0, 0, 0);
        break;
      case 'mes':
        desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        desde.setHours(0, 0, 0, 0);
        break;
      case 'año':
        desde = new Date(hoy.getFullYear(), 0, 1);
        desde.setHours(0, 0, 0, 0);
        break;
      case 'personalizado':
        return {
          desde: fechaDesde ? new Date(fechaDesde + 'T00:00:00') : null,
          hasta: fechaHasta ? new Date(fechaHasta + 'T23:59:59') : null
        };
      default:
        desde = new Date();
        desde.setHours(0, 0, 0, 0);
    }
    
    return {
      desde: desde.toISOString().split('T')[0],
      hasta: hoy.toISOString().split('T')[0]
    };
  };

  // Calcular fechas del período anterior para comparación
  const calcularFechasPeriodoAnterior = (periodo) => {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    
    let desde = new Date();
    let hasta = new Date();
    
    switch(periodo) {
      case 'hoy':
        desde = new Date(hoy);
        desde.setDate(hoy.getDate() - 1);
        desde.setHours(0, 0, 0, 0);
        hasta = new Date(hoy);
        hasta.setDate(hoy.getDate() - 1);
        hasta.setHours(23, 59, 59, 999);
        break;
      case 'semana':
        desde = new Date(hoy);
        desde.setDate(hoy.getDate() - 13);
        desde.setHours(0, 0, 0, 0);
        hasta = new Date(hoy);
        hasta.setDate(hoy.getDate() - 7);
        hasta.setHours(23, 59, 59, 999);
        break;
      case 'mes':
        const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        desde = new Date(mesAnterior);
        desde.setHours(0, 0, 0, 0);
        hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'año':
        desde = new Date(hoy.getFullYear() - 1, 0, 1);
        desde.setHours(0, 0, 0, 0);
        hasta = new Date(hoy.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
      default:
        return { desde: null, hasta: null };
    }
    
    return {
      desde: desde.toISOString().split('T')[0],
      hasta: hasta.toISOString().split('T')[0]
    };
  };

  // Cargar resumen según período
  useEffect(() => {
    let isMounted = true;
    
    const loadResumen = async () => {
      setLoading(true);
      try {
        const fechas = calcularFechasPeriodo(periodoSeleccionado);
        
        const resumenActual = await supabaseService.getResumenGeneral(fechas.desde, fechas.hasta, false);
        
        if (!isMounted) return;
        setResumen(resumenActual);
        
        if (periodoSeleccionado !== 'personalizado') {
          try {
            const fechasAnteriores = calcularFechasPeriodoAnterior(periodoSeleccionado);
            const resumenAnt = await supabaseService.getResumenGeneral(fechasAnteriores.desde, fechasAnteriores.hasta, false);
            
            if (!isMounted) return;
            setResumenAnterior(resumenAnt);
          } catch (errorAnterior) {
            console.warn('Error cargando resumen anterior:', errorAnterior);
            if (isMounted) {
              setResumenAnterior(null);
            }
          }
        } else {
          if (isMounted) {
            setResumenAnterior(null);
          }
        }
        
        const lastRemitosLoad = localStorage.getItem('last_remitos_load');
        const now = Date.now();
        if (!lastRemitosLoad || (now - parseInt(lastRemitosLoad, 10)) > 30000) {
          loadRemitosCache(true).then(() => {
            localStorage.setItem('last_remitos_load', now.toString());
          }).catch(err => {
            console.warn('Error recargando remitos:', err);
          });
        }
      } catch (error) {
        console.error('Error cargando resumen:', error);
        
        if (isMounted) {
          alertNoBloqueante('Error al cargar resumen', 'error');
          setResumen({
            total_clientes: 0,
            total_remitos: 0,
            total_facturado: 0,
            total_pagado: 0,
            total_pendiente: 0
          });
          setResumenAnterior(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadResumen();
    
    return () => {
      isMounted = false;
    };
  }, [periodoSeleccionado, fechaDesde, fechaHasta, loadRemitosCache]);

  // Filtrar remitos según período
  const remitosFiltrados = useMemo(() => {
    if (!remitos || remitos.length === 0) return [];
    
    const fechas = calcularFechasPeriodo(periodoSeleccionado);
    if (!fechas.desde || !fechas.hasta) return remitos;
    
    const normalizarFecha = (fecha) => {
      if (!fecha) return null;
      const d = new Date(fecha);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };
    
    const desde = normalizarFecha(fechas.desde);
    const hasta = normalizarFecha(fechas.hasta);
    
    if (!desde || !hasta) return remitos;
    
    const remitosFiltrados = remitos.filter(remito => {
      if (!remito.fecha) return false;
      
      const fechaRemito = normalizarFecha(remito.fecha);
      if (!fechaRemito) return false;
      
      return fechaRemito >= desde && fechaRemito <= hasta;
    }).sort((a, b) => {
      const fechaA = normalizarFecha(a.fecha);
      const fechaB = normalizarFecha(b.fecha);
      if (!fechaA || !fechaB) return 0;
      return fechaB - fechaA;
    });
    
    return remitosFiltrados;
  }, [remitos, periodoSeleccionado, fechaDesde, fechaHasta]);

  // Calcular porcentaje de cambio
  const calcularCambio = (actual, anterior) => {
    if (!anterior || anterior === 0) return null;
    const cambio = ((actual - anterior) / anterior) * 100;
    return cambio;
  };

  const getLabelPeriodo = () => {
    switch(periodoSeleccionado) {
      case 'hoy': return 'Hoy';
      case 'semana': return 'Esta Semana';
      case 'mes': return 'Este Mes';
      case 'año': return 'Este Año';
      case 'personalizado': return 'Personalizado';
      default: return 'Hoy';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h2>Resumen General</h2>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Selector de Período */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ margin: 0 }}>Resumen General - {getLabelPeriodo()}</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-danger"
                  onClick={async () => {
                    setExportandoPDF(true);
                    try {
                  await exportResumenGeneralPDF(deudasClientes);
                  alert('✅ Reporte de Deudas PDF generado');
                    } catch (error) {
                      console.error('Error generando PDF:', error);
                  alert('❌ Error al generar PDF');
                    } finally {
                      setExportandoPDF(false);
                    }
                  }}
              disabled={exportandoPDF || deudasClientes.length === 0}
              style={{ padding: '8px 15px', fontSize: '12px' }}
                >
              {exportandoPDF ? '⏳ Generando...' : '📄 Deudas PDF'}
                </button>
                <button
                  className="btn btn-success"
                  onClick={async () => {
                    try {
                  await exportResumenGeneralExcel(deudasClientes);
                  alert('✅ Reporte de Deudas Excel generado');
                    } catch (error) {
                      console.error('Error generando Excel:', error);
                  alert('❌ Error al generar Excel');
                    }
                  }}
              disabled={deudasClientes.length === 0}
              style={{ padding: '8px 15px', fontSize: '12px' }}
                >
              📊 Deudas Excel
                </button>
          </div>
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={periodoSeleccionado}
            onChange={(e) => setPeriodoSeleccionado(e.target.value)}
            style={{
              padding: '8px 15px',
              fontSize: '14px',
              borderRadius: '6px',
              border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
              backgroundColor: theme === 'dark' ? '#404040' : '#fff',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit',
              cursor: 'pointer'
            }}
          >
            <option value="hoy">📅 Hoy</option>
            <option value="semana">📆 Esta Semana</option>
            <option value="mes">📊 Este Mes</option>
            <option value="año">📈 Este Año</option>
            <option value="personalizado">🔧 Personalizado</option>
          </select>
          
          {periodoSeleccionado === 'personalizado' && (
            <>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                style={{
                  padding: '8px 15px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                  backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                  color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                }}
              />
              <span style={{ color: theme === 'dark' ? '#999' : '#666' }}>hasta</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                style={{
                  padding: '8px 15px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                  backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                  color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Tarjetas de Métricas - Diseño Mejorado */}
      {resumen && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          {/* Total Remitos */}
          <div style={{ 
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%)'
              : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            border: `2px solid ${theme === 'dark' ? '#3498db' : '#2196f3'}`,
            borderRadius: '16px',
            padding: '28px',
            boxShadow: theme === 'dark' 
              ? '0 8px 24px rgba(52, 152, 219, 0.3)' 
              : '0 8px 24px rgba(33, 150, 243, 0.2)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = theme === 'dark' 
              ? '0 12px 32px rgba(52, 152, 219, 0.4)' 
              : '0 12px 32px rgba(33, 150, 243, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = theme === 'dark' 
              ? '0 8px 24px rgba(52, 152, 219, 0.3)' 
              : '0 8px 24px rgba(33, 150, 243, 0.2)';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '14px', 
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <span style={{ fontSize: '28px' }}>📋</span>
              </div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '14px', 
                fontWeight: '600',
                color: theme === 'dark' ? '#b0d4ff' : '#1565c0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Total Remitos
              </h3>
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: '42px', 
              fontWeight: 'bold', 
              color: theme === 'dark' ? '#ffffff' : '#0d47a1',
              lineHeight: '1.2'
            }}>
              {resumen.total_remitos || 0}
            </p>
          </div>

          {/* Total Facturado */}
          <div style={{ 
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, #5d4037 0%, #6d4c41 100%)'
              : 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
            border: `2px solid ${theme === 'dark' ? '#ff9800' : '#ff9800'}`,
            borderRadius: '16px',
            padding: '28px',
            boxShadow: theme === 'dark' 
              ? '0 8px 24px rgba(255, 152, 0, 0.3)' 
              : '0 8px 24px rgba(255, 152, 0, 0.2)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = theme === 'dark' 
              ? '0 12px 32px rgba(255, 152, 0, 0.4)' 
              : '0 12px 32px rgba(255, 152, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = theme === 'dark' 
              ? '0 8px 24px rgba(255, 152, 0, 0.3)' 
              : '0 8px 24px rgba(255, 152, 0, 0.2)';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '14px', 
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <span style={{ fontSize: '28px' }}>💰</span>
              </div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '14px', 
                fontWeight: '600',
                color: theme === 'dark' ? '#ffccbc' : '#e65100',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Total Facturado
              </h3>
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: theme === 'dark' ? '#ffffff' : '#bf360c',
              lineHeight: '1.2'
            }}>
              {formatearMonedaConSimbolo(resumen.total_facturado || 0)}
            </p>
          </div>

          {/* Total Pagado */}
          <div style={{ 
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)'
              : 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
            border: `2px solid ${theme === 'dark' ? '#4caf50' : '#4caf50'}`,
            borderRadius: '16px',
            padding: '28px',
            boxShadow: theme === 'dark' 
              ? '0 8px 24px rgba(76, 175, 80, 0.3)' 
              : '0 8px 24px rgba(76, 175, 80, 0.2)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = theme === 'dark' 
              ? '0 12px 32px rgba(76, 175, 80, 0.4)' 
              : '0 12px 32px rgba(76, 175, 80, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = theme === 'dark' 
              ? '0 8px 24px rgba(76, 175, 80, 0.3)' 
              : '0 8px 24px rgba(76, 175, 80, 0.2)';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '14px', 
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <span style={{ fontSize: '28px' }}>✅</span>
              </div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '14px', 
                fontWeight: '600',
                color: theme === 'dark' ? '#a5d6a7' : '#1b5e20',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Total Pagado
              </h3>
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: theme === 'dark' ? '#ffffff' : '#1b5e20',
              lineHeight: '1.2'
            }}>
              {formatearMonedaConSimbolo(resumen.total_pagado || 0)}
            </p>
          </div>

          {/* Total Pendiente */}
          <div style={{ 
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, #b71c1c 0%, #c62828 100%)'
              : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            border: `2px solid ${theme === 'dark' ? '#f44336' : '#f44336'}`,
            borderRadius: '16px',
            padding: '28px',
            boxShadow: theme === 'dark' 
              ? '0 8px 24px rgba(244, 67, 54, 0.3)' 
              : '0 8px 24px rgba(244, 67, 54, 0.2)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = theme === 'dark' 
              ? '0 12px 32px rgba(244, 67, 54, 0.4)' 
              : '0 12px 32px rgba(244, 67, 54, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = theme === 'dark' 
              ? '0 8px 24px rgba(244, 67, 54, 0.3)' 
              : '0 8px 24px rgba(244, 67, 54, 0.2)';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '14px', 
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <span style={{ fontSize: '28px' }}>⏳</span>
              </div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '14px', 
                fontWeight: '600',
                color: theme === 'dark' ? '#ffcdd2' : '#b71c1c',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Total Pendiente
              </h3>
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: theme === 'dark' ? '#ffffff' : '#b71c1c',
              lineHeight: '1.2'
            }}>
              {formatearMonedaConSimbolo(resumen.total_pendiente || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Tabla de Remitos del Período */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h2>Remitos del Período ({remitosFiltrados.length})</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Número</th>
                <th>Cliente</th>
                <th>Artículo</th>
                <th>Cantidad</th>
                <th>Precio Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {remitosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">No hay remitos en el período seleccionado</td>
                </tr>
              ) : (
                remitosFiltrados.slice(0, 50).map(remito => (
                  <tr key={remito.id}>
                    <td>{new Date(remito.fecha).toLocaleDateString('es-AR')}</td>
                    <td>{remito.numero || '-'}</td>
                    <td>{remito.cliente_nombre}</td>
                    <td>{(remito.articulos || []).map(a => 
                      `${a.articulo_codigo ? `[${a.articulo_codigo}] ` : ''}${a.articulo_nombre}`
                    ).join(', ') || '-'}</td>
                    <td>{(remito.articulos || []).reduce((sum, a) => sum + parseFloat(a.cantidad || 0), 0)}</td>
                    <td><strong>{formatearMonedaConSimbolo(remito.precio_total || 0)}</strong></td>
                    <td>
                      <span className={`badge ${remito.estado_pago === 'Pagado' ? 'badge-success' : remito.estado_pago === 'Parcial' ? 'badge-warning' : 'badge-secondary'}`}>
                        {remito.estado_pago || 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Resumen;
