import React, { useState, useEffect, useMemo } from 'react';
import * as db from '../services/databaseService';
import { formatearMonedaConSimbolo, formatearMoneda, formatearCantidad, formatearCantidadDecimal, formatearNumeroVisual, limpiarFormatoNumero, sumarPagosSaldoAFavorAplicado } from '../utils/formatoMoneda';
import { useTheme } from '../context/ThemeContext';
import { useDataCache } from '../context/DataCacheContext';
import { alertNoBloqueante, confirmNoBloqueante } from '../utils/notificaciones';

// Función helper para obtener fecha local en formato YYYY-MM-DD (sin conversión UTC)
const obtenerFechaLocal = (fecha = null) => {
  const d = fecha ? new Date(fecha) : new Date();
  const año = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
};

// Función para convertir fecha YYYY-MM-DD a formato con hora 14:00 para guardar en BD
const fechaConHora14 = (fechaString) => {
  if (!fechaString) return null;
  // Si ya tiene hora, extraer solo la fecha
  const fechaSolo = fechaString.split('T')[0].split(' ')[0];
  // Crear fecha con hora 14:00 hora local
  const [año, mes, dia] = fechaSolo.split('-');
  const fecha = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia), 14, 0, 0, 0);
  // Retornar en formato ISO para guardar en BD
  return fecha.toISOString();
};

// Función helper para convertir fecha a formato YYYY-MM-DD para inputs
const fechaParaInput = (fechaInput) => {
  if (!fechaInput) return obtenerFechaLocal();
  
  // Si es un objeto Date
  if (fechaInput instanceof Date) {
    return obtenerFechaLocal(fechaInput);
  }
  
  // Si es string
  if (typeof fechaInput === 'string') {
    // Si ya viene como YYYY-MM-DD
    if (fechaInput.match(/^\d{4}-\d{2}-\d{2}/)) {
      return fechaInput.split('T')[0];
    }
    // Si viene como DD/MM/YYYY
    if (fechaInput.match(/^\d{2}\/\d{2}\/\d{4}/)) {
      const partes = fechaInput.split('/');
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    // Intentar parsear como Date
    try {
      const fechaObj = new Date(fechaInput);
      if (!isNaN(fechaObj.getTime())) {
        return obtenerFechaLocal(fechaObj);
      }
    } catch (e) {
      // Si falla, usar fecha actual
    }
  }
  
  return obtenerFechaLocal();
};

// Función helper para formatear fecha sin problemas de zona horaria
// Convierte YYYY-MM-DD a DD/MM/YYYY
const formatearFecha = (fechaInput) => {
  if (!fechaInput) return '-';
  
  // Si es un objeto Date, convertir a string ISO
  let fechaString = fechaInput;
  if (fechaInput instanceof Date) {
    fechaString = fechaInput.toISOString();
  } else if (typeof fechaInput !== 'string') {
    // Si no es string ni Date, intentar convertir
    fechaString = String(fechaInput);
  }
  
  // Si ya viene como YYYY-MM-DD, convertir directamente
  const fecha = fechaString.split('T')[0]; // Tomar solo la parte de fecha si viene con hora
  const partes = fecha.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  // Si ya está en otro formato, intentar parsearlo
  try {
    const fechaObj = new Date(fechaString);
    if (!isNaN(fechaObj.getTime())) {
      return fechaObj.toLocaleDateString('es-AR');
    }
  } catch (e) {
    // Si falla, devolver el string original
  }
  return fechaString;
};

function Remitos() {
  const { theme } = useTheme();
  const { 
    remitos: remitosCache, 
    clientes: clientesCache, 
    articulos: articulosCache,
    loadRemitos: loadRemitosCache,
    loadClientes: loadClientesCache,
    loadArticulos: loadArticulosCache,
    invalidateCache,
    refreshRelated
  } = useDataCache();
  
  // Usar datos del caché o estado local como fallback
  const [remitos, setRemitos] = useState(remitosCache);
  const [clientes, setClientes] = useState(clientesCache);
  const [articulosDisponibles, setArticulosDisponibles] = useState(articulosCache);
  
  const [showForm, setShowForm] = useState(false);
  const [editingRemito, setEditingRemito] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    cliente_id: '',
    fecha: obtenerFechaLocal(),
    numero: '',
    estado_pago: 'Pendiente',
    monto_pagado: 0,
    observaciones: '',
    articulos: [],
    foto_path: null
  });
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenModal, setImagenModal] = useState({ abierto: false, url: null, remitoNumero: null });
  const [remitosExpandidos, setRemitosExpandidos] = useState(new Set());
  const [modalAgregarArticulo, setModalAgregarArticulo] = useState({ abierto: false, articuloId: '', cantidad: '', precioBase: '', precioUnitario: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const formRef = React.useRef(null);

  // Estado para modal "Aplicar saldo a favor" tras crear remito
  const [showAplicarSaldoFavorModal, setShowAplicarSaldoFavorModal] = useState(false);
  const [remitoParaSaldoFavor, setRemitoParaSaldoFavor] = useState(null); // { id, cliente_id, precio_total, fecha }
  const [saldoAFavorDisponible, setSaldoAFavorDisponible] = useState(0);
  const [montoAplicarSaldoFavor, setMontoAplicarSaldoFavor] = useState('');
  const [detalleAplicarSaldoFavor, setDetalleAplicarSaldoFavor] = useState('');
  const [aplicandoSaldoFavor, setAplicandoSaldoFavor] = useState(false);
  
  // Estados para búsqueda de artículo en el modal
  const [busquedaArticulo, setBusquedaArticulo] = useState('');
  const [articulosFiltrados, setArticulosFiltrados] = useState([]);
  const [mostrarListaArticulos, setMostrarListaArticulos] = useState(false);
  const [mostrarFormNuevoArticulo, setMostrarFormNuevoArticulo] = useState(false);
  const [nuevoArticuloData, setNuevoArticuloData] = useState({ 
    nombre: '', 
    precio_base: '', 
    descripcion: '',
    medida: '',
    cabezal: '',
    costado: '',
    fondo: '',
    taco: '',
    esquinero: '',
    despeje: ''
  });
  
  // Estados para búsqueda de cliente
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);
  
  // Estados para filtros avanzados
  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    montoMinimo: '',
    montoMaximo: '',
    estadoPago: '',
    busqueda: '',
    clienteId: ''
  });
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina] = useState(30); // 30 registros por página

  // Sincronizar datos del caché con estado local cuando cambian
  useEffect(() => {
    setRemitos(remitosCache);
  }, [remitosCache]);

  useEffect(() => {
    setClientes(clientesCache);
  }, [clientesCache]);

  // Filtrar artículos según el cliente seleccionado
  useEffect(() => {
    if (!articulosCache || articulosCache.length === 0) {
      setArticulosDisponibles([]);
      return;
    }

    const clienteId = formData.cliente_id ? parseInt(formData.cliente_id) : null;
    
    // Si no hay cliente seleccionado, mostrar solo artículos universales
    if (!clienteId) {
      const universales = articulosCache.filter(a => !a.cliente_id && a.activo);
      setArticulosDisponibles(universales);
      return;
    }

    // Si hay cliente seleccionado, mostrar:
    // 1. Artículos universales (cliente_id = null)
    // 2. Artículos específicos del cliente (cliente_id = clienteId)
    const filtrados = articulosCache.filter(a => 
      a.activo && (
        !a.cliente_id || // Universales
        a.cliente_id === clienteId // Del cliente seleccionado
      )
    );
    
    setArticulosDisponibles(filtrados);
  }, [articulosCache, formData.cliente_id]);

  // Scroll automático al formulario cuando se abre
  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showForm]);

  // Cargar datos solo si no están en caché
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadRemitosCache(),
          loadClientesCache(),
          loadArticulosCache()
        ]);
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };
    loadData();
  }, []); // Solo se ejecuta una vez al montar

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    
    // Si es un campo numérico y está vacío, mantenerlo como string vacío
    if (type === 'number') {
      finalValue = value === '' ? '' : (parseFloat(value) || 0);
    }
    
    setFormData({ ...formData, [name]: finalValue });
  };

  // Funciones para búsqueda de cliente
  const handleBuscarCliente = (e) => {
    const valor = e.target.value;
    setBusquedaCliente(valor);
    
    if (valor === '') {
      setClientesFiltrados([]);
      setMostrarListaClientes(false);
      setFormData({ ...formData, cliente_id: '' });
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
    setMostrarListaClientes(true);
  };

  const handleSeleccionarCliente = (cliente) => {
    setFormData({ ...formData, cliente_id: cliente.id.toString() });
    setBusquedaCliente(cliente.nombre);
    setClientesFiltrados([]);
    setMostrarListaClientes(false);
  };

  const handleLimpiarCliente = () => {
    setFormData({ ...formData, cliente_id: '' });
    setBusquedaCliente('');
    setClientesFiltrados([]);
    setMostrarListaClientes(false);
  };

  const addArticulo = () => {
    // Abrir modal para agregar artículo
    setModalAgregarArticulo({ 
      abierto: true, 
      articuloId: '', 
      cantidad: '',
      precioBase: ''
    });
    setBusquedaArticulo('');
    setArticulosFiltrados([]);
    setMostrarListaArticulos(false);
    setMostrarFormNuevoArticulo(false);
    setNuevoArticuloData({ 
      nombre: '', 
      precio_base: '', 
      descripcion: '',
      medida: '',
      cabezal: '',
      costado: '',
      fondo: '',
      taco: '',
      esquinero: '',
      despeje: ''
    });
  };

  // Funciones para búsqueda de artículo en el modal
  const handleBuscarArticulo = (e) => {
    const valor = e.target.value;
    setBusquedaArticulo(valor);
    
    if (valor === '') {
      setArticulosFiltrados([]);
      setMostrarListaArticulos(false);
      setModalAgregarArticulo({ ...modalAgregarArticulo, articuloId: '', precioBase: '', precioUnitario: '' });
      return;
    }
    
    // Filtrar artículos por código, nombre o descripción
    const clienteId = formData.cliente_id ? parseInt(formData.cliente_id) : null;
    const valorLower = valor.toLowerCase();
    
    // Separar artículos exclusivos del cliente y universales
    const exclusivos = articulosDisponibles.filter(a => 
      a.activo && a.cliente_id === clienteId && 
      (a.codigo?.toLowerCase().includes(valorLower) ||
       a.nombre?.toLowerCase().includes(valorLower) || 
       a.descripcion?.toLowerCase().includes(valorLower))
    );
    
    const universales = articulosDisponibles.filter(a => 
      a.activo && !a.cliente_id && 
      (a.codigo?.toLowerCase().includes(valorLower) ||
       a.nombre?.toLowerCase().includes(valorLower) || 
       a.descripcion?.toLowerCase().includes(valorLower))
    );
    
    // Primero los exclusivos, luego los universales
    // Eliminar duplicados usando un Map por ID
    const todosArticulos = [...exclusivos, ...universales];
    const filtrados = Array.from(
      new Map(todosArticulos.map(a => [a.id, a])).values()
    );
    
    setArticulosFiltrados(filtrados);
    setMostrarListaArticulos(true);
  };

  const handleSeleccionarArticulo = (articulo) => {
    const precioBase = parseFloat(articulo.precio_base) || 0;
    // Formatear precio en formato argentino: punto para miles, coma para decimales
    let precioFormateado = '';
    if (precioBase > 0) {
      const partes = precioBase.toFixed(2).split('.');
      const parteEntera = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      precioFormateado = `${parteEntera},${partes[1]}`;
    }
    
    setModalAgregarArticulo({ 
      ...modalAgregarArticulo, 
      articuloId: articulo.id.toString(), 
      precioBase: precioBase,
      precioUnitario: precioFormateado
    });
    setBusquedaArticulo(articulo.codigo ? `[${articulo.codigo}] ${articulo.nombre}` : articulo.nombre);
    setArticulosFiltrados([]);
    setMostrarListaArticulos(false);
    setMostrarFormNuevoArticulo(false);
  };

  const handleCrearNuevoArticulo = async () => {
    if (!nuevoArticuloData.nombre.trim()) {
      alertNoBloqueante('El nombre del artículo es obligatorio', 'error');
      return;
    }

    try {
      const clienteId = formData.cliente_id ? parseInt(formData.cliente_id) : null;
      // Convertir precio_base de string a número, manejando valores como ",09" o "0,09"
      let precioBase = 0;
      if (nuevoArticuloData.precio_base && nuevoArticuloData.precio_base !== '') {
        const precioLimpio = typeof nuevoArticuloData.precio_base === 'string' 
          ? limpiarFormatoNumero(nuevoArticuloData.precio_base) 
          : nuevoArticuloData.precio_base.toString();
        precioBase = parseFloat(precioLimpio) || 0;
      }
      
      const nuevoArticulo = {
        nombre: nuevoArticuloData.nombre.trim(),
        descripcion: nuevoArticuloData.descripcion || '',
        precio_base: precioBase,
        medida: nuevoArticuloData.medida || '',
        cabezal: nuevoArticuloData.cabezal || '',
        costado: nuevoArticuloData.costado || '',
        fondo: nuevoArticuloData.fondo || '',
        taco: nuevoArticuloData.taco || '',
        esquinero: nuevoArticuloData.esquinero || '',
        despeje: nuevoArticuloData.despeje || '',
        activo: true,
        cliente_id: clienteId // Si hay cliente seleccionado, el artículo será exclusivo
      };

      const articuloCreado = await db.createArticulo(nuevoArticulo);
      
      // Invalidar caché y recargar
      invalidateCache('articulos');
      invalidateCache('remitos');
      refreshRelated('articulos');
      await loadArticulosCache(true);
      
      // Seleccionar el artículo recién creado
      handleSeleccionarArticulo(articuloCreado);
      
      alertNoBloqueante('Artículo creado exitosamente', 'success');
    } catch (error) {
      console.error('Error creando artículo:', error);
      alertNoBloqueante('Error al crear artículo: ' + (error.message || 'Error desconocido'), 'error');
    }
  };

  // Función auxiliar para convertir valor argentino a número
  const convertirANumero = (valor) => {
    if (valor === null || valor === undefined || valor === '') return 0;
    const str = valor.toString();
    // Formato argentino: 1.234,56 -> quitar puntos de miles, coma a punto decimal
    const limpio = str.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(limpio);
    return isNaN(num) ? 0 : num;
  };

  const handleAgregarArticuloModal = () => {
    if (!modalAgregarArticulo.articuloId) {
      alertNoBloqueante('Debes seleccionar un artículo', 'error');
      return;
    }
    
    const articuloSeleccionado = articulosDisponibles.find(a => a.id === parseInt(modalAgregarArticulo.articuloId));
    if (!articuloSeleccionado) {
      alertNoBloqueante('Artículo no encontrado', 'error');
      return;
    }
    
    // Convertir cantidad de formato argentino a número
    const cantidadNum = convertirANumero(modalAgregarArticulo.cantidad);
    
    // Formatear cantidad para mostrar en formato argentino (1.234,56)
    const cantidadFormateada = cantidadNum === 0 ? '' : cantidadNum.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    
    // Usar el precio del modal (que el usuario pudo modificar)
    const precioUnitarioNum = convertirANumero(modalAgregarArticulo.precioUnitario);
    const precioTotal = cantidadNum * precioUnitarioNum;
    
    // Mantener el formato del precio como está en el modal
    const precioUnitario = modalAgregarArticulo.precioUnitario || '';
    
    const nuevosArticulos = [...formData.articulos, {
      articulo_id: parseInt(modalAgregarArticulo.articuloId),
      articulo_nombre: articuloSeleccionado.nombre,
      articulo_codigo: articuloSeleccionado.codigo || '',
      cantidad: cantidadFormateada, // Guardar como string formateado
      precio_unitario: precioUnitario, // String con coma decimal
      precio_total: precioTotal
    }];
    
    setFormData({ ...formData, articulos: nuevosArticulos });
    
    // Cerrar modal y limpiar
    setModalAgregarArticulo({ abierto: false, articuloId: '', cantidad: '', precioBase: '', precioUnitario: '' });
  };

  const handleCambiarArticuloModal = (articuloId) => {
    if (!articuloId) {
      setModalAgregarArticulo({ ...modalAgregarArticulo, articuloId: '', precioBase: '', precioUnitario: '' });
      return;
    }
    const articuloSeleccionado = articulosDisponibles.find(a => a.id === parseInt(articuloId));
    const precioBase = articuloSeleccionado ? parseFloat(articuloSeleccionado.precio_base) || 0 : 0;
    // Formatear precio en formato argentino: punto para miles, coma para decimales
    let precioFormateado = '';
    if (precioBase > 0) {
      const partes = precioBase.toFixed(2).split('.');
      const parteEntera = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      precioFormateado = `${parteEntera},${partes[1]}`;
    }
    setModalAgregarArticulo({ ...modalAgregarArticulo, articuloId, precioBase, precioUnitario: precioFormateado });
  };

  const removeArticulo = (index) => {
    const nuevosArticulos = formData.articulos.filter((_, i) => i !== index);
    setFormData({ ...formData, articulos: nuevosArticulos });
  };

  const updateArticulo = (index, field, value) => {
    const nuevosArticulos = [...formData.articulos];
    const articuloActual = nuevosArticulos[index];
    
    if (field === 'cantidad') {
      // Guardar el valor tal cual para mostrar, pero calcular con número limpio
      nuevosArticulos[index] = { ...articuloActual, cantidad: value };
      
      // Calcular precio total
      const cantidad = convertirANumero(value);
      const precioUnitario = convertirANumero(articuloActual.precio_unitario);
      nuevosArticulos[index].precio_total = cantidad * precioUnitario;
      
    } else if (field === 'precio_unitario') {
      // Guardar el valor tal cual para mostrar
      nuevosArticulos[index] = { ...articuloActual, precio_unitario: value };
      
      // Calcular precio total
      const cantidad = convertirANumero(articuloActual.cantidad);
      const precioUnitario = convertirANumero(value);
      nuevosArticulos[index].precio_total = cantidad * precioUnitario;
      
    } else {
      nuevosArticulos[index] = { ...articuloActual, [field]: value };
    }
    
    // Si cambió el artículo, actualizar nombre y precio base
    if (field === 'articulo_id' && value) {
      const articulo = articulosDisponibles.find(a => a.id === parseInt(value));
      if (articulo) {
        nuevosArticulos[index].articulo_nombre = articulo.nombre;
        const precioBase = articulo.precio_base || 0;
        // Actualizar precio unitario como string con coma decimal para mantener formato
        nuevosArticulos[index].precio_unitario = precioBase === 0 ? '' : precioBase.toString().replace('.', ',');
        // Recalcular precio total con la nueva cantidad y precio base
        const cantidadRaw = nuevosArticulos[index].cantidad;
        // Convertir formato argentino
        const cantidadStr = (cantidadRaw || '').toString().replace(/\./g, '').replace(',', '.');
        const cantidad = cantidadStr === '' ? 0 : parseFloat(cantidadStr) || 0;
        // Asegurar que precioBase sea un número limpio para el cálculo
        const precioBaseNumero = typeof precioBase === 'number' ? precioBase : parseFloat(precioBase) || 0;
        nuevosArticulos[index].precio_total = cantidad * precioBaseNumero;
      }
    }
    
    setFormData({ ...formData, articulos: nuevosArticulos });
  };

  const handleSelectImage = async () => {
    try {
      // Verificar si electronAPI está disponible
      if (!window.electronAPI || !window.electronAPI.selectImage) {
        alertNoBloqueante('La funcionalidad de seleccionar imagen solo está disponible en la versión de escritorio.', 'warning');
        return;
      }

      const selectedPath = await window.electronAPI.selectImage();
      if (selectedPath) {
        // Mostrar preview de la imagen seleccionada usando file:// protocol
        setImagenPreview(`file://${selectedPath.replace(/\\/g, '/')}`);
        
        // Guardar la ruta temporalmente hasta comprimir y guardar la imagen en MySQL (data URL / base64)
        setFormData({ ...formData, foto_path: selectedPath });
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      alertNoBloqueante('Error al seleccionar imagen: ' + error.message, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevenir doble envío
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Validar que tenga al menos un artículo
      if (!formData.articulos || formData.articulos.length === 0) {
        alertNoBloqueante('Debes agregar al menos un artículo al remito', 'error');
        setIsSubmitting(false);
        return;
      }
      
      // Validar y limpiar artículos antes de enviar
      const articulosLimpios = formData.articulos.map(art => {
        // Convertir valores vacíos o strings a números, limpiando formato visual
        // Convertir formato argentino: quitar puntos de miles, coma a punto decimal
        const cantidadStr = (art.cantidad || '').toString().replace(/\./g, '').replace(',', '.');
        const cantidad = cantidadStr === '' ? 0 : parseFloat(cantidadStr) || 0;
        const precioUnitarioLimpio = art.precio_unitario === '' || art.precio_unitario === null || art.precio_unitario === undefined ? '' : limpiarFormatoNumero(art.precio_unitario.toString());
        const precioUnitario = precioUnitarioLimpio === '' ? 0 : parseFloat(precioUnitarioLimpio) || 0;
        const precioTotal = art.precio_total === '' || art.precio_total === null || art.precio_total === undefined ? 0 : parseFloat(art.precio_total) || 0;
        
        return {
          articulo_id: art.articulo_id || null,
          articulo_nombre: art.articulo_nombre || '',
          cantidad: cantidad,
          precio_unitario: precioUnitario,
          precio_total: precioTotal
        };
      });
      
      // Calcular precio total del remito
      const precioTotalRemito = articulosLimpios.reduce((sum, art) => sum + parseFloat(art.precio_total || 0), 0);
      
      // Validar monto pagado cuando el estado es "Pagado" (limpiar formato visual)
      const montoPagadoLimpio = formData.monto_pagado === '' || formData.monto_pagado === null || formData.monto_pagado === undefined ? '' : limpiarFormatoNumero(formData.monto_pagado.toString());
      const montoPagado = montoPagadoLimpio === '' ? 0 : parseFloat(montoPagadoLimpio) || 0;
      
      if (formData.estado_pago === 'Pagado') {
        if (montoPagado < precioTotalRemito) {
          alertNoBloqueante(`El remito está marcado como "Pagado" pero el monto pagado (${formatearMonedaConSimbolo(montoPagado)}) es menor al precio total del remito (${formatearMonedaConSimbolo(precioTotalRemito)}). Por favor, ajuste el monto pagado o cambie el estado a "Pago Parcial".`, 'error');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Manejo de imágenes: comprimir y guardar en MySQL (como data URL / base64)
      let remitoId = editingRemito ? editingRemito.id : null;
      let fotoUrlFinal = formData.foto_path || null;
      
      // Si hay una imagen nueva seleccionada (ruta local)
      const tieneImagenNueva = formData.foto_path && 
        (formData.foto_path.includes('\\') || formData.foto_path.includes('/')) &&
        !formData.foto_path.startsWith('http');
      
      if (tieneImagenNueva && window.electronAPI && window.electronAPI.compressImage) {
        // Crear remito primero para obtener el ID (si es nuevo)
        if (!editingRemito) {
          const datosSinFoto = {
            ...formData,
            articulos: articulosLimpios,
            monto_pagado: montoPagado,
            foto_path: null
          };
          const remitoCreado = await db.createRemito(datosSinFoto);
          remitoId = remitoCreado.id;
        }
        
        // Comprimir la imagen
        try {
          const imagenComprimida = await window.electronAPI.compressImage(formData.foto_path, remitoId);
          
          // imagenComprimida.buffer viene como base64 string (sin prefijo data:)
          // Agregar el prefijo para crear data URL
          if (typeof imagenComprimida.buffer === 'string') {
            if (imagenComprimida.buffer.startsWith('data:image')) {
              // Ya tiene prefijo, usar directamente
              fotoUrlFinal = imagenComprimida.buffer;
            } else {
              // Es base64 sin prefijo, agregarlo
              fotoUrlFinal = `data:${imagenComprimida.mimeType || 'image/jpeg'};base64,${imagenComprimida.buffer}`;
            }
          } else {
            // Si es ArrayBuffer/Uint8Array, convertirlo usando la función
            fotoUrlFinal = await db.uploadRemitoImage(imagenComprimida.buffer, imagenComprimida.filename);
          }
          
          // Si estamos editando y había una imagen anterior, eliminarla (no hace nada en MySQL, pero por compatibilidad)
          if (editingRemito && editingRemito.foto_path) {
            await db.deleteRemitoImage(editingRemito.foto_path);
          }
        } catch (imgError) {
          console.error('Error subiendo imagen:', imgError);
          if (editingRemito) {
            alertNoBloqueante('Error al subir la imagen nueva. Se mantendrá la imagen anterior.', 'error');
            fotoUrlFinal = editingRemito.foto_path; // Mantener la anterior
          } else {
            alertNoBloqueante('Remito creado pero hubo un error al subir la imagen. El remito puede ser editado después.', 'warning');
            fotoUrlFinal = null;
          }
        }
      } else if (editingRemito && !tieneImagenNueva) {
        // Si estamos editando y no hay imagen nueva
        // Si formData.foto_path es null explícitamente, significa que el usuario eliminó la imagen
        if (formData.foto_path === null && editingRemito.foto_path) {
          // Eliminar/reemplazar la imagen anterior (compat)
          try {
            await db.deleteRemitoImage(editingRemito.foto_path);
          } catch (imgError) {
            console.warn('Error eliminando imagen anterior:', imgError);
            // Continuar aunque falle la eliminación de la imagen
          }
          fotoUrlFinal = null;
        } else {
          // Mantener la imagen actual
          fotoUrlFinal = editingRemito.foto_path || null;
        }
      }
      
      // Preparar datos finales para enviar
      // Guardar fecha con hora 14:00 para evitar problemas de zona horaria
      const fechaParaGuardar = formData.fecha ? fechaConHora14(formData.fecha) : fechaConHora14(obtenerFechaLocal());
      
      // Limpiar formato del monto pagado antes de guardar
      const montoPagadoParaGuardar = formData.monto_pagado === '' || formData.monto_pagado === null || formData.monto_pagado === undefined 
        ? 0 
        : (() => {
            // Si es string, limpiar formato primero
            if (typeof formData.monto_pagado === 'string') {
              const limpio = limpiarFormatoNumero(formData.monto_pagado);
              return limpio === '' ? 0 : parseFloat(limpio) || 0;
            }
            // Si ya es número, usarlo directamente
            return parseFloat(formData.monto_pagado) || 0;
          })();
      
      const datosEnviar = {
        ...formData,
        fecha: fechaParaGuardar, // Asegurar formato YYYY-MM-DD sin hora
        articulos: articulosLimpios,
        monto_pagado: montoPagadoParaGuardar,
        foto_path: fotoUrlFinal // data URL / referencia de imagen almacenada vía MySQL
      };
      
      // Si ya creamos el remito arriba, solo actualizar con la imagen
      if (remitoId && !editingRemito) {
        await db.updateRemito(remitoId, datosEnviar);
      } else if (editingRemito) {
        await db.updateRemito(editingRemito.id, datosEnviar);
      } else {
        // Solo crear si no lo creamos arriba
        const remitoCreado = await db.createRemito(datosEnviar);
        remitoId = remitoCreado?.id ?? null;
      }
      
      // Invalidar caché y recargar datos relacionados desde la base
      invalidateCache('remitos');
      invalidateCache('pagos');
      invalidateCache('resumen');
      refreshRelated('remitos');
      // Recargar todos los datos relacionados desde la base para sincronizar
      await Promise.all([
        loadRemitosCache(true), // Forzar recarga de remitos
        loadClientesCache(true), // Recargar clientes para actualizar cuentas
        loadArticulosCache(true) // Recargar artículos por si hay cambios
      ]);
      const estabaEditando = editingRemito !== null;
      const clienteIdForSaldo = formData.cliente_id ? parseInt(formData.cliente_id, 10) : null;
      const precioTotalNuevoRemito = precioTotalRemito;
      const fechaRemito = formData.fecha ? (typeof formData.fecha === 'string' && formData.fecha.match(/^\d{4}-\d{2}-\d{2}/) ? formData.fecha : null) : null;
      resetForm();
      alertNoBloqueante(estabaEditando ? 'Remito actualizado correctamente' : 'Remito creado correctamente', 'success');

      // Si fue creación (no edición) y hay cliente, verificar si tiene saldo a favor REAL (crédito restante) para ofrecer aplicarlo al remito
      if (!estabaEditando && remitoId && clienteIdForSaldo) {
        try {
          let cuentaCorriente = await db.getCuentaCorriente(clienteIdForSaldo);
          if (!cuentaCorriente?.saldoInicial) {
            try {
              const si = await db.getSaldoInicialCliente(clienteIdForSaldo);
              if (si) cuentaCorriente = { ...cuentaCorriente, saldoInicial: si };
            } catch (e) { /* ignorar */ }
          }
          const montoSaldoInicial = (cuentaCorriente?.saldoInicial && parseFloat(cuentaCorriente.saldoInicial.monto || 0)) || 0;
          const sumaYaAplicado = sumarPagosSaldoAFavorAplicado(cuentaCorriente?.pagos || []);
          const creditoRestante = Math.max(0, montoSaldoInicial - sumaYaAplicado);
          const precioTotal = Number(precioTotalNuevoRemito) || 0;
          const disponible = creditoRestante > 0 ? Math.min(creditoRestante, precioTotal) : 0;
          if (disponible > 0) {
            setRemitoParaSaldoFavor({
              id: remitoId,
              cliente_id: clienteIdForSaldo,
              precio_total: precioTotal,
              fecha: fechaRemito || obtenerFechaLocal()
            });
            setSaldoAFavorDisponible(disponible);
            setMontoAplicarSaldoFavor('');
            setDetalleAplicarSaldoFavor('');
            setShowAplicarSaldoFavorModal(true);
          }
        } catch (err) {
          console.warn('Error al verificar saldo a favor para modal:', err);
        }
      }
    } catch (error) {
      console.error('Error guardando remito:', error);
      alertNoBloqueante('Error al guardar remito: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmarAplicarSaldoFavor = async () => {
    if (!remitoParaSaldoFavor) return;
    const montoNum = montoAplicarSaldoFavor === '' ? 0 : (parseFloat(limpiarFormatoNumero(String(montoAplicarSaldoFavor))) || 0);
    const detalleTrim = (detalleAplicarSaldoFavor || '').trim();
    if (detalleTrim === '') {
      alertNoBloqueante('El detalle es obligatorio al aplicar saldo a favor.', 'warning');
      return;
    }
    if (montoNum <= 0) {
      alertNoBloqueante('El monto a aplicar debe ser mayor a 0.', 'warning');
      return;
    }
    if (montoNum > saldoAFavorDisponible) {
      alertNoBloqueante(`El monto no puede superar el saldo disponible (${formatearMonedaConSimbolo(saldoAFavorDisponible)}).`, 'warning');
      return;
    }
    setAplicandoSaldoFavor(true);
    await new Promise(resolve => setTimeout(resolve, 0));
    try {
      const fechaPago = remitoParaSaldoFavor.fecha && remitoParaSaldoFavor.fecha.match(/^\d{4}-\d{2}-\d{2}/)
        ? remitoParaSaldoFavor.fecha
        : obtenerFechaLocal();
      await db.createPago({
        remito_id: remitoParaSaldoFavor.id,
        cliente_id: remitoParaSaldoFavor.cliente_id,
        fecha: fechaPago,
        monto: montoNum,
        observaciones: `Saldo a favor aplicado - ${detalleTrim}`,
        es_cheque: false
      });
      invalidateCache('pagos');
      invalidateCache('remitos');
      invalidateCache('resumen');
      refreshRelated('remitos');
      await loadRemitosCache(true);
      await loadClientesCache(true);
      setShowAplicarSaldoFavorModal(false);
      setRemitoParaSaldoFavor(null);
      setSaldoAFavorDisponible(0);
      setMontoAplicarSaldoFavor('');
      setDetalleAplicarSaldoFavor('');
      alertNoBloqueante('Saldo a favor aplicado al remito correctamente.', 'success');
    } catch (error) {
      console.error('Error aplicando saldo a favor:', error);
      alertNoBloqueante('Error al aplicar saldo a favor: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
      setAplicandoSaldoFavor(false);
    }
  };

  const handleEdit = async (remito) => {
    try {
      setEditingRemito(remito);
      // Cargar los artículos del remito y formatear con formato argentino
      const articulosEditados = (remito.articulos || []).map(art => {
        // Formatear cantidad con formato argentino
        let cantidadFormateada = '';
        if (art.cantidad !== 0 && art.cantidad !== null && art.cantidad !== undefined) {
          // Convertir a número limpio
          let cantidadNum;
          if (typeof art.cantidad === 'string') {
            // Si es string, puede venir como "1008.00" desde MySQL (formato internacional)
            // o como "1.008,00" (formato argentino ya formateado)
            if (art.cantidad.includes(',')) {
              // Tiene coma, es formato argentino, usar limpiarFormatoNumero
              cantidadNum = parseFloat(limpiarFormatoNumero(art.cantidad));
            } else {
              // No tiene coma, parsear directamente (formato internacional)
              cantidadNum = parseFloat(art.cantidad);
            }
          } else {
            cantidadNum = Number(art.cantidad);
          }
          
          if (!isNaN(cantidadNum) && isFinite(cantidadNum)) {
            // Redondear a máximo 2 decimales
            cantidadNum = Math.round(cantidadNum * 100) / 100;
            cantidadFormateada = formatearCantidadDecimal(cantidadNum);
          }
        }
        
        // Formatear precio_unitario con formato argentino
        let precioUnitarioFormateado = '';
        if (art.precio_unitario !== 0 && art.precio_unitario !== null && art.precio_unitario !== undefined) {
          // Convertir a número limpio
          let precioNum;
          if (typeof art.precio_unitario === 'string') {
            // Si es string, puede venir como "2300.00" desde MySQL (formato internacional)
            // o como "2.300,00" (formato argentino ya formateado)
            if (art.precio_unitario.includes(',')) {
              // Tiene coma, es formato argentino, usar limpiarFormatoNumero
              precioNum = parseFloat(limpiarFormatoNumero(art.precio_unitario));
            } else {
              // No tiene coma, parsear directamente (formato internacional)
              precioNum = parseFloat(art.precio_unitario);
            }
          } else {
            precioNum = Number(art.precio_unitario);
          }
          
          if (!isNaN(precioNum) && isFinite(precioNum)) {
            // Redondear a máximo 2 decimales
            precioNum = Math.round(precioNum * 100) / 100;
            precioUnitarioFormateado = formatearCantidadDecimal(precioNum);
          }
        }
        
        return {
          ...art,
          articulo_id: art.articulo_id || null,
          articulo_nombre: art.articulo_nombre || '',
          cantidad: cantidadFormateada,
          precio_unitario: precioUnitarioFormateado,
          precio_total: art.precio_total || 0
        };
      });
      
      // Cargar la imagen si existe (data URL o URL pública según el registro)
      if (remito.foto_path) {
        setImagenPreview(remito.foto_path);
      } else {
        setImagenPreview(null);
      }
      
      // Cargar nombre del cliente en la búsqueda
      if (remito.cliente_id) {
        const cliente = clientes.find(c => c.id === remito.cliente_id);
        if (cliente) {
          setBusquedaCliente(cliente.nombre);
        } else {
          setBusquedaCliente('');
        }
      } else {
        setBusquedaCliente('');
      }
      
      setFormData({
        cliente_id: remito.cliente_id || '',
        fecha: fechaParaInput(remito.fecha),
        numero: remito.numero_remito || remito.numero || '',
        estado_pago: remito.estado_pago || 'Pendiente',
        monto_pagado: remito.monto_pagado && remito.monto_pagado !== 0 ? remito.monto_pagado.toString().replace('.', ',') : '',
        observaciones: remito.observaciones || '',
        articulos: articulosEditados,
        foto_path: remito.foto_path || null
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error editando remito:', error);
      alertNoBloqueante('Error al cargar remito para editar: ' + error.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (eliminandoId === id) return; // Ya se está eliminando
    
    confirmNoBloqueante('¿Estás seguro de eliminar este remito?').then(async (confirmado) => {
      if (!confirmado) return;
      setEliminandoId(id);
      try {
        await db.deleteRemito(id);
      // Invalidar caché y recargar datos relacionados desde la base
      invalidateCache('remitos');
      invalidateCache('pagos');
      invalidateCache('resumen');
      refreshRelated('remitos');
      // Recargar todos los datos relacionados desde la base para sincronizar
      await Promise.all([
        loadRemitosCache(true), // Forzar recarga de remitos
        loadClientesCache(true), // Recargar clientes para actualizar cuentas
        loadArticulosCache(true) // Recargar artículos por si hay cambios
      ]);
      alertNoBloqueante('Remito eliminado', 'success');
      } catch (error) {
        console.error('Error eliminando remito:', error);
        alertNoBloqueante('Error al eliminar remito: ' + error.message, 'error');
      } finally {
        setEliminandoId(null);
      }
    });
  };

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      fecha: obtenerFechaLocal(),
      numero: '',
      estado_pago: 'Pendiente',
      monto_pagado: '',
      observaciones: '',
      articulos: [],
      foto_path: null
    });
    setEditingRemito(null);
    setShowForm(false);
    setShowEditModal(false);
    setImagenPreview(null);
    // Limpiar búsqueda de cliente
    setBusquedaCliente('');
    setClientesFiltrados([]);
    setMostrarListaClientes(false);
    // Cerrar también el modal de agregar artículo si está abierto
    setModalAgregarArticulo({ abierto: false, articuloId: '', cantidad: '', precioBase: '', precioUnitario: '' });
    setBusquedaArticulo('');
    setArticulosFiltrados([]);
    setMostrarListaArticulos(false);
    setMostrarFormNuevoArticulo(false);
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'Pagado': 'badge-success',
      'Pendiente': 'badge-danger',
      'Pago Parcial': 'badge-warning'
    };
    return badges[estado] || 'badge-secondary';
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

  // Función para aplicar filtros
  const remitosFiltrados = remitos.filter(remito => {
    // Filtro por fecha desde
    if (filtros.fechaDesde) {
      // Comparar fechas como strings (YYYY-MM-DD) para evitar problemas de zona horaria
      const fechaRemito = remito.fecha ? remito.fecha.split('T')[0] : '';
      const fechaDesde = filtros.fechaDesde;
      if (fechaRemito < fechaDesde) return false;
    }
    
    // Filtro por fecha hasta
    if (filtros.fechaHasta) {
      // Comparar fechas como strings (YYYY-MM-DD) para evitar problemas de zona horaria
      const fechaRemito = remito.fecha ? remito.fecha.split('T')[0] : '';
      const fechaHasta = filtros.fechaHasta;
      if (fechaRemito > fechaHasta) return false;
    }
    
    // Filtro por monto mínimo
    if (filtros.montoMinimo) {
      const precioTotal = parseFloat(remito.precio_total || 0);
      const montoMin = parseFloat(limpiarFormatoNumero(filtros.montoMinimo)) || 0;
      if (precioTotal < montoMin) return false;
    }
    
    // Filtro por monto máximo
    if (filtros.montoMaximo) {
      const precioTotal = parseFloat(remito.precio_total || 0);
      const montoMax = parseFloat(limpiarFormatoNumero(filtros.montoMaximo)) || Infinity;
      if (precioTotal > montoMax) return false;
    }
    
    // Filtro por estado de pago
    if (filtros.estadoPago && filtros.estadoPago !== '') {
      if (remito.estado_pago !== filtros.estadoPago) return false;
    }
    
    // Filtro por búsqueda (número, cliente)
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      const numeroMatch = remito.numero?.toLowerCase().includes(busqueda);
      const clienteMatch = remito.cliente_nombre?.toLowerCase().includes(busqueda);
      if (!numeroMatch && !clienteMatch) return false;
    }
    
    // Filtro por cliente
    if (filtros.clienteId && filtros.clienteId !== '') {
      if (remito.cliente_id !== parseInt(filtros.clienteId)) return false;
    }
    
    return true;
  });
  
  const handleFiltroChange = (field, value) => {
    setFiltros({ ...filtros, [field]: value });
  };
  
  const limpiarFiltros = () => {
    setFiltros({
      fechaDesde: '',
      fechaHasta: '',
      montoMinimo: '',
      montoMaximo: '',
      estadoPago: '',
      busqueda: '',
      clienteId: ''
    });
    setPaginaActual(1); // Resetear a la primera página al limpiar filtros
  };
  
  // Calcular paginación (la búsqueda busca en TODOS los datos filtrados, luego se paginan)
  const totalPaginas = Math.ceil(remitosFiltrados.length / registrosPorPagina);
  const inicioIndex = (paginaActual - 1) * registrosPorPagina;
  const finIndex = inicioIndex + registrosPorPagina;
  const remitosPaginated = remitosFiltrados.slice(inicioIndex, finIndex);
  
  // Calcular totales de los remitos filtrados
  const totales = useMemo(() => {
    const totalPrecio = remitosFiltrados.reduce((sum, remito) => {
      return sum + parseFloat(remito.precio_total || 0);
    }, 0);
    
    const totalPagado = remitosFiltrados.reduce((sum, remito) => {
      // Asegurar que monto_pagado sea un número válido
      const montoPagado = remito.monto_pagado;
      let monto = 0;
      if (montoPagado !== null && montoPagado !== undefined && montoPagado !== '') {
        monto = parseFloat(montoPagado) || 0;
      }
      return sum + monto;
    }, 0);
    
    const totalPendiente = remitosFiltrados.reduce((sum, remito) => {
      const precioTotal = parseFloat(remito.precio_total || 0);
      const montoPagado = remito.monto_pagado;
      let monto = 0;
      if (montoPagado !== null && montoPagado !== undefined && montoPagado !== '') {
        monto = parseFloat(montoPagado) || 0;
      }
      const pendiente = Math.max(0, precioTotal - monto);
      return sum + pendiente;
    }, 0);
    
    return {
      totalPrecio,
      totalPagado,
      totalPendiente
    };
  }, [remitosFiltrados]);
  
  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [filtros.fechaDesde, filtros.fechaHasta, filtros.montoMinimo, filtros.montoMaximo, filtros.estadoPago, filtros.busqueda, filtros.clienteId]);
  
  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ margin: 0 }}>Gestión de Remitos</h2>
        <button className="btn btn-primary" onClick={() => {
          resetForm();
          setShowEditModal(true);
        }}>
          ➕ Nuevo Remito
        </button>
      </div>
      </div>

      {/* Modal flotante para editar o crear remito */}
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
              <h2 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                {editingRemito ? `✏️ Editar Remito ${editingRemito.numero || `#${editingRemito.id}`}` : '➕ Nuevo Remito'}
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
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Cliente *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={formData.cliente_id ? (clientes.find(c => c.id === parseInt(formData.cliente_id))?.nombre || busquedaCliente) : busquedaCliente}
                  onChange={handleBuscarCliente}
                  onFocus={(e) => {
                    e.target.select();
                    if (!formData.cliente_id && clientes.length > 0) {
                      setClientesFiltrados(clientes);
                      setMostrarListaClientes(true);
                    } else if (busquedaCliente) {
                      setMostrarListaClientes(true);
                    }
                  }}
                  onBlur={(e) => {
                    // Solo cerrar si el nuevo focus no es un elemento de la lista
                    const relatedTarget = e.relatedTarget;
                    if (!relatedTarget || !relatedTarget.closest('[data-dropdown-list]')) {
                      setTimeout(() => setMostrarListaClientes(false), 200);
                    }
                  }}
                  autoComplete="off"
                  placeholder={formData.cliente_id ? '' : "Buscar cliente..."}
                  required={!formData.cliente_id}
                  style={{ 
                    width: '100%', 
                    paddingRight: formData.cliente_id ? '80px' : '10px',
                    backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                    color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                    border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
                  }}
                />
                {formData.cliente_id && (
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
                {((busquedaCliente && !formData.cliente_id && clientesFiltrados.length > 0) || mostrarListaClientes) && (
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
                    {(mostrarListaClientes && clientesFiltrados.length === 0 && busquedaCliente) ? (
                      <div style={{
                        padding: '15px',
                        textAlign: 'center',
                        color: theme === 'dark' ? '#999' : '#666',
                        fontStyle: 'italic'
                      }}>
                        No se encontraron clientes
                      </div>
                    ) : (
                      clientesFiltrados.map(cliente => (
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
                          {cliente.telefono && (
                            <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', marginTop: '2px' }}>
                              📞 {cliente.telefono}
                            </div>
                          )}
                        </div>
                      ))
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Número de Remito</label>
              <input
                type="text"
                name="numero"
                value={formData.numero}
                onChange={handleInputChange}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label><strong>Artículos *</strong></label>
              <button type="button" className="btn btn-secondary" onClick={addArticulo} style={{ padding: '5px 15px', fontSize: '14px' }}>
                ➕ Agregar Artículo
              </button>
            </div>
            
            {formData.articulos.length === 0 && (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No hay artículos agregados. Haz clic en "Agregar Artículo" para comenzar.</p>
            )}

            {formData.articulos.map((articulo, index) => (
              <div key={index} style={{ border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, padding: '15px', marginBottom: '10px', borderRadius: '5px', backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong>Artículo {index + 1}</strong>
                  <button type="button" className="btn btn-danger" onClick={() => removeArticulo(index)} style={{ padding: '5px 10px', fontSize: '12px' }}>
                    🗑️ Eliminar
                  </button>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Artículo *</label>
                    <select
                      value={articulo.articulo_id || ''}
                      onChange={(e) => updateArticulo(index, 'articulo_id', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar artículo</option>
                      {articulosDisponibles.filter(a => a.activo).map(art => (
                        <option key={art.id} value={art.id}>
                          {art.codigo ? `[${art.codigo}] ` : ''}{art.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Cantidad *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={articulo.cantidad === 0 || articulo.cantidad === '' || articulo.cantidad === null || articulo.cantidad === undefined ? '' : (typeof articulo.cantidad === 'string' ? articulo.cantidad : formatearCantidadDecimal(articulo.cantidad))}
                      onChange={(e) => {
                        // Permitir dígitos, puntos (miles) y coma (decimal)
                        let valor = e.target.value.replace(/[^\d.,]/g, '');
                        // Solo permitir una coma decimal
                        const partes = valor.split(',');
                        if (partes.length > 2) {
                          valor = partes[0] + ',' + partes.slice(1).join('');
                        }
                        // Limitar a 2 decimales después de la coma
                        if (partes.length === 2 && partes[1].length > 2) {
                          valor = partes[0] + ',' + partes[1].substring(0, 2);
                        }
                        updateArticulo(index, 'cantidad', valor);
                      }}
                      onBlur={(e) => {
                        // Al salir del campo, sanitizar y reformatear correctamente
                        if (articulo.cantidad && articulo.cantidad !== '') {
                          let valorLimpio = articulo.cantidad.toString().trim();
                          
                          // PASO 1: Eliminar TODOS los puntos (separadores de miles)
                          const sinPuntos = valorLimpio.replace(/\./g, '');
                          
                          // PASO 2: Si tiene coma, convertirla a punto para parseFloat
                          const sinComas = sinPuntos.replace(',', '.');
                          
                          // PASO 3: Parsear a número
                          const numero = parseFloat(sinComas);
                          
                          // PASO 4: Si es válido, reformatear con formato argentino
                          if (!isNaN(numero)) {
                            const formateado = formatearCantidadDecimal(numero);
                          updateArticulo(index, 'cantidad', formateado);
                          } else {
                            // Si no es válido, limpiar el campo
                            updateArticulo(index, 'cantidad', '');
                          }
                        }
                      }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Precio Unitario *</label>
                    <input
                      type="text"
                      value={(() => {
                        if (articulo.precio_unitario === 0 || articulo.precio_unitario === '' || articulo.precio_unitario === null || articulo.precio_unitario === undefined) {
                          return '';
                        }
                        // Si es string, mostrarlo tal cual (ya viene formateado desde handleEdit)
                        if (typeof articulo.precio_unitario === 'string') {
                          return articulo.precio_unitario;
                        }
                        // Si es número, formatearlo con formato argentino
                        return formatearCantidadDecimal(articulo.precio_unitario);
                      })()}
                      onChange={(e) => {
                        // Permitir dígitos, puntos (miles) y coma (decimal)
                        let valor = e.target.value.replace(/[^\d.,]/g, '');
                        // Solo permitir una coma decimal
                        const partes = valor.split(',');
                        if (partes.length > 2) {
                          valor = partes[0] + ',' + partes.slice(1).join('');
                        }
                        // Limitar a 2 decimales después de la coma
                        if (partes.length === 2 && partes[1].length > 2) {
                          valor = partes[0] + ',' + partes[1].substring(0, 2);
                        }
                        // Mantener como string mientras se escribe para permitir valores como ",09"
                        updateArticulo(index, 'precio_unitario', valor);
                      }}
                      onBlur={(e) => {
                        // Al salir del campo, sanitizar y reformatear correctamente
                        if (articulo.precio_unitario && articulo.precio_unitario !== '') {
                          let valorLimpio = articulo.precio_unitario.toString().trim();
                          
                          // PASO 1: Eliminar TODOS los puntos (separadores de miles)
                          const sinPuntos = valorLimpio.replace(/\./g, '');
                          
                          // PASO 2: Si tiene coma, convertirla a punto para parseFloat
                          const sinComas = sinPuntos.replace(',', '.');
                          
                          // PASO 3: Parsear a número
                          const numero = parseFloat(sinComas);
                          
                          // PASO 4: Si es válido, reformatear con formato argentino
                          if (!isNaN(numero)) {
                            const formateado = formatearCantidadDecimal(numero);
                          updateArticulo(index, 'precio_unitario', formateado);
                          } else {
                            // Si no es válido, limpiar el campo
                            updateArticulo(index, 'precio_unitario', '');
                          }
                        }
                      }}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0,00"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Precio Total</label>
                    <input
                      type="text"
                      value={(() => {
                        if (articulo.precio_total === 0 || articulo.precio_total === '' || articulo.precio_total === null || articulo.precio_total === undefined) {
                          return '';
                        }
                        // Convertir número a string con punto decimal, luego formatear
                        const numero = typeof articulo.precio_total === 'number' 
                          ? articulo.precio_total 
                          : parseFloat(articulo.precio_total) || 0;
                        // Formatear con puntos de miles y coma decimal
                        return formatearMoneda(numero);
                      })()}
                      readOnly
                      style={{ backgroundColor: theme === 'dark' ? '#404040' : '#e9ecef', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {formData.articulos.length > 0 && (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e7f3ff', borderRadius: '5px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                <strong>Total del Remito: {formatearMonedaConSimbolo(
                  formData.articulos.reduce((sum, art) => sum + parseFloat(art.precio_total || 0), 0)
                )}</strong>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Estado de Pago *</label>
              <select
                name="estado_pago"
                value={formData.estado_pago}
                onChange={handleInputChange}
                required
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Pago Parcial">Pago Parcial</option>
                <option value="Pagado">Pagado</option>
              </select>
            </div>
          </div>

          {(formData.estado_pago === 'Pago Parcial' || formData.estado_pago === 'Pagado') && (
            <div className="form-group">
              <label>Monto Pagado</label>
              <input
                type="text"
                name="monto_pagado"
                value={(() => {
                  if (formData.monto_pagado === 0 || formData.monto_pagado === '' || formData.monto_pagado === null || formData.monto_pagado === undefined) {
                    return '';
                  }
                  // Si es string, formatearlo directamente
                  if (typeof formData.monto_pagado === 'string') {
                    return formatearNumeroVisual(formData.monto_pagado);
                  }
                  // Si es número, convertirlo a string y formatearlo
                  return formatearNumeroVisual(formData.monto_pagado.toString());
                })()}
                onChange={(e) => {
                  // Permitir dígitos, puntos (miles) y coma (decimal)
                  let valor = e.target.value.replace(/[^\d.,]/g, '');
                  // Solo permitir una coma decimal
                  const partes = valor.split(',');
                  if (partes.length > 2) {
                    valor = partes[0] + ',' + partes.slice(1).join('');
                  }
                  // Mantener como string mientras se escribe para permitir valores como ",09"
                  setFormData({ ...formData, monto_pagado: valor });
                }}
                onWheel={(e) => e.target.blur()}
                placeholder="0,00"
              />
            </div>
          )}

          <div className="form-group">
            <label>Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Foto del Remito (Opcional)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleSelectImage}
                style={{ width: 'fit-content' }}
              >
                📷 Seleccionar Imagen
              </button>
              {imagenPreview && (
                <div style={{ marginTop: '10px' }}>
                  <img 
                    src={imagenPreview} 
                    alt="Preview" 
                    style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '5px', border: '1px solid #ddd' }}
                    onError={(e) => {
                      console.error('Error cargando imagen:', e);
                      e.target.style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      setImagenPreview(null);
                      setFormData({ ...formData, foto_path: null });
                    }}
                    style={{ marginTop: '10px', padding: '5px 10px', fontSize: '12px' }}
                  >
                    🗑️ Eliminar Imagen
                  </button>
                </div>
              )}
            </div>
            <small style={{ color: theme === 'dark' ? '#999' : '#666', display: 'block', marginTop: '5px' }}>
              Las imágenes se comprimen automáticamente (1600px máximo, calidad 70%) y se guardan en la base MySQL para que todas las PCs puedan verlas. Tamaño estimado: ~100-300 KB por imagen.
            </small>
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
                    ? (editingRemito ? '⏳ Actualizando...' : '⏳ Guardando...') 
                    : (editingRemito ? '💾 Actualizar' : '✅ Guardar')
                  }
                </button>
              </div>
            </form>
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
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Cliente *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={formData.cliente_id ? (clientes.find(c => c.id === parseInt(formData.cliente_id))?.nombre || busquedaCliente) : busquedaCliente}
                  onChange={handleBuscarCliente}
                  onFocus={(e) => {
                    e.target.select();
                    if (!formData.cliente_id && clientes.length > 0) {
                      setClientesFiltrados(clientes);
                      setMostrarListaClientes(true);
                    } else if (busquedaCliente) {
                      setMostrarListaClientes(true);
                    }
                  }}
                  onBlur={(e) => {
                    const relatedTarget = e.relatedTarget;
                    if (!relatedTarget || !relatedTarget.closest('[data-dropdown-list]')) {
                      setTimeout(() => setMostrarListaClientes(false), 200);
                    }
                  }}
                  autoComplete="off"
                  placeholder={formData.cliente_id ? '' : "Buscar cliente..."}
                  required={!formData.cliente_id}
                  style={{ 
                    width: '100%', 
                    paddingRight: formData.cliente_id ? '80px' : '10px',
                    backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                    color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                    border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
                  }}
                />
                {formData.cliente_id && (
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
                
                {((busquedaCliente && !formData.cliente_id && clientesFiltrados.length > 0) || mostrarListaClientes) && (
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
                    {(mostrarListaClientes && clientesFiltrados.length === 0 && busquedaCliente) ? (
                      <div style={{
                        padding: '15px',
                        textAlign: 'center',
                        color: theme === 'dark' ? '#999' : '#666',
                        fontStyle: 'italic'
                      }}>
                        No se encontraron clientes
                      </div>
                    ) : (
                      clientesFiltrados.map(cliente => (
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
                          {cliente.telefono && (
                            <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', marginTop: '2px' }}>
                              📞 {cliente.telefono}
                            </div>
                          )}
                        </div>
                      ))
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Número de Remito</label>
              <input
                type="text"
                name="numero"
                value={formData.numero}
                onChange={handleInputChange}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label><strong>Artículos *</strong></label>
              <button type="button" className="btn btn-secondary" onClick={addArticulo} style={{ padding: '5px 15px', fontSize: '14px' }}>
                ➕ Agregar Artículo
              </button>
            </div>
            
            {formData.articulos.length === 0 && (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No hay artículos agregados. Haz clic en "Agregar Artículo" para comenzar.</p>
            )}

            {formData.articulos.map((articulo, index) => (
              <div key={index} style={{ border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, padding: '15px', marginBottom: '10px', borderRadius: '5px', backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong>Artículo {index + 1}</strong>
                  <button type="button" className="btn btn-danger" onClick={() => removeArticulo(index)} style={{ padding: '5px 10px', fontSize: '12px' }}>
                    🗑️ Eliminar
                  </button>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Artículo *</label>
                    <select
                      value={articulo.articulo_id || ''}
                      onChange={(e) => updateArticulo(index, 'articulo_id', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar artículo</option>
                      {articulosDisponibles.filter(a => a.activo).map(art => (
                        <option key={art.id} value={art.id}>
                          {art.codigo ? `[${art.codigo}] ` : ''}{art.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Cantidad *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={articulo.cantidad === 0 || articulo.cantidad === '' || articulo.cantidad === null || articulo.cantidad === undefined ? '' : articulo.cantidad}
                      onChange={(e) => {
                        // Permitir dígitos, puntos (miles) y coma (decimal)
                        let valor = e.target.value.replace(/[^\d.,]/g, '');
                        // Solo permitir una coma decimal
                        const partes = valor.split(',');
                        if (partes.length > 2) {
                          valor = partes[0] + ',' + partes.slice(1).join('');
                        }
                        // Limitar a 2 decimales después de la coma
                        if (partes.length === 2 && partes[1].length > 2) {
                          valor = partes[0] + ',' + partes[1].substring(0, 2);
                        }
                        updateArticulo(index, 'cantidad', valor);
                      }}
                      onBlur={(e) => {
                        // Al salir del campo, sanitizar y reformatear correctamente
                        if (articulo.cantidad && articulo.cantidad !== '') {
                          let valorLimpio = articulo.cantidad.toString().trim();
                          
                          // PASO 1: Eliminar TODOS los puntos (separadores de miles)
                          const sinPuntos = valorLimpio.replace(/\./g, '');
                          
                          // PASO 2: Si tiene coma, convertirla a punto para parseFloat
                          const sinComas = sinPuntos.replace(',', '.');
                          
                          // PASO 3: Parsear a número
                          const numero = parseFloat(sinComas);
                          
                          // PASO 4: Si es válido, reformatear con formato argentino
                          if (!isNaN(numero)) {
                            const formateado = formatearCantidadDecimal(numero);
                          updateArticulo(index, 'cantidad', formateado);
                          } else {
                            // Si no es válido, limpiar el campo
                            updateArticulo(index, 'cantidad', '');
                          }
                        }
                      }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Precio Unitario *</label>
                    <input
                      type="text"
                      value={(() => {
                        if (articulo.precio_unitario === 0 || articulo.precio_unitario === '' || articulo.precio_unitario === null || articulo.precio_unitario === undefined) {
                          return '';
                        }
                        // Si es string, formatearlo directamente
                        if (typeof articulo.precio_unitario === 'string') {
                          return formatearNumeroVisual(articulo.precio_unitario);
                        }
                        // Si es número, convertirlo a string con coma y formatearlo
                        return formatearNumeroVisual(articulo.precio_unitario.toString().replace('.', ','));
                      })()}
                      onChange={(e) => {
                        // Permitir dígitos, puntos (miles) y coma (decimal)
                        let valor = e.target.value.replace(/[^\d.,]/g, '');
                        // Solo permitir una coma decimal
                        const partes = valor.split(',');
                        if (partes.length > 2) {
                          valor = partes[0] + ',' + partes.slice(1).join('');
                        }
                        // Limitar a 2 decimales después de la coma
                        if (partes.length === 2 && partes[1].length > 2) {
                          valor = partes[0] + ',' + partes[1].substring(0, 2);
                        }
                        updateArticulo(index, 'precio_unitario', valor);
                      }}
                      onBlur={(e) => {
                        // Al salir del campo, sanitizar y reformatear correctamente
                        if (articulo.precio_unitario && articulo.precio_unitario !== '') {
                          let valorLimpio = articulo.precio_unitario.toString().trim();
                          
                          // PASO 1: Eliminar TODOS los puntos (separadores de miles)
                          const sinPuntos = valorLimpio.replace(/\./g, '');
                          
                          // PASO 2: Si tiene coma, convertirla a punto para parseFloat
                          const sinComas = sinPuntos.replace(',', '.');
                          
                          // PASO 3: Parsear a número
                          const numero = parseFloat(sinComas);
                          
                          // PASO 4: Si es válido, reformatear con formato argentino
                          if (!isNaN(numero)) {
                            const formateado = formatearCantidadDecimal(numero);
                            updateArticulo(index, 'precio_unitario', formateado);
                          } else {
                            // Si no es válido, limpiar el campo
                            updateArticulo(index, 'precio_unitario', '');
                          }
                        }
                      }}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0,00"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Precio Total</label>
                    <input
                      type="text"
                      value={(() => {
                        if (articulo.precio_total === 0 || articulo.precio_total === '' || articulo.precio_total === null || articulo.precio_total === undefined) {
                          return '';
                        }
                        // Convertir número a string con punto decimal, luego formatear
                        const numero = typeof articulo.precio_total === 'number' 
                          ? articulo.precio_total 
                          : parseFloat(articulo.precio_total) || 0;
                        // Formatear con puntos de miles y coma decimal
                        return formatearMoneda(numero);
                      })()}
                      readOnly
                      style={{ backgroundColor: theme === 'dark' ? '#404040' : '#e9ecef', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {formData.articulos.length > 0 && (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e7f3ff', borderRadius: '5px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                <strong>Total del Remito: {formatearMonedaConSimbolo(
                  formData.articulos.reduce((sum, art) => sum + parseFloat(art.precio_total || 0), 0)
                )}</strong>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Estado de Pago *</label>
              <select
                name="estado_pago"
                value={formData.estado_pago}
                onChange={handleInputChange}
                required
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Pago Parcial">Pago Parcial</option>
                <option value="Pagado">Pagado</option>
              </select>
            </div>
          </div>

          {(formData.estado_pago === 'Pago Parcial' || formData.estado_pago === 'Pagado') && (
            <div className="form-group">
              <label>Monto Pagado</label>
              <input
                type="text"
                name="monto_pagado"
                value={(() => {
                  if (formData.monto_pagado === 0 || formData.monto_pagado === '' || formData.monto_pagado === null || formData.monto_pagado === undefined) {
                    return '';
                  }
                  // Si es string, formatearlo directamente
                  if (typeof formData.monto_pagado === 'string') {
                    return formatearNumeroVisual(formData.monto_pagado);
                  }
                  // Si es número, convertirlo a string y formatearlo
                  return formatearNumeroVisual(formData.monto_pagado.toString());
                })()}
                onChange={(e) => {
                  // Permitir dígitos, puntos (miles) y coma (decimal)
                  let valor = e.target.value.replace(/[^\d.,]/g, '');
                  // Solo permitir una coma decimal
                  const partes = valor.split(',');
                  if (partes.length > 2) {
                    valor = partes[0] + ',' + partes.slice(1).join('');
                  }
                  // Mantener como string mientras se escribe para permitir valores como ",09"
                  setFormData({ ...formData, monto_pagado: valor });
                }}
                onWheel={(e) => e.target.blur()}
                placeholder="0,00"
              />
            </div>
          )}

          <div className="form-group">
            <label>Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Foto del Remito (Opcional)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleSelectImage}
                style={{ width: 'fit-content' }}
              >
                📷 Seleccionar Imagen
              </button>
              {imagenPreview && (
                <div style={{ marginTop: '10px' }}>
                  <img 
                    src={imagenPreview} 
                    alt="Preview" 
                    style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '5px', border: '1px solid #ddd' }}
                    onError={(e) => {
                      console.error('Error cargando imagen:', e);
                      e.target.style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      setImagenPreview(null);
                      setFormData({ ...formData, foto_path: null });
                    }}
                    style={{ marginTop: '10px', padding: '5px 10px', fontSize: '12px' }}
                  >
                    🗑️ Eliminar Imagen
                  </button>
                </div>
              )}
            </div>
            <small style={{ color: theme === 'dark' ? '#999' : '#666', display: 'block', marginTop: '5px' }}>
              Las imágenes se comprimen automáticamente (1600px máximo, calidad 70%) y se guardan en la base MySQL para que todas las PCs puedan verlas. Tamaño estimado: ~100-300 KB por imagen.
            </small>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              type="submit" 
              className="btn btn-success"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (editingRemito ? '⏳ Actualizando...' : '⏳ Guardando...') 
                : (editingRemito ? '💾 Actualizar' : '✅ Guardar')
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

      {/* Filtros avanzados */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ 
        marginTop: '20px', 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f9f9f9', 
        borderRadius: '8px',
        border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>🔍 Filtros Avanzados</h3>
          <button 
            className="btn btn-secondary" 
            onClick={limpiarFiltros}
            style={{ padding: '5px 15px', fontSize: '12px' }}
          >
            ✕ Limpiar Filtros
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {/* Búsqueda por texto */}
          <div className="form-group">
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Buscar (número/cliente)</label>
            <input
              type="text"
              value={filtros.busqueda}
              onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
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
          
          {/* Cliente */}
          <div className="form-group">
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Cliente</label>
            <select
              value={filtros.clienteId}
              onChange={(e) => handleFiltroChange('clienteId', e.target.value)}
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
          
          {/* Fecha desde */}
          <div className="form-group">
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Fecha desde</label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
              style={{ 
                width: '100%', 
                padding: '6px',
                backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
              }}
            />
          </div>
          
          {/* Fecha hasta */}
          <div className="form-group">
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Fecha hasta</label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
              style={{ 
                width: '100%', 
                padding: '6px',
                backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
              }}
            />
          </div>
          
          {/* Monto mínimo */}
          <div className="form-group">
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Monto mínimo</label>
            <input
              type="text"
              value={filtros.montoMinimo === '' ? '' : formatearNumeroVisual(filtros.montoMinimo.toString())}
              onChange={(e) => {
                // Permitir dígitos, puntos (miles) y coma (decimal)
                let valor = e.target.value.replace(/[^\d.,]/g, '');
                // Solo permitir una coma decimal
                const partes = valor.split(',');
                if (partes.length > 2) {
                  valor = partes[0] + ',' + partes.slice(1).join('');
                }
                const valorLimpio = limpiarFormatoNumero(valor);
                handleFiltroChange('montoMinimo', valorLimpio);
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
          
          {/* Monto máximo */}
          <div className="form-group">
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Monto máximo</label>
            <input
              type="text"
              value={filtros.montoMaximo === '' ? '' : formatearNumeroVisual(filtros.montoMaximo.toString())}
              onChange={(e) => {
                // Permitir dígitos, puntos (miles) y coma (decimal)
                let valor = e.target.value.replace(/[^\d.,]/g, '');
                // Solo permitir una coma decimal
                const partes = valor.split(',');
                if (partes.length > 2) {
                  valor = partes[0] + ',' + partes.slice(1).join('');
                }
                const valorLimpio = limpiarFormatoNumero(valor);
                handleFiltroChange('montoMaximo', valorLimpio);
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
          
          {/* Estado de pago */}
          <div className="form-group">
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Estado</label>
            <select
              value={filtros.estadoPago}
              onChange={(e) => handleFiltroChange('estadoPago', e.target.value)}
              style={{ 
                width: '100%', 
                padding: '6px',
                backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
              }}
            >
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Pago Parcial">Pago Parcial</option>
              <option value="Pagado">Pagado</option>
            </select>
          </div>
        </div>
        
        {/* Contador de resultados y paginación */}
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: theme === 'dark' ? '#404040' : '#e9ecef', 
          borderRadius: '5px', 
          fontSize: '13px', 
          color: theme === 'dark' ? '#999' : '#666',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            Mostrando {inicioIndex + 1} - {Math.min(finIndex, remitosFiltrados.length)} de {remitosFiltrados.length} remito(s)
            {remitosFiltrados.length !== remitos.length && (
              <span style={{ color: theme === 'dark' ? '#5dade2' : '#007bff', marginLeft: '10px' }}>
                (filtrados de {remitos.length} total)
              </span>
            )}
          </div>
          
          {/* Controles de paginación */}
          {totalPaginas > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => cambiarPagina(paginaActual - 1)}
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
                onClick={() => cambiarPagina(paginaActual + 1)}
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
        </div>
        </div>
      </div>

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
            onClick={() => cambiarPagina(paginaActual - 1)}
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
            onClick={() => cambiarPagina(paginaActual + 1)}
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

      {/* Tabla de Remitos */}
      <div className="card">
        <div className="table-container">
          <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Fecha</th>
              <th>Número</th>
              <th>Cliente</th>
              <th>Artículos</th>
              <th>Cantidad Total</th>
              <th>Precio Unit.</th>
              <th>Precio Total</th>
              <th>Estado</th>
              <th>Pagado</th>
              <th>Pendiente</th>
              <th>Imagen</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {remitosFiltrados.length === 0 ? (
              <tr style={{ backgroundColor: theme === 'dark' ? '#2d2d2d' : 'white' }}>
                <td colSpan="13" className="text-center" style={{ padding: '20px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                  {remitos.length === 0 ? 'No hay remitos registrados' : 'No hay remitos que coincidan con los filtros'}
                </td>
              </tr>
            ) : (
              remitosPaginated.map(remito => {
                const totalArticulos = (remito.articulos || []).length;
                const totalCantidad = (remito.articulos || []).reduce((sum, art) => sum + parseFloat(art.cantidad || 0), 0);
                const precioTotal = parseFloat(remito.precio_total || 0);
                const montoPagado = parseFloat(remito.monto_pagado || 0);
                // Calcular pendiente: siempre >= 0 (si hay saldo a favor, pendiente = 0)
                const pendiente = Math.max(0, precioTotal - montoPagado);
                const estaExpandido = remitosExpandidos.has(remito.id);
                const articulos = remito.articulos || [];
                
                // Asegurar que el estado sea correcto: si pagado >= total, debe estar como "Pagado"
                let estadoCorrecto = remito.estado_pago || 'Pendiente';
                if (precioTotal > 0 && montoPagado >= precioTotal) {
                  estadoCorrecto = 'Pagado';
                } else if (montoPagado > 0 && precioTotal > 0) {
                  estadoCorrecto = 'Pago Parcial';
                } else if (montoPagado === 0) {
                  estadoCorrecto = 'Pendiente';
                }
                
                return (
                  <React.Fragment key={remito.id}>
                    <tr style={{ cursor: 'pointer', backgroundColor: theme === 'dark' ? '#2d2d2d' : 'white', color: theme === 'dark' ? '#e0e0e0' : '#333' }} onClick={() => toggleRemitoExpandido(remito.id)}>
                      <td style={{ textAlign: 'center', width: '40px', padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
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
                            toggleRemitoExpandido(remito.id);
                          }}
                          title={estaExpandido ? 'Contraer' : 'Expandir'}
                        >
                          {estaExpandido ? '▼' : '▶'}
                        </button>
                      </td>
                      <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{formatearFecha(remito.fecha)}</td>
                      <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{remito.numero || '-'}</td>
                      <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{remito.cliente_nombre || ''}</td>
                      <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                        {totalArticulos > 0 ? (
                          <span title={(remito.articulos || []).map(a => a.articulo_nombre).join(', ')}>
                            {totalArticulos} artículo{totalArticulos !== 1 ? 's' : ''}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{formatearCantidadDecimal(totalCantidad)}</td>
                      <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>-</td>
                      <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}><strong>{formatearMonedaConSimbolo(precioTotal)}</strong></td>
                      <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>
                        <span className={`badge ${getEstadoBadge(estadoCorrecto)}`}>
                          {estadoCorrecto}
                        </span>
                      </td>
                      <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{formatearMonedaConSimbolo(montoPagado)}</td>
                      <td style={{ padding: '10px', color: pendiente === 0 ? (theme === 'dark' ? '#28a745' : '#28a745') : (theme === 'dark' ? '#e0e0e0' : '#333'), fontWeight: pendiente === 0 ? 'normal' : 'bold' }}>
                        {pendiente === 0 ? '✓ Pagado' : formatearMonedaConSimbolo(pendiente)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }} onClick={(e) => e.stopPropagation()}>
                        {remito.foto_path ? (
                          <button 
                            className="btn btn-primary" 
                            style={{ 
                              padding: '5px 10px', 
                              fontSize: '12px',
                              color: 'white',
                              fontWeight: 'bold'
                            }} 
                            onClick={() => {
                              const imageUrl = db.getPublicImageUrl(remito.foto_path);
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
                      <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }} onClick={(e) => e.stopPropagation()}>
                        <button className="btn btn-success" style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }} onClick={() => handleEdit(remito)}>
                          ✏️
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ 
                            padding: '5px 10px', 
                            fontSize: '12px',
                            opacity: eliminandoId === remito.id ? 0.5 : 1,
                            cursor: eliminandoId === remito.id ? 'not-allowed' : 'pointer'
                          }} 
                          onClick={() => handleDelete(remito.id)}
                          disabled={eliminandoId === remito.id}
                          title={eliminandoId === remito.id ? 'Eliminando...' : 'Eliminar remito'}
                        >
                          {eliminandoId === remito.id ? '⏳' : '🗑️'}
                        </button>
                      </td>
                    </tr>
                    {estaExpandido && articulos.length > 0 && (
                      <tr style={{ backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f9f9f9' }}>
                        <td colSpan="12" style={{ padding: '15px', paddingLeft: '50px', backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f9f9f9' }}>
                          <div style={{ marginLeft: '20px' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>Artículos del Remito:</h4>
                            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', backgroundColor: theme === 'dark' ? '#2a2a2a' : 'white' }}>
                              <thead>
                                <tr style={{ backgroundColor: theme === 'dark' ? '#404040' : '#e9ecef', fontWeight: 'bold' }}>
                                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, color: theme === 'dark' ? '#e0e0e0' : '#333' }}>Código</th>
                                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, color: theme === 'dark' ? '#e0e0e0' : '#333' }}>Artículo</th>
                                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, color: theme === 'dark' ? '#e0e0e0' : '#333' }}>Cantidad</th>
                                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, color: theme === 'dark' ? '#e0e0e0' : '#333' }}>Precio Unitario</th>
                                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`, color: theme === 'dark' ? '#e0e0e0' : '#333' }}>Precio Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {articulos.map((articulo, index) => (
                                  <tr key={index} style={{ borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}`, backgroundColor: theme === 'dark' ? '#2a2a2a' : 'white' }}>
                                    <td style={{ 
                                      padding: '8px', 
                                      color: theme === 'dark' ? '#5dade2' : '#007bff',
                                      fontFamily: 'monospace',
                                      fontWeight: 'bold',
                                      textAlign: 'center'
                                    }}>
                                      {articulo.articulo_codigo || '-'}
                                    </td>
                                    <td style={{ padding: '8px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{articulo.articulo_nombre || '-'}</td>
                                    <td style={{ padding: '8px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{formatearCantidadDecimal(articulo.cantidad || 0)}</td>
                                    <td style={{ padding: '8px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{formatearMonedaConSimbolo(articulo.precio_unitario || 0)}</td>
                                    <td style={{ padding: '8px', fontWeight: 'bold', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{formatearMonedaConSimbolo(articulo.precio_total || 0)}</td>
                                  </tr>
                                ))}
                                <tr style={{ backgroundColor: theme === 'dark' ? '#404040' : '#e9ecef', fontWeight: 'bold' }}>
                                  <td style={{ padding: '8px', color: theme === 'dark' ? '#e0e0e0' : '#333' }} colSpan="4">TOTAL:</td>
                                  <td style={{ padding: '8px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{formatearMonedaConSimbolo(precioTotal)}</td>
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
              })
            )}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: theme === 'dark' ? '#404040' : '#e9ecef', fontWeight: 'bold' }}>
              <td colSpan="7" style={{ padding: '10px', textAlign: 'right', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>TOTALES:</td>
              <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{formatearMonedaConSimbolo(totales.totalPrecio)}</td>
              <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}></td>
              <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{formatearMonedaConSimbolo(totales.totalPagado)}</td>
              <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{formatearMonedaConSimbolo(totales.totalPendiente)}</td>
              <td colSpan="2" style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : '#333' }}></td>
            </tr>
          </tfoot>
        </table>
        </div>

        {/* Controles de paginación ABAJO */}
      {totalPaginas > 1 && (
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
            onClick={() => cambiarPagina(paginaActual - 1)}
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
            onClick={() => cambiarPagina(paginaActual + 1)}
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
      </div>

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

      {/* Modal para agregar artículo */}
      {modalAgregarArticulo.abierto && (
        <div 
          key={`modal-articulo-${modalAgregarArticulo.abierto}`}
          data-modal-overlay="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1003,
            padding: '20px',
            pointerEvents: 'auto'
          }}
          onClick={(e) => {
            // Solo cerrar si se hace clic en el overlay, no en el contenido del modal
            if (e.target === e.currentTarget) {
              setModalAgregarArticulo({ abierto: false, articuloId: '', cantidad: '', precioBase: '', precioUnitario: '' });
              setBusquedaArticulo('');
              setArticulosFiltrados([]);
              setMostrarListaArticulos(false);
              setMostrarFormNuevoArticulo(false);
              setNuevoArticuloData({ 
      nombre: '', 
      precio_base: '', 
      descripcion: '',
      medida: '',
      cabezal: '',
      costado: '',
      fondo: '',
      taco: '',
      esquinero: '',
      despeje: ''
    });
              // FORZAR limpieza completa inmediatamente
              setTimeout(() => {
              }, 50);
            }
          }}
        >
          <div 
            style={{
              backgroundColor: theme === 'dark' ? '#3a3a3a' : 'white',
              borderRadius: '8px',
              padding: '25px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.3)',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit',
              border: theme === 'dark' ? '1px solid #555' : 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>➕ Agregar Artículo al Remito</h3>
              <button 
                className="btn btn-danger"
                onClick={() => {
            setModalAgregarArticulo({ abierto: false, articuloId: '', cantidad: '', precioBase: '', precioUnitario: '' });
            setBusquedaArticulo('');
            setArticulosFiltrados([]);
            setMostrarListaArticulos(false);
            setMostrarFormNuevoArticulo(false);
            setNuevoArticuloData({ 
      nombre: '', 
      precio_base: '', 
      descripcion: '',
      medida: '',
      cabezal: '',
      costado: '',
      fondo: '',
      taco: '',
      esquinero: '',
      despeje: ''
    });
          }}
                style={{ padding: '5px 15px' }}
              >
                ✕
              </button>
            </div>
            
            <div className="form-group" style={{ marginBottom: '15px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label>Buscar Artículo *</label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setMostrarFormNuevoArticulo(!mostrarFormNuevoArticulo);
                    if (!mostrarFormNuevoArticulo) {
                      setBusquedaArticulo('');
                      setArticulosFiltrados([]);
                      setMostrarListaArticulos(false);
                    }
                  }}
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                >
                  {mostrarFormNuevoArticulo ? '❌ Cancelar' : '➕ Crear Nuevo'}
                </button>
              </div>
              
              {!mostrarFormNuevoArticulo ? (
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={modalAgregarArticulo.articuloId ? (() => {
                      const articulo = articulosDisponibles.find(a => a.id === parseInt(modalAgregarArticulo.articuloId));
                      if (articulo) {
                        return articulo.codigo ? `[${articulo.codigo}] ${articulo.nombre}` : articulo.nombre;
                      }
                      return busquedaArticulo;
                    })() : busquedaArticulo}
                    onChange={handleBuscarArticulo}
                    onFocus={(e) => {
                      e.target.select();
                      // Permitir agregar artículos incluso sin cliente (solo universales)
                      if (!modalAgregarArticulo.articuloId) {
                        const clienteId = formData.cliente_id ? parseInt(formData.cliente_id) : null;
                        // Eliminar duplicados primero usando un Map por ID
                        const articulosUnicos = Array.from(
                          new Map(articulosDisponibles.map(a => [a.id, a])).values()
                        );
                        // Si no hay cliente, mostrar solo universales; si hay cliente, mostrar exclusivos + universales
                        let articulosParaMostrar = [];
                        if (clienteId) {
                          const exclusivos = articulosUnicos.filter(a => a.activo && a.cliente_id === clienteId);
                          const universales = articulosUnicos.filter(a => a.activo && !a.cliente_id);
                          articulosParaMostrar = [...exclusivos, ...universales];
                        } else {
                          // Sin cliente, solo universales
                          articulosParaMostrar = articulosUnicos.filter(a => a.activo && !a.cliente_id);
                        }
                        // Eliminar duplicados al combinar
                        const sinDuplicados = Array.from(
                          new Map(articulosParaMostrar.map(a => [a.id, a])).values()
                        );
                        setArticulosFiltrados(sinDuplicados);
                        setMostrarListaArticulos(true);
                      } else if (busquedaArticulo) {
                        setMostrarListaArticulos(true);
                      }
                    }}
                    onBlur={(e) => {
                      // Solo cerrar si el nuevo focus no es un elemento de la lista
                      const relatedTarget = e.relatedTarget;
                      if (!relatedTarget || !relatedTarget.closest('[data-dropdown-list]')) {
                        setTimeout(() => setMostrarListaArticulos(false), 200);
                      }
                    }}
                    autoComplete="off"
                    placeholder="Buscar por código, nombre o descripción..."
                    required={!modalAgregarArticulo.articuloId}
                    style={{ 
                      width: '100%', 
                      paddingRight: modalAgregarArticulo.articuloId ? '80px' : '10px',
                      padding: '10px',
                      borderRadius: '4px', 
                      border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                      backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                      color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                      fontSize: '14px'
                    }}
                    autoFocus
                  />
                  {modalAgregarArticulo.articuloId && (
                    <button
                      type="button"
                      onClick={() => {
                        setModalAgregarArticulo({ ...modalAgregarArticulo, articuloId: '', precioBase: '', precioUnitario: '' });
                        setBusquedaArticulo('');
                      }}
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
                      ✕
                    </button>
                  )}
                  
                  {/* Lista desplegable de artículos filtrados */}
                  {((busquedaArticulo && !modalAgregarArticulo.articuloId && articulosFiltrados.length > 0) || mostrarListaArticulos) && (
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
                      zIndex: 1004,
                      boxShadow: theme === 'dark' ? '0 4px 6px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {(() => {
                        const clienteId = formData.cliente_id ? parseInt(formData.cliente_id) : null;
                        // Usar un Set para evitar duplicados por ID
                        const articulosUnicos = Array.from(
                          new Map(articulosFiltrados.map(a => [a.id, a])).values()
                        );
                        const exclusivos = articulosUnicos.filter(a => a.cliente_id === clienteId);
                        const universales = articulosUnicos.filter(a => !a.cliente_id);
                        
                        return (
                          <>
                            {exclusivos.length > 0 && (
                              <>
                                <div style={{
                                  padding: '8px 15px',
                                  backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e7f3ff',
                                  borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                                  fontWeight: 'bold',
                                  fontSize: '12px',
                                  color: theme === 'dark' ? '#5dade2' : '#0066cc'
                                }}>
                                  👤 Artículos Exclusivos de este Cliente
                                </div>
                                {exclusivos.map(articulo => (
                                  <div
                                    key={articulo.id}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSeleccionarArticulo(articulo)}
                                    style={{
                                      padding: '12px 15px',
                                      cursor: 'pointer',
                                      borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}`,
                                      color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                                      transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#333' : '#f5f5f5'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                      {articulo.codigo ? `[${articulo.codigo}] ` : ''}{articulo.nombre}
                                    </div>
                                    {articulo.descripcion && (
                                      <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', marginTop: '2px' }}>
                                        {articulo.descripcion}
                                      </div>
                                    )}
                                    <div style={{ fontSize: '12px', color: theme === 'dark' ? '#5dade2' : '#0066cc', marginTop: '4px', fontWeight: 'bold' }}>
                                      💰 {formatearMonedaConSimbolo(articulo.precio_base || 0)}
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                            {universales.length > 0 && (
                              <>
                                {exclusivos.length > 0 && (
                                  <div style={{
                                    padding: '8px 15px',
                                    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f9f9f9',
                                    borderTop: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                                    borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                                    fontWeight: 'bold',
                                    fontSize: '12px',
                                    color: theme === 'dark' ? '#999' : '#666'
                                  }}>
                                    🌐 Artículos Universales
                                  </div>
                                )}
                                {universales.map(articulo => (
                                  <div
                                    key={articulo.id}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSeleccionarArticulo(articulo)}
                                    style={{
                                      padding: '12px 15px',
                                      cursor: 'pointer',
                                      borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}`,
                                      color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                                      transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#333' : '#f5f5f5'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                      {articulo.codigo ? `[${articulo.codigo}] ` : ''}{articulo.nombre}
                                    </div>
                                    {articulo.descripcion && (
                                      <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', marginTop: '2px' }}>
                                        {articulo.descripcion}
                                      </div>
                                    )}
                                    <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', marginTop: '4px' }}>
                                      💰 {formatearMonedaConSimbolo(articulo.precio_base || 0)}
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                            {articulosFiltrados.length === 0 && busquedaArticulo && (
                              <div style={{
                                padding: '15px',
                                textAlign: 'center',
                                color: theme === 'dark' ? '#999' : '#666',
                                fontStyle: 'italic'
                              }}>
                                No se encontraron artículos. Usa el botón "Crear Nuevo" para agregar uno.
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  padding: '15px',
                  backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f9f9f9',
                  borderRadius: '5px',
                  border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
                }}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Nombre del Artículo *</label>
                    <input
                      type="text"
                      value={nuevoArticuloData.nombre}
                      onChange={(e) => setNuevoArticuloData({ ...nuevoArticuloData, nombre: e.target.value })}
                      placeholder="Ej: Cajón Especial..."
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                        backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                        color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                      }}
                      autoFocus
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Precio Base (opcional)</label>
                    <input
                      type="text"
                      value={(() => {
                        if (nuevoArticuloData.precio_base === '' || nuevoArticuloData.precio_base === null || nuevoArticuloData.precio_base === undefined) {
                          return '';
                        }
                        // Si es string, formatearlo directamente
                        if (typeof nuevoArticuloData.precio_base === 'string') {
                          return formatearNumeroVisual(nuevoArticuloData.precio_base);
                        }
                        // Si es número, convertirlo a string y formatearlo
                        return formatearNumeroVisual(nuevoArticuloData.precio_base.toString());
                      })()}
                      onChange={(e) => {
                        // Permitir dígitos, puntos (miles) y coma (decimal)
                        let valor = e.target.value.replace(/[^\d.,]/g, '');
                        // Solo permitir una coma decimal
                        const partes = valor.split(',');
                        if (partes.length > 2) {
                          valor = partes[0] + ',' + partes.slice(1).join('');
                        }
                        // Mantener como string mientras se escribe para permitir valores como ",09"
                        setNuevoArticuloData({ ...nuevoArticuloData, precio_base: valor });
                      }}
                      placeholder="0,00"
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                        backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                        color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Descripción (opcional)</label>
                    <textarea
                      value={nuevoArticuloData.descripcion}
                      onChange={(e) => setNuevoArticuloData({ ...nuevoArticuloData, descripcion: e.target.value })}
                      placeholder="Descripción del artículo..."
                      rows="2"
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                        backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                        color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Sección de Medidas y Detalles */}
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '15px', 
                    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f0f0f0', 
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                    marginBottom: '15px'
                  }}>
                    <h3 style={{ margin: '0 0 15px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit', fontSize: '16px' }}>
                      📐 Medidas y Detalles de la Caja
                    </h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Medida (Dimensiones)</label>
                      <input
                        type="text"
                        value={nuevoArticuloData.medida || ''}
                        onChange={(e) => setNuevoArticuloData({ ...nuevoArticuloData, medida: e.target.value })}
                        placeholder="Ej: 20 X 28 X 48"
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '4px',
                          border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                          backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                          color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                        }}
                      />
                      <small style={{ color: theme === 'dark' ? '#999' : '#666', fontSize: '12px' }}>Dimensiones de la caja</small>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Cabezal</label>
                        <textarea
                          value={nuevoArticuloData.cabezal || ''}
                          onChange={(e) => setNuevoArticuloData({ ...nuevoArticuloData, cabezal: e.target.value })}
                          rows="2"
                          placeholder="Ej: 8 X 28 más 2 suplementos de 3.7 X 28"
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                            backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                            color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Costado</label>
                        <textarea
                          value={nuevoArticuloData.costado || ''}
                          onChange={(e) => setNuevoArticuloData({ ...nuevoArticuloData, costado: e.target.value })}
                          rows="2"
                          placeholder="Ej: 3 tablas de 5.7 X 48"
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                            backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                            color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Fondo</label>
                        <input
                          type="text"
                          value={nuevoArticuloData.fondo || ''}
                          onChange={(e) => setNuevoArticuloData({ ...nuevoArticuloData, fondo: e.target.value })}
                          placeholder="Ej: CONVENCIONAL o 5 tablas de 5.8 X 50"
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                            backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                            color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Taco</label>
                        <input
                          type="text"
                          value={nuevoArticuloData.taco || ''}
                          onChange={(e) => setNuevoArticuloData({ ...nuevoArticuloData, taco: e.target.value })}
                          placeholder="Ej: CONVENCIONAL"
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                            backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                            color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Esquinero</label>
                        <input
                          type="text"
                          value={nuevoArticuloData.esquinero || ''}
                          onChange={(e) => setNuevoArticuloData({ ...nuevoArticuloData, esquinero: e.target.value })}
                          placeholder='Ej: A 17" / Holgura: TOP 1.5 CM'
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                            backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                            color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Despeje</label>
                        <input
                          type="text"
                          value={nuevoArticuloData.despeje || ''}
                          onChange={(e) => setNuevoArticuloData({ ...nuevoArticuloData, despeje: e.target.value })}
                          placeholder="Ej: arriba 4,5CM"
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                            backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                            color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e7f3ff', 
                    borderRadius: '5px',
                    fontSize: '12px',
                    color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                    marginBottom: '15px'
                  }}>
                    {formData.cliente_id ? (
                      <strong>ℹ️ Este artículo será exclusivo para el cliente seleccionado</strong>
                    ) : (
                      <strong>ℹ️ Este artículo será universal (disponible para todos los clientes)</strong>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleCrearNuevoArticulo}
                    style={{ width: '100%', padding: '10px' }}
                  >
                    ✅ Crear y Agregar Artículo
                  </button>
                </div>
              )}
            </div>

            {modalAgregarArticulo.articuloId && (
              <>
                {/* Precio base de referencia */}
                <div style={{ 
                  marginBottom: '10px', 
                  padding: '8px', 
                  backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e7f3ff', 
                  borderRadius: '5px',
                  fontSize: '13px',
                  color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                }}>
                  <strong>Precio base del artículo:</strong> {formatearMonedaConSimbolo(modalAgregarArticulo.precioBase || 0)}
                </div>

                {/* Campo Precio Unitario editable */}
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label>Precio Unitario *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={modalAgregarArticulo.precioUnitario}
                    onChange={(e) => {
                      let valor = e.target.value.replace(/[^0-9.,]/g, '');
                      // Solo permitir una coma decimal
                      const partes = valor.split(',');
                      if (partes.length > 2) {
                        valor = partes[0] + ',' + partes.slice(1).join('');
                      }
                      // Limitar a 2 decimales después de la coma
                      if (partes.length === 2 && partes[1].length > 2) {
                        valor = partes[0] + ',' + partes[1].substring(0, 2);
                      }
                      setModalAgregarArticulo({ ...modalAgregarArticulo, precioUnitario: valor });
                    }}
                    onBlur={(e) => {
                      if (modalAgregarArticulo.precioUnitario) {
                        let valorLimpio = modalAgregarArticulo.precioUnitario.toString().trim();
                        
                        // PASO 1: Eliminar TODOS los puntos (separadores de miles)
                        const sinPuntos = valorLimpio.replace(/\./g, '');
                        
                        // PASO 2: Si tiene coma, convertirla a punto para parseFloat
                        const sinComas = sinPuntos.replace(',', '.');
                        
                        // PASO 3: Parsear a número
                        const numero = parseFloat(sinComas);
                        
                        // PASO 4: Si es válido, reformatear con formato argentino
                        if (!isNaN(numero)) {
                          const formateado = formatearCantidadDecimal(numero);
                        setModalAgregarArticulo({ ...modalAgregarArticulo, precioUnitario: formateado });
                        } else {
                          setModalAgregarArticulo({ ...modalAgregarArticulo, precioUnitario: '' });
                        }
                      }
                    }}
                    placeholder="Ej: 2.300"
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                      backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                      color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                    }}
                    required
                  />
                </div>

                {/* Campo Cantidad */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label>Cantidad *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={modalAgregarArticulo.cantidad}
                    onChange={(e) => {
                      let valor = e.target.value.replace(/[^0-9.,]/g, '');
                      // Solo permitir una coma decimal
                      const partes = valor.split(',');
                      if (partes.length > 2) {
                        valor = partes[0] + ',' + partes.slice(1).join('');
                      }
                      // Limitar a 2 decimales después de la coma
                      if (partes.length === 2 && partes[1].length > 2) {
                        valor = partes[0] + ',' + partes[1].substring(0, 2);
                      }
                      setModalAgregarArticulo({ ...modalAgregarArticulo, cantidad: valor });
                    }}
                    onBlur={(e) => {
                      if (modalAgregarArticulo.cantidad) {
                        let valorLimpio = modalAgregarArticulo.cantidad.toString().trim();
                        
                        // PASO 1: Eliminar TODOS los puntos (separadores de miles)
                        const sinPuntos = valorLimpio.replace(/\./g, '');
                        
                        // PASO 2: Si tiene coma, convertirla a punto para parseFloat
                        const sinComas = sinPuntos.replace(',', '.');
                        
                        // PASO 3: Parsear a número
                        const numero = parseFloat(sinComas);
                        
                        // PASO 4: Si es válido, reformatear con formato argentino
                        if (!isNaN(numero)) {
                          const formateado = formatearCantidadDecimal(numero);
                        setModalAgregarArticulo({ ...modalAgregarArticulo, cantidad: formateado });
                        } else {
                          setModalAgregarArticulo({ ...modalAgregarArticulo, cantidad: '' });
                        }
                      }
                    }}
                    placeholder="Ej: 1.251,44"
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                      backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                      color: theme === 'dark' ? '#e0e0e0' : 'inherit'
                    }}
                    required
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setModalAgregarArticulo({ abierto: false, articuloId: '', cantidad: '', precioBase: '', precioUnitario: '' });
                  setBusquedaArticulo('');
                  setArticulosFiltrados([]);
                  setMostrarListaArticulos(false);
                  setMostrarFormNuevoArticulo(false);
                  setNuevoArticuloData({ 
      nombre: '', 
      precio_base: '', 
      descripcion: '',
      medida: '',
      cabezal: '',
      costado: '',
      fondo: '',
      taco: '',
      esquinero: '',
      despeje: ''
    });
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-success"
                onClick={handleAgregarArticuloModal}
              >
                ✅ Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aplicar saldo a favor al remito recién creado */}
      {showAplicarSaldoFavorModal && remitoParaSaldoFavor && (
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
            if (e.target === e.currentTarget) setShowAplicarSaldoFavorModal(false);
          }}
        >
          <div
            style={{
              backgroundColor: theme === 'dark' ? '#2d2d2d' : 'white',
              padding: '25px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              border: `2px solid ${theme === 'dark' ? '#5dade2' : '#17a2b8'}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '16px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
              Aplicar saldo a favor a este remito
            </h3>
            <div style={{
              padding: '12px',
              backgroundColor: theme === 'dark' ? '#1a3a4a' : '#d1ecf1',
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid #17a2b8'
            }}>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Este cliente tiene saldo a favor (por saldo inicial y/o adelantos). Podés aplicar hasta <strong>{formatearMonedaConSimbolo(saldoAFavorDisponible)}</strong> al remito recién creado.
              </p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Monto a aplicar *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatearNumeroVisual(montoAplicarSaldoFavor)}
                  onChange={(e) => setMontoAplicarSaldoFavor(e.target.value.replace(/[^0-9.,]/g, ''))}
                  placeholder={formatearMonedaConSimbolo(saldoAFavorDisponible)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                    color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                    border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                    borderRadius: '6px',
                    textAlign: 'right'
                  }}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-outline-info"
                  onClick={() => setMontoAplicarSaldoFavor(String(saldoAFavorDisponible))}
                >
                  Max
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Detalle del pago (obligatorio) *</label>
              <textarea
                value={detalleAplicarSaldoFavor}
                onChange={(e) => setDetalleAplicarSaldoFavor(e.target.value)}
                rows={3}
                placeholder="Ej: Aplicación de saldo a favor por remito recién creado"
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: theme === 'dark' ? '#404040' : '#fff',
                  color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                  border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                  borderRadius: '6px',
                  resize: 'vertical',
                  fontSize: '13px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowAplicarSaldoFavorModal(false);
                  setRemitoParaSaldoFavor(null);
                  setMontoAplicarSaldoFavor('');
                  setDetalleAplicarSaldoFavor('');
                  setAplicandoSaldoFavor(false);
                }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-info"
                onClick={handleConfirmarAplicarSaldoFavor}
                disabled={
                  aplicandoSaldoFavor ||
                  (montoAplicarSaldoFavor === '' || (parseFloat(limpiarFormatoNumero(String(montoAplicarSaldoFavor))) || 0) <= 0) ||
                  (detalleAplicarSaldoFavor || '').trim() === ''
                }
                style={aplicandoSaldoFavor ? { cursor: 'not-allowed', opacity: 0.85 } : undefined}
              >
                {aplicandoSaldoFavor ? 'Cargando...' : 'Aplicar saldo a favor'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Remitos;

