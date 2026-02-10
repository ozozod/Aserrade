import React, { useState, useEffect } from 'react';
import * as supabaseService from '../services/databaseService';
import { formatearMonedaConSimbolo, formatearMoneda, formatearNumeroVisual, limpiarFormatoNumero, formatearCantidad } from '../utils/formatoMoneda';
import { useTheme } from '../context/ThemeContext';
import { useDataCache } from '../context/DataCacheContext';
import { alertNoBloqueante, confirmNoBloqueante } from '../utils/notificaciones';
import { forzarCierreModalCompleto } from '../utils/modalCleanup';

function Pagos() {
  const { theme } = useTheme();
  const { 
    pagos: pagosCache,
    remitos: remitosCache,
    clientes: clientesCache,
    loadPagos: loadPagosCache,
    loadRemitos: loadRemitosCache,
    loadClientes: loadClientesCache,
    invalidateCache,
    refreshRelated
  } = useDataCache();
  
  const [pagos, setPagos] = useState(pagosCache);
  const [remitos, setRemitos] = useState([]);
  const [remitosClienteSeleccionado, setRemitosClienteSeleccionado] = useState([]); // Remitos del cliente seleccionado
  const [cargandoRemitos, setCargandoRemitos] = useState(false); // Estado de carga de remitos
  const [clientes, setClientes] = useState(clientesCache);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [pendientesClientes, setPendientesClientes] = useState({}); // { clienteId: totalPendiente }
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditPagoModal, setShowEditPagoModal] = useState(false);
  const [editingPago, setEditingPago] = useState(null);
  const [distribucionPagos, setDistribucionPagos] = useState({});
  const [montoTotal, setMontoTotal] = useState(0);
  const [montoTotalVisual, setMontoTotalVisual] = useState(''); // Valor visual del input mientras se escribe
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [marcandoRebotadoId, setMarcandoRebotadoId] = useState(null); // Estado para rastrear qué pago se está marcando como rebotado
  const [remitosExpandidos, setRemitosExpandidos] = useState(new Set());
  const [pagosExpandidos, setPagosExpandidos] = useState(new Set()); // Estado para pagos expandidos
  const [showAplicarAdelantoModal, setShowAplicarAdelantoModal] = useState(false);
  const [adelantoAplicar, setAdelantoAplicar] = useState(null);
  const [distribucionAdelanto, setDistribucionAdelanto] = useState({});
  const [remitosParaAdelanto, setRemitosParaAdelanto] = useState([]);
  // Función helper para obtener fecha local en formato YYYY-MM-DD (sin conversión UTC)
  const obtenerFechaLocal = (fecha = null) => {
    const d = fecha ? new Date(fecha) : new Date();
    const año = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  // Función para convertir fecha YYYY-MM-DD a formato MySQL DATE (YYYY-MM-DD)
  // MySQL DATE solo acepta formato YYYY-MM-DD sin hora ni timezone
  const fechaConHora14 = (fechaString) => {
    if (!fechaString) return null;
    // Extraer solo la fecha en formato YYYY-MM-DD (sin hora, sin timezone)
    const fechaSolo = fechaString.split('T')[0].split(' ')[0];
    // Validar formato YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaSolo)) {
      console.error('Formato de fecha inválido:', fechaString);
      return null;
    }
    // Retornar solo la fecha en formato MySQL DATE: YYYY-MM-DD
    return fechaSolo;
  };
  
  const [formData, setFormData] = useState({
    fecha: obtenerFechaLocal(),
    observaciones: ''
  });
  const [formDataEditPago, setFormDataEditPago] = useState({
    fecha: '',
    monto: '',
    observaciones: ''
  });
  // Estados para edición de pago con remitos
  const [remitosEditPago, setRemitosEditPago] = useState([]);
  const [clienteEditPago, setClienteEditPago] = useState(null);
  const [distribucionEditPago, setDistribucionEditPago] = useState({});
  const [montoTotalEditPago, setMontoTotalEditPago] = useState(0);
  const [remitosExpandidosEdit, setRemitosExpandidosEdit] = useState(new Set());
  const [cargandoRemitosEdit, setCargandoRemitosEdit] = useState(false);
  
  // Estados para filtros avanzados de la tabla de pagos
  const [filtrosPagos, setFiltrosPagos] = useState({
    fechaDesde: '',
    fechaHasta: '',
    montoMinimo: '',
    montoMaximo: '',
    busqueda: '',
    clienteId: ''
  });
  
  // Estados para paginación de pagos
  const [paginaActualPagos, setPaginaActualPagos] = useState(1);
  const [registrosPorPagina] = useState(30);
  
  // Estado para pago a cuenta (adelanto sin remitos)
  const [esPagoACuenta, setEsPagoACuenta] = useState(false);
  
  // Estado para cheque
  const [esCheque, setEsCheque] = useState(false);

  // Sincronizar datos del caché con estado local - con actualización inmediata
  useEffect(() => {
    if (pagosCache && pagosCache.length > 0) {
      setPagos(pagosCache);
    } else if (pagosCache && pagosCache.length === 0) {
      setPagos([]);
    }
  }, [pagosCache]);

  useEffect(() => {
    setClientes(clientesCache);
  }, [clientesCache]);

  // Cargar datos solo si no están en caché
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadPagosCache(),
          loadClientesCache()
        ]);
        // Remitos se cargan de forma especial (solo pendientes)
        await loadRemitosCache();
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };
    loadData();
  }, []);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setPaginaActualPagos(1);
  }, [filtrosPagos.fechaDesde, filtrosPagos.fechaHasta, filtrosPagos.montoMinimo, filtrosPagos.montoMaximo, filtrosPagos.busqueda, filtrosPagos.clienteId]);

  // Usar remitos del caché - mostrar TODOS los remitos (no solo los pendientes)
  // Porque un remito puede tener saldo negativo (saldo a favor) y aún así necesita estar visible
  useEffect(() => {
    if (remitosCache.length > 0) {
      // Cargar TODOS los remitos, no solo los que tienen saldo > 0
      // Esto permite ver remitos pagados y con saldo a favor
      setRemitos(remitosCache);
    } else {
      setRemitos([]);
    }
  }, [remitosCache]);

  // Limpieza automática cuando el modal se cierra - FORZADA para Electron
  // Scroll automático al formulario cuando se abre
  const formRef = React.useRef(null);
  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showForm]);

  const aEntero = (valor) => {
    const numero = Number(valor);
    if (Number.isNaN(numero) || numero === null || numero === undefined) {
      return 0;
    }
    return Math.round(numero);
  };

  // Función auxiliar para calcular saldo pendiente
  const getSaldoPendiente = (remito) => {
    const precioTotal = aEntero(remito.precio_total_remito || remito.precio_total || 0);
    const montoPagado = aEntero(remito.monto_pagado || 0);
    return precioTotal - montoPagado;
  };

  // Filtrar remitos por cliente seleccionado
  // Usar remitosClienteSeleccionado que se carga directamente desde la base de datos
  // Mostrar solo remitos con saldo pendiente (impagos) para facilitar el pago
  const remitosFiltrados = clienteSeleccionado 
    ? remitosClienteSeleccionado
        .filter(r => {
          // Excluir remitos con precio_total = 0 (remitos inválidos o sin artículos)
          const precioTotal = aEntero(r.precio_total || 0);
          if (precioTotal === 0) return false;
          // Solo mostrar remitos con saldo pendiente positivo (impagos)
          const saldo = getSaldoPendiente(r);
          return saldo > 0;
        })
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    : [];

  // Calcular pagos filtrados ANTES del return para usarlo en los controles de paginación
  // Función para parsear remitos desde observaciones
  const parsearRemitosDesdeObservaciones = (observaciones) => {
    if (!observaciones) return null;
    // Extraer solo el array JSON; después puede venir " PAGO_GRUPO_ID:..." que rompería JSON.parse
    const match = observaciones.match(/REMITOS_DETALLE:\s*(\[[\s\S]*\])\s*(?:PAGO_GRUPO_ID|$)/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        return null;
      }
    }
    return null;
  };
  
  // Función para obtener texto de observaciones sin el JSON
  const obtenerObservacionesTexto = (observaciones) => {
    if (!observaciones) return '-';
    // Si tiene REMITOS_DETALLE, mostrar solo la parte antes del |
    const partes = observaciones.split(' | REMITOS_DETALLE:');
    return partes[0] || observaciones;
  };
  
  // Filtrar pagos ocultos (que tienen [OCULTO] en observaciones) O pagos con monto 0 que no tienen REMITOS_DETALLE
  const esPagoOculto = (pago) => {
    if (!pago.observaciones) return false;
    // Pagos ocultos tienen [OCULTO] en observaciones PERO solo si tienen monto 0
    // Si tienen [OCULTO] pero tienen monto > 0, son pagos reales que se deben mostrar
    if (pago.observaciones.includes('[OCULTO]')) {
      // Si tiene monto > 0, NO es oculto (es un pago real)
      if (aEntero(pago.monto || 0) > 0) return false;
      // Si tiene monto 0, es oculto
      return true;
    }
    // Pagos con monto 0 que NO tienen REMITOS_DETALLE son también ocultos (pagos principales sin distribución)
    if (aEntero(pago.monto || 0) === 0 && !pago.observaciones.includes('REMITOS_DETALLE')) return true;
    return false;
  };
  
  // Obtener monto total del pago principal (suma de todos los remitos en REMITOS_DETALLE)
  const obtenerMontoTotalPago = (pago) => {
    const remitosDetalle = parsearRemitosDesdeObservaciones(pago.observaciones);
    if (remitosDetalle && remitosDetalle.length > 0) {
      // Si tiene REMITOS_DETALLE, sumar todos los montos manteniendo decimales
      return remitosDetalle.reduce((sum, r) => sum + parseFloat(r.monto || 0), 0);
    }
    // Si no tiene detalle, usar el monto del pago manteniendo decimales
    return parseFloat(pago.monto || 0);
  };
  
  const calcularPagosFiltrados = () => {
    // Filtrar pagos ocultos (no mostrarlos en la tabla)
    let pagosFiltrados = pagos.filter(p => !esPagoOculto(p));
    
    // Filtro por búsqueda
    if (filtrosPagos.busqueda) {
      const busqueda = filtrosPagos.busqueda.toLowerCase();
      pagosFiltrados = pagosFiltrados.filter(pago => {
        const clienteMatch = pago.cliente_nombre?.toLowerCase().includes(busqueda);
        const remitoMatch = (pago.remito_numero || `#${pago.remito_id}`).toLowerCase().includes(busqueda);
        return clienteMatch || remitoMatch;
      });
    }
    
    // Filtro por cliente
    if (filtrosPagos.clienteId) {
      pagosFiltrados = pagosFiltrados.filter(pago => pago.cliente_id === parseInt(filtrosPagos.clienteId));
    }
    
    // Filtro por fecha desde
    if (filtrosPagos.fechaDesde) {
      const fechaDesde = new Date(filtrosPagos.fechaDesde);
      fechaDesde.setHours(0, 0, 0, 0);
      pagosFiltrados = pagosFiltrados.filter(pago => {
        const fechaPago = new Date(pago.fecha);
        return fechaPago >= fechaDesde;
      });
    }
    
    // Filtro por fecha hasta
    if (filtrosPagos.fechaHasta) {
      const fechaHasta = new Date(filtrosPagos.fechaHasta);
      fechaHasta.setHours(23, 59, 59, 999);
      pagosFiltrados = pagosFiltrados.filter(pago => {
        const fechaPago = new Date(pago.fecha);
        return fechaPago <= fechaHasta;
      });
    }
    
    // Filtro por monto mínimo
    if (filtrosPagos.montoMinimo) {
      const montoMin = aEntero(filtrosPagos.montoMinimo) || 0;
      pagosFiltrados = pagosFiltrados.filter(pago => aEntero(pago.monto || 0) >= montoMin);
    }
    
    // Filtro por monto máximo
    if (filtrosPagos.montoMaximo) {
      const montoMax = aEntero(filtrosPagos.montoMaximo) || 0;
      pagosFiltrados = pagosFiltrados.filter(pago => aEntero(pago.monto || 0) <= montoMax);
    }
    
    // Ordenar por fecha descendente (más recientes primero), y si tienen la misma fecha, por ID descendente
    pagosFiltrados.sort((a, b) => {
      const fechaA = new Date(a.fecha);
      const fechaB = new Date(b.fecha);
      if (fechaB.getTime() !== fechaA.getTime()) {
        return fechaB - fechaA; // Fecha descendente
      }
      // Si tienen la misma fecha, ordenar por ID descendente (más recientes primero)
      return (b.id || 0) - (a.id || 0);
    });
    
    return pagosFiltrados;
  };

  const pagosFiltrados = calcularPagosFiltrados();
  
  // Calcular totalPaginas una vez para usar en toda la tabla
  const totalPaginas = pagosFiltrados && pagosFiltrados.length > 0 
    ? Math.ceil(pagosFiltrados.length / registrosPorPagina) 
    : 0;

  // Agrupar remitos por cliente (solo para el cliente seleccionado)
  const remitosPorCliente = remitosFiltrados.reduce((acc, remito) => {
    const clienteId = remito.cliente_id;
    if (!acc[clienteId]) {
      acc[clienteId] = {
        cliente_id: clienteId,
        cliente_nombre: remito.cliente_nombre || 'Sin nombre',
        remitos: []
      };
    }
    acc[clienteId].remitos.push(remito);
    return acc;
  }, {});

  // Calcular totales por cliente
  const calcularTotalesCliente = (clienteId) => {
    const remitosCliente = remitosPorCliente[clienteId]?.remitos || [];
    // Solo considerar remitos con precio_total > 0 para los totales
    const remitosValidos = remitosCliente.filter(r => aEntero(r.precio_total || 0) > 0);
    
    const totalRemitos = remitosValidos.reduce((sum, r) => sum + aEntero(r.precio_total || 0), 0);
    const totalPagado = remitosValidos.reduce((sum, r) => sum + aEntero(r.monto_pagado || 0), 0);
    // Solo sumar saldos POSITIVOS (pendientes reales, no créditos)
    const totalPendiente = remitosValidos.reduce((sum, r) => {
      const saldo = getSaldoPendiente(r);
      return sum + Math.max(0, saldo); // Solo sumar si es positivo
    }, 0);
    
    return {
      totalRemitos,
      totalPagado,
      totalPendiente
    };
  };

  const toggleRemitoExpandido = (remitoId) => {
    const nuevosExpandidos = new Set(remitosExpandidos);
    if (nuevosExpandidos.has(remitoId)) {
      nuevosExpandidos.delete(remitoId);
    } else {
      nuevosExpandidos.add(remitoId);
    }
    setRemitosExpandidos(nuevosExpandidos);
  };

  const handleBuscarCliente = (e) => {
    const valor = e.target.value;
    setBusquedaCliente(valor);
    
    if (valor === '') {
      setClientesFiltrados([]);
      setMostrarLista(false);
      return;
    }
    
    // Filtrar clientes por nombre, teléfono, dirección o email
    const filtrados = clientes.filter(cliente => {
      const nombreMatch = cliente.nombre?.toLowerCase().includes(valor.toLowerCase());
      const telefonoMatch = cliente.telefono?.toLowerCase().includes(valor.toLowerCase());
      const direccionMatch = cliente.direccion?.toLowerCase().includes(valor.toLowerCase());
      const emailMatch = cliente.email?.toLowerCase().includes(valor.toLowerCase());
      return nombreMatch || telefonoMatch || direccionMatch || emailMatch;
    });
    
    setClientesFiltrados(filtrados);
    setMostrarLista(true);
  };

  // Calcular pendientes de clientes filtrados usando getCuentaCorriente
  useEffect(() => {
    const calcularPendientes = async () => {
      if (clientesFiltrados.length === 0) return;
      
      // Calcular pendiente para TODOS los clientes filtrados (siempre recalcular para tener datos frescos)
      const clientesSinPendiente = clientesFiltrados;
      
      if (clientesSinPendiente.length === 0) return;
      
      const nuevosPendientes = { ...pendientesClientes };
      
      const promesas = clientesSinPendiente.map(async (cliente) => {
        try {
          const cuentaCorriente = await supabaseService.getCuentaCorriente(cliente.id);
          nuevosPendientes[cliente.id] = cuentaCorriente?.totales?.total_pendiente || 0;
        } catch (error) {
          console.error(`Error calculando pendiente para cliente ${cliente.id}:`, error);
          nuevosPendientes[cliente.id] = 0;
        }
      });
      
      await Promise.all(promesas);
      setPendientesClientes(nuevosPendientes);
    };
    
    calcularPendientes();
  }, [clientesFiltrados]);

  const handleSeleccionarCliente = async (cliente) => {
    // Verificar que cliente existe y tiene id
    if (!cliente) {
      console.error('Cliente inválido:', cliente);
      return;
    }
    
    let clienteId = null;
    let clienteNombre = '';
    
    // Si es solo un ID (número), buscar el objeto cliente
    if (typeof cliente === 'number' || (typeof cliente === 'string' && !isNaN(cliente))) {
      const clienteEncontrado = clientes.find(c => c.id === parseInt(cliente) || c.id === cliente);
      if (clienteEncontrado) {
        clienteId = clienteEncontrado.id;
        clienteNombre = clienteEncontrado.nombre || '';
      } else {
        console.error('Cliente no encontrado con ID:', cliente);
        return;
      }
    } else if (typeof cliente === 'object' && cliente !== null) {
      // Es un objeto cliente
      if (cliente.id === undefined || cliente.id === null) {
        console.error('Cliente sin ID:', cliente);
        return;
      }
      clienteId = cliente.id;
      clienteNombre = cliente.nombre || '';
    } else {
      console.error('Tipo de cliente inválido:', typeof cliente, cliente);
      return;
    }
    
    setClienteSeleccionado(clienteId.toString());
    setBusquedaCliente(clienteNombre);
    setClientesFiltrados([]);
    setMostrarLista(false);
    // Limpiar distribución al cambiar de cliente
    setDistribucionPagos({});
    setMontoTotal('');
    setMontoTotalVisual('');
    
    // Activar estado de carga
    setCargandoRemitos(true);
    setRemitosClienteSeleccionado([]);
    
    // Cargar remitos directamente del cliente seleccionado desde la base de datos
    // Esto asegura que tenemos todos los remitos del cliente, no solo los del caché
    try {
      const cuentaCorriente = await supabaseService.getCuentaCorriente(clienteId);
      if (cuentaCorriente && cuentaCorriente.remitos) {
        const remitosNormalizados = cuentaCorriente.remitos.map(remito => ({
          ...remito,
          precio_total: aEntero(remito.precio_total || remito.precio_total_remito || 0),
          precio_total_remito: aEntero(remito.precio_total_remito || remito.precio_total || 0),
          monto_pagado: aEntero(remito.monto_pagado || 0),
          saldo_pendiente: aEntero(remito.saldo_pendiente || (remito.precio_total || 0) - (remito.monto_pagado || 0))
        }));
        setRemitosClienteSeleccionado(remitosNormalizados);
      } else {
        setRemitosClienteSeleccionado([]);
      }
    } catch (error) {
      console.error('Error cargando remitos del cliente:', error);
      setRemitosClienteSeleccionado([]);
    } finally {
      setCargandoRemitos(false);
    }
  };

  const handleLimpiarCliente = () => {
    setClienteSeleccionado('');
    setBusquedaCliente('');
    setClientesFiltrados([]);
    setRemitosClienteSeleccionado([]);
    setCargandoRemitos(false);
    setMostrarLista(false);
    setDistribucionPagos({});
    setMontoTotal('');
    setMontoTotalVisual('');
  };

  const clienteActual = clientes.find(c => c.id === parseInt(clienteSeleccionado));

  // Función para distribuir automáticamente cuando cambia el monto total
  const distribuirAutomaticamentePorAntiguedad = (monto) => {
    if (!clienteSeleccionado || monto <= 0) {
      setDistribucionPagos({});
      return;
    }

    // Obtener remitos del cliente ordenados por fecha (más antiguo primero)
    const remitosCliente = remitosFiltrados;
    
    // Distribuir por orden de antigüedad: pagar completamente cada remito antes de pasar al siguiente
    // Permitir pagos mayores al saldo para generar crédito (saldo positivo)
    const nuevaDistribucion = {};
    let montoRestante = parseFloat(monto) || 0;

    for (const remito of remitosCliente) {
      nuevaDistribucion[remito.id] = 0;
      
      if (montoRestante <= 0) {
        continue;
      }

      const saldoRemito = parseFloat(getSaldoPendiente(remito)) || 0;
      
      if (saldoRemito > 0) {
        // Si el remito tiene saldo pendiente, pagamos hasta el saldo completo
        // Si el monto restante es mayor al saldo, lo pagamos completo y el exceso genera crédito
        const montoAPagar = Math.min(montoRestante, saldoRemito);
        nuevaDistribucion[remito.id] = montoAPagar;
        montoRestante -= montoAPagar;
      }
    }
    
    // Si después de pagar todos los remitos completos todavía hay monto restante,
    // aplicarlo como crédito adicional al primer remito pendiente (más antiguo)
    if (montoRestante > 0 && remitosCliente.length > 0) {
      const primerRemito = remitosCliente[0];
      nuevaDistribucion[primerRemito.id] = parseFloat((nuevaDistribucion[primerRemito.id] || 0) + montoRestante);
    }

    setDistribucionPagos(nuevaDistribucion);
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMontoTotalChange = (e) => {
    const input = e.target;
    const cursorPosition = input.selectionStart;
    const valorAnterior = input.value;
    
    // Permitir dígitos, puntos (miles) y coma (decimal)
    let valor = e.target.value.replace(/[^\d.,]/g, '');
    // Solo permitir una coma decimal
    const partes = valor.split(',');
    if (partes.length > 2) {
      valor = partes[0] + ',' + partes.slice(1).join('');
    }
    
    // Limitar decimales a 2 dígitos después de la coma
    if (valor.includes(',')) {
      const partesComa = valor.split(',');
      if (partesComa[1] && partesComa[1].length > 2) {
        valor = partesComa[0] + ',' + partesComa[1].substring(0, 2);
      }
    }
    
    // Si el campo está vacío, mantenerlo vacío
    if (valor === '' || valor === null || valor === undefined) {
      setMontoTotal('');
      setMontoTotalVisual('');
      setDistribucionPagos({});
      return;
    }
    
    // Si empieza con coma (ej: ",09"), mantenerlo como string temporalmente
    // pero calcular el valor numérico para el estado
    let nuevoMonto = 0;
    if (valor.startsWith(',')) {
      // Permitir valores como ",09" mientras se escribe - NO formatear todavía
      setMontoTotalVisual(valor);
      const decimales = valor.substring(1).replace(/[^\d]/g, '').slice(0, 2);
      if (decimales) {
        nuevoMonto = parseFloat('0.' + decimales) || 0;
      } else {
        nuevoMonto = 0;
      }
      setMontoTotal(nuevoMonto);
      distribuirAutomaticamentePorAntiguedad(nuevoMonto);
      return; // Salir temprano para no formatear valores que empiezan con coma
    }
    
    // Si tiene coma (usuario está escribiendo decimales), mantener sin formatear mientras escribe
    if (valor.includes(',')) {
      const partesComa = valor.split(',');
      // Si tiene coma y los decimales tienen menos de 2 dígitos o termina en coma, no formatear todavía
      if (valor.endsWith(',') || (partesComa[1] && partesComa[1].length < 2)) {
        // El usuario está escribiendo decimales, mantener el valor sin formatear
        setMontoTotalVisual(valor);
        const valorLimpio = limpiarFormatoNumero(valor);
        nuevoMonto = valorLimpio === '' ? 0 : parseFloat(valorLimpio) || 0;
        setMontoTotal(nuevoMonto);
        distribuirAutomaticamentePorAntiguedad(nuevoMonto);
        return;
      }
    }
    
    // Limpiar formato para obtener número puro
    const valorLimpio = limpiarFormatoNumero(valor);
    nuevoMonto = valorLimpio === '' ? 0 : parseFloat(valorLimpio) || 0;
    setMontoTotal(nuevoMonto);
    
    // Formatear el valor para mostrar (solo si no está escribiendo decimales)
    const valorFormateado = formatearNumeroVisual(valor);
    
    // Actualizar valor visual con formato
    setMontoTotalVisual(valorFormateado);
    
    // Calcular nueva posición del cursor solo si el valor cambió
    if (valorFormateado !== valor) {
      // Contar dígitos antes del cursor en el valor anterior
      const digitosAntesCursor = valorAnterior.substring(0, cursorPosition).replace(/[^\d]/g, '').length;
      
      // Encontrar posición equivalente en el valor formateado
      let nuevaPosicion = 0;
      let digitosContados = 0;
      for (let i = 0; i < valorFormateado.length; i++) {
        if (valorFormateado[i] === '.' || valorFormateado[i] === ',') {
          nuevaPosicion++;
        } else {
          digitosContados++;
          if (digitosContados > digitosAntesCursor) {
            break;
          }
          nuevaPosicion++;
        }
      }
      
      // Restaurar la posición del cursor después de que React actualice el DOM
      setTimeout(() => {
        input.setSelectionRange(nuevaPosicion, nuevaPosicion);
      }, 0);
    }
    
    // Distribuir automáticamente por antigüedad
    distribuirAutomaticamentePorAntiguedad(nuevoMonto);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevenir doble envío
    if (isSubmitting) {
      return;
    }
    
    if (!clienteSeleccionado) {
      alertNoBloqueante('Selecciona un cliente primero', 'warning');
      return;
    }

    if (!montoTotal || montoTotal <= 0) {
      alertNoBloqueante('El monto total a pagar debe ser mayor a 0', 'warning');
      return;
    }

    // Si es pago a cuenta, crear pago sin remitos
    if (esPagoACuenta) {
      setIsSubmitting(true);
      try {
        const montoNumero = parseFloat(limpiarFormatoNumero(montoTotal.toString())) || 0;
        const observacionesTexto = formData.observaciones && formData.observaciones.trim() !== ''
          ? `ADELANTO - ${formData.observaciones}`
          : 'ADELANTO / PAGO A CUENTA';
        
        // Crear pago sin remito asociado pero con cliente
        const nuevoPago = {
          remito_id: null,
          cliente_id: parseInt(clienteSeleccionado),
          fecha: fechaConHora14(formData.fecha), // Guardar con hora 14:00
          monto: montoNumero,
          observaciones: `[ADELANTO] ${observacionesTexto}`,
          es_cheque: esCheque
        };
        
        await supabaseService.createPago(nuevoPago);
        
        alertNoBloqueante(`✅ Adelanto de ${formatearMonedaConSimbolo(montoNumero)} registrado correctamente`, 'success');
        
        // Limpiar formulario
        setMontoTotal(0);
        setMontoTotalVisual('');
        setFormData({ fecha: obtenerFechaLocal(), observaciones: '' });
        setEsPagoACuenta(false);
        setEsCheque(false);
        setShowForm(false);
        setShowEditModal(false);
        
        // Refrescar datos
        await invalidateCache('pagos');
        await invalidateCache('remitos');
        await refreshRelated('pagos');
        
        // Recargar pagos inmediatamente
        const pagosActualizados = await loadPagosCache(true);
        if (pagosActualizados) {
          setPagos(pagosActualizados);
        }
        
        // INVALIDAR caché de pendientes para forzar recálculo
        setPendientesClientes({});
        
      } catch (error) {
        console.error('Error al crear adelanto:', error);
        alertNoBloqueante('Error al registrar el adelanto: ' + error.message, 'error');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (remitosFiltrados.length === 0) {
      alertNoBloqueante('Este cliente no tiene remitos pendientes. Podés usar "Pago a Cuenta" para registrar un adelanto.', 'info');
      return;
    }

    // Validar límite máximo del campo monto en la base de datos
    // DECIMAL(10,2) permite hasta 99.999.999,99
    // Después de ejecutar la migración, DECIMAL(15,2) permitirá hasta 999.999.999.999,99
    const montoNumero = parseFloat(limpiarFormatoNumero(montoTotal.toString())) || 0;
    const MAX_MONTO_ACTUAL = 99999999.99; // Límite actual (DECIMAL 10,2)
    const MAX_MONTO_DESPUES_MIGRACION = 999999999999.99; // Límite después de migración (DECIMAL 15,2)
    
    // Verificar si la migración ya se ejecutó (asumimos que sí si el usuario está intentando montos mayores)
    // Por ahora, permitimos hasta el límite de la migración
    if (montoNumero > MAX_MONTO_DESPUES_MIGRACION) {
      alertNoBloqueante(
        `El monto excede el límite máximo permitido (${formatearMonedaConSimbolo(MAX_MONTO_DESPUES_MIGRACION)}). ` +
        `Por favor, divide el pago en múltiples pagos menores.`,
        'error'
      );
      return;
    }
    
    // Si el monto está entre el límite antiguo y el nuevo, advertir pero permitir
    if (montoNumero > MAX_MONTO_ACTUAL && montoNumero <= MAX_MONTO_DESPUES_MIGRACION) {
      // Asumimos que la migración ya se ejecutó, pero mostramos un mensaje informativo
      console.log('Monto mayor al límite antiguo, asumiendo que la migración se ejecutó');
    }
    
    setIsSubmitting(true);

    // Validar que todos los montos sean válidos
    // Ahora permitimos pagos mayores al saldo para generar crédito
    let totalDistribuido = 0;
    const remitosConPago = [];
    
    for (const remito of remitosFiltrados) {
      const monto = distribucionPagos[remito.id] || 0;
      // Asegurar que el monto sea un número con decimales
      const montoNumero = typeof monto === 'string' ? parseFloat(limpiarFormatoNumero(monto)) || 0 : parseFloat(monto) || 0;
      if (montoNumero > 0) {
        // Ya no validamos que el monto no exceda el saldo
        // Permitimos pagos mayores para generar crédito (saldo positivo)
        remitosConPago.push({ remito, monto: montoNumero });
        totalDistribuido += montoNumero;
      }
    }

    if (remitosConPago.length === 0) {
      alertNoBloqueante('No hay remitos con monto a pagar. Verifica la distribución.', 'warning');
      return;
    }

    try {
      // Crear UN SOLO pago que agrupe todos los remitos
      // Guardar el detalle de remitos en las observaciones en formato JSON
      const remitosDetalle = remitosConPago.map(({ remito, monto }) => ({
        remito_id: remito.id,
        remito_numero: remito.numero || `REM-${remito.id}`,
        monto: monto
      }));
      
      // Determinar si es pago completo o parcial
      const totalSaldoPendiente = remitosConPago.reduce((sum, { remito }) => {
        return sum + parseFloat(getSaldoPendiente(remito));
      }, 0);
      const esPagoCompleto = totalDistribuido >= totalSaldoPendiente;
      
      // Guardar en observaciones: texto legible + JSON para parsear después
      const observacionesTexto = formData.observaciones && formData.observaciones.trim() !== ''
        ? `${formData.observaciones}`
        : esPagoCompleto ? `Pago completo` : `Pago parcial`;
      
      // ID único para vincular este pago principal con sus ocultos
      const pagoGrupoId = `G${Date.now()}${Math.random().toString(36).slice(2, 9)}`;
      // Guardar JSON al final de las observaciones (invisible para el usuario, después de |)
      const observacionesConDetalle = `${observacionesTexto} | REMITOS_DETALLE:${JSON.stringify(remitosDetalle)} PAGO_GRUPO_ID:${pagoGrupoId}`;
      
      // OPTIMIZACIÓN: Crear todos los pagos en un solo batch insert para mejor rendimiento
      const remitoPrincipal = remitosConPago[0].remito;
      
      // Preparar pagos ocultos (mismo PAGO_GRUPO_ID para eliminar solo estos al borrar este pago)
      const pagosOcultos = remitosConPago.map(({ remito, monto }) => ({
            remito_id: remito.id,
        cliente_id: parseInt(clienteSeleccionado), // AGREGAR cliente_id
        fecha: fechaConHora14(formData.fecha),
        monto: parseFloat(monto) || 0,
            observaciones: `[OCULTO] Pago agrupado - Remito ${remito.numero || remito.id} - ${formatearMonedaConSimbolo(monto)} PAGO_GRUPO_ID:${pagoGrupoId}`,
            es_cheque: esCheque
      }));
      
      console.log('📝 Pagos ocultos a crear:', pagosOcultos.length, pagosOcultos);
      
      // Preparar todos los pagos para insertar en batch
      const pagosParaInsertar = [
        // Pagos ocultos individuales para cada remito
        ...pagosOcultos,
          // Pago principal visible
          {
            remito_id: remitoPrincipal.id,
            cliente_id: parseInt(clienteSeleccionado), // AGREGAR cliente_id
            fecha: fechaConHora14(formData.fecha), // Guardar con hora 14:00
            monto: 0, // Monto 0 porque el monto real ya está distribuido en los pagos ocultos
            observaciones: observacionesConDetalle,
            es_cheque: esCheque
          }
        ];
      
      console.log('📝 Total pagos a insertar:', pagosParaInsertar.length, pagosParaInsertar);
      
      // Insertar todos los pagos en un solo batch (mucho más rápido)
      const pagosCreados = await supabaseService.createPagosBatch(pagosParaInsertar);
      console.log('✅ Pagos creados:', pagosCreados?.length, pagosCreados);
      
      if (!pagosCreados) {
        throw new Error('Error creando pagos');
      }
      
      // Recalcular estados de todos los remitos del cliente UNA SOLA VEZ al final
      // Esto es mucho más eficiente que recalcular por cada pago individual
      if (clienteSeleccionado) {
        try {
          await supabaseService.recalcularEstadosRemitosCliente(parseInt(clienteSeleccionado));
        } catch (error) {
          console.warn('Error recalculando estados de remitos (no crítico):', error);
        }
      }
      
      // Invalidar caché y recargar datos relacionados desde la base
      invalidateCache('pagos');
      invalidateCache('remitos');
      invalidateCache('resumen');
      invalidateCache('clientes'); // Por si cambian las cuentas corrientes
      refreshRelated('pagos');
      
      // Mantener el cliente seleccionado para permitir hacer otro pago rápidamente
      const remitosCount = remitosConPago.length;
      setShowEditModal(false);
      resetForm(true);
      
      // FORZAR limpieza completa INMEDIATAMENTE después de cerrar el modal
      requestAnimationFrame(() => {
        forzarCierreModalCompleto();
      });
      
      // Recargar pagos INMEDIATAMENTE y actualizar estado local
      // Esto asegura que el nuevo pago aparezca en la tabla lo antes posible
      loadPagosCache(true)
        .then((pagosActualizados) => {
          // Actualizar estado local inmediatamente si la función devuelve datos
          if (pagosActualizados && Array.isArray(pagosActualizados)) {
            setPagos(pagosActualizados);
          }
          // INVALIDAR caché de pendientes para forzar recálculo
          setPendientesClientes({});
        })
        .catch(error => {
          console.error('Error recargando pagos:', error);
        });
      
      // Recargar otros datos en segundo plano (no bloquear la UI)
      Promise.all([
        loadRemitosCache(true), // Forzar recarga de remitos (actualizar estados)
        loadClientesCache(true) // Recargar clientes para actualizar cuentas
      ]).catch(error => {
        console.error('Error recargando datos relacionados:', error);
      });
      
      // Mostrar notificación después de un pequeño delay
      setTimeout(() => {
        alertNoBloqueante(`Pago registrado correctamente para ${remitosCount} remito(s). Puedes registrar otro pago ahora.`, 'success');
      }, 100);
    } catch (error) {
      console.error('Error guardando pago:', error);
      alertNoBloqueante('Error al guardar pago: ' + error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = (mantenerCliente = false) => {
    setFormData({
      fecha: obtenerFechaLocal(),
      observaciones: ''
    });
    if (!mantenerCliente) {
      setClienteSeleccionado('');
    }
    setDistribucionPagos({});
    setMontoTotal(0);
    setMontoTotalVisual('');
    setShowForm(false);
    setShowEditModal(false);
  };

  const handleEditPago = async (pago) => {
    // Resetear todos los estados de edición
    setEditingPago(pago);
    setRemitosEditPago([]);
    setClienteEditPago(null);
    setDistribucionEditPago({});
    setRemitosExpandidosEdit(new Set());
    setCargandoRemitosEdit(true);
    
    // Abrir modal INMEDIATAMENTE (mostrará "Cargando datos...")
    setShowEditPagoModal(true);
    
    // Obtener monto total del pago
    const montoTotalPago = obtenerMontoTotalPago(pago);
    
    // Parsear remitos desde observaciones
    const remitosDetalle = parsearRemitosDesdeObservaciones(pago.observaciones);
    const tieneMultiplesRemitos = remitosDetalle && remitosDetalle.length > 0;
    
    // Obtener observaciones sin el JSON
    const observacionesTexto = obtenerObservacionesTexto(pago.observaciones);
    
    // Inicializar datos del formulario
    // Normalizar fecha para el input (formato YYYY-MM-DD)
    let fechaNormalizada = '';
    if (pago.fecha) {
      if (pago.fecha instanceof Date) {
        fechaNormalizada = obtenerFechaLocal(pago.fecha);
      } else if (typeof pago.fecha === 'string') {
        fechaNormalizada = pago.fecha.includes('T') ? pago.fecha.split('T')[0] : pago.fecha;
      }
    }
    
    setFormDataEditPago({
      fecha: fechaNormalizada,
      monto: montoTotalPago.toString(),
      observaciones: observacionesTexto || ''
    });
    
    setMontoTotalEditPago(montoTotalPago);
    
    try {
      console.log('Iniciando carga de datos para pago:', pago.id);
      console.log('tieneMultiplesRemitos:', tieneMultiplesRemitos);
      console.log('remitosDetalle:', remitosDetalle);
      
      // SIEMPRE cargar datos del cliente, independientemente del tipo de pago
      let clienteId = null;
      let remitoPrincipal = null;
      
      if (tieneMultiplesRemitos && remitosDetalle) {
        // Pago múltiple: obtener cliente del primer remito
        remitoPrincipal = await supabaseService.getRemitos(remitosDetalle[0].remito_id);
        console.log('remitoPrincipal (múltiple):', remitoPrincipal);
      } else {
        // Pago simple: obtener remito directo
        remitoPrincipal = await supabaseService.getRemitos(pago.remito_id);
        console.log('remitoPrincipal (simple):', remitoPrincipal);
      }
      
      if (remitoPrincipal && remitoPrincipal.length > 0) {
        clienteId = remitoPrincipal[0].cliente_id;
        console.log('Cliente ID encontrado:', clienteId);
        
        // Buscar cliente en la lista
        const cliente = clientes.find(c => c.id === clienteId);
        console.log('Cliente encontrado:', cliente);
        setClienteEditPago(cliente || null);
        
        // Obtener todos los remitos del cliente
        const cuentaCorriente = await supabaseService.getCuentaCorriente(clienteId);
        console.log('Cuenta corriente:', cuentaCorriente);
        const remitosNormalizados = (cuentaCorriente.remitos || []).map(remito => ({
          ...remito,
          precio_total: aEntero(remito.precio_total || remito.precio_total_remito || 0),
          precio_total_remito: aEntero(remito.precio_total_remito || remito.precio_total || 0),
          monto_pagado: aEntero(remito.monto_pagado || 0),
          saldo_pendiente: aEntero(remito.saldo_pendiente || (remito.precio_total || 0) - (remito.monto_pagado || 0))
        }));
        setRemitosEditPago(remitosNormalizados);
        
        // Inicializar distribución de pagos
        if (tieneMultiplesRemitos && remitosDetalle) {
          // Distribución desde remitos múltiples
          const distribucionInicial = {};
          remitosDetalle.forEach(rd => {
            distribucionInicial[rd.remito_id] = aEntero(rd.monto || 0);
          });
          setDistribucionEditPago(distribucionInicial);
        } else {
          // Distribución simple
          setDistribucionEditPago({
            [pago.remito_id]: aEntero(montoTotalPago)
          });
        }
      } else {
        console.error('No se encontró remito principal');
      }
    } catch (error) {
      console.error('Error cargando remito para edición:', error);
      alertNoBloqueante('Error al cargar los remitos del pago', 'error');
    } finally {
      setCargandoRemitosEdit(false);
    }
  };

  const handleDeletePago = async (pago) => {
    const remitosDetalle = parsearRemitosDesdeObservaciones(pago.observaciones);
    const tieneMultiplesRemitos = remitosDetalle && remitosDetalle.length > 0;
    
    const montoTotalPago = obtenerMontoTotalPago(pago);
    const mensaje = tieneMultiplesRemitos
      ? `¿Estás seguro de que deseas eliminar este pago?\n\n` +
        `Monto: ${formatearMonedaConSimbolo(montoTotalPago)}\n` +
        `Remitos afectados: ${remitosDetalle.length}\n\n` +
        `Esta acción actualizará el estado de todos los remitos.`
      : `¿Estás seguro de que deseas eliminar este pago?\n\n` +
        `Remito: ${pago.remito_numero || `#${pago.remito_id}`}\n` +
        `Monto: ${formatearMonedaConSimbolo(montoTotalPago)}\n\n` +
        `Esta acción actualizará el estado del remito.`;
    
    const confirmado = await confirmNoBloqueante(mensaje);

    if (!confirmado) return;

    setEliminandoId(pago.id);
    try {
      // Obtener el cliente_id del pago ANTES de eliminarlo
      let clienteIdPago = pago.cliente_id || null;
      
      // Si no tiene cliente_id directo (pago viejo), buscar por remito
      if (!clienteIdPago && pago.remito_id) {
      try {
        const remitoPago = await supabaseService.getRemitos(pago.remito_id);
        if (remitoPago && remitoPago.length > 0) {
          clienteIdPago = remitoPago[0].cliente_id;
        }
      } catch (error) {
        console.warn('Error obteniendo cliente del remito:', error);
        }
      }
      
      // Eliminar el pago principal
      await supabaseService.deletePago(pago.id);
      
      // Si tiene múltiples remitos, eliminar también los pagos ocultos asociados
      if (tieneMultiplesRemitos && remitosDetalle) {
        // Obtener los IDs de remitos del detalle
        const remitosIds = remitosDetalle.map(r => r.remito_id);
        
        // Normalizar fecha para comparación (formato YYYY-MM-DD)
        // Manejar diferentes formatos: Date object, string ISO, string YYYY-MM-DD
        let fechaPagoNormalizada = null;
        if (pago.fecha) {
          if (pago.fecha instanceof Date) {
            fechaPagoNormalizada = obtenerFechaLocal(pago.fecha);
          } else if (typeof pago.fecha === 'string') {
            fechaPagoNormalizada = pago.fecha.includes('T') ? pago.fecha.split('T')[0] : pago.fecha;
          }
        }
        
        if (!fechaPagoNormalizada || remitosIds.length === 0) {
          console.warn('No se puede buscar pagos ocultos: fecha o remitos inválidos');
        } else {
          // Buscar TODOS los pagos ocultos relacionados con estos remitos
          // No solo por fecha, sino TODOS los que tengan [OCULTO] y estén asociados a estos remitos
          const todosPagos = await supabaseService.getPagos();
          const pagosOcultosFiltrados = todosPagos.filter(p => {
            // Verificar que el pago esté asociado a uno de los remitos afectados
            const estaEnRemitosAfectados = remitosIds.includes(p.remito_id);
            
            // Verificar que sea un pago oculto
            const esOculto = p.observaciones && typeof p.observaciones === 'string' && p.observaciones.includes('[OCULTO]');
            
            // Verificar que tenga monto > 0 (pagos reales, no principales con monto 0)
            const tieneMonto = parseFloat(p.monto || 0) > 0;
            
            // Incluir TODOS los pagos ocultos con monto > 0 asociados a estos remitos
            // No importa la fecha, solo que estén asociados a los remitos afectados
            return estaEnRemitosAfectados && esOculto && tieneMonto;
          });
            
          if (pagosOcultosFiltrados.length > 0) {
            // Eliminar todos los pagos ocultos encontrados en paralelo
            const promesasEliminacion = pagosOcultosFiltrados.map(pagoOculto => 
              supabaseService.deletePago(pagoOculto.id).catch(error => {
                console.warn(`Error eliminando pago oculto ${pagoOculto.id}:`, error);
                return null; // Continuar aunque falle uno
              })
            );
            
            await Promise.all(promesasEliminacion);
            console.log(`Eliminados ${pagosOcultosFiltrados.length} pagos ocultos asociados`);
          }
        }
      }
      
      alertNoBloqueante('Pago eliminado correctamente', 'success');
      
      // FORZAR RECARGA COMPLETA después de 500ms para evitar problemas de concurrencia
      setTimeout(async () => {
        try {
          console.log('🔄 Recargando datos después de eliminar pago...');
          
          // Invalidar TODO el caché
          await invalidateCache('pagos');
          await invalidateCache('remitos');
          await invalidateCache('resumen');
          await invalidateCache('clientes');
          
          // Recargar desde BD
          const [nuevosPagos, nuevosRemitos] = await Promise.all([
            supabaseService.getPagos(),
            supabaseService.getRemitos()
          ]);
          
          // Actualizar estados
          setPagos(nuevosPagos || []);
          setRemitos(nuevosRemitos || []);
          setPendientesClientes({});
          
          console.log('✅ Datos recargados completamente');
        } catch (error) {
          console.error('Error en recarga post-eliminación:', error);
        }
      }, 500);
    } catch (error) {
      console.error('Error eliminando pago:', error);
      alertNoBloqueante('Error al eliminar pago: ' + error.message, 'error');
    } finally {
      setEliminandoId(null);
    }
  };

  const handleAplicarAdelanto = async (adelanto) => {
    if (!adelanto || adelanto.remito_id !== null) {
      alertNoBloqueante('Este pago no es un adelanto', 'warning');
      return;
    }

    try {
      const clienteId = adelanto.cliente_id ? parseInt(adelanto.cliente_id, 10) : null;
      if (!clienteId) {
        alertNoBloqueante('Este adelanto no tiene cliente asociado', 'warning');
        return;
      }

      // Obtener remitos del cliente desde la base (no depender del caché)
      const cuentaCorriente = await supabaseService.getCuentaCorriente(clienteId);
      if (!cuentaCorriente || !cuentaCorriente.remitos || cuentaCorriente.remitos.length === 0) {
        alertNoBloqueante('Este cliente no tiene remitos para aplicar el adelanto', 'info');
        return;
      }

      // Filtrar solo remitos con saldo pendiente > 0
      const remitosCliente = cuentaCorriente.remitos
        .map(r => ({
          ...r,
          precio_total: parseFloat(r.precio_total || 0),
          monto_pagado: parseFloat(r.monto_pagado || 0)
        }))
        .filter(r => {
          const total = r.precio_total || 0;
          const pagado = r.monto_pagado || 0;
          const pendiente = total - pagado;
          return total > 0 && pendiente > 0;
        });

      if (remitosCliente.length === 0) {
        alertNoBloqueante('Este cliente no tiene remitos pendientes para aplicar el adelanto', 'info');
        return;
      }

      setAdelantoAplicar(adelanto);
      setRemitosParaAdelanto(remitosCliente);
      setDistribucionAdelanto({});
      setShowAplicarAdelantoModal(true);
    } catch (error) {
      console.error('Error preparando aplicación de adelanto:', error);
      alertNoBloqueante('Error: ' + (error.message || 'No se pudieron cargar los remitos'), 'error');
    }
  };

  const handleConfirmarAplicarAdelanto = async () => {
    if (!adelantoAplicar) return;

    try {
      const remitosConPago = Object.entries(distribucionAdelanto)
        .filter(([remitoId, monto]) => aEntero(monto || 0) > 0)
        .map(([remitoId, monto]) => ({
          remito: remitosParaAdelanto.find(r => r.id === parseInt(remitoId)),
          monto: aEntero(monto)
        }));

      if (remitosConPago.length === 0) {
        alertNoBloqueante('Debes asignar al menos un monto a un remito', 'warning');
        return;
      }

      const totalDistribuido = remitosConPago.reduce((sum, { monto }) => sum + monto, 0);
      const montoAdelanto = parseFloat(adelantoAplicar.monto || 0);

      if (totalDistribuido > montoAdelanto) {
        alertNoBloqueante('No puedes distribuir más dinero del que tiene el adelanto', 'warning');
        return;
      }

      // Eliminar el adelanto original
      await supabaseService.deletePago(adelantoAplicar.id);

      // Crear nuevo pago distribuido con PAGO_GRUPO_ID
      const remitosDetalle = remitosConPago.map(({ remito, monto }) => ({
        remito_id: remito.id,
        remito_numero: remito.numero || `REM-${remito.id}`,
        monto: monto
      }));

      const pagoGrupoId = `G${Date.now()}${Math.random().toString(36).slice(2, 9)}`;
      const observacionesConDetalle = `Adelanto aplicado | REMITOS_DETALLE:${JSON.stringify(remitosDetalle)} PAGO_GRUPO_ID:${pagoGrupoId}`;
      
      const pagosOcultos = remitosConPago.map(({ remito, monto }) => ({
        remito_id: remito.id,
        cliente_id: adelantoAplicar.cliente_id,
        fecha: adelantoAplicar.fecha,
        monto: monto,
        observaciones: `[OCULTO] Pago agrupado - Remito ${remito.numero || remito.id} - ${formatearMonedaConSimbolo(monto)} PAGO_GRUPO_ID:${pagoGrupoId}`,
        es_cheque: adelantoAplicar.es_cheque || false
      }));

      const pagosParaInsertar = [
        ...pagosOcultos,
        {
          remito_id: remitosConPago[0].remito.id,
          cliente_id: adelantoAplicar.cliente_id,
          fecha: adelantoAplicar.fecha,
          monto: 0,
          observaciones: observacionesConDetalle,
          es_cheque: adelantoAplicar.es_cheque || false
        }
      ];

      // Si queda dinero del adelanto, crear adelanto residual
      const montoResidual = montoAdelanto - totalDistribuido;
      if (montoResidual > 0) {
        pagosParaInsertar.push({
          remito_id: null,
          cliente_id: adelantoAplicar.cliente_id,
          fecha: adelantoAplicar.fecha,
          monto: montoResidual,
          observaciones: `[ADELANTO] Residual - ${formatearMonedaConSimbolo(montoResidual)}`,
          es_cheque: false
        });
      }

      await supabaseService.createPagosBatch(pagosParaInsertar);

      // Invalidar caché y recargar con delay
      setTimeout(async () => {
        await invalidateCache('pagos');
        await invalidateCache('remitos');
        const pagosActualizados = await supabaseService.getPagos();
        setPagos(pagosActualizados || []);
        setPendientesClientes({});
      }, 500);

      setShowAplicarAdelantoModal(false);
      setAdelantoAplicar(null);
      alertNoBloqueante(`✅ Adelanto aplicado correctamente`, 'success');
    } catch (error) {
      console.error('Error aplicando adelanto:', error);
      alertNoBloqueante('Error al aplicar adelanto: ' + error.message, 'error');
    }
  };

  const handleSubmitEditPago = async (e) => {
    e.preventDefault();
    
    if (isSubmitting || !editingPago) return;

    const montoTotal = aEntero(montoTotalEditPago);
    if (!montoTotal || montoTotal <= 0) {
      alertNoBloqueante('El monto debe ser mayor a 0', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      // Si hay múltiples remitos, necesitamos actualizar la distribución
      const remitosConPago = Object.entries(distribucionEditPago)
        .filter(([remitoId, monto]) => aEntero(monto || 0) > 0)
        .map(([remitoId, monto]) => ({
          remito_id: parseInt(remitoId, 10),
          monto: aEntero(monto)
        }));

      if (remitosConPago.length === 0) {
        alertNoBloqueante('Debes asignar al menos un monto a un remito', 'warning');
        setIsSubmitting(false);
        return;
      }

      // Preparar observaciones con el detalle de remitos
      const remitosDetalleJSON = JSON.stringify(remitosConPago.map(r => ({
        remito_id: r.remito_id,
        monto: r.monto
      })));
      const observacionesFinal = formDataEditPago.observaciones 
        ? `${formDataEditPago.observaciones} | REMITOS_DETALLE:${remitosDetalleJSON}`
        : `REMITOS_DETALLE:${remitosDetalleJSON}`;

      // Actualizar el pago principal
      await supabaseService.updatePago(editingPago.id, {
        fecha: fechaConHora14(formDataEditPago.fecha), // Guardar con hora 14:00
        monto: 0, // El monto real está en los pagos ocultos
        observaciones: observacionesFinal
      });

      // Eliminar pagos ocultos anteriores si existen
      const remitosDetalleAnterior = parsearRemitosDesdeObservaciones(editingPago.observaciones);
      if (remitosDetalleAnterior && remitosDetalleAnterior.length > 0) {
        const remitosIdsAnteriores = remitosDetalleAnterior.map(r => r.remito_id);
        
        // Normalizar fecha para comparación
        let fechaPagoNormalizada = formDataEditPago.fecha;
        if (!fechaPagoNormalizada && editingPago.fecha) {
          if (editingPago.fecha instanceof Date) {
            fechaPagoNormalizada = editingPago.fecha.toISOString().split('T')[0];
          } else if (typeof editingPago.fecha === 'string') {
            fechaPagoNormalizada = editingPago.fecha.includes('T') ? editingPago.fecha.split('T')[0] : editingPago.fecha;
          }
        }
        
        // Obtener todos los pagos y filtrar los ocultos anteriores
        const todosPagos = await supabaseService.getPagos();
        const pagosOcultosFiltrados = todosPagos.filter(p => {
          // Normalizar fecha del pago a comparar
          let fechaPagoComparar = null;
          if (p.fecha) {
            if (p.fecha instanceof Date) {
              fechaPagoComparar = p.fecha.toISOString().split('T')[0];
            } else if (typeof p.fecha === 'string') {
              fechaPagoComparar = p.fecha.includes('T') ? p.fecha.split('T')[0] : p.fecha;
            }
          }
          
          return remitosIdsAnteriores.includes(p.remito_id) &&
            fechaPagoComparar === fechaPagoNormalizada &&
            p.observaciones && typeof p.observaciones === 'string' && p.observaciones.includes('[OCULTO]');
        });
          
        // Eliminar pagos ocultos anteriores
        for (const pago of pagosOcultosFiltrados) {
          await supabaseService.deletePago(pago.id);
        }
      }

      // Crear nuevos pagos ocultos para cada remito
      const pagosOcultosData = remitosConPago.map(r => ({
        remito_id: r.remito_id,
        fecha: formDataEditPago.fecha,
        monto: r.monto,
        observaciones: `[OCULTO] Pago parte del pago principal #${editingPago.id}`
      }));

      if (pagosOcultosData.length > 0) {
        await supabaseService.createPagosBatch(pagosOcultosData);
      }

      // Recalcular estados del cliente
      if (clienteEditPago && clienteEditPago.id) {
        await supabaseService.recalcularEstadosRemitosCliente(clienteEditPago.id);
      }
      
      // Invalidar caché y recargar datos
      invalidateCache('pagos');
      invalidateCache('remitos');
      invalidateCache('resumen');
      invalidateCache('clientes');
      refreshRelated('pagos');
      
      await Promise.all([
        loadPagosCache(true),
        loadRemitosCache(true),
        loadClientesCache(true)
      ]);
      
      // Forzar actualización del estado directamente para evitar que desaparezcan los pagos
      const nuevosPagos = await supabaseService.getPagos();
      setPagos(nuevosPagos || []);
      
      // INVALIDAR caché de pendientes para forzar recálculo
      setPendientesClientes({});
      
      setShowEditPagoModal(false);
      resetEditPagoForm();
      alertNoBloqueante('Pago actualizado correctamente', 'success');
    } catch (error) {
      console.error('Error actualizando pago:', error);
      alertNoBloqueante('Error al actualizar pago: ' + error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetEditPagoForm = () => {
    setEditingPago(null);
    setFormDataEditPago({ fecha: '', monto: '', observaciones: '' });
    setRemitosEditPago([]);
    setClienteEditPago(null);
    setDistribucionEditPago({});
    setMontoTotalEditPago(0);
    setRemitosExpandidosEdit(new Set());
    setCargandoRemitosEdit(false);
    setShowEditPagoModal(false);
  };

  // Función para distribuir automáticamente el monto en la edición
  const distribuirAutomaticamenteEditPago = (monto) => {
    if (!remitosEditPago || remitosEditPago.length === 0 || monto <= 0) {
      setDistribucionEditPago({});
      return;
    }

    // Obtener todos los remitos válidos ordenados por fecha (más antiguo primero)
    const remitosOrdenados = remitosEditPago
      .filter(r => aEntero(r.precio_total || 0) > 0)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    const nuevaDistribucion = {};
    let montoRestante = aEntero(monto);

    // Primero distribuir en remitos pendientes
    for (const remito of remitosOrdenados) {
      nuevaDistribucion[remito.id] = 0;
      
      if (montoRestante <= 0) {
        continue;
      }

      const saldoRemito = aEntero(getSaldoPendiente(remito));
      
      if (saldoRemito > 0) {
        const montoAPagar = Math.min(montoRestante, saldoRemito);
        nuevaDistribucion[remito.id] = montoAPagar;
        montoRestante -= montoAPagar;
      }
    }
    
    // Si después de pagar todos los remitos completos todavía hay monto restante,
    // aplicarlo como crédito adicional al primer remito pendiente
    if (montoRestante > 0 && remitosOrdenados.length > 0) {
      const primerRemitoPendiente = remitosOrdenados.find(r => getSaldoPendiente(r) > 0) || remitosOrdenados[0];
      if (primerRemitoPendiente) {
        nuevaDistribucion[primerRemitoPendiente.id] = aEntero((nuevaDistribucion[primerRemitoPendiente.id] || 0) + montoRestante);
      }
    }

    setDistribucionEditPago(nuevaDistribucion);
  };

  // Manejar cambio de monto total en edición (con preservación de cursor)
  const handleMontoTotalEditChange = (e) => {
    const input = e.target;
    const cursorPosition = input.selectionStart;
    const valorAnterior = input.value;
    
    // Permitir dígitos, puntos (miles) y coma (decimal)
    let valor = e.target.value.replace(/[^\d.,]/g, '');
    // Solo permitir una coma decimal
    const partes = valor.split(',');
    if (partes.length > 2) {
      valor = partes[0] + ',' + partes.slice(1).join('');
    }
    
    // Si el campo está vacío, mantenerlo vacío
    if (valor === '' || valor === null || valor === undefined) {
      setMontoTotalEditPago('');
      setDistribucionEditPago({});
      return;
    }
    
    // Si empieza con coma (ej: ",09"), mantenerlo como string temporalmente
    // pero calcular el valor numérico para el estado
    let nuevoMonto = 0;
    if (valor.startsWith(',')) {
      // Permitir valores como ",09" mientras se escribe
      const decimales = valor.substring(1).replace(/[^\d]/g, '').slice(0, 2);
      if (decimales) {
        nuevoMonto = parseFloat('0.' + decimales) || 0;
      } else {
        nuevoMonto = 0;
      }
    } else {
      // Limpiar formato para obtener número puro
      const valorLimpio = limpiarFormatoNumero(valor);
      nuevoMonto = valorLimpio === '' ? 0 : parseFloat(valorLimpio) || 0;
    }
    
    setMontoTotalEditPago(nuevoMonto);
    const valorLimpio = limpiarFormatoNumero(valor);
    setFormDataEditPago({ ...formDataEditPago, monto: valorLimpio === '' ? '' : valorLimpio });
    
    // Formatear el valor para mostrar (mantener formato mientras se escribe)
    const valorFormateado = formatearNumeroVisual(valor);
    
    // Calcular nueva posición del cursor
    // Si el valor formateado cambió, ajustar posición
    if (valorFormateado !== valor) {
      // Contar dígitos antes del cursor en el valor anterior
      const digitosAntesCursor = valorAnterior.substring(0, cursorPosition).replace(/[^\d]/g, '').length;
      
      // Encontrar posición equivalente en el valor formateado
      let nuevaPosicion = 0;
      let digitosContados = 0;
      for (let i = 0; i < valorFormateado.length; i++) {
        if (valorFormateado[i] === '.' || valorFormateado[i] === ',') {
          nuevaPosicion++;
        } else {
          digitosContados++;
          if (digitosContados > digitosAntesCursor) {
            break;
          }
          nuevaPosicion++;
        }
      }
      
      // Restaurar la posición del cursor después de que React actualice el DOM
      setTimeout(() => {
        input.setSelectionRange(nuevaPosicion, nuevaPosicion);
      }, 0);
    }
    
    // Redistribuir automáticamente
    distribuirAutomaticamenteEditPago(nuevoMonto);
  };

  // Toggle expandir remito en edición
  const toggleRemitoExpandidoEdit = (remitoId) => {
    const nuevosExpandidos = new Set(remitosExpandidosEdit);
    if (nuevosExpandidos.has(remitoId)) {
      nuevosExpandidos.delete(remitoId);
    } else {
      nuevosExpandidos.add(remitoId);
    }
    setRemitosExpandidosEdit(nuevosExpandidos);
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ margin: 0 }}>Registro de Pagos</h2>
          <button className="btn btn-primary" onClick={() => {
            setFormData({
              fecha: obtenerFechaLocal(),
              observaciones: ''
            });
            setDistribucionPagos({});
            setMontoTotal(0);
    setMontoTotalVisual('');
            setClienteSeleccionado('');
            setBusquedaCliente('');
            setShowForm(true);
            setShowEditModal(true);
          }} style={{ padding: '10px 20px' }}>
            ➕ Nuevo Pago
          </button>
        </div>

      {/* Modal flotante para crear pago */}
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
              confirmNoBloqueante('¿Deseas cancelar? Los cambios no guardados se perderán.').then((confirmado) => {
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
              maxWidth: '1000px',
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
                ➕ Nuevo Pago
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

            <form onSubmit={handleSubmit} style={{ color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
              <div className="form-row">
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Cliente *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={clienteSeleccionado ? (clientes.find(c => c.id === parseInt(clienteSeleccionado))?.nombre || busquedaCliente) : busquedaCliente}
                  onChange={handleBuscarCliente}
                  onFocus={(e) => {
                    e.target.select();
                    if (!clienteSeleccionado && clientes.length > 0) {
                      setClientesFiltrados(clientes);
                      setMostrarLista(true);
                    } else if (busquedaCliente) {
                      setMostrarLista(true);
                    }
                  }}
                  onBlur={(e) => {
                    const relatedTarget = e.relatedTarget;
                    if (!relatedTarget || !relatedTarget.closest('[data-dropdown-list]')) {
                      setTimeout(() => setMostrarLista(false), 200);
                    }
                  }}
                  autoComplete="off"
                  placeholder={clienteSeleccionado ? '' : "Buscar cliente..."}
                  required={!clienteSeleccionado}
                  style={{ 
                    width: '100%', 
                    paddingRight: clienteSeleccionado ? '80px' : '10px',
                    backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                    color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                    border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
                  }}
                />
                {clienteSeleccionado && (
                  <button
                    type="button"
                    onClick={handleLimpiarCliente}
                    style={{
                      position: 'absolute',
                      right: '5px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    ✕ Limpiar
                  </button>
                )}
                
                {/* Lista desplegable de clientes filtrados */}
                {((busquedaCliente && !clienteSeleccionado && clientesFiltrados.length > 0) || mostrarLista) && (
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
                  }}
                  data-dropdown-list
                  >
                    {(mostrarLista && clientesFiltrados.length === 0 && busquedaCliente) ? (
                      <div style={{
                        padding: '15px',
                        textAlign: 'center',
                        color: theme === 'dark' ? '#999' : '#666',
                        fontStyle: 'italic'
                      }}>
                        No se encontraron clientes
                      </div>
                    ) : (
                      clientesFiltrados.map(cliente => {
                        // Usar pendiente desde el estado (calculado por useEffect)
                        const totalPendiente = pendientesClientes[cliente.id] || 0;
                        
                        return (
                          <div
                            key={cliente.id}
                            onMouseDown={(e) => {
                              // Prevenir que el blur oculte la lista antes del click
                              e.preventDefault();
                            }}
                            onClick={() => handleSeleccionarCliente(cliente)}
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
                            {totalPendiente > 0 && (
                              <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '3px' }}>
                                Pendiente: {formatearMonedaConSimbolo(totalPendiente)}
                              </div>
                            )}
                            {cliente.telefono && (
                              <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', marginTop: '2px' }}>
                                📞 {cliente.telefono}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Fecha *</label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Monto Total a Pagar *</label>
              <input
                type="text"
                value={montoTotalVisual || ''}
                onChange={handleMontoTotalChange}
                onWheel={(e) => e.target.blur()}
                placeholder="0,00"
                required
              />
              <small style={{ color: theme === 'dark' ? '#999' : '#666', display: 'block', marginTop: '5px' }}>
                {clienteSeleccionado && remitosFiltrados.length > 0 && !esPagoACuenta && (
                  <>Se distribuirá automáticamente por orden de antigüedad (más viejo primero) en los {remitosFiltrados.length} remito(s) pendiente(s)</>
                )}
                {esPagoACuenta && (
                  <span style={{ color: '#28a745' }}>💰 Este pago se registrará como adelanto a cuenta del cliente</span>
                )}
                {(!montoTotal || aEntero(montoTotal) <= 0) && (
                  <span style={{ color: '#dc3545', display: 'block', marginTop: '5px' }}>⚠️ El monto debe ser mayor a 0</span>
                )}
              </small>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="pagoACuenta1"
                checked={esPagoACuenta}
                onChange={(e) => setEsPagoACuenta(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="pagoACuenta1" style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold', color: esPagoACuenta ? '#28a745' : 'inherit' }}>
                💰 Pago a Cuenta / Adelanto (sin remitos)
              </label>
            </div>
            <div className="form-group" style={{ marginTop: '10px' }}>
              <label>Detalle (opcional)</label>
              <input
                type="text"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                placeholder="Ej: Efectivo, Transferencia, N° Cheque..."
                style={{ width: '100%' }}
              />
          </div>

            {/* Checkbox para cheque */}
            <div style={{ marginTop: '15px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                cursor: 'pointer',
                padding: '10px 15px',
                backgroundColor: esCheque ? (theme === 'dark' ? '#3a4a3a' : '#e8f5e9') : 'transparent',
                borderRadius: '8px',
                border: `1px solid ${esCheque ? '#4caf50' : (theme === 'dark' ? '#555' : '#ddd')}`
              }}>
                <input
                  type="checkbox"
                  checked={esCheque}
                  onChange={(e) => setEsCheque(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: esCheque ? 'bold' : 'normal' }}>
                  🏦 Es un Cheque
                </span>
              </label>
            </div>
          </div>

          {clienteSeleccionado && !esPagoACuenta && (
            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              {clienteActual && (
                <div style={{ 
                  backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e7f3ff', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  marginBottom: '15px',
                  border: `1px solid ${theme === 'dark' ? '#5dade2' : '#007bff'}`,
                  color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{clienteActual.nombre}</h3>
                  {clienteActual.telefono && <div>Teléfono: {clienteActual.telefono}</div>}
                  {clienteActual.direccion && <div>Dirección: {clienteActual.direccion}</div>}
                </div>
              )}
              {cargandoRemitos ? (
                <p style={{ color: theme === 'dark' ? '#5dade2' : '#007bff', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
                  ⏳ Cargando datos...
                </p>
              ) : Object.keys(remitosPorCliente).length === 0 ? (
                <p style={{ color: theme === 'dark' ? '#999' : '#666', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
                  Este cliente no tiene remitos registrados
                </p>
              ) : (
              Object.values(remitosPorCliente).map((grupo) => {
                const totales = calcularTotalesCliente(grupo.cliente_id);
                return (
                  <div key={grupo.cliente_id} style={{ 
                    border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, 
                    borderRadius: '8px', 
                    padding: '15px', 
                    marginBottom: '15px',
                    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                    color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '10px',
                      paddingBottom: '10px',
                      borderBottom: `2px solid ${theme === 'dark' ? '#5dade2' : '#007bff'}`
                    }}>
                      <div>
                        <strong style={{ fontSize: '16px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{grupo.cliente_nombre}</strong>
                        <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', marginTop: '5px' }}>
                          {grupo.remitos.length} remito(s) pendiente(s)
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', color: theme === 'dark' ? '#999' : '#666' }}>
                          Total: {formatearMonedaConSimbolo(totales.totalRemitos)} | 
                          Pagado: {formatearMonedaConSimbolo(totales.totalPagado)}
                        </div>
                        <div style={{ fontSize: '16px', color: '#dc3545', fontWeight: 'bold' }}>
                          Pendiente: {formatearMonedaConSimbolo(totales.totalPendiente)}
                        </div>
                      </div>
                    </div>

                    <table style={{ width: '100%', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ backgroundColor: theme === 'dark' ? '#404040' : '#f8f9fa' }}>
                          <th style={{ padding: '8px', textAlign: 'center', width: '40px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}></th>
                          <th style={{ padding: '8px', textAlign: 'left', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Remito</th>
                          <th style={{ padding: '8px', textAlign: 'left', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Fecha</th>
                          <th style={{ padding: '8px', textAlign: 'right', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Total</th>
                          <th style={{ padding: '8px', textAlign: 'right', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Pagado</th>
                          <th style={{ padding: '8px', textAlign: 'right', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Saldo</th>
                          <th style={{ padding: '8px', textAlign: 'right', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Monto a Pagar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.remitos.map(remito => {
                          const saldo = getSaldoPendiente(remito);
                          const montoDistribuido = distribucionPagos[remito.id] || 0;
                          const tienePago = montoDistribuido > 0;
                          const generaCredito = montoDistribuido > saldo;
                          const estaExpandido = remitosExpandidos.has(remito.id);
                          const articulos = remito.articulos || [];
                          
                          const bgColor = tienePago 
                            ? (generaCredito 
                                ? (theme === 'dark' ? '#4a3a1a' : '#fff3cd')
                                : (theme === 'dark' ? '#1e3a5f' : '#e7f3ff'))
                            : 'transparent';
                          
                          return (
                            <React.Fragment key={remito.id}>
                              <tr 
                                style={{ 
                                  backgroundColor: bgColor,
                                  color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                                  cursor: 'pointer'
                                }}
                                onClick={() => toggleRemitoExpandido(remito.id)}
                              >
                                <td 
                                  style={{ padding: '8px', textAlign: 'center' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    className="btn btn-sm"
                                    style={{ 
                                      padding: '2px 6px', 
                                      fontSize: '12px',
                                      border: 'none',
                                      background: 'transparent',
                                      cursor: 'pointer',
                                      color: theme === 'dark' ? '#5dade2' : 'inherit',
                                      pointerEvents: 'auto'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      toggleRemitoExpandido(remito.id);
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                    }}
                                    title={estaExpandido ? 'Contraer' : 'Expandir'}
                                  >
                                    {estaExpandido ? '▼' : '▶'}
                                  </button>
                                </td>
                                <td style={{ padding: '8px' }}>
                                  <strong>{remito.numero || `#${remito.id}`}</strong>
                                </td>
                                <td style={{ padding: '8px' }}>
                                  {new Date(remito.fecha).toLocaleDateString('es-AR')}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>
                                  {formatearMonedaConSimbolo(remito.precio_total || 0)}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>
                                  {formatearMonedaConSimbolo(remito.monto_pagado || 0)}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right', color: '#dc3545', fontWeight: 'bold' }}>
                                  {formatearMonedaConSimbolo(saldo)}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                      value={(() => {
                                        if (montoDistribuido === 0 || montoDistribuido === '' || montoDistribuido === null || montoDistribuido === undefined) {
                                          return '';
                                        }
                                        return formatearMoneda(montoDistribuido);
                                      })()}
                                      onChange={(e) => {
                                        let valor = e.target.value.replace(/[^\d.,]/g, '');
                                        // Solo permitir una coma decimal
                                        const partes = valor.split(',');
                                        if (partes.length > 2) {
                                          valor = partes[0] + ',' + partes.slice(1).join('');
                                        }
                                        // Limitar decimales a 2 dígitos
                                        if (valor.includes(',')) {
                                          const partesComa = valor.split(',');
                                          if (partesComa[1] && partesComa[1].length > 2) {
                                            valor = partesComa[0] + ',' + partesComa[1].substring(0, 2);
                                          }
                                        }
                                        
                                        // Si está vacío, limpiar
                                        if (valor === '' || valor === null || valor === undefined) {
                                          setDistribucionPagos({
                                            ...distribucionPagos,
                                            [remito.id]: 0
                                          });
                                          return;
                                        }
                                        
                                        // Limpiar formato y convertir a número
                                        const valorLimpio = limpiarFormatoNumero(valor);
                                        const nuevoMonto = valorLimpio === '' ? 0 : parseFloat(valorLimpio) || 0;
                                        
                                        setDistribucionPagos({
                                          ...distribucionPagos,
                                          [remito.id]: nuevoMonto
                                        });
                                      }}
                                      placeholder="0,00"
                                    onWheel={(e) => e.target.blur()}
                                    autoComplete="off"
                                    style={{ 
                                      width: '120px', 
                                      padding: '5px',
                                      textAlign: 'right',
                                      border: tienePago ? (generaCredito ? '1px solid #ffc107' : '1px solid #28a745') : `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                                      borderRadius: '4px',
                                      backgroundColor: tienePago 
                                        ? (generaCredito 
                                            ? (theme === 'dark' ? '#4a3a1a' : '#fff3cd')
                                            : (theme === 'dark' ? '#1e3a5f' : '#d4edda'))
                                        : (theme === 'dark' ? '#404040' : '#f8f9fa'),
                                      color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                                      fontWeight: tienePago ? 'bold' : 'normal'
                                    }}
                                  />
                                  {generaCredito && (
                                    <small style={{ display: 'block', color: theme === 'dark' ? '#ffd700' : '#856404', marginTop: '2px' }}>
                                      Crédito: {formatearMonedaConSimbolo(montoDistribuido - saldo)}
                                    </small>
                                  )}
                                </td>
                              </tr>
                              {estaExpandido && articulos.length > 0 && (
                                <tr style={{ backgroundColor: theme === 'dark' ? '#333' : '#f9f9f9' }}>
                                  <td colSpan="7" style={{ padding: '15px', paddingLeft: '50px' }}>
                                    <div style={{ marginLeft: '20px' }}>
                                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Artículos del Remito:</h4>
                                      <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                                        <thead>
                                          <tr style={{ backgroundColor: theme === 'dark' ? '#404040' : '#e9ecef', fontWeight: 'bold' }}>
                                            <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Código</th>
                                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Artículo</th>
                                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Cantidad</th>
                                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Precio Unitario</th>
                                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Precio Total</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {articulos.map((articulo, index) => (
                                            <tr key={index} style={{ borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}` }}>
                                              <td style={{ 
                                                padding: '8px', 
                                                textAlign: 'center',
                                                fontFamily: 'monospace',
                                                fontWeight: 'bold',
                                                color: theme === 'dark' ? '#5dade2' : '#007bff'
                                              }}>
                                                {articulo.articulo_codigo || '-'}
                                              </td>
                                              <td style={{ padding: '8px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{articulo.articulo_nombre || '-'}</td>
                                              <td style={{ padding: '8px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{formatearCantidad(Math.round(articulo.cantidad || 0))}</td>
                                              <td style={{ padding: '8px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{formatearMonedaConSimbolo(articulo.precio_unitario || 0)}</td>
                                              <td style={{ padding: '8px', fontWeight: 'bold', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{formatearMonedaConSimbolo(articulo.precio_total || 0)}</td>
                                            </tr>
                                          ))}
                                          <tr style={{ backgroundColor: theme === 'dark' ? '#404040' : '#e9ecef', fontWeight: 'bold' }}>
                                            <td style={{ padding: '8px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }} colSpan="4">TOTAL:</td>
                                            <td style={{ padding: '8px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{formatearMonedaConSimbolo(remito.precio_total || 0)}</td>
                                          </tr>
                                        </tbody>
                                      </table>
                                      {remito.observaciones && (
                                        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: theme === 'dark' ? '#404040' : '#fff', borderRadius: '4px', border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                                          <strong>Observaciones:</strong> {remito.observaciones}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>

                    <div style={{ 
                      marginTop: '10px', 
                      padding: '10px', 
                      backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e7f3ff', 
                      borderRadius: '4px',
                      color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                    }}>
                      <strong>Total a pagar de este cliente: {
                        formatearMonedaConSimbolo(
                          grupo.remitos.reduce((sum, r) => sum + parseFloat(distribucionPagos[r.id] || 0), 0)
                        )
                      }</strong>
                    </div>
                  </div>
                );
              })
              )}
            </div>
          )}

          {!clienteSeleccionado && (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              backgroundColor: theme === 'dark' ? '#4a3a1a' : '#fff3cd',
              borderRadius: '8px',
              marginTop: '20px'
            }}>
              <p style={{ color: theme === 'dark' ? '#ffd700' : '#856404', fontSize: '16px' }}>
                👆 Selecciona un cliente arriba para ver sus remitos pendientes
              </p>
            </div>
          )}

          {clienteSeleccionado && remitosFiltrados.length > 0 && (
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: theme === 'dark' ? '#4a3a1a' : '#fff3cd', 
              borderRadius: '8px',
              border: `1px solid ${theme === 'dark' ? '#ffd700' : '#ffc107'}`,
              color: theme === 'dark' ? '#e0e0e0' : 'inherit'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Resumen del Pago</strong>
              </div>
              <div style={{ fontSize: '14px' }}>
                <div>Remitos pendientes: <strong>{remitosFiltrados.length}</strong></div>
                <div>Total a pagar: <strong style={{ color: '#28a745', fontSize: '16px' }}>
                  {formatearMonedaConSimbolo(
                    Object.values(distribucionPagos).reduce((sum, monto) => sum + parseFloat(monto || 0), 0)
                  )}
                </strong></div>
                <div style={{ marginTop: '5px', fontSize: '12px', color: theme === 'dark' ? '#999' : '#666' }}>
                  💡 El pago se distribuye automáticamente: primero el remito más antiguo, luego el siguiente, y así sucesivamente.
                  {Object.values(distribucionPagos).some((monto, idx) => {
                    const remito = remitosFiltrados[idx];
                    return remito && monto > getSaldoPendiente(remito);
                  }) && (
                    <div style={{ marginTop: '5px', color: theme === 'dark' ? '#ffd700' : '#856404', fontWeight: 'bold' }}>
                      ⚠️ El monto excede el saldo pendiente. Se generará crédito (saldo positivo) para el cliente.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    confirmNoBloqueante('¿Deseas cancelar? Los cambios no guardados se perderán.').then((confirmado) => {
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
                  disabled={isSubmitting || !clienteSeleccionado || !montoTotal || montoTotal <= 0}
                >
                  {isSubmitting ? '⏳ Registrando...' : '✅ Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulario inline (oculto cuando hay modal) */}
      {showForm && !showEditModal && (
        <form onSubmit={handleSubmit} style={{ marginTop: '20px', padding: '20px', backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f9f9f9', borderRadius: '8px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
          <div className="form-row">
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Cliente *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={clienteSeleccionado ? (clientes.find(c => c.id === parseInt(clienteSeleccionado))?.nombre || busquedaCliente) : busquedaCliente}
                  onChange={handleBuscarCliente}
                  onFocus={() => {
                    if (!clienteSeleccionado && clientes.length > 0) {
                      setClientesFiltrados(clientes);
                      setMostrarLista(true);
                    } else if (busquedaCliente) {
                      setMostrarLista(true);
                    }
                  }}
                  onBlur={(e) => {
                    const relatedTarget = e.relatedTarget;
                    if (!relatedTarget || !relatedTarget.closest('[data-dropdown-list]')) {
                      setTimeout(() => setMostrarLista(false), 200);
                    }
                  }}
                  autoComplete="off"
                  placeholder={clienteSeleccionado ? '' : "Buscar cliente..."}
                  required={!clienteSeleccionado}
                  style={{ 
                    width: '100%', 
                    paddingRight: clienteSeleccionado ? '80px' : '10px',
                    backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                    color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                    border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
                  }}
                />
                {clienteSeleccionado && (
                  <button
                    type="button"
                    onClick={handleLimpiarCliente}
                    style={{
                      position: 'absolute',
                      right: '5px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    ✕ Limpiar
                  </button>
                )}
                
                {((busquedaCliente && !clienteSeleccionado && clientesFiltrados.length > 0) || mostrarLista) && (
                  <div 
                    data-dropdown-list
                    style={{
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
                    {(mostrarLista && clientesFiltrados.length === 0 && busquedaCliente) ? (
                      <div style={{
                        padding: '15px',
                        textAlign: 'center',
                        color: theme === 'dark' ? '#999' : '#666',
                        fontStyle: 'italic'
                      }}>
                        No se encontraron clientes
                      </div>
                    ) : (
                      clientesFiltrados.map(cliente => {
                        // Calcular solo pendientes positivos (lo que realmente adeuda)
                        // Para que coincida con lo que se muestra en Clientes
                        const remitosCliente = remitos.filter(r => r.cliente_id === cliente.id);
                        const totalPendiente = remitosCliente.reduce((sum, r) => {
                          const saldo = getSaldoPendiente(r);
                          // Solo sumar pendientes positivos (adeuda), no saldos a favor
                          return sum + (saldo > 0 ? saldo : 0);
                        }, 0);
                        
                        return (
                          <div
                            key={cliente.id}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSeleccionarCliente(cliente)}
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
                            {totalPendiente > 0 && (
                              <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '3px' }}>
                                Pendiente: {formatearMonedaConSimbolo(totalPendiente)}
                              </div>
                            )}
                            {cliente.telefono && (
                              <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', marginTop: '2px' }}>
                                📞 {cliente.telefono}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Fecha *</label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Monto Total a Pagar *</label>
              <input
                type="text"
                value={montoTotalVisual || ''}
                onChange={handleMontoTotalChange}
                onWheel={(e) => e.target.blur()}
                placeholder="0,00"
                required
              />
              <small style={{ color: theme === 'dark' ? '#999' : '#666', display: 'block', marginTop: '5px' }}>
                {clienteSeleccionado && remitosFiltrados.length > 0 && (
                  <>Se distribuirá automáticamente por orden de antigüedad (más viejo primero) en los {remitosFiltrados.length} remito(s) pendiente(s)</>
                )}
                {(!montoTotal || aEntero(montoTotal) <= 0) && (
                  <span style={{ color: '#dc3545', display: 'block', marginTop: '5px' }}>⚠️ El monto debe ser mayor a 0</span>
                )}
              </small>
            </div>
          </div>

          {clienteSeleccionado && (
            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              {clienteActual && (
                <div style={{ 
                  backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e7f3ff', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  marginBottom: '15px',
                  border: `1px solid ${theme === 'dark' ? '#5dade2' : '#007bff'}`,
                  color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{clienteActual.nombre}</h3>
                  {clienteActual.telefono && <div>Teléfono: {clienteActual.telefono}</div>}
                  {clienteActual.direccion && <div>Dirección: {clienteActual.direccion}</div>}
                </div>
              )}
              
              {cargandoRemitos ? (
                <p style={{ color: theme === 'dark' ? '#5dade2' : '#007bff', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
                  ⏳ Cargando datos...
                </p>
              ) : Object.keys(remitosPorCliente).length === 0 ? (
                <p style={{ color: theme === 'dark' ? '#999' : '#666', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
                  Este cliente no tiene remitos registrados
                </p>
              ) : (
                Object.values(remitosPorCliente).map((grupo) => {
                  const totales = calcularTotalesCliente(grupo.cliente_id);
                  return (
                    <div key={grupo.cliente_id} style={{ 
                      border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, 
                      borderRadius: '8px', 
                      padding: '15px', 
                      marginBottom: '15px',
                      backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                      color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '10px',
                        paddingBottom: '10px',
                        borderBottom: `2px solid ${theme === 'dark' ? '#5dade2' : '#007bff'}`
                      }}>
                        <div>
                          <strong style={{ fontSize: '16px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{grupo.cliente_nombre}</strong>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', color: theme === 'dark' ? '#999' : '#666' }}>
                            Total Remitos: {formatearMonedaConSimbolo(totales.totalRemitos)}
                          </div>
                          <div style={{ fontSize: '14px', color: '#28a745' }}>
                            Total Pagado: {formatearMonedaConSimbolo(totales.totalPagado)}
                          </div>
                          <div style={{ fontSize: '16px', color: '#dc3545', fontWeight: 'bold' }}>
                            Pendiente: {formatearMonedaConSimbolo(totales.totalPendiente)}
                          </div>
                        </div>
                      </div>
                      
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ backgroundColor: theme === 'dark' ? '#404040' : '#e9ecef', fontWeight: 'bold' }}>
                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}` }}>Remito</th>
                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}` }}>Fecha</th>
                            <th style={{ padding: '8px', textAlign: 'right', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}` }}>Total</th>
                            <th style={{ padding: '8px', textAlign: 'right', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}` }}>Pagado</th>
                            <th style={{ padding: '8px', textAlign: 'right', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}` }}>Saldo</th>
                            <th style={{ padding: '8px', textAlign: 'right', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}` }}>Monto a Pagar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grupo.remitos.map((remito) => {
                            const saldo = getSaldoPendiente(remito);
                            const montoDistribuido = distribucionPagos[remito.id] || 0;
                            const estaExpandido = remitosExpandidos.has(remito.id);
                            
                            return (
                              <React.Fragment key={remito.id}>
                                <tr 
                                  style={{ 
                                    cursor: 'pointer',
                                    backgroundColor: estaExpandido ? (theme === 'dark' ? '#333' : '#f5f5f5') : 'transparent'
                                  }}
                                  onClick={() => toggleRemitoExpandido(remito.id)}
                                >
                                  <td style={{ padding: '8px' }}>
                                    <strong>{remito.numero || `#${remito.id}`}</strong>
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                    {new Date(remito.fecha).toLocaleDateString('es-AR')}
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right' }}>
                                    {formatearMonedaConSimbolo(remito.precio_total || 0)}
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right' }}>
                                    {formatearMonedaConSimbolo(remito.monto_pagado || 0)}
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right', color: '#dc3545', fontWeight: 'bold' }}>
                                    {formatearMonedaConSimbolo(saldo)}
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="text"
                                      value={(() => {
                                        if (montoDistribuido === 0 || montoDistribuido === '' || montoDistribuido === null || montoDistribuido === undefined) {
                                          return '';
                                        }
                                        // Si es un número, formatearlo; si es string, mantenerlo (puede estar escribiendo)
                                        if (typeof montoDistribuido === 'string' && montoDistribuido.includes(',')) {
                                          return montoDistribuido;
                                        }
                                        return formatearMoneda(montoDistribuido);
                                      })()}
                                      onChange={(e) => {
                                        let valor = e.target.value.replace(/[^\d.,]/g, '');
                                        // Solo permitir una coma decimal
                                        const partes = valor.split(',');
                                        if (partes.length > 2) {
                                          valor = partes[0] + ',' + partes.slice(1).join('');
                                        }
                                        // Limitar decimales a 2 dígitos
                                        if (valor.includes(',')) {
                                          const partesComa = valor.split(',');
                                          if (partesComa[1] && partesComa[1].length > 2) {
                                            valor = partesComa[0] + ',' + partesComa[1].substring(0, 2);
                                          }
                                        }
                                        
                                        // Si está vacío, limpiar
                                        if (valor === '' || valor === null || valor === undefined) {
                                          setDistribucionPagos({
                                            ...distribucionPagos,
                                            [remito.id]: 0
                                          });
                                          return;
                                        }
                                        
                                        // Limpiar formato y convertir a número
                                        const valorLimpio = limpiarFormatoNumero(valor);
                                        const nuevoMonto = valorLimpio === '' ? 0 : parseFloat(valorLimpio) || 0;
                                        
                                        // Guardar como número para cálculos, pero mantener string visual si está escribiendo decimales
                                        setDistribucionPagos({
                                          ...distribucionPagos,
                                          [remito.id]: nuevoMonto
                                        });
                                      }}
                                      onWheel={(e) => e.target.blur()}
                                      autoComplete="off"
                                      placeholder="0,00"
                                      style={{ 
                                        width: '100px', 
                                        padding: '4px',
                                        textAlign: 'right',
                                        backgroundColor: theme === 'dark' ? '#404040' : '#e9ecef',
                                        color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                                        border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                                        borderRadius: '4px'
                                      }}
                                    />
                                  </td>
                                </tr>
                                {estaExpandido && remito.articulos && remito.articulos.length > 0 && (
                                  <tr>
                                    <td colSpan="6" style={{ padding: '10px 20px', backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f9f9f9' }}>
                                      <div style={{ fontSize: '12px' }}>
                                        <strong>Artículos:</strong>
                                        {remito.articulos.map((art, idx) => (
                                          <span key={idx} style={{ marginLeft: '10px' }}>
                                            {art.articulo_codigo ? `[${art.articulo_codigo}] ` : ''}{art.articulo_nombre} (x{formatearCantidad(art.cantidad || 0)})
                                          </span>
                                        ))}
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
                  );
                })
              )}
            </div>
          )}

          <div className="form-group" style={{ marginTop: '15px' }}>
            <label>Detalle (opcional)</label>
            <input
              type="text"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              placeholder="Ej: Efectivo, Transferencia, Cheque..."
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              type="submit" 
              className="btn btn-success" 
              disabled={isSubmitting || !clienteSeleccionado || !montoTotal || aEntero(montoTotal) <= 0}
              title={(!montoTotal || aEntero(montoTotal) <= 0) ? 'El monto debe ser mayor a 0 para poder registrar el pago' : ''}
            >
              {isSubmitting ? '⏳ Registrando...' : '✅ Registrar Pago'}
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
      </div>

      {/* Filtros avanzados para la tabla de pagos */}
      <div style={{ 
        marginTop: '20px', 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f9f9f9', 
        borderRadius: '8px',
        border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>🔍 Filtros de Pagos</h3>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setFiltrosPagos({
                fechaDesde: '',
                fechaHasta: '',
                montoMinimo: '',
                montoMaximo: '',
                busqueda: '',
                clienteId: ''
              });
              setPaginaActualPagos(1);
            }}
            style={{ padding: '5px 15px', fontSize: '12px' }}
          >
            ✕ Limpiar Filtros
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div className="form-group">
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Buscar (cliente/remito)</label>
            <input
              type="text"
              value={filtrosPagos.busqueda}
              onChange={(e) => {
                setFiltrosPagos({ ...filtrosPagos, busqueda: e.target.value });
                setPaginaActualPagos(1);
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
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Cliente</label>
            <select
              value={filtrosPagos.clienteId}
              onChange={(e) => {
                setFiltrosPagos({ ...filtrosPagos, clienteId: e.target.value });
                setPaginaActualPagos(1);
              }}
              style={{ 
                width: '100%', 
                padding: '6px',
                backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
              }}
            >
              <option value="">Todos los clientes</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Fecha desde</label>
            <input
              type="date"
              value={filtrosPagos.fechaDesde}
              onChange={(e) => {
                setFiltrosPagos({ ...filtrosPagos, fechaDesde: e.target.value });
                setPaginaActualPagos(1);
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
              value={filtrosPagos.fechaHasta}
              onChange={(e) => {
                setFiltrosPagos({ ...filtrosPagos, fechaHasta: e.target.value });
                setPaginaActualPagos(1);
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
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Monto mínimo</label>
            <input
              type="text"
              value={filtrosPagos.montoMinimo === '' ? '' : formatearNumeroVisual(filtrosPagos.montoMinimo.toString())}
              onChange={(e) => {
                // Permitir dígitos, puntos (miles) y coma (decimal)
                let valor = e.target.value.replace(/[^\d.,]/g, '');
                // Solo permitir una coma decimal
                const partes = valor.split(',');
                if (partes.length > 2) {
                  valor = partes[0] + ',' + partes.slice(1).join('');
                }
                const valorLimpio = limpiarFormatoNumero(valor);
                setFiltrosPagos({ ...filtrosPagos, montoMinimo: valorLimpio });
                setPaginaActualPagos(1);
              }}
              onWheel={(e) => e.target.blur()}
              placeholder="0,00"
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
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Monto máximo</label>
            <input
              type="text"
              value={filtrosPagos.montoMaximo === '' ? '' : formatearNumeroVisual(filtrosPagos.montoMaximo.toString())}
              onChange={(e) => {
                // Permitir dígitos, puntos (miles) y coma (decimal)
                let valor = e.target.value.replace(/[^\d.,]/g, '');
                // Solo permitir una coma decimal
                const partes = valor.split(',');
                if (partes.length > 2) {
                  valor = partes[0] + ',' + partes.slice(1).join('');
                }
                const valorLimpio = limpiarFormatoNumero(valor);
                setFiltrosPagos({ ...filtrosPagos, montoMaximo: valorLimpio });
                setPaginaActualPagos(1);
              }}
              onWheel={(e) => e.target.blur()}
              placeholder="0,00"
              style={{ 
                width: '100%', 
                padding: '6px',
                backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
              }}
            />
          </div>
        </div>
      </div>

      {/* Controles de paginación ARRIBA */}
      {(() => {
        if (!pagosFiltrados || pagosFiltrados.length === 0) return null;
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
              onClick={() => setPaginaActualPagos(Math.max(1, paginaActualPagos - 1))}
              disabled={paginaActualPagos === 1}
              style={{ 
                padding: '5px 15px', 
                fontSize: '12px',
                opacity: paginaActualPagos === 1 ? 0.5 : 1,
                cursor: paginaActualPagos === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ← Anterior
            </button>
            <span style={{ color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
              Página {paginaActualPagos} de {totalPaginas}
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => setPaginaActualPagos(Math.min(totalPaginas, paginaActualPagos + 1))}
              disabled={paginaActualPagos === totalPaginas}
              style={{ 
                padding: '5px 15px', 
                fontSize: '12px',
                opacity: paginaActualPagos === totalPaginas ? 0.5 : 1,
                cursor: paginaActualPagos === totalPaginas ? 'not-allowed' : 'pointer'
              }}
            >
              Siguiente →
            </button>
          </div>
        );
      })()}

      {/* Tabla de Pagos */}
      <div className="card">
        <div className="table-container">
          <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Fecha</th>
              <th>Remito</th>
              <th>Cliente</th>
              <th>Monto</th>
              <th>Observaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Usar pagosFiltrados que ya está calculado arriba
              if (!pagosFiltrados || pagosFiltrados.length === 0) {
                return (
                  <tr>
                    <td colSpan="7" className="text-center">
                      {pagos.length === 0 ? 'No hay pagos registrados' : 'No hay pagos que coincidan con los filtros'}
                    </td>
                  </tr>
                );
              }
              
              // Paginación (búsqueda busca en TODOS los datos filtrados)
              const inicioIndex = (paginaActualPagos - 1) * registrosPorPagina;
              const finIndex = inicioIndex + registrosPorPagina;
              const pagosPaginados = pagosFiltrados.slice(inicioIndex, finIndex);
              
              return (
                <>
                  {pagosPaginados.map((pago) => {
                    const estaExpandido = pagosExpandidos.has(pago.id);
                    const remitosDetalle = parsearRemitosDesdeObservaciones(pago.observaciones);
                    const tieneDetalle = remitosDetalle && remitosDetalle.length > 0;
                    const observacionesTexto = obtenerObservacionesTexto(pago.observaciones);
                    
                    // Función para toggle del pago
                    const togglePagoExpandido = (pagoId) => {
                      const nuevosExpandidos = new Set(pagosExpandidos);
                      if (nuevosExpandidos.has(pagoId)) {
                        nuevosExpandidos.delete(pagoId);
                      } else {
                        nuevosExpandidos.add(pagoId);
                      }
                      setPagosExpandidos(nuevosExpandidos);
                    };
                    
                    // Verificar si es cheque y si está rebotado (convertir a boolean explícito)
                    const esCheque = pago.es_cheque === 1 || pago.es_cheque === true;
                    const chequeRebotado = pago.cheque_rebotado === 1 || pago.cheque_rebotado === true;
                    
                    return (
                      <React.Fragment key={pago.id}>
                        <tr 
                          style={{ 
                            cursor: tieneDetalle ? 'pointer' : 'default',
                            backgroundColor: chequeRebotado 
                              ? (theme === 'dark' ? '#4a2020' : '#ffebee') 
                              : (theme === 'dark' ? '#2d2d2d' : 'white'),
                            color: chequeRebotado 
                              ? '#e53935' 
                              : (theme === 'dark' ? '#e0e0e0' : '#333'),
                            fontWeight: chequeRebotado ? 'bold' : 'normal'
                          }}
                          onClick={tieneDetalle ? () => togglePagoExpandido(pago.id) : undefined}
                        >
                          <td 
                            style={{ textAlign: 'center', width: '40px', padding: '10px' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {tieneDetalle ? (
                              <button
                                className="btn btn-sm"
                                style={{ 
                                  padding: '2px 6px', 
                                  fontSize: '12px',
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  color: theme === 'dark' ? '#5dade2' : '#007bff',
                                  pointerEvents: 'auto'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  togglePagoExpandido(pago.id);
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                                title={estaExpandido ? 'Contraer' : 'Expandir'}
                              >
                                {estaExpandido ? '▼' : '▶'}
                              </button>
                            ) : (
                              <span style={{ color: theme === 'dark' ? '#666' : '#ccc' }}>-</span>
                            )}
                          </td>
                          <td>{new Date(pago.fecha).toLocaleDateString('es-AR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric'
                          })}</td>
                          <td>
                            {tieneDetalle ? (
                              <span style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>
                                {remitosDetalle.length} remito(s)
                              </span>
                            ) : pago.remito_id === null ? (
                              <span style={{ color: '#28a745', fontWeight: 'bold' }}>💰 ADELANTO</span>
                            ) : (
                              pago.remito_numero || `REM-${pago.remito_id}`
                            )}
                          </td>
                          <td>{pago.cliente_nombre || '-'}</td>
                          <td>
                            <strong>{formatearMonedaConSimbolo(obtenerMontoTotalPago(pago))}</strong>
                            {esCheque && (
                              <span style={{ 
                                marginLeft: '8px', 
                                fontSize: '11px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: chequeRebotado 
                                  ? '#e53935' 
                                  : (theme === 'dark' ? '#1565c0' : '#1976d2'),
                                color: 'white'
                              }}>
                                {chequeRebotado ? '🚫 REBOTADO' : '🏦 CHEQUE'}
                              </span>
                            )}
                          </td>
                          <td>{pago.remito_id === null ? (observacionesTexto.replace('[ADELANTO]', '').replace('ADELANTO -', '').replace('ADELANTO', '').trim() || '-') : observacionesTexto}</td>
                          <td>
                            {/* Botón Editar temporalmente oculto - código preservado para futura implementación */}
                            {false && (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPago(pago);
                                }}
                                style={{ marginRight: '5px', padding: '4px 8px', fontSize: '12px' }}
                                title="Editar pago"
                              >
                                ✏️ Editar
                              </button>
                            )}
                            {/* Botón Marcar Rebotado - solo para cheques no rebotados */}
                            {esCheque && !chequeRebotado && (
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setMarcandoRebotadoId(pago.id);
                                  const confirmar = await confirmNoBloqueante(
                                    `¿Marcar este cheque como REBOTADO?\n\n` +
                                    `Monto: ${formatearMonedaConSimbolo(obtenerMontoTotalPago(pago))}\n\n` +
                                    `El cheque aparecerá en rojo en los reportes.`
                                  );
                                  if (confirmar) {
                                    try {
                                      await supabaseService.marcarChequeRebotado(pago.id, true);
                                      alertNoBloqueante('🚫 Cheque marcado como rebotado', 'warning');
                                      // Refrescar lista
                                      const pagosActualizados = await loadPagosCache(true);
                                      if (pagosActualizados) setPagos(pagosActualizados);
                                      // INVALIDAR caché de pendientes
                                      setPendientesClientes({});
                                    } catch (error) {
                                      console.error('Error:', error);
                                      alertNoBloqueante('Error al marcar cheque: ' + error.message, 'error');
                                    } finally {
                                      setMarcandoRebotadoId(null);
                                    }
                                  } else {
                                    setMarcandoRebotadoId(null);
                                  }
                                }}
                                disabled={marcandoRebotadoId === pago.id}
                                style={{ 
                                  marginRight: '5px', 
                                  padding: '4px 8px', 
                                  fontSize: '12px',
                                  opacity: marcandoRebotadoId === pago.id ? 0.6 : 1,
                                  cursor: marcandoRebotadoId === pago.id ? 'wait' : 'pointer'
                                }}
                                title="Marcar cheque como rebotado"
                              >
                                {marcandoRebotadoId === pago.id ? '⏳ Procesando...' : '🚫 Rebotó'}
                              </button>
                            )}
                            
                            {/* Botón Desmarcar Rebotado - solo para cheques rebotados */}
                            {esCheque && chequeRebotado && (
                              <button
                                className="btn btn-sm"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setMarcandoRebotadoId(pago.id);
                                  const confirmar = await confirmNoBloqueante(
                                    `¿Desmarcar este cheque como rebotado?\n\n` +
                                    `El cheque volverá a contabilizarse normalmente.`
                                  );
                                  if (confirmar) {
                                    try {
                                      await supabaseService.marcarChequeRebotado(pago.id, false);
                                      alertNoBloqueante('✅ Cheque rehabilitado', 'success');
                                      // Refrescar lista
                                      const pagosActualizados = await loadPagosCache(true);
                                      if (pagosActualizados) setPagos(pagosActualizados);
                                      // INVALIDAR caché de pendientes
                                      setPendientesClientes({});
                                    } catch (error) {
                                      console.error('Error:', error);
                                      alertNoBloqueante('Error: ' + error.message, 'error');
                                    } finally {
                                      setMarcandoRebotadoId(null);
                                    }
                                  } else {
                                    setMarcandoRebotadoId(null);
                                  }
                                }}
                                disabled={marcandoRebotadoId === pago.id}
                                style={{ 
                                  marginRight: '5px', 
                                  padding: '4px 8px', 
                                  fontSize: '12px',
                                  backgroundColor: theme === 'dark' ? '#28a745' : '#28a745',
                                  color: '#ffffff',
                                  border: '1px solid #28a745',
                                  opacity: marcandoRebotadoId === pago.id ? 0.6 : 1,
                                  cursor: marcandoRebotadoId === pago.id ? 'wait' : 'pointer'
                                }}
                                title="Rehabilitar cheque"
                              >
                                {marcandoRebotadoId === pago.id ? '⏳ Procesando...' : '✅ Rehabilitar'}
                              </button>
                            )}
                            
                            {/* Botón Aplicar Adelanto - solo para adelantos (remito_id null) */}
                            {pago.remito_id === null && (
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAplicarAdelanto(pago);
                                }}
                                style={{ marginRight: '5px', padding: '4px 8px', fontSize: '12px' }}
                                title="Aplicar este adelanto a remitos pendientes"
                              >
                                💰 Aplicar
                              </button>
                            )}
                            
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePago(pago);
                              }}
                              disabled={eliminandoId === pago.id}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              title="Eliminar pago"
                            >
                              {eliminandoId === pago.id ? '⏳...' : '🗑️ Eliminar'}
                            </button>
                          </td>
                        </tr>
                        {estaExpandido && tieneDetalle && (
                          <tr>
                            <td colSpan="7" style={{ 
                              padding: '15px',
                              backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
                              borderLeft: `4px solid ${theme === 'dark' ? '#5dade2' : '#007bff'}`
                            }}>
                              <div style={{ marginBottom: '10px' }}>
                                <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>
                                  Detalle de Remitos Pagados ({remitosDetalle.length}):
                                </strong>
                              </div>
                              <table style={{ width: '100%', fontSize: '12px' }}>
                                <thead>
                                  <tr style={{ 
                                    backgroundColor: theme === 'dark' ? '#3a3a3a' : '#e9ecef',
                                    borderBottom: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}`
                                  }}>
                                    <th style={{ padding: '8px', textAlign: 'left' }}>Remito</th>
                                    <th style={{ padding: '8px', textAlign: 'right' }}>Monto</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {remitosDetalle.map((detalle, idx) => (
                                    <tr key={idx} style={{ 
                                      borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                                      backgroundColor: idx % 2 === 0 
                                        ? (theme === 'dark' ? '#2d2d2d' : 'transparent')
                                        : (theme === 'dark' ? '#3a3a3a' : '#f8f9fa')
                                    }}>
                                      <td style={{ padding: '8px' }}>{detalle.remito_numero}</td>
                                      <td style={{ padding: '8px', textAlign: 'right' }}>
                                        <strong>{formatearMonedaConSimbolo(detalle.monto)}</strong>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  <tr>
                    <td colSpan="6" style={{ 
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
                          Mostrando {inicioIndex + 1} - {Math.min(finIndex, pagosFiltrados.length)} de {pagosFiltrados.length} pago(s)
                          {pagosFiltrados.length !== pagos.length && (
                            <span style={{ color: theme === 'dark' ? '#5dade2' : '#007bff', marginLeft: '10px' }}>
                              (filtrados de {pagos.length} total)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                </>
              );
            })()}
          </tbody>
        </table>
        </div>

        {/* Controles de paginación ABAJO */}
        {(() => {
          if (!pagosFiltrados || pagosFiltrados.length === 0) return null;
          if (totalPaginas <= 1) return null;
          return (
            <div style={{ 
              marginTop: '15px',
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
                onClick={() => setPaginaActualPagos(Math.max(1, paginaActualPagos - 1))}
                disabled={paginaActualPagos === 1}
                style={{ 
                  padding: '5px 15px', 
                  fontSize: '12px',
                  opacity: paginaActualPagos === 1 ? 0.5 : 1,
                  cursor: paginaActualPagos === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Anterior
              </button>
              <span style={{ color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                Página {paginaActualPagos} de {totalPaginas}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setPaginaActualPagos(Math.min(totalPaginas, paginaActualPagos + 1))}
                disabled={paginaActualPagos === totalPaginas}
                style={{ 
                  padding: '5px 15px', 
                  fontSize: '12px',
                  opacity: paginaActualPagos === totalPaginas ? 0.5 : 1,
                  cursor: paginaActualPagos === totalPaginas ? 'not-allowed' : 'pointer'
                }}
              >
                Siguiente →
              </button>
            </div>
          );
        })()}
      </div>

      {/* Modal de edición de pago - Mejorado con remitos */}
      {showEditPagoModal && editingPago && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1002,
            padding: '20px', overflowY: 'auto', pointerEvents: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              confirmNoBloqueante('¿Deseas cancelar la edición? Los cambios no guardados se perderán.').then((confirmado) => {
                if (confirmado) {
                  resetEditPagoForm();
                }
              });
            }
          }}
        >
          <div 
            style={{
              backgroundColor: theme === 'dark' ? '#3a3a3a' : 'white',
              borderRadius: '12px', padding: '30px', maxWidth: '900px',
              width: '100%', maxHeight: '90vh', overflowY: 'auto',
              boxShadow: theme === 'dark' ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.4)',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit',
              border: theme === 'dark' ? '1px solid #555' : 'none',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}`, paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                ✏️ Editar Pago
              </h2>
              <button 
                className="btn btn-danger"
                onClick={() => {
                  confirmNoBloqueante('¿Deseas cancelar? Los cambios no guardados se perderán.').then((confirmado) => {
                    if (confirmado) {
                      resetEditPagoForm();
                    }
                  });
                }}
                style={{ 
                  padding: '8px 15px', 
                  fontSize: '14px',
                  backgroundColor: theme === 'dark' ? '#555' : '#dc3545',
                  color: 'white'
                }}
              >
                ❌ Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmitEditPago} style={{ color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha *</label>
                  <input
                    type="date"
                    name="fecha"
                    value={formDataEditPago.fecha}
                    onChange={(e) => setFormDataEditPago({ ...formDataEditPago, fecha: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Monto Total a Pagar *</label>
                  <input
                    type="text"
                    value={(() => {
                      if (montoTotalEditPago === 0 || montoTotalEditPago === '' || montoTotalEditPago === null || montoTotalEditPago === undefined) {
                        return '';
                      }
                      // Usar formatearMoneda para asegurar formato consistente con 2 decimales
                      return formatearMoneda(montoTotalEditPago);
                    })()}
                    onChange={handleMontoTotalEditChange}
                    onWheel={(e) => e.target.blur()}
                    placeholder="0,00"
                    required
                  />
                  <small style={{ color: theme === 'dark' ? '#999' : '#666', display: 'block', marginTop: '5px' }}>
                    {clienteEditPago && remitosEditPago.length > 0 && (
                      <>Se redistribuirá automáticamente por orden de antigüedad en los {remitosEditPago.filter(r => aEntero(r.precio_total || 0) > 0).length} remito(s) del cliente</>
                    )}
                    {(!montoTotalEditPago || aEntero(montoTotalEditPago) <= 0) && (
                      <span style={{ color: '#dc3545', display: 'block', marginTop: '5px' }}>⚠️ El monto debe ser mayor a 0</span>
                    )}
                  </small>
                </div>
              </div>

              {/* DEBUG: Información del estado de carga */}
              <div style={{ 
                padding: '10px', 
                backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f0f0f0', 
                marginTop: '10px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                Debug: clienteEditPago={clienteEditPago ? 'SI' : 'NO'}, 
                cargandoRemitosEdit={cargandoRemitosEdit ? 'SI' : 'NO'}, 
                remitosEditPago.length={remitosEditPago.length}
              </div>

              {/* Mostrar SIEMPRE, incluso si está cargando */}
              <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                {/* Caja destacada del cliente (igual que en Nuevo Pago) */}
                {clienteEditPago ? (
                  <div style={{ 
                    backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e7f3ff', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    marginBottom: '15px',
                    border: `1px solid ${theme === 'dark' ? '#5dade2' : '#007bff'}`,
                    color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{clienteEditPago.nombre}</h3>
                    {clienteEditPago.telefono && <div>Teléfono: {clienteEditPago.telefono}</div>}
                    {clienteEditPago.direccion && <div>Dirección: {clienteEditPago.direccion}</div>}
                  </div>
                ) : (
                  <div style={{ 
                    backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    marginBottom: '15px',
                    border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                    color: theme === 'dark' ? '#999' : '#666',
                    fontStyle: 'italic',
                    textAlign: 'center'
                  }}>
                    ⏳ Cargando información del cliente...
                  </div>
                )}
                  
                  {cargandoRemitosEdit ? (
                    <p style={{ color: theme === 'dark' ? '#5dade2' : '#007bff', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
                      ⏳ Cargando datos...
                    </p>
                  ) : remitosEditPago.length === 0 ? (
                    <p style={{ color: theme === 'dark' ? '#999' : '#666', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
                      Este cliente no tiene remitos registrados
                    </p>
                  ) : (
                    <div style={{ 
                      border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, 
                      borderRadius: '8px', 
                      padding: '15px', 
                      marginBottom: '15px',
                      backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                      color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '10px',
                        paddingBottom: '10px',
                        borderBottom: `2px solid ${theme === 'dark' ? '#5dade2' : '#007bff'}`
                      }}>
                        <div>
                          <strong style={{ fontSize: '16px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{clienteEditPago.nombre}</strong>
                          <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', marginTop: '5px' }}>
                            {remitosEditPago.filter(r => aEntero(r.precio_total || 0) > 0).length} remito(s) total(es) | 
                            {remitosEditPago.filter(r => aEntero(r.precio_total || 0) > 0 && getSaldoPendiente(r) > 0).length} pendiente(s) | 
                            {Object.keys(distribucionEditPago).filter(id => distribucionEditPago[id] > 0).length} afectado(s) por este pago
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', color: theme === 'dark' ? '#999' : '#666' }}>
                            Total: {formatearMonedaConSimbolo(remitosEditPago.reduce((sum, r) => sum + aEntero(r.precio_total || 0), 0))} | 
                            Pagado: {formatearMonedaConSimbolo(remitosEditPago.reduce((sum, r) => sum + aEntero(r.monto_pagado || 0), 0))}
                          </div>
                          <div style={{ fontSize: '16px', color: '#dc3545', fontWeight: 'bold' }}>
                            Pendiente: {formatearMonedaConSimbolo(remitosEditPago.reduce((sum, r) => sum + Math.max(0, getSaldoPendiente(r)), 0))}
                          </div>
                        </div>
                      </div>

                      <table style={{ width: '100%', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ backgroundColor: theme === 'dark' ? '#404040' : '#f8f9fa' }}>
                            <th style={{ padding: '8px', textAlign: 'center', width: '40px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}></th>
                            <th style={{ padding: '8px', textAlign: 'left', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Remito</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Fecha</th>
                            <th style={{ padding: '8px', textAlign: 'right', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Total</th>
                            <th style={{ padding: '8px', textAlign: 'right', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Pagado</th>
                            <th style={{ padding: '8px', textAlign: 'right', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Saldo</th>
                            <th style={{ padding: '8px', textAlign: 'right', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Monto a Pagar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {remitosEditPago
                            .filter(r => aEntero(r.precio_total || 0) > 0)
                            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                            .map(remito => {
                            const saldo = getSaldoPendiente(remito);
                            const montoDistribuido = distribucionEditPago[remito.id] || 0;
                            const tienePago = montoDistribuido > 0;
                            const generaCredito = montoDistribuido > saldo;
                            const estaExpandido = remitosExpandidosEdit.has(remito.id);
                            const articulos = remito.articulos || [];
                            
                            const bgColor = tienePago 
                              ? (generaCredito 
                                  ? (theme === 'dark' ? '#4a3a1a' : '#fff3cd')
                                  : (theme === 'dark' ? '#1e3a5f' : '#e7f3ff'))
                              : 'transparent';
                            
                            return (
                              <React.Fragment key={remito.id}>
                                <tr 
                                  style={{ 
                                    backgroundColor: bgColor,
                                    color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => toggleRemitoExpandidoEdit(remito.id)}
                                >
                                  <td 
                                    style={{ padding: '8px', textAlign: 'center' }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {articulos.length > 0 && (
                                      <button
                                        className="btn btn-sm"
                                        style={{ 
                                          padding: '2px 6px', 
                                          fontSize: '12px',
                                          border: 'none',
                                          background: 'transparent',
                                          cursor: 'pointer',
                                          color: theme === 'dark' ? '#5dade2' : 'inherit',
                                          pointerEvents: 'auto'
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          toggleRemitoExpandidoEdit(remito.id);
                                        }}
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                        }}
                                        title={estaExpandido ? 'Contraer' : 'Expandir'}
                                      >
                                        {estaExpandido ? '▼' : '▶'}
                                      </button>
                                    )}
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                    <strong>{remito.numero || `#${remito.id}`}</strong>
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                    {new Date(remito.fecha).toLocaleDateString('es-AR')}
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right' }}>
                                    {formatearMonedaConSimbolo(remito.precio_total || 0)}
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right' }}>
                                    {formatearMonedaConSimbolo(remito.monto_pagado || 0)}
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right', color: saldo < 0 ? '#28a745' : (saldo > 0 ? '#dc3545' : theme === 'dark' ? '#999' : '#666'), fontWeight: 'bold' }}>
                                    {formatearMonedaConSimbolo(saldo)}
                                    {saldo < 0 && <span style={{ fontSize: '10px', marginLeft: '5px', color: '#28a745' }}>(Crédito)</span>}
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="text"
                                      value={(() => {
                                        if (montoDistribuido === 0 || montoDistribuido === '' || montoDistribuido === null || montoDistribuido === undefined) {
                                          return '';
                                        }
                                        return formatearMoneda(montoDistribuido);
                                      })()}
                                      onChange={(e) => {
                                        let valor = e.target.value.replace(/[^\d.,]/g, '');
                                        // Solo permitir una coma decimal
                                        const partes = valor.split(',');
                                        if (partes.length > 2) {
                                          valor = partes[0] + ',' + partes.slice(1).join('');
                                        }
                                        // Limitar decimales a 2 dígitos
                                        if (valor.includes(',')) {
                                          const partesComa = valor.split(',');
                                          if (partesComa[1] && partesComa[1].length > 2) {
                                            valor = partesComa[0] + ',' + partesComa[1].substring(0, 2);
                                          }
                                        }
                                        
                                        if (valor === '' || valor === null || valor === undefined) {
                                          setDistribucionEditPago({ ...distribucionEditPago, [remito.id]: 0 });
                                          return;
                                        }
                                        
                                        const valorLimpio = limpiarFormatoNumero(valor);
                                        const nuevoMonto = valorLimpio === '' ? 0 : parseFloat(valorLimpio) || 0;
                                        setDistribucionEditPago({
                                          ...distribucionEditPago,
                                          [remito.id]: nuevoMonto
                                        });
                                        // Recalcular monto total
                                        const nuevoTotal = Object.values({...distribucionEditPago, [remito.id]: nuevoMonto}).reduce((sum, m) => sum + parseFloat(m || 0), 0);
                                        setMontoTotalEditPago(nuevoTotal);
                                        setFormDataEditPago({ ...formDataEditPago, monto: nuevoTotal.toString() });
                                      }}
                                      onWheel={(e) => e.target.blur()}
                                      autoComplete="off"
                                      style={{ 
                                        width: '120px', 
                                        padding: '5px',
                                        textAlign: 'right',
                                        border: tienePago ? (generaCredito ? '1px solid #ffc107' : '1px solid #28a745') : `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                                        borderRadius: '4px',
                                        backgroundColor: tienePago 
                                          ? (generaCredito 
                                              ? (theme === 'dark' ? '#4a3a1a' : '#fff3cd')
                                              : (theme === 'dark' ? '#1e3a5f' : '#d4edda'))
                                          : (theme === 'dark' ? '#404040' : '#f8f9fa'),
                                        color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                                        fontWeight: tienePago ? 'bold' : 'normal'
                                      }}
                                    />
                                    {generaCredito && (
                                      <small style={{ display: 'block', color: theme === 'dark' ? '#ffd700' : '#856404', marginTop: '2px' }}>
                                        Crédito: {formatearMonedaConSimbolo(montoDistribuido - saldo)}
                                      </small>
                                    )}
                                  </td>
                                </tr>
                                {estaExpandido && articulos.length > 0 && (
                                  <tr style={{ backgroundColor: theme === 'dark' ? '#333' : '#f9f9f9' }}>
                                    <td colSpan="7" style={{ padding: '15px', paddingLeft: '50px' }}>
                                      <div style={{ marginLeft: '20px' }}>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Artículos del Remito:</h4>
                                        <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                                          <thead>
                                            <tr style={{ backgroundColor: theme === 'dark' ? '#404040' : '#e9ecef', fontWeight: 'bold' }}>
                                              <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Artículo</th>
                                              <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Cantidad</th>
                                              <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Precio Unitario</th>
                                              <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>Precio Total</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {articulos.map((articulo, index) => (
                                              <tr key={index} style={{ borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}` }}>
                                                <td style={{ padding: '8px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{articulo.articulo_nombre || '-'}</td>
                                                <td style={{ padding: '8px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{formatearCantidad(Math.round(articulo.cantidad || 0))}</td>
                                                <td style={{ padding: '8px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{formatearMonedaConSimbolo(articulo.precio_unitario || 0)}</td>
                                                <td style={{ padding: '8px', fontWeight: 'bold', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{formatearMonedaConSimbolo(articulo.precio_total || 0)}</td>
                                              </tr>
                                            ))}
                                            <tr style={{ backgroundColor: theme === 'dark' ? '#404040' : '#e9ecef', fontWeight: 'bold' }}>
                                              <td style={{ padding: '8px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }} colSpan="3">TOTAL:</td>
                                              <td style={{ padding: '8px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>{formatearMonedaConSimbolo(remito.precio_total || 0)}</td>
                                            </tr>
                                          </tbody>
                                        </table>
                                        {remito.observaciones && (
                                          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: theme === 'dark' ? '#404040' : '#fff', borderRadius: '4px', border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                                            <strong>Observaciones:</strong> {remito.observaciones}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>

                      <div style={{ 
                        marginTop: '10px', 
                        padding: '10px', 
                        backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e7f3ff', 
                        borderRadius: '4px',
                        color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                      }}>
                        <strong>Total a pagar de este cliente: {
                          formatearMonedaConSimbolo(
                            Object.values(distribucionEditPago).reduce((sum, m) => sum + parseFloat(m || 0), 0)
                          )
                        }</strong>
                      </div>
                    </div>
                  )}
                </div>

              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>Detalle (opcional)</label>
                <input
                  type="text"
                  name="observaciones"
                  value={formDataEditPago.observaciones}
                  onChange={(e) => setFormDataEditPago({ ...formDataEditPago, observaciones: e.target.value })}
                  placeholder="Ej: Efectivo, Transferencia, Cheque..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    confirmNoBloqueante('¿Deseas cancelar? Los cambios no guardados se perderán.').then((confirmado) => {
                      if (confirmado) {
                        resetEditPagoForm();
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
                  disabled={isSubmitting || !montoTotalEditPago || aEntero(montoTotalEditPago) <= 0}
                >
                  {isSubmitting ? '⏳ Actualizando...' : '💾 Actualizar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal flotante eliminado - usando formulario inline */}
      {false && (
        <div
          data-modal-overlay="true" 
          key={`modal-pago-disabled`}
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
              confirmNoBloqueante('¿Deseas cancelar? Los cambios no guardados se perderán.').then((confirmado) => {
                if (confirmado) {
                  // Cerrar modal INMEDIATAMENTE
                  setShowForm(false);
                  resetForm();
                  // Forzar limpieza completa (oculta overlays sin eliminar del DOM)
                  requestAnimationFrame(() => {
                  });
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
              maxWidth: '900px',
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
              <h2 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>➕ Nuevo Pago</h2>
              <button 
                className="btn btn-danger"
                onClick={() => {
                  confirmNoBloqueante('¿Deseas cancelar? Los cambios no guardados se perderán.').then((confirmado) => {
                    if (confirmado) {
                      resetForm();
                    }
                  });
                }}
                style={{ padding: '8px 15px', fontSize: '14px' }}
              >
                ❌ Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
              {/* Copiar el formulario completo aquí - es el mismo que showForm */}
              <div className="form-row">
                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Cliente *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={clienteSeleccionado ? (clientes.find(c => c.id === parseInt(clienteSeleccionado))?.nombre || busquedaCliente) : busquedaCliente}
                      onChange={handleBuscarCliente}
                      onFocus={() => {
                        if (!clienteSeleccionado && clientes.length > 0) {
                          setClientesFiltrados(clientes);
                          setMostrarLista(true);
                        } else if (busquedaCliente) {
                          setMostrarLista(true);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setMostrarLista(false), 200);
                      }}
                      placeholder={clienteSeleccionado ? '' : "Buscar cliente..."}
                      required={!clienteSeleccionado}
                      style={{ 
                        width: '100%', 
                        paddingRight: clienteSeleccionado ? '80px' : '10px',
                        backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                        color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                        border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
                      }}
                    />
                    {clienteSeleccionado && (
                      <button
                        type="button"
                        onClick={handleLimpiarCliente}
                        style={{
                          position: 'absolute',
                          right: '5px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        ✕ Limpiar
                      </button>
                    )}
                    {((busquedaCliente && !clienteSeleccionado && clientesFiltrados.length > 0) || mostrarLista) && (
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
                        {clientesFiltrados.map(cliente => {
                          const remitosCliente = remitos.filter(r => r.cliente_id === cliente.id);
                          const totalPendiente = remitosCliente.reduce((sum, r) => sum + getSaldoPendiente(r), 0);
                          return (
                            <div
                              key={cliente.id}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleSeleccionarCliente(cliente)}
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
                              <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', marginTop: '2px' }}>
                                💰 Pendiente: {formatearMonedaConSimbolo(totalPendiente)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Fecha *</label>
                  <input
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Resto del formulario de pagos - distribución de pagos, remitos, etc. */}
              {/* Por brevedad, copio solo las partes esenciales. El resto es igual al formulario normal */}
              {clienteSeleccionado && remitosFiltrados.length > 0 && (
                <div className="form-group" style={{ marginTop: '20px' }}>
                  <label><strong>Distribución del Pago entre Remitos</strong></label>
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '15px', 
                    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f0f0f0', 
                    borderRadius: '8px',
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}>
                    {remitosFiltrados.map(remito => {
                      const saldoPendiente = getSaldoPendiente(remito);
                      const montoAsignado = distribucionPagos[remito.id] || 0;
                      return (
                        <div key={remito.id} style={{ 
                          marginBottom: '15px', 
                          padding: '12px', 
                          backgroundColor: theme === 'dark' ? '#3a3a3a' : '#fff',
                          borderRadius: '5px',
                          border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div>
                              <strong>{remito.numero || `#${remito.id}`}</strong>
                              <span style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', marginLeft: '10px' }}>
                                Saldo: {formatearMonedaConSimbolo(saldoPendiente)}
                              </span>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={(() => {
                              if (montoAsignado === 0 || montoAsignado === '' || montoAsignado === null || montoAsignado === undefined) {
                                return '';
                              }
                              return formatearMoneda(montoAsignado);
                            })()}
                            onChange={(e) => {
                              let valor = e.target.value.replace(/[^\d.,]/g, '');
                              // Solo permitir una coma decimal
                              const partes = valor.split(',');
                              if (partes.length > 2) {
                                valor = partes[0] + ',' + partes.slice(1).join('');
                              }
                              // Limitar decimales a 2 dígitos
                              if (valor.includes(',')) {
                                const partesComa = valor.split(',');
                                if (partesComa[1] && partesComa[1].length > 2) {
                                  valor = partesComa[0] + ',' + partesComa[1].substring(0, 2);
                                }
                              }
                              
                              if (valor === '' || valor === null || valor === undefined) {
                                setDistribucionPagos({ ...distribucionPagos, [remito.id]: 0 });
                                const nuevoTotal = Object.values({ ...distribucionPagos, [remito.id]: 0 }).reduce((sum, m) => sum + parseFloat(m || 0), 0);
                                setMontoTotal(nuevoTotal);
                                setMontoTotalVisual(formatearMoneda(nuevoTotal));
                                return;
                              }
                              
                              const valorLimpio = limpiarFormatoNumero(valor);
                              const monto = valorLimpio === '' ? 0 : parseFloat(valorLimpio) || 0;
                              const nuevoMonto = Math.min(monto, saldoPendiente);
                              setDistribucionPagos({ ...distribucionPagos, [remito.id]: nuevoMonto });
                              const nuevoTotal = Object.values({ ...distribucionPagos, [remito.id]: nuevoMonto }).reduce((sum, m) => sum + parseFloat(m || 0), 0);
                              setMontoTotal(nuevoTotal);
                              setMontoTotalVisual(formatearMoneda(nuevoTotal));
                            }}
                            onWheel={(e) => e.target.blur()}
                            placeholder="0,00"
                            style={{ width: '100%', padding: '8px' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '15px', padding: '10px', backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e7f3ff', borderRadius: '5px' }}>
                    <strong>Total del Pago: {formatearMonedaConSimbolo(montoTotal)}</strong>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Detalle (opcional)</label>
                <input
                  type="text"
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Ej: Efectivo, Transferencia, Cheque..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => {
                    confirmNoBloqueante('¿Deseas cancelar? Los cambios no guardados se perderán.').then((confirmado) => {
                      if (confirmado) {
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
                  disabled={isSubmitting || !clienteSeleccionado || !montoTotal || montoTotal <= 0}
                >
                  {isSubmitting ? '⏳ Registrando...' : '✅ Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para aplicar adelanto */}
      {showAplicarAdelantoModal && adelantoAplicar && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAplicarAdelantoModal(false);
            }
          }}
        >
          <div 
            style={{
              backgroundColor: theme === 'dark' ? '#2d2d2d' : 'white',
              padding: '25px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              border: `2px solid ${theme === 'dark' ? '#5dade2' : '#007bff'}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '20px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
              💰 Aplicar Adelanto a Remitos
            </h3>
            
            <div style={{ 
              padding: '15px', 
              backgroundColor: theme === 'dark' ? '#1e4a1e' : '#d4edda',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #28a745'
            }}>
              <strong>Adelanto disponible: {formatearMonedaConSimbolo(adelantoAplicar.monto)}</strong>
              <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
                Fecha: {new Date(adelantoAplicar.fecha).toLocaleDateString('es-AR')}
              </div>
            </div>

            <h4 style={{ color: theme === 'dark' ? '#e0e0e0' : 'inherit', marginBottom: '15px' }}>
              Remitos Pendientes del Cliente:
            </h4>

            {remitosParaAdelanto.map(remito => {
              const saldoPendiente = parseFloat(remito.precio_total || 0) - parseFloat(remito.monto_pagado || 0);
              return (
                <div key={remito.id} style={{ 
                  padding: '12px',
                  marginBottom: '10px',
                  backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f8f9fa',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: theme === 'dark' ? '#5dade2' : '#007bff' }}>
                      {remito.numero || `REM-${remito.id}`}
                    </span>
                    <span>Pendiente: {formatearMonedaConSimbolo(saldoPendiente)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ minWidth: '100px', fontSize: '13px' }}>Pagar:</label>
                    <input
                      type="text"
                      value={formatearNumeroVisual(distribucionAdelanto[remito.id] || '')}
                      onChange={(e) => {
                        const valor = e.target.value;
                        const numero = limpiarFormatoNumero(valor);
                        setDistribucionAdelanto({
                          ...distribucionAdelanto,
                          [remito.id]: numero
                        });
                      }}
                      placeholder="0"
                      style={{ 
                        flex: 1,
                        padding: '6px',
                        backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                        color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                        border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                        textAlign: 'right'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const montoDisponible = parseFloat(adelantoAplicar.monto || 0);
                        const yaDistribuido = Object.entries(distribucionAdelanto)
                          .filter(([rid]) => rid !== remito.id.toString())
                          .reduce((sum, [, monto]) => sum + aEntero(monto || 0), 0);
                        const maxPagar = Math.min(saldoPendiente, montoDisponible - yaDistribuido);
                        if (maxPagar > 0) {
                          setDistribucionAdelanto({
                            ...distribucionAdelanto,
                            [remito.id]: maxPagar
                          });
                        }
                      }}
                      className="btn btn-sm btn-outline-primary"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                    >
                      Max
                    </button>
                  </div>
                </div>
              );
            })}

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '20px',
              padding: '15px',
              backgroundColor: theme === 'dark' ? '#404040' : '#e9ecef',
              borderRadius: '8px'
            }}>
              <span>
                <strong>Total a distribuir: </strong>
                {formatearMonedaConSimbolo(Object.values(distribucionAdelanto).reduce((sum, monto) => sum + aEntero(monto || 0), 0))}
              </span>
              <span>
                <strong>Disponible: </strong>
                {formatearMonedaConSimbolo(parseFloat(adelantoAplicar.monto || 0))}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAplicarAdelantoModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-success"
                onClick={handleConfirmarAplicarAdelanto}
                disabled={Object.values(distribucionAdelanto).every(monto => aEntero(monto || 0) === 0)}
              >
                💰 Aplicar Adelanto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pagos;
