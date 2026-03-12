import React, { useState, useEffect } from 'react';
import * as supabaseService from '../services/databaseService';
import * as databaseService from '../services/databaseService';
import { exportCuentaCorrientePDF } from '../utils/exportPDF';
import { exportCuentaCorrienteExcel } from '../utils/exportExcel';
import { useTheme } from '../context/ThemeContext';
import { useDataCache } from '../context/DataCacheContext';
import { formatearMonedaConSimbolo, formatearNumeroVisual, limpiarFormatoNumero, sumarPagosSaldoAFavorAplicado } from '../utils/formatoMoneda';
import { alertNoBloqueante, confirmNoBloqueante } from '../utils/notificaciones';

function Clientes({ onNavigate }) {
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
  const [filtroEstadoCuenta, setFiltroEstadoCuenta] = useState('todos'); // 'todos', 'adeudan', 'al-dia', 'saldo-favor'
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [clientesExpandidos, setClientesExpandidos] = useState(new Set());
  const [cuentasCorrientes, setCuentasCorrientes] = useState(new Map());
  const [cargandoClientes, setCargandoClientes] = useState(new Set());
  const [cargandoCuentasCorrientes, setCargandoCuentasCorrientes] = useState(false); // Estado global de carga
  const [progresoCargaCuentas, setProgresoCargaCuentas] = useState({ cargadas: 0, totales: 0 }); // Progreso de carga
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCliente, setExportCliente] = useState(null);
  const [exportFormato, setExportFormato] = useState('pdf');
  const [exportFechaDesde, setExportFechaDesde] = useState('');
  const [exportFechaHasta, setExportFechaHasta] = useState('');
  const [exportando, setExportando] = useState(false);
  const formRef = React.useRef(null);
  const cuentasCorrientesRef = React.useRef(new Map());
  const cargandoClientesRef = React.useRef(new Set());
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    email: '',
    observaciones: '',
    saldoInicialMonto: '',
    saldoInicialDescripcion: '',
    saldoInicialFecha: '',
    saldoInicialEsNegativo: false
  });

  // Sincronizar datos del caché con estado local
  useEffect(() => {
    setClientes(clientesCache);
    // Aplicar filtros cuando cambian los clientes
    aplicarFiltros(clientesCache, busquedaCliente, filtroEstadoCuenta);
  }, [clientesCache]);

  // Recalcular filtros cuando cambian las cuentas corrientes (para que los filtros por estado funcionen)
  useEffect(() => {
    if (filtroEstadoCuenta !== 'todos') {
      aplicarFiltros(clientes, busquedaCliente, filtroEstadoCuenta);
    }
  }, [cuentasCorrientes, cargandoClientes]); // Recalcular cuando se cargan nuevas cuentas

  // Función para aplicar filtros (búsqueda y estado de cuenta)
  const aplicarFiltros = (listaClientes, busqueda, estadoCuenta) => {
    let filtrados = listaClientes;

    // Aplicar filtro de búsqueda por texto
    if (busqueda !== '') {
      filtrados = filtrados.filter(cliente => 
        cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (cliente.telefono && cliente.telefono.toLowerCase().includes(busqueda.toLowerCase())) ||
        (cliente.direccion && cliente.direccion.toLowerCase().includes(busqueda.toLowerCase())) ||
        (cliente.email && cliente.email.toLowerCase().includes(busqueda.toLowerCase()))
      );
    }

    // Aplicar filtro de estado de cuenta
    if (estadoCuenta !== 'todos') {
      filtrados = filtrados.filter(cliente => {
        const cuentaCorriente = cuentasCorrientesRef.current.get(cliente.id);
        const estaCargando = cargandoClientesRef.current.has(cliente.id);
        
        // Si está cargando, no mostrar aún (esperar a que termine)
        if (estaCargando) {
          return false;
        }
        
        // Si no tiene cuenta cargada aún, no mostrar para este filtro
        if (!cuentaCorriente) {
          return false;
        }
        
        const totalPendiente = cuentaCorriente.totales.total_pendiente || 0;
        
        switch(estadoCuenta) {
          case 'adeudan':
            return totalPendiente > 0;
          case 'al-dia':
            return totalPendiente === 0;
          case 'saldo-favor':
            return totalPendiente < 0;
          default:
            return true;
        }
      });
    }

    setClientesFiltrados(filtrados);
    setPaginaActual(1); // Resetear a página 1 cuando cambian los filtros
  };

  // Cargar datos solo si no están en caché
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadClientesCache();
      } catch (error) {
        console.error('Error cargando clientes:', error);
        alertNoBloqueante('Error al cargar clientes: ' + error.message, 'error');
      }
    };
    loadData();
  }, []);

  // Cargar TODAS las cuentas corrientes cuando cambian los clientes (en segundo plano)
  useEffect(() => {
    let isMounted = true;
    let cargandoActual = false;
    
    const cargarTodasLasCuentasCorrientes = async () => {
      // Solo cargar si hay clientes y no se está cargando ya
      if (clientes.length === 0 || cargandoActual) return;
      
      // Verificar si ya están todas cargadas
      const clientesSinCuenta = clientes.filter(cliente => {
        const cuenta = cuentasCorrientesRef.current.get(cliente.id);
        const estaCargando = cargandoClientesRef.current.has(cliente.id);
        return !cuenta && !estaCargando;
      });
      
      if (clientesSinCuenta.length === 0) {
        setCargandoCuentasCorrientes(false);
        setProgresoCargaCuentas({ cargadas: clientes.length, totales: clientes.length });
        return; // Ya están todas cargadas
      }
      
      cargandoActual = true;
      setCargandoCuentasCorrientes(true);
      setProgresoCargaCuentas({ cargadas: clientes.length - clientesSinCuenta.length, totales: clientes.length });
      
      // Cargar en lotes más grandes para ser más rápido (30 clientes por lote)
      const LOTES = 30;
      for (let i = 0; i < clientesSinCuenta.length; i += LOTES) {
        if (!isMounted) break;
        
        const lote = clientesSinCuenta.slice(i, i + LOTES);
        
        // Cargar este lote en paralelo
        await Promise.all(lote.map(async (cliente) => {
          if (!isMounted) return;
          
          try {
            // Marcar como cargando
            setCargandoClientes(prev => {
              const nuevo = new Set(prev);
              nuevo.add(cliente.id);
              cargandoClientesRef.current = nuevo;
              return nuevo;
            });
            
            // Cargar cuenta corriente
            const cuentaCorriente = await supabaseService.getCuentaCorriente(cliente.id);
            
            if (!isMounted) return;
            
            // Actualizar cuenta corriente
            setCuentasCorrientes(prev => {
              const nuevo = new Map(prev);
              nuevo.set(cliente.id, cuentaCorriente);
              cuentasCorrientesRef.current = nuevo;
              return nuevo;
            });
            
            // Actualizar progreso
            setProgresoCargaCuentas(prevProg => ({
              cargadas: prevProg.cargadas + 1,
              totales: prevProg.totales
            }));
          } catch (error) {
            console.error(`Error cargando cuenta corriente de cliente ${cliente.id}:`, error);
            if (isMounted) {
              // Crear cuenta vacía en caso de error
              setCuentasCorrientes(prev => {
                const nuevo = new Map(prev);
                nuevo.set(cliente.id, { 
                  remitos: [], 
                  totales: {
                    total_remitos: 0,
                    total_pagado: 0,
                    total_pendiente: 0
                  }
                });
                cuentasCorrientesRef.current = nuevo;
                return nuevo;
              });
              
              // Actualizar progreso también en caso de error (se cuenta como cargada)
              setProgresoCargaCuentas(prevProg => ({
                cargadas: prevProg.cargadas + 1,
                totales: prevProg.totales
              }));
            }
          } finally {
            if (isMounted) {
              setCargandoClientes(prev => {
                const nuevo = new Set(prev);
                nuevo.delete(cliente.id);
                cargandoClientesRef.current = nuevo;
                return nuevo;
              });
            }
          }
        }));
        
        // Pausa más pequeña entre lotes para ser más rápido
        if (i + LOTES < clientesSinCuenta.length) {
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }
      
      if (isMounted) {
        setCargandoCuentasCorrientes(false);
        cargandoActual = false;
      }
    };
    
    // Iniciar carga inmediatamente sin delay para ser más rápido
    // Usar requestIdleCallback si está disponible, sino setTimeout con 0
    let timeoutOrCallbackId = null;
    if (window.requestIdleCallback) {
      timeoutOrCallbackId = requestIdleCallback(() => {
        cargarTodasLasCuentasCorrientes();
      }, { timeout: 100 });
    } else {
      timeoutOrCallbackId = setTimeout(() => {
        cargarTodasLasCuentasCorrientes();
      }, 0);
    }
    
    return () => {
      isMounted = false;
      // Limpiar timeout o cancelar idle callback
      if (timeoutOrCallbackId !== null) {
        if (window.requestIdleCallback && window.cancelIdleCallback) {
          try {
            window.cancelIdleCallback(timeoutOrCallbackId);
          } catch (e) {
            // Si falla, intentar clearTimeout
            clearTimeout(timeoutOrCallbackId);
          }
        } else {
          clearTimeout(timeoutOrCallbackId);
        }
      }
    };
  }, [clientes.length]); // Solo cuando cambia el número de clientes

  // Sincronizar refs con estado
  useEffect(() => {
    cuentasCorrientesRef.current = cuentasCorrientes;
  }, [cuentasCorrientes]);
  
  useEffect(() => {
    cargandoClientesRef.current = cargandoClientes;
  }, [cargandoClientes]);

  // Este useEffect ya no es necesario porque ahora cargamos todas las cuentas corrientes al inicio
  // Se mantiene solo para asegurar que las cuentas se recarguen si cambia algo
  useEffect(() => {
    // Cuando cambian los clientes filtrados o la página, solo aplicar filtros
    // Las cuentas corrientes ya se cargaron en el useEffect anterior
    aplicarFiltros(clientes, busquedaCliente, filtroEstadoCuenta);
  }, [paginaActual]); // Solo recalcular filtros si cambia la página

  // Limpieza automática cuando el modal se cierra - FORZADA para Electron
  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showForm]);

  const handleBuscarCliente = (e) => {
    const busqueda = e.target.value;
    setBusquedaCliente(busqueda);
    aplicarFiltros(clientes, busqueda, filtroEstadoCuenta);
  };

  const handleFiltroEstadoCuenta = (estado) => {
    setFiltroEstadoCuenta(estado);
    aplicarFiltros(clientes, busquedaCliente, estado);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevenir doble envío
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { saldoInicialMonto, saldoInicialDescripcion, saldoInicialFecha, saldoInicialEsNegativo, ...clientePayload } = formData;
      let clienteId = editingCliente ? editingCliente.id : null;
      
      // Preparar datos de saldo inicial para auditoría unificada
      const montoLimpio = saldoInicialMonto ? limpiarFormatoNumero(String(saldoInicialMonto)) : '';
      const montoNum = montoLimpio !== '' ? parseFloat(montoLimpio) : NaN;
      let saldoInicialParaAuditoria = null;
      
      if (!isNaN(montoNum) && montoNum !== 0) {
        const montoFinal = saldoInicialEsNegativo ? -Math.abs(montoNum) : montoNum;
        const fechaRef = saldoInicialFecha || `${new Date().getFullYear()}-01-19`;
        saldoInicialParaAuditoria = {
          monto: montoFinal,
          fecha_referencia: fechaRef,
          descripcion: saldoInicialDescripcion || `Saldo inicial al ${fechaRef.split('-').reverse().join('/')}`
        };
      }
      
      if (editingCliente) {
        // Obtener saldo anterior para comparar en auditoría
        let saldoAnterior = null;
        try {
          saldoAnterior = await databaseService.getSaldoInicialCliente(editingCliente.id);
        } catch (e) { /* ignorar */ }
        
        if (saldoInicialParaAuditoria) {
          saldoInicialParaAuditoria.anterior = saldoAnterior;
        } else if (saldoAnterior && parseFloat(saldoAnterior.monto || 0) !== 0) {
          saldoInicialParaAuditoria = { monto: 0, anterior: saldoAnterior };
        }
        
        await supabaseService.updateCliente(editingCliente.id, clientePayload, saldoInicialParaAuditoria);
      } else {
        const nuevo = await supabaseService.createCliente(clientePayload, saldoInicialParaAuditoria);
        if (nuevo && nuevo.id) {
          clienteId = nuevo.id;
        }
      }
      
      // Guardar saldo inicial en la tabla saldos_iniciales (separado de la auditoría)
      if (clienteId && !isNaN(montoNum) && montoNum !== 0) {
        const montoFinal = saldoInicialEsNegativo ? -Math.abs(montoNum) : montoNum;
        const fechaRef = saldoInicialFecha || `${new Date().getFullYear()}-01-19`;
        await databaseService.setSaldoInicialCliente({
          cliente_id: clienteId,
          fecha_referencia: fechaRef,
          monto: montoFinal,
          descripcion: saldoInicialDescripcion || `Saldo inicial al ${fechaRef.split('-').reverse().join('/')}`
        });
      }
      // Invalidar caché y recargar datos relacionados desde la base
      invalidateCache('clientes');
      invalidateCache('remitos');
      invalidateCache('pagos');
      invalidateCache('resumen');
      refreshRelated('clientes');
      // Recargar todos los datos relacionados desde la base para sincronizar
      await loadClientesCache(true); // Forzar recarga de clientes
      const estabaEditando = editingCliente !== null;
      setShowEditModal(false);
      resetForm();
      
      // FORZAR limpieza completa después de cerrar el modal
      setTimeout(() => {
        // Mostrar notificación después de la limpieza
        setTimeout(() => {
          alertNoBloqueante(estabaEditando ? 'Cliente actualizado' : 'Cliente creado', 'success');
        }, 50);
      }, 100);
    } catch (error) {
      console.error('Error guardando cliente:', error);
      alertNoBloqueante('Error al guardar cliente: ' + error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setShowForm(true);
    setShowEditModal(true);
    setFormData(prev => ({
      ...prev,
      nombre: cliente.nombre,
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      email: cliente.email || '',
      observaciones: cliente.observaciones || '',
      saldoInicialMonto: '',
      saldoInicialDescripcion: '',
      saldoInicialFecha: '',
      saldoInicialEsNegativo: false
    }));
    // Abrir modal flotante
    setShowForm(true);
    
    // Cargar saldo inicial del cliente
    databaseService.getSaldoInicialCliente(cliente.id)
      .then(saldo => {
        if (saldo) {
          const monto = parseFloat(saldo.monto || 0);
          let fechaRef = '';
          if (saldo.fecha_referencia) {
            const d = new Date(saldo.fecha_referencia);
            if (!isNaN(d.getTime())) {
              fechaRef = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }
          }
          setFormData(prev => ({
            ...prev,
            saldoInicialMonto: monto !== 0 ? formatearNumeroVisual(String(Math.abs(monto))) : '',
            saldoInicialDescripcion: saldo.descripcion || '',
            saldoInicialFecha: fechaRef,
            saldoInicialEsNegativo: monto < 0
          }));
        }
      })
      .catch(err => {
        console.warn('No se pudo cargar saldo inicial del cliente:', err?.message || err);
      });
  };

  const handleDelete = async (id) => {
    if (eliminandoId === id) return; // Ya se está eliminando
    
    setEliminandoId(id);
    try {
      // Verificar qué datos tiene el cliente
      const remitos = await supabaseService.getRemitos(id);
      const articulos = await supabaseService.getArticulos(id);
      
      // Contar pagos asociados
      let totalPagos = 0;
      if (remitos && remitos.length > 0) {
        for (const remito of remitos) {
          const pagos = await supabaseService.getPagos(remito.id);
          totalPagos += pagos ? pagos.length : 0;
        }
      }
      
      const cliente = clientes.find(c => c.id === id);
      const nombreCliente = cliente ? cliente.nombre : `ID ${id}`;
      
      // Mensaje detallado de confirmación
      const mensaje = `⚠️ ELIMINAR TODO LO RELACIONADO CON ${nombreCliente}\n\n` +
        `Se eliminarán:\n` +
        `📦 ${remitos.length} remito(s)\n` +
        `💰 ${totalPagos} pago(s)\n` +
        `📝 ${articulos.length} artículo(s) exclusivo(s)\n` +
        `👤 1 cliente\n\n` +
        `⚠️ Esta acción NO se puede deshacer.\n\n` +
        `¿Estás seguro?`;
      
      const confirmado = await confirmNoBloqueante(mensaje);
      if (!confirmado) {
        setEliminandoId(null);
        return;
      }
      
      // Eliminar en orden: pagos → remitos → artículos → cliente
      console.log(`Eliminando todo de cliente ${id}...`);
      
      // 1. Eliminar todos los pagos
      if (remitos && remitos.length > 0) {
        for (const remito of remitos) {
          const pagos = await supabaseService.getPagos(remito.id);
          if (pagos && pagos.length > 0) {
            for (const pago of pagos) {
              await supabaseService.deletePago(pago.id);
            }
          }
        }
      }
      
      // 2. Eliminar todos los remitos
      if (remitos && remitos.length > 0) {
        for (const remito of remitos) {
          await supabaseService.deleteRemito(remito.id);
        }
      }
      
      // 3. Eliminar artículos exclusivos del cliente
      if (articulos && articulos.length > 0) {
        for (const articulo of articulos) {
          if (articulo.cliente_id === id) {
            await supabaseService.deleteArticulo(articulo.id);
          }
        }
      }
      
      // 4. Eliminar el cliente
      await supabaseService.deleteCliente(id);
      
      // Invalidar caché y recargar
      await invalidateCache('clientes');
      await invalidateCache('remitos');
      await invalidateCache('pagos');
      await invalidateCache('resumen');
      await invalidateCache('articulos');
      await refreshRelated('clientes');
      await loadClientesCache(true);
      
      alertNoBloqueante(`✅ ${nombreCliente} y todos sus datos eliminados correctamente`, 'success');
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      alertNoBloqueante('Error al eliminar cliente: ' + error.message, 'error');
    } finally {
      setEliminandoId(null);
    }
  };

  // Abrir modal de exportación
  const handleGenerarReporte = (cliente, formato) => {
    setExportCliente(cliente);
    setExportFormato(formato);
    setExportFechaDesde('');
    setExportFechaHasta('');
    setShowExportModal(true);
  };

  // Ejecutar exportación con filtros de fecha (igual que en Reportes.js)
  const ejecutarExportacion = async () => {
    if (!exportCliente) return;
    
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
      let cuentaCorrienteData = await supabaseService.getCuentaCorriente(exportCliente.id);
      if (!cuentaCorrienteData.saldoInicial) {
        try {
          const si = await supabaseService.getSaldoInicialCliente(exportCliente.id);
          if (si) cuentaCorrienteData = { ...cuentaCorrienteData, saldoInicial: si };
        } catch (e) { /* ignorar */ }
      }
      const montoSI = cuentaCorrienteData.saldoInicial ? parseFloat(cuentaCorrienteData.saldoInicial.monto || 0) : 0;
      const sumaSAF = sumarPagosSaldoAFavorAplicado(cuentaCorrienteData.pagos || []);
      const creditoRestante = Math.max(0, montoSI - sumaSAF);
      
      // Cargar artículos del cliente
      const articulos = await supabaseService.getArticulos();
      const articulosDelCliente = articulos.filter(a => a.cliente_id === exportCliente.id);
      
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
        await exportCuentaCorrientePDF(exportCliente, cuentaFiltrada);
        alertNoBloqueante('✅ PDF generado correctamente', 'success');
      } else if (exportFormato === 'excel') {
        await exportCuentaCorrienteExcel(exportCliente, cuentaFiltrada);
        alertNoBloqueante('✅ Excel generado correctamente', 'success');
      }
      
      setShowExportModal(false);
    } catch (error) {
      console.error('Error generando reporte:', error);
      alertNoBloqueante('❌ Error al generar reporte: ' + error.message, 'error');
    } finally {
      setExportando(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      telefono: '',
      direccion: '',
      email: '',
      observaciones: ''
    });
    setEditingCliente(null);
    setShowForm(false);
    setShowEditModal(false);
  };

  const toggleExpandirCliente = (clienteId) => {
    const nuevosExpandidos = new Set(clientesExpandidos);
    
    if (nuevosExpandidos.has(clienteId)) {
      // Si ya está expandido, contraerlo
      nuevosExpandidos.delete(clienteId);
      setClientesExpandidos(nuevosExpandidos);
    } else {
      // Expandir INMEDIATAMENTE sin esperar
      nuevosExpandidos.add(clienteId);
      setClientesExpandidos(nuevosExpandidos);
      
      // Cargar cuenta corriente en SEGUNDO PLANO si no está cargada
      if (!cuentasCorrientes.has(clienteId) && !cargandoClientes.has(clienteId)) {
        setCargandoClientes(prev => new Set([...prev, clienteId]));
        
        // Cargar en segundo plano SIN bloquear la expansión
        supabaseService.getCuentaCorriente(clienteId)
          .then(cuentaCorriente => {
            setCuentasCorrientes(prev => {
              const nuevo = new Map(prev);
              nuevo.set(clienteId, cuentaCorriente);
              return nuevo;
            });
          })
          .catch(error => {
            console.error('Error cargando cuenta corriente:', error);
            alertNoBloqueante('Error al cargar cuenta corriente: ' + (error.message || 'Error desconocido'), 'error');
            // Crear cuenta vacía con el formato correcto para evitar reintentos infinitos
            setCuentasCorrientes(prev => {
              const nuevo = new Map(prev);
              nuevo.set(clienteId, { 
                remitos: [], 
                totales: {
                  total_remitos: 0,
                  total_pagado: 0,
                  total_pendiente: 0
                }
              });
              return nuevo;
            });
          })
          .finally(() => {
            setCargandoClientes(prev => {
              const nuevo = new Set(prev);
              nuevo.delete(clienteId);
              return nuevo;
            });
          });
      }
    }
  };

  const handleVerReporteCompleto = (clienteId) => {
    // Guardar el clienteId en localStorage para que Reportes lo cargue
    localStorage.setItem('selectedClienteId', clienteId.toString());
    // Navegar a la pestaña de Reportes
    if (onNavigate) {
      onNavigate('reportes');
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ margin: 0 }}>Gestión de Clientes</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              resetForm();
              setShowForm(true);
              setShowEditModal(true);
            }} 
            style={{ padding: '10px 20px' }}
          >
            ➕ Nuevo Cliente
          </button>
        </div>

      {/* Modal flotante para editar o crear cliente */}
      {showEditModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1002,
            padding: '20px',
            overflowY: 'auto',
            pointerEvents: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              confirmNoBloqueante('¿Deseas cancelar la edición? Los cambios no guardados se perderán.').then((confirmado) => {
                if (confirmado) {
                  setShowEditModal(false);
                  resetForm();
                }
              });
            }
          }}
        >
          <div 
            style={{
              backgroundColor: theme === 'dark' ? '#3a3a3a' : 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: theme === 'dark' ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.4)',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit',
              border: theme === 'dark' ? '1px solid #555' : 'none',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}`, paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                {editingCliente ? `✏️ Editar Cliente: ${editingCliente.nombre}` : '➕ Nuevo Cliente'}
              </h2>
              <button 
                className="btn btn-danger"
                onClick={() => {
                  confirmNoBloqueante('¿Deseas cancelar? Los cambios no guardados se perderán.').then((confirmado) => {
                    if (confirmado) {
                      setShowEditModal(false);
                      resetForm();
                    }
                  });
                }}
                style={{ 
                  padding: '8px 15px', 
                  fontSize: '14px',
                  backgroundColor: theme === 'dark' ? '#555' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                ❌ Cerrar
              </button>
            </div>

            <form 
              ref={formRef}
              onSubmit={handleSubmit} 
              style={{ color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}
            >
          <div className="form-row">
            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                placeholder="Nombre completo del cliente"
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="Número de contacto"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Dirección</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                placeholder="Dirección del cliente"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              rows="3"
              placeholder="Notas adicionales sobre el cliente"
            />
          </div>

          <div style={{
            padding: '16px',
            marginTop: '8px',
            marginBottom: '8px',
            borderRadius: '8px',
            backgroundColor: theme === 'dark' ? '#1a2a3a' : '#f0f7ff',
            border: `1px solid ${theme === 'dark' ? '#2a4a6a' : '#b8d8fa'}`
          }}>
            <div style={{ marginBottom: '12px', fontWeight: 'bold', color: theme === 'dark' ? '#5dade2' : '#0066cc', fontSize: '13px' }}>
              💰 Saldo Inicial
            </div>
            <div className="form-row">
              <div className="form-group">
                <label style={{ fontSize: '13px' }}>Monto</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{
                    display: 'flex',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                    flexShrink: 0
                  }}>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, saldoInicialEsNegativo: false })}
                      style={{
                        padding: '8px 14px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        backgroundColor: !formData.saldoInicialEsNegativo
                          ? '#28a745' : (theme === 'dark' ? '#404040' : '#f0f0f0'),
                        color: !formData.saldoInicialEsNegativo
                          ? '#fff' : (theme === 'dark' ? '#999' : '#666'),
                        transition: 'all 0.2s'
                      }}
                    >
                      + A favor
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, saldoInicialEsNegativo: true })}
                      style={{
                        padding: '8px 14px',
                        border: 'none',
                        borderLeft: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        backgroundColor: formData.saldoInicialEsNegativo
                          ? '#dc3545' : (theme === 'dark' ? '#404040' : '#f0f0f0'),
                        color: formData.saldoInicialEsNegativo
                          ? '#fff' : (theme === 'dark' ? '#999' : '#666'),
                        transition: 'all 0.2s'
                      }}
                    >
                      - En contra
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="saldoInicialMonto"
                    value={formData.saldoInicialMonto}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const formatted = formatearNumeroVisual(raw.replace(/-/g, ''));
                      setFormData({ ...formData, saldoInicialMonto: formatted });
                    }}
                    placeholder="Ej: 50.000.000"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${formData.saldoInicialEsNegativo ? '#dc3545' : (formData.saldoInicialMonto ? '#28a745' : (theme === 'dark' ? '#555' : '#ddd'))}`,
                      backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                      color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                      fontSize: '15px',
                      fontWeight: 'bold'
                    }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '13px' }}>Fecha de referencia</label>
                <input
                  type="date"
                  name="saldoInicialFecha"
                  value={formData.saldoInicialFecha}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                    backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                    color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '13px' }}>Descripción</label>
              <input
                type="text"
                name="saldoInicialDescripcion"
                value={formData.saldoInicialDescripcion}
                onChange={handleInputChange}
                placeholder="Ej: Saldo al 19/01/2026"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                  backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                  color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    confirmNoBloqueante('¿Deseas cancelar la edición? Los cambios no guardados se perderán.').then((confirmado) => {
                      if (confirmado) {
                        setShowEditModal(false);
                        resetForm();
                      }
                    });
                  }}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-success"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? (editingCliente ? '⏳ Actualizando...' : '⏳ Guardando...') 
                    : (editingCliente ? '💾 Actualizar' : '✅ Guardar')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exportación con filtros de fecha */}
      {showExportModal && exportCliente && (
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
              {exportFormato === 'pdf' ? '📄' : '📊'} Exportar Reporte - {exportCliente.nombre}
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

      {/* Formulario inline (oculto cuando hay modal) */}
      {showForm && !showEditModal && (
        <form 
          ref={formRef}
          onSubmit={handleSubmit} 
          style={{ marginTop: '20px', padding: '20px', backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f9f9f9', borderRadius: '8px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                placeholder="Nombre completo del cliente"
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="Número de contacto"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Dirección</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                placeholder="Dirección del cliente"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              rows="3"
              placeholder="Notas adicionales sobre el cliente"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              type="submit" 
              className="btn btn-success"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (editingCliente ? '⏳ Actualizando...' : '⏳ Guardando...') 
                : (editingCliente ? '💾 Actualizar' : '✅ Guardar')
              }
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={resetForm}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Indicador de carga de cuentas corrientes */}
      {cargandoCuentasCorrientes && (
        <div className="card" style={{ marginBottom: '20px', backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e7f3ff', border: `2px solid ${theme === 'dark' ? '#5dade2' : '#007bff'}` }}>
          <div style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '24px' }}>⏳</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                Cargando datos de clientes...
              </div>
              <div style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666', marginBottom: '10px' }}>
                Estamos cargando las cuentas corrientes de todos los clientes. Los filtros estarán disponibles en breve.
              </div>
              {progresoCargaCuentas.totales > 0 && (
                <div style={{ fontSize: '12px', color: theme === 'dark' ? '#888' : '#555' }}>
                  Progreso: {progresoCargaCuentas.cargadas} de {progresoCargaCuentas.totales} clientes cargados ({Math.round((progresoCargaCuentas.cargadas / progresoCargaCuentas.totales) * 100)}%)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ 
          padding: '15px', 
          backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f9f9f9', 
          borderRadius: '8px',
          border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : 'inherit', fontSize: '16px' }}>🔍 Filtros de Búsqueda</h3>
            {(busquedaCliente || filtroEstadoCuenta !== 'todos') && (
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setBusquedaCliente('');
                  setFiltroEstadoCuenta('todos');
                  aplicarFiltros(clientes, '', 'todos');
                }}
                style={{ padding: '5px 15px', fontSize: '12px' }}
              >
                ✕ Limpiar Filtros
              </button>
            )}
          </div>
          
          {/* Filtro por Estado de Cuenta */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666', marginBottom: '8px', display: 'block' }}>Estado de Cuenta</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className={`btn ${filtroEstadoCuenta === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleFiltroEstadoCuenta('todos')}
                style={{
                  padding: '8px 15px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: `1px solid ${filtroEstadoCuenta === 'todos' ? (theme === 'dark' ? '#5dade2' : '#007bff') : (theme === 'dark' ? '#555' : '#ddd')}`,
                  backgroundColor: filtroEstadoCuenta === 'todos' 
                    ? (theme === 'dark' ? '#007bff' : '#007bff')
                    : (theme === 'dark' ? '#404040' : '#fff'),
                  color: filtroEstadoCuenta === 'todos' ? '#fff' : (theme === 'dark' ? '#e0e0e0' : 'inherit'),
                  cursor: 'pointer'
                }}
              >
                📋 Todos
              </button>
              <button
                className={`btn ${filtroEstadoCuenta === 'adeudan' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => handleFiltroEstadoCuenta('adeudan')}
                disabled={cargandoCuentasCorrientes}
                style={{
                  padding: '8px 15px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: `1px solid ${filtroEstadoCuenta === 'adeudan' ? '#dc3545' : (theme === 'dark' ? '#555' : '#ddd')}`,
                  backgroundColor: filtroEstadoCuenta === 'adeudan' 
                    ? '#dc3545'
                    : (theme === 'dark' ? '#404040' : '#fff'),
                  color: filtroEstadoCuenta === 'adeudan' ? '#fff' : (theme === 'dark' ? '#e0e0e0' : 'inherit'),
                  cursor: cargandoCuentasCorrientes ? 'not-allowed' : 'pointer',
                  opacity: cargandoCuentasCorrientes ? 0.6 : 1
                }}
              >
                💰 Adeudan
              </button>
              <button
                className={`btn ${filtroEstadoCuenta === 'al-dia' ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => handleFiltroEstadoCuenta('al-dia')}
                disabled={cargandoCuentasCorrientes}
                style={{
                  padding: '8px 15px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: `1px solid ${filtroEstadoCuenta === 'al-dia' ? '#28a745' : (theme === 'dark' ? '#555' : '#ddd')}`,
                  backgroundColor: filtroEstadoCuenta === 'al-dia' 
                    ? '#28a745'
                    : (theme === 'dark' ? '#404040' : '#fff'),
                  color: filtroEstadoCuenta === 'al-dia' ? '#fff' : (theme === 'dark' ? '#e0e0e0' : 'inherit'),
                  cursor: cargandoCuentasCorrientes ? 'not-allowed' : 'pointer',
                  opacity: cargandoCuentasCorrientes ? 0.6 : 1
                }}
              >
                ✅ Al Día
              </button>
              <button
                className={`btn ${filtroEstadoCuenta === 'saldo-favor' ? 'btn-info' : 'btn-secondary'}`}
                onClick={() => handleFiltroEstadoCuenta('saldo-favor')}
                disabled={cargandoCuentasCorrientes}
                style={{
                  padding: '8px 15px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: `1px solid ${filtroEstadoCuenta === 'saldo-favor' ? '#17a2b8' : (theme === 'dark' ? '#555' : '#ddd')}`,
                  backgroundColor: filtroEstadoCuenta === 'saldo-favor' 
                    ? '#17a2b8'
                    : (theme === 'dark' ? '#404040' : '#fff'),
                  color: filtroEstadoCuenta === 'saldo-favor' ? '#fff' : (theme === 'dark' ? '#e0e0e0' : 'inherit'),
                  cursor: cargandoCuentasCorrientes ? 'not-allowed' : 'pointer',
                  opacity: cargandoCuentasCorrientes ? 0.6 : 1
                }}
              >
                💚 Saldo a Favor
              </button>
            </div>
          </div>

          {/* Búsqueda por texto */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666', marginBottom: '8px' }}>Buscar Cliente</label>
            <input
              type="text"
              value={busquedaCliente}
              onChange={handleBuscarCliente}
              placeholder="Buscar por nombre, teléfono, dirección o email..."
              style={{ 
                width: '100%', 
                padding: '10px',
                borderRadius: '6px',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                fontSize: '14px',
                backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : 'inherit'
              }}
            />
            {(busquedaCliente || filtroEstadoCuenta !== 'todos') && (
              <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', marginTop: '8px' }}>
                Mostrando {clientesFiltrados.length} de {clientes.length} clientes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="card">

        {clientes.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#999' : '#666' }}>
            No hay clientes registrados
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#999' : '#666' }}>
            No se encontraron clientes que coincidan con "{busquedaCliente}"
          </div>
        ) : (() => {
          // Paginación
          const totalPaginas = Math.ceil(clientesFiltrados.length / registrosPorPagina);
          const inicioIndex = (paginaActual - 1) * registrosPorPagina;
          const finIndex = inicioIndex + registrosPorPagina;
          const clientesPaginados = clientesFiltrados.slice(inicioIndex, finIndex);
          
          return (
            <>
              {/* Controles de paginación ARRIBA */}
              {totalPaginas > 1 && (
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
              )}

              {clientesPaginados.map(cliente => {
            const estaExpandido = clientesExpandidos.has(cliente.id);
            const cuentaCorriente = cuentasCorrientes.get(cliente.id);
            const estaCargando = cargandoClientes.has(cliente.id);
            
            return (
              <div 
                key={cliente.id}
                style={{
                  border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                  borderRadius: '8px',
                  marginBottom: '15px',
                  backgroundColor: estaExpandido ? (theme === 'dark' ? '#1a3a5f' : '#f0f8ff') : (theme === 'dark' ? '#2d2d2d' : '#fff'),
                  color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    padding: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => toggleExpandirCliente(cliente.id)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#333' : '#f9f9f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = estaExpandido ? (theme === 'dark' ? '#1a3a5f' : '#f0f8ff') : 'transparent'}
                >
                  <div style={{ flex: 1, display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '5px',
                        color: theme === 'dark' ? '#5dade2' : 'inherit'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpandirCliente(cliente.id);
                      }}
                    >
                      {estaExpandido ? '▼' : '▶'}
                    </button>
                    <div>
                      <strong style={{ fontSize: '16px' }}>{cliente.nombre}</strong>
                      <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', marginTop: '3px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        {cliente.telefono && <span>📞 {cliente.telefono}</span>}
                        {cliente.direccion && <span>📍 {cliente.direccion}</span>}
                        {cliente.email && <span>✉️ {cliente.email}</span>}
                        {estaCargando && (
                          <span style={{ fontSize: '11px', fontStyle: 'italic', color: theme === 'dark' ? '#666' : '#999' }}>
                            ⏳ Calculando...
                          </span>
                        )}
                        {!estaCargando && cuentaCorriente && (() => {
                          const pend = cuentaCorriente.totales.total_pendiente;
                          const sumaAplicado = sumarPagosSaldoAFavorAplicado(cuentaCorriente.pagos);
                          const saldoAFavorMostrar = pend < 0 ? Math.max(0, Math.abs(pend) - sumaAplicado) : 0;
                          return (
                          <span style={{ 
                            fontSize: '12px',
                            fontWeight: 'bold',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: pend > 0 
                              ? (theme === 'dark' ? '#4a1a1a' : '#ffe6e6')
                              : pend < 0 
                                ? (theme === 'dark' ? '#1a3a4a' : '#e6f7ff')
                                : (theme === 'dark' ? '#1a4a1a' : '#e6ffe6'),
                            color: pend > 0 
                              ? '#dc3545' 
                              : pend < 0 
                                ? '#17a2b8' 
                                : '#28a745'
                          }}>
                            {pend > 0 
                              ? `💰 Adeuda: ${formatearMonedaConSimbolo(pend)}`
                              : pend < 0
                                ? (saldoAFavorMostrar > 0 ? `💚 Saldo a favor: ${formatearMonedaConSimbolo(saldoAFavorMostrar)}` : '✅ Al día')
                                : '✅ Al día'
                            }
                          </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {estaCargando && (
                      <span style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666' }}>Cargando...</span>
                    )}
                    <div onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="btn btn-danger" 
                        style={{ 
                          padding: '5px 10px', 
                          fontSize: '12px', 
                          marginRight: '5px',
                          color: 'white',
                          fontWeight: 'bold'
                        }} 
                        onClick={() => handleGenerarReporte(cliente, 'pdf')}
                        title="Generar reporte PDF de cuenta corriente"
                      >
                        📄 PDF
                      </button>
                      <button 
                        className="btn btn-success" 
                        style={{ 
                          padding: '5px 10px', 
                          fontSize: '12px',
                          marginRight: '5px',
                          color: 'white',
                          fontWeight: 'bold'
                        }} 
                        onClick={() => handleGenerarReporte(cliente, 'excel')}
                        title="Generar reporte Excel de cuenta corriente"
                      >
                        📊 Excel
                      </button>
                      <button 
                        className="btn btn-success" 
                        style={{ 
                          padding: '5px 10px', 
                          fontSize: '12px',
                          marginRight: '5px'
                        }} 
                        onClick={() => handleEdit(cliente)}
                        title="Editar cliente"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ 
                          padding: '5px 10px', 
                          fontSize: '12px'
                        }} 
                        onClick={() => handleDelete(cliente.id)}
                        title="Eliminar cliente"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
                
                {estaExpandido && cuentaCorriente && (
                  <div style={{
                    padding: '15px',
                    backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fafafa',
                    borderTop: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                    color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '15px',
                      marginBottom: '15px'
                    }}>
                      <div style={{
                        padding: '10px',
                        backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e7f3ff',
                        borderRadius: '5px',
                        color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                      }}>
                        <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666' }}>Total Remitos</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          {formatearMonedaConSimbolo(cuentaCorriente.totales.total_remitos)}
                        </div>
                      </div>
                      <div style={{
                        padding: '10px',
                        backgroundColor: theme === 'dark' ? '#1e4a3a' : '#d4edda',
                        borderRadius: '5px',
                        color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                      }}>
                        <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666' }}>Total Pagado</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
                          {formatearMonedaConSimbolo(cuentaCorriente.totales.total_pagado ?? 0)}
                        </div>
                      </div>
                      {(() => {
                        const pend = cuentaCorriente.totales.total_pendiente || 0;
                        const sumaAplicado = sumarPagosSaldoAFavorAplicado(cuentaCorriente.pagos || []);
                        const saldoAFavorMostrar = pend < 0 ? Math.max(0, Math.abs(pend) - sumaAplicado) : Math.abs(pend);
                        return (
                          <div style={{
                            padding: '10px',
                            backgroundColor: pend > 0
                              ? (theme === 'dark' ? '#4a1e1e' : '#f5c2c5')
                              : pend < 0
                                ? (theme === 'dark' ? '#1e3a5f' : '#cfe2ff')
                                : (theme === 'dark' ? '#1e4a3a' : '#a8e6cf'),
                            borderRadius: '5px',
                            color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                          }}>
                            <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666' }}>
                              {pend < 0 ? 'Saldo a Favor' : 'Total Pendiente'}
                              {cuentaCorriente.saldoInicial && parseFloat(cuentaCorriente.saldoInicial.monto || 0) !== 0 && (
                                <span style={{ marginLeft: '4px', fontSize: '10px', fontStyle: 'italic' }}>
                                  (inc. saldo inicial)
                                </span>
                              )}
                            </div>
                            <div style={{ 
                              fontSize: '16px', 
                              fontWeight: 'bold', 
                              color: pend > 0 
                                ? '#dc3545' 
                                : pend < 0
                                  ? '#17a2b8'
                                  : '#28a745' 
                            }}>
                              {formatearMonedaConSimbolo(saldoAFavorMostrar)}
                            </div>
                          </div>
                        );
                      })()}
                      <div style={{
                        padding: '10px',
                        backgroundColor: theme === 'dark' ? '#4a3a1a' : '#fff3cd',
                        borderRadius: '5px',
                        color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                      }}>
                        <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666' }}>Remitos Pendientes</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          {cuentaCorriente.remitos.filter(r => {
                            const saldo = parseFloat(r.precio_total || 0) - parseFloat(r.monto_pagado || 0);
                            return saldo > 0;
                          }).length}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        className="btn btn-primary"
                        style={{ 
                          padding: '5px 15px', 
                          fontSize: '12px',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerReporteCompleto(cliente.id);
                        }}
                      >
                        📋 Ver Reporte Completo
                      </button>
                    </div>
                  </div>
                )}
              </div>
                );
              })}
              
              {/* Controles de paginación ABAJO */}
              {totalPaginas > 1 && (
                <div style={{ 
                  marginTop: '20px',
                  marginBottom: '20px',
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
              )}
            </>
          );
        })()}
        </div>
      </div>

      {/* Modal flotante eliminado - usando formulario inline */}
      {false && (
        <div
          data-modal-overlay="true" 
          key={`modal-cliente-disabled`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1002,
            padding: '20px',
            overflowY: 'auto',
            pointerEvents: 'auto'
          }}
          onClick={(e) => {
            // Solo cerrar si se hace clic en el overlay, no en el contenido del modal
            if (e.target === e.currentTarget) {
              if (!editingCliente) {
                resetForm();
                setTimeout(() => {
                }, 50);
              } else {
                confirmNoBloqueante('¿Deseas cancelar? Los cambios no guardados se perderán.').then((confirmado) => {
                  if (confirmado) {
                    resetForm();
                    setTimeout(() => {
                    }, 50);
                  }
                });
              }
            }
          }}
        >
          <div 
            style={{
              backgroundColor: theme === 'dark' ? '#3a3a3a' : 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: theme === 'dark' ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.4)',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit',
              border: theme === 'dark' ? '1px solid #555' : 'none',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}`, paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                {editingCliente ? `✏️ Editar Cliente: ${editingCliente.nombre}` : '➕ Nuevo Cliente'}
              </h2>
              <button 
                className="btn btn-danger"
                onClick={() => {
                  if (!editingCliente) {
                    resetForm();
                    setTimeout(() => {
                    }, 50);
                  } else {
                    confirmNoBloqueante('¿Deseas cancelar? Los cambios no guardados se perderán.').then((confirmado) => {
                      if (confirmado) {
                        resetForm();
                        setTimeout(() => {
                        }, 50);
                      }
                    });
                  }
                }}
                style={{ padding: '8px 15px', fontSize: '14px' }}
              >
                ❌ Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    placeholder="Nombre completo del cliente"
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="Número de contacto"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    placeholder="Dirección del cliente"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Notas adicionales sobre el cliente"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => {
                    if (!editingCliente) {
                      resetForm();
                      setTimeout(() => {
                      }, 50);
                    } else {
                      confirmNoBloqueante('¿Deseas cancelar? Los cambios no guardados se perderán.').then((confirmado) => {
                        if (confirmado) {
                          resetForm();
                          setTimeout(() => {
                          }, 50);
                        }
                      });
                    }
                  }}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-success"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? (editingCliente ? '⏳ Actualizando...' : '⏳ Guardando...') 
                    : (editingCliente ? '💾 Actualizar' : '✅ Guardar')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;

