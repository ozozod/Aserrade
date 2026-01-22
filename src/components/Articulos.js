import React, { useState, useEffect } from 'react';
import * as supabaseService from '../services/databaseService';
import { formatearMonedaConSimbolo, formatearNumeroVisual, limpiarFormatoNumero } from '../utils/formatoMoneda';
import { useTheme } from '../context/ThemeContext';
import { useDataCache } from '../context/DataCacheContext';
import { alertNoBloqueante, confirmNoBloqueante } from '../utils/notificaciones';

function Articulos() {
  const { theme } = useTheme();
  const { 
    articulos: articulosCache,
    clientes: clientesCache,
    loadArticulos: loadArticulosCache,
    loadClientes: loadClientesCache,
    invalidateCache,
    refreshRelated
  } = useDataCache();
  
  const [articulos, setArticulos] = useState(articulosCache);
  const [clientes, setClientes] = useState(clientesCache);
  const [showForm, setShowForm] = useState(false);
  const [editingArticulo, setEditingArticulo] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina] = useState(30);
  const [articulosExpandidos, setArticulosExpandidos] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const formRef = React.useRef(null);
  
  // Estados para búsqueda de cliente
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    precioMinimo: '',
    precioMaximo: '',
    estado: '' // 'todos', 'activo', 'inactivo'
  });
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio_base: '', // String vacío inicialmente para permitir edición
    activo: 1,
    medida: '',
    cabezal: '',
    costado: '',
    fondo: '',
    taco: '',
    esquinero: '',
    despeje: '',
    tipo_articulo: 'universal', // 'universal' o 'cliente'
    cliente_id: null, // null para universales, ID de cliente para únicos
    codigo: '' // Código del artículo (0001, 0002, etc.)
  });
  
  // Estados para imágenes del artículo (múltiples)
  const [imagenesSeleccionadas, setImagenesSeleccionadas] = useState([]); // Array de File objects
  const [imagenesPreview, setImagenesPreview] = useState([]); // Array de URLs de preview
  const [imagenesExistentes, setImagenesExistentes] = useState([]); // Array de imágenes existentes del artículo
  const [imagenesAEliminar, setImagenesAEliminar] = useState(new Set()); // IDs/índices de imágenes a eliminar
  const [subiendoImagenes, setSubiendoImagenes] = useState(false);
  const [imagenModal, setImagenModal] = useState({ abierto: false, url: null, imagenes: [], index: 0 });

  // Sincronizar datos del caché con estado local
  useEffect(() => {
    setArticulos(articulosCache);
  }, [articulosCache]);

  // Scroll automático al formulario cuando se abre
  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showForm]);

  useEffect(() => {
    setClientes(clientesCache);
  }, [clientesCache]);

  // Cargar datos solo si no están en caché
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadArticulosCache(),
          loadClientesCache()
        ]);
      } catch (error) {
        console.error('Error cargando datos:', error);
        alertNoBloqueante('Error al cargar datos: ' + error.message, 'error');
      }
    };
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // Para campos de precio, manejar formato visual con puntos y coma decimal
    if (name === 'precio_base') {
      // Permitir dígitos, puntos (miles) y coma (decimal)
      let valor = value.replace(/[^\d.,]/g, '');
      // Solo permitir una coma decimal
      const partes = valor.split(',');
      if (partes.length > 2) {
        valor = partes[0] + ',' + partes.slice(1).join('');
      }
      // Mantener como string mientras se escribe para permitir valores como ",09"
      // Solo guardar el string formateado, no convertirlo a número todavía
      setFormData({ ...formData, [name]: valor });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Funciones para búsqueda de cliente
  const handleBuscarCliente = (e) => {
    const valor = e.target.value;
    setBusquedaCliente(valor);
    
    if (valor === '') {
      setClientesFiltrados([]);
      setMostrarListaClientes(false);
      setFormData({ ...formData, cliente_id: null });
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
    // Verificar que cliente existe y tiene id
    if (!cliente || cliente.id === undefined || cliente.id === null) {
      console.error('Cliente inválido:', cliente);
      return;
    }
    setFormData({ ...formData, cliente_id: cliente.id });
    setBusquedaCliente(cliente.nombre || '');
    setClientesFiltrados([]);
    setMostrarListaClientes(false);
  };

  const handleLimpiarCliente = () => {
    setFormData({ ...formData, cliente_id: null });
    setBusquedaCliente('');
    setClientesFiltrados([]);
    setMostrarListaClientes(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevenir doble envío
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Validar que el código sea único (si no es edición o si cambió el código)
      if (formData.codigo) {
        const codigoFormateado = formData.codigo.padStart(4, '0');
        const articuloConMismoCodigo = articulos.find(a => 
          a.codigo === codigoFormateado && 
          (!editingArticulo || a.id !== editingArticulo.id)
        );
        
        if (articuloConMismoCodigo) {
          alertNoBloqueante('El código ya está en uso por otro artículo. Por favor, usa otro código.', 'error');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Limpiar datos antes de enviar
      // Limpiar formato de precio_base antes de enviar
      const precioBaseLimpio = formData.precio_base === '' || formData.precio_base === null || formData.precio_base === undefined ? 0 : parseFloat(limpiarFormatoNumero(formData.precio_base.toString())) || 0;
      
      // Preparar datos para enviar (excluir tipo_articulo que es solo para el formulario)
      const { tipo_articulo, ...datosSinTipo } = formData;
      const codigoFormateado = formData.codigo ? formData.codigo.padStart(4, '0') : '';
      const datosEnviar = {
        ...datosSinTipo,
        precio_base: precioBaseLimpio,
        cliente_id: formData.tipo_articulo === 'universal' ? null : (formData.cliente_id || null),
        codigo: codigoFormateado
      };
      
      // Manejar múltiples imágenes: subir nuevas y combinar con existentes
      setSubiendoImagenes(true);
      try {
        const imagenesFinales = [];
        
        // 1. Agregar imágenes existentes que NO fueron eliminadas
        if (editingArticulo && imagenesExistentes.length > 0) {
          imagenesExistentes.forEach((img, index) => {
            if (!imagenesAEliminar.has(index)) {
              imagenesFinales.push(img);
            }
          });
        }
        
        // 2. Subir nuevas imágenes seleccionadas
        if (imagenesSeleccionadas.length > 0) {
          for (const file of imagenesSeleccionadas) {
            try {
              const imagenUrl = await supabaseService.uploadRemitoImage(file, `articulo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
              imagenesFinales.push(imagenUrl);
            } catch (imgError) {
              console.error('Error subiendo imagen:', imgError);
              alertNoBloqueante('Error al subir una imagen, pero se continuará con las demás', 'warning');
            }
          }
        }
        
        // 3. Guardar como JSON array (o null si no hay imágenes)
        if (imagenesFinales.length > 0) {
          datosEnviar.imagen_url = JSON.stringify(imagenesFinales);
        } else {
          datosEnviar.imagen_url = null;
        }
      } catch (imgError) {
        console.error('Error procesando imágenes:', imgError);
        alertNoBloqueante('Error al procesar imágenes, pero el artículo se guardará', 'warning');
      } finally {
        setSubiendoImagenes(false);
      }
      
      if (editingArticulo) {
        await supabaseService.updateArticulo(editingArticulo.id, datosEnviar);
      } else {
        await supabaseService.createArticulo(datosEnviar);
      }
      // Invalidar caché y recargar datos relacionados desde la base
      invalidateCache('articulos');
      invalidateCache('remitos');
      refreshRelated('articulos');
      // Recargar todos los datos relacionados desde la base para sincronizar
      await loadArticulosCache(true); // Forzar recarga de artículos
      const estabaEditando = editingArticulo !== null;
      setShowEditModal(false);
      resetForm();
      
      // FORZAR limpieza completa después de cerrar el modal
      setTimeout(() => {
        // Mostrar notificación después de la limpieza
        setTimeout(() => {
          alertNoBloqueante(estabaEditando ? 'Artículo actualizado correctamente' : 'Artículo creado correctamente', 'success');
        }, 50);
      }, 100);
    } catch (error) {
      console.error('Error guardando artículo:', error);
      alertNoBloqueante('Error al guardar artículo: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (eliminandoId === id) return; // Ya se está eliminando
    
    confirmNoBloqueante('¿Estás seguro de eliminar este artículo? Esta acción no se puede deshacer.').then(async (confirmado) => {
      if (!confirmado) return;
      setEliminandoId(id);
      try {
        await supabaseService.deleteArticulo(id);
      // Invalidar caché y recargar datos relacionados desde la base
      invalidateCache('articulos');
      invalidateCache('remitos');
      refreshRelated('articulos');
      // Recargar todos los datos relacionados desde la base para sincronizar
      await loadArticulosCache(true); // Forzar recarga de artículos
      alertNoBloqueante('Artículo eliminado correctamente', 'success');
      } catch (error) {
        console.error('Error eliminando artículo:', error);
        alertNoBloqueante('Error al eliminar artículo: ' + error.message, 'error');
      } finally {
        setEliminandoId(null);
      }
    });
  };

  const handleEdit = (articulo) => {
    try {
      setEditingArticulo(articulo);
      const precioBase = articulo.precio_base;
      const esUniversal = !articulo.cliente_id;
      const clienteId = articulo.cliente_id || null;
      const clienteNombre = clienteId ? (clientes.find(c => c.id === clienteId)?.nombre || '') : '';
      
      // Convertir precio_base a string con coma decimal para permitir edición
      let precioBaseString = '';
      if (precioBase !== 0 && precioBase !== null && precioBase !== undefined) {
        // Convertir el número a string y reemplazar el punto decimal por coma
        precioBaseString = precioBase.toString().replace('.', ',');
      }
      
      setFormData({
        nombre: articulo.nombre || '',
        descripcion: articulo.descripcion || '',
        precio_base: precioBaseString, // Mantener como string con coma para permitir edición
        activo: articulo.activo !== undefined ? articulo.activo : 1,
        medida: articulo.medida || '',
        cabezal: articulo.cabezal || '',
        costado: articulo.costado || '',
        fondo: articulo.fondo || '',
        taco: articulo.taco || '',
        esquinero: articulo.esquinero || '',
        despeje: articulo.despeje || '',
        tipo_articulo: esUniversal ? 'universal' : 'cliente',
        cliente_id: clienteId,
        codigo: articulo.codigo || ''
      });
      
      // Cargar imágenes existentes (puede ser string simple o JSON array)
      let imagenesExistentesArray = [];
      if (articulo.imagen_url) {
        try {
          // Intentar parsear como JSON (array de imágenes)
          const parsed = JSON.parse(articulo.imagen_url);
          if (Array.isArray(parsed)) {
            imagenesExistentesArray = parsed;
          } else {
            // Si no es array, es una imagen antigua (string simple)
            imagenesExistentesArray = [articulo.imagen_url];
          }
        } catch (e) {
          // Si falla el parse, es una imagen antigua (string simple)
          imagenesExistentesArray = [articulo.imagen_url];
        }
      }
      setImagenesExistentes(imagenesExistentesArray);
      setImagenesSeleccionadas([]);
      setImagenesPreview([]);
      setImagenesAEliminar(new Set());
      
      // Establecer el nombre del cliente en el buscador si existe
      setBusquedaCliente(clienteNombre);
      
      // Abrir modal flotante
      setShowForm(true);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error editando artículo:', error);
      alertNoBloqueante('Error al cargar artículo para editar: ' + error.message, 'error');
    }
  };

  const toggleArticuloExpandido = (articuloId) => {
    const nuevosExpandidos = new Set(articulosExpandidos);
    if (nuevosExpandidos.has(articuloId)) {
      nuevosExpandidos.delete(articuloId);
    } else {
      nuevosExpandidos.add(articuloId);
    }
    setArticulosExpandidos(nuevosExpandidos);
  };

  const resetForm = async () => {
    // Obtener siguiente código automático cuando se resetea el formulario (nuevo artículo)
    let siguienteCodigo = '';
    if (!editingArticulo) {
      try {
        siguienteCodigo = await supabaseService.obtenerSiguienteCodigo();
      } catch (error) {
        console.error('Error obteniendo siguiente código:', error);
        siguienteCodigo = '0001';
      }
    }
    
    setFormData({
      nombre: '',
      descripcion: '',
      precio_base: '', // String vacío para permitir edición
      activo: 1,
      medida: '',
      cabezal: '',
      costado: '',
      fondo: '',
      taco: '',
      esquinero: '',
      despeje: '',
      tipo_articulo: 'universal',
      cliente_id: null,
      codigo: siguienteCodigo
    });
    setBusquedaCliente('');
    setClientesFiltrados([]);
    setMostrarListaClientes(false);
    setEditingArticulo(null);
    setShowForm(false);
    setShowEditModal(false);
    // Limpiar imágenes
    setImagenesSeleccionadas([]);
    setImagenesPreview([]);
    setImagenesExistentes([]);
    setImagenesAEliminar(new Set());
    // Liberar URLs de preview
    imagenesPreview.forEach(url => URL.revokeObjectURL(url));
  };
  
  // Función para seleccionar múltiples imágenes
  const handleSelectImages = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/gif,image/webp';
    input.multiple = true; // Permitir múltiples archivos
    input.onchange = (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      
      // Validar tamaño de cada imagen (máximo 5MB)
      const archivosInvalidos = files.filter(file => file.size > 5 * 1024 * 1024);
      if (archivosInvalidos.length > 0) {
        alertNoBloqueante(`Algunas imágenes son muy grandes. Máximo 5MB por imagen.`, 'error');
        return;
      }
      
      // Agregar nuevas imágenes al array
      const nuevasImagenes = [...imagenesSeleccionadas, ...files];
      setImagenesSeleccionadas(nuevasImagenes);
      
      // Crear previews para las nuevas imágenes
      const nuevosPreviews = files.map(file => URL.createObjectURL(file));
      setImagenesPreview([...imagenesPreview, ...nuevosPreviews]);
      
      alertNoBloqueante(`✅ ${files.length} imagen(es) seleccionada(s). Guardá el artículo para subirlas.`, 'info');
    };
    input.click();
  };
  
  // Función para eliminar imagen del preview (nueva o existente)
  const handleEliminarImagen = (index, esExistente = false) => {
    if (esExistente) {
      // Marcar imagen existente para eliminación
      const nuevasAEliminar = new Set(imagenesAEliminar);
      nuevasAEliminar.add(index);
      setImagenesAEliminar(nuevasAEliminar);
    } else {
      // Eliminar imagen nueva del preview
      const nuevasImagenes = imagenesSeleccionadas.filter((_, i) => i !== index);
      const nuevosPreviews = imagenesPreview.filter((_, i) => i !== index);
      
      // Liberar URL del objeto
      URL.revokeObjectURL(imagenesPreview[index]);
      
      setImagenesSeleccionadas(nuevasImagenes);
      setImagenesPreview(nuevosPreviews);
    }
  };
  
  // Función para restaurar imagen eliminada
  const handleRestaurarImagen = (index) => {
    const nuevasAEliminar = new Set(imagenesAEliminar);
    nuevasAEliminar.delete(index);
    setImagenesAEliminar(nuevasAEliminar);
  };

  // Filtrar artículos
  const articulosFiltrados = articulos.filter(articulo => {
    // Filtro por búsqueda (nombre, descripción o código)
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      const nombreMatch = articulo.nombre?.toLowerCase().includes(busqueda);
      const descripcionMatch = articulo.descripcion?.toLowerCase().includes(busqueda);
      const codigoMatch = articulo.codigo?.toLowerCase().includes(busqueda);
      if (!nombreMatch && !descripcionMatch && !codigoMatch) return false;
    }
    
    // Filtro por precio mínimo
    if (filtros.precioMinimo) {
      const precioMin = parseFloat(limpiarFormatoNumero(filtros.precioMinimo)) || 0;
      if ((articulo.precio_base || 0) < precioMin) return false;
    }
    
    // Filtro por precio máximo
    if (filtros.precioMaximo) {
      const precioMax = parseFloat(limpiarFormatoNumero(filtros.precioMaximo)) || Infinity;
      if ((articulo.precio_base || 0) > precioMax) return false;
    }
    
    // Filtro por estado
    if (filtros.estado === 'activo' && !articulo.activo) return false;
    if (filtros.estado === 'inactivo' && articulo.activo) return false;
    
    return true;
  });

  // Resetear página cuando cambian los filtros
  React.useEffect(() => {
    setPaginaActual(1);
  }, [filtros.busqueda, filtros.precioMinimo, filtros.precioMaximo, filtros.estado]);

  return (
    <div>
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ margin: 0 }}>Gestión de Artículos/Productos</h2>
          <button 
            className="btn btn-primary" 
            onClick={async () => {
              // Obtener siguiente código antes de abrir el formulario
              let siguienteCodigo = '0001';
              try {
                siguienteCodigo = await supabaseService.obtenerSiguienteCodigo();
              } catch (error) {
                console.error('Error obteniendo siguiente código:', error);
              }
              // Resetear formulario SIN cerrar el modal
              setFormData({
                nombre: '',
                descripcion: '',
                precio_base: '', // String vacío para permitir edición
                activo: 1,
                medida: '',
                cabezal: '',
                costado: '',
                fondo: '',
                taco: '',
                esquinero: '',
                despeje: '',
                tipo_articulo: 'universal',
                cliente_id: null,
                codigo: siguienteCodigo
              });
              setBusquedaCliente('');
              setClientesFiltrados([]);
              setMostrarListaClientes(false);
              setEditingArticulo(null);
              setShowForm(true);
              setShowEditModal(true);
            }} 
            style={{ padding: '10px 20px' }}
          >
            ➕ Nuevo Artículo
          </button>
        </div>

      {/* Modal flotante para editar o crear artículo */}
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
                {editingArticulo ? `✏️ Editar Artículo: ${editingArticulo.nombre}` : '➕ Nuevo Artículo'}
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
              <label>Código *</label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={(e) => {
                  // Permitir solo números y limitar a 4 dígitos
                  const valor = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
                  setFormData({ ...formData, codigo: valor });
                }}
                onBlur={(e) => {
                  // Rellenar con ceros a la izquierda si es necesario
                  const valor = e.target.value.padStart(4, '0');
                  setFormData({ ...formData, codigo: valor });
                }}
                required
                placeholder="0001"
                maxLength={4}
                style={{ 
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}
              />
              <small style={{ color: theme === 'dark' ? '#999' : '#666' }}>
                Código único del artículo (se genera automáticamente, pero puedes editarlo)
              </small>
            </div>
            <div className="form-group">
              <label>Nombre del Artículo *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                placeholder="Ej: Cajón Estándar, Cajón Pequeño..."
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Precio Base</label>
              <input
                type="text"
                name="precio_base"
                value={(() => {
                  if (formData.precio_base === 0 || formData.precio_base === '' || formData.precio_base === null || formData.precio_base === undefined) {
                    return '';
                  }
                  // Si es string, formatearlo directamente
                  if (typeof formData.precio_base === 'string') {
                    return formatearNumeroVisual(formData.precio_base);
                  }
                  // Si es número, convertirlo a string y formatearlo
                  return formatearNumeroVisual(formData.precio_base.toString());
                })()}
                onChange={handleInputChange}
                onWheel={(e) => e.target.blur()}
                placeholder="0,00"
              />
              <small style={{ color: theme === 'dark' ? '#999' : '#666' }}>Precio sugerido (se puede modificar en cada remito)</small>
            </div>
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows="3"
              placeholder="Descripción del artículo (opcional)"
            />
          </div>

          {/* Selector de tipo de artículo */}
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f0f0f0', 
            borderRadius: '8px',
            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit', fontSize: '16px' }}>
              🏷️ Tipo de Artículo
            </h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Tipo *</label>
                <select
                  name="tipo_articulo"
                  value={formData.tipo_articulo}
                  onChange={(e) => {
                    const nuevoTipo = e.target.value;
                    if (nuevoTipo === 'universal') {
                      // Limpiar cliente y búsqueda al cambiar a universal
                      setFormData({ 
                        ...formData, 
                        tipo_articulo: nuevoTipo,
                        cliente_id: null
                      });
                      setBusquedaCliente('');
                      setClientesFiltrados([]);
                      setMostrarListaClientes(false);
                    } else {
                      setFormData({ 
                        ...formData, 
                        tipo_articulo: nuevoTipo
                      });
                    }
                  }}
                  required
                  style={{ 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                    backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
                    color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                    width: '100%'
                  }}
                >
                  <option value="universal">🌐 Universal (Disponible para todos los clientes)</option>
                  <option value="cliente">👤 Único para Cliente (Solo disponible para un cliente específico)</option>
                </select>
                <small style={{ color: theme === 'dark' ? '#999' : '#666' }}>
                  {formData.tipo_articulo === 'universal' 
                    ? 'Este artículo estará disponible para todos los clientes' 
                    : 'Este artículo solo estará disponible para el cliente seleccionado'}
                </small>
              </div>
            </div>

            {formData.tipo_articulo === 'cliente' && (
              <div className="form-group" style={{ marginTop: '15px', position: 'relative' }}>
                <label>Cliente *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={formData.cliente_id ? (clientes.find(c => c.id === formData.cliente_id)?.nombre || busquedaCliente) : busquedaCliente}
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
                    placeholder="Buscar cliente..."
                    required={formData.tipo_articulo === 'cliente' && !formData.cliente_id}
                    style={{ 
                      width: '100%', 
                      paddingRight: formData.cliente_id ? '80px' : '10px',
                      padding: '8px',
                      borderRadius: '4px', 
                      border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
                      color: theme === 'dark' ? '#e0e0e0' : 'inherit'
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
                <small style={{ color: theme === 'dark' ? '#999' : '#666' }}>
                  Busca y selecciona el cliente para el cual este artículo será exclusivo
                </small>
              </div>
            )}
          </div>

          {/* Sección de Medidas y Detalles */}
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f0f0f0', 
            borderRadius: '8px',
            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit', fontSize: '16px' }}>
              📐 Medidas y Detalles de la Caja
            </h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Medida (Dimensiones)</label>
                <input
                  type="text"
                  name="medida"
                  value={formData.medida}
                  onChange={handleInputChange}
                  placeholder="Ej: 20 X 28 X 48"
                />
                <small style={{ color: theme === 'dark' ? '#999' : '#666' }}>Dimensiones de la caja</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Cabezal</label>
                <textarea
                  name="cabezal"
                  value={formData.cabezal}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Ej: 8 X 28 más 2 suplementos de 3.7 X 28"
                />
              </div>
              <div className="form-group">
                <label>Costado</label>
                <textarea
                  name="costado"
                  value={formData.costado}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Ej: 3 tablas de 5.7 X 48"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fondo</label>
                <input
                  type="text"
                  name="fondo"
                  value={formData.fondo}
                  onChange={handleInputChange}
                  placeholder="Ej: CONVENCIONAL o 5 tablas de 5.8 X 50"
                />
              </div>
              <div className="form-group">
                <label>Taco</label>
                <input
                  type="text"
                  name="taco"
                  value={formData.taco}
                  onChange={handleInputChange}
                  placeholder="Ej: CONVENCIONAL"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Esquinero</label>
                <input
                  type="text"
                  name="esquinero"
                  value={formData.esquinero}
                  onChange={handleInputChange}
                  placeholder='Ej: A 17" / Holgura: TOP 1.5 CM'
                />
              </div>
              <div className="form-group">
                <label>Despeje</label>
                <input
                  type="text"
                  name="despeje"
                  value={formData.despeje}
                  onChange={handleInputChange}
                  placeholder="Ej: arriba 4,5CM"
                />
              </div>
            </div>
          </div>

              {/* Galería de imágenes del artículo */}
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f5f5f5', borderRadius: '8px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                  📷 Imágenes del Artículo (Opcional) - Puedes subir múltiples imágenes
                </label>
                <div style={{ marginBottom: '15px' }}>
                  <button 
                    type="button"
                    onClick={handleSelectImages}
                    disabled={subiendoImagenes}
                    style={{ 
                      padding: '10px 18px',
                      backgroundColor: theme === 'dark' ? '#4a90d9' : '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: subiendoImagenes ? 'wait' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    {subiendoImagenes ? '⏳ Subiendo...' : '🖼️ Agregar Imágenes'}
                  </button>
                </div>
                
                {/* Galería de imágenes */}
                {(imagenesExistentes.length > 0 || imagenesPreview.length > 0) && (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                    gap: '15px',
                    marginTop: '15px'
                  }}>
                    {/* Imágenes existentes */}
                    {imagenesExistentes.map((imgUrl, index) => {
                      const estaEliminada = imagenesAEliminar.has(index);
                      if (estaEliminada) return null;
                      
                      return (
                        <div key={`existente-${index}`} style={{ position: 'relative' }}>
                          <img 
                            src={imgUrl} 
                            alt={`Imagen ${index + 1}`} 
                            style={{ 
                              width: '100%', 
                              height: '100px', 
                              objectFit: 'cover', 
                              borderRadius: '8px',
                              border: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              const todasLasImagenes = [...imagenesExistentes.filter((_, i) => !imagenesAEliminar.has(i)), ...imagenesPreview];
                              setImagenModal({ abierto: true, url: imgUrl, imagenes: todasLasImagenes, index: index });
                            }}
                          />
                          <button 
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleEliminarImagen(index, true)}
                            style={{ 
                              position: 'absolute',
                              top: '5px',
                              right: '5px',
                              padding: '2px 6px',
                              fontSize: '10px',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Eliminar imagen"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                    
                    {/* Imágenes nuevas (preview) */}
                    {imagenesPreview.map((previewUrl, index) => (
                      <div key={`nueva-${index}`} style={{ position: 'relative' }}>
                        <img 
                          src={previewUrl} 
                          alt={`Nueva imagen ${index + 1}`} 
                          style={{ 
                            width: '100%', 
                            height: '100px', 
                            objectFit: 'cover', 
                            borderRadius: '8px',
                            border: `2px solid ${theme === 'dark' ? '#4a90d9' : '#17a2b8'}`,
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            const todasLasImagenes = [...imagenesExistentes, ...imagenesPreview];
                            setImagenModal({ abierto: true, url: previewUrl, imagenes: todasLasImagenes, index: imagenesExistentes.length + index });
                          }}
                        />
                        <button 
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleEliminarImagen(index, false)}
                          style={{ 
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Eliminar imagen"
                        >
                          ✕
                        </button>
                        <div style={{
                          position: 'absolute',
                          bottom: '5px',
                          left: '5px',
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px'
                        }}>
                          Nueva
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Imágenes eliminadas (con opción de restaurar) */}
                {imagenesAEliminar.size > 0 && (
                  <div style={{ 
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f9fa',
                    borderRadius: '6px',
                    border: `1px dashed ${theme === 'dark' ? '#555' : '#ddd'}`
                  }}>
                    <div style={{ fontSize: '12px', color: theme === 'dark' ? '#aaa' : '#666', marginBottom: '8px' }}>
                      🗑️ {imagenesAEliminar.size} imagen(es) marcada(s) para eliminar
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {Array.from(imagenesAEliminar).map(index => (
                        <div key={`eliminada-${index}`} style={{ position: 'relative', opacity: 0.5 }}>
                          <img 
                            src={imagenesExistentes[index]} 
                            alt={`Eliminada ${index + 1}`} 
                            style={{ 
                              width: '60px', 
                              height: '60px', 
                              objectFit: 'cover', 
                              borderRadius: '4px',
                              border: `2px dashed ${theme === 'dark' ? '#555' : '#ddd'}`
                            }}
                          />
                          <button 
                            type="button"
                            className="btn btn-sm"
                            onClick={() => handleRestaurarImagen(index)}
                            style={{ 
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              padding: '2px 6px',
                              fontSize: '10px',
                              backgroundColor: theme === 'dark' ? '#4a90d9' : '#17a2b8',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px'
                            }}
                            title="Restaurar imagen"
                          >
                            ↶
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                  disabled={isSubmitting || subiendoImagenes}
                >
                  {isSubmitting 
                    ? (editingArticulo ? '⏳ Actualizando...' : '⏳ Guardando...') 
                    : (editingArticulo ? '💾 Actualizar' : '✅ Guardar')
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
            <div className="form-group">
              <label>Nombre del Artículo *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                placeholder="Ej: Cajón Estándar, Cajón Pequeño..."
              />
            </div>
            <div className="form-group">
              <label>Precio Base</label>
              <input
                type="text"
                name="precio_base"
                value={formData.precio_base === 0 || formData.precio_base === '' || formData.precio_base === null || formData.precio_base === undefined ? '' : formatearNumeroVisual(formData.precio_base.toString())}
                onChange={handleInputChange}
                onWheel={(e) => e.target.blur()}
                placeholder="0"
              />
              <small style={{ color: theme === 'dark' ? '#999' : '#666' }}>Precio sugerido (se puede modificar en cada remito)</small>
            </div>
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows="3"
              placeholder="Descripción del artículo (opcional)"
            />
          </div>

          {/* Selector de tipo de artículo */}
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f0f0f0', 
            borderRadius: '8px',
            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit', fontSize: '16px' }}>
              🏷️ Tipo de Artículo
            </h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Tipo *</label>
                <select
                  name="tipo_articulo"
                  value={formData.tipo_articulo}
                  onChange={(e) => {
                    const nuevoTipo = e.target.value;
                    if (nuevoTipo === 'universal') {
                      setFormData({ 
                        ...formData, 
                        tipo_articulo: nuevoTipo,
                        cliente_id: null
                      });
                      setBusquedaCliente('');
                      setClientesFiltrados([]);
                      setMostrarListaClientes(false);
                    } else {
                      setFormData({ 
                        ...formData, 
                        tipo_articulo: nuevoTipo
                      });
                    }
                  }}
                  required
                  style={{ 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                    backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
                    color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                    width: '100%'
                  }}
                >
                  <option value="universal">🌐 Universal (Disponible para todos los clientes)</option>
                  <option value="cliente">👤 Único para Cliente (Solo disponible para un cliente específico)</option>
                </select>
                <small style={{ color: theme === 'dark' ? '#999' : '#666' }}>
                  {formData.tipo_articulo === 'universal' 
                    ? 'Este artículo estará disponible para todos los clientes' 
                    : 'Este artículo solo estará disponible para el cliente seleccionado'}
                </small>
              </div>
            </div>

            {formData.tipo_articulo === 'cliente' && (
              <div className="form-group" style={{ marginTop: '15px', position: 'relative' }}>
                <label>Cliente *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={formData.cliente_id ? (clientes.find(c => c.id === formData.cliente_id)?.nombre || busquedaCliente) : busquedaCliente}
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
                    placeholder="Buscar cliente..."
                    required={formData.tipo_articulo === 'cliente' && !formData.cliente_id}
                    style={{ 
                      width: '100%', 
                      paddingRight: formData.cliente_id ? '80px' : '10px',
                      padding: '8px',
                      borderRadius: '4px', 
                      border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
                      color: theme === 'dark' ? '#e0e0e0' : 'inherit'
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
                <small style={{ color: theme === 'dark' ? '#999' : '#666' }}>
                  Busca y selecciona el cliente para el cual este artículo será exclusivo
                </small>
              </div>
            )}
          </div>

          {/* Sección de Medidas y Detalles */}
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f0f0f0', 
            borderRadius: '8px',
            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit', fontSize: '16px' }}>
              📐 Medidas y Detalles de la Caja
            </h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Medida (Dimensiones)</label>
                <input
                  type="text"
                  name="medida"
                  value={formData.medida}
                  onChange={handleInputChange}
                  placeholder="Ej: 20 X 28 X 48"
                />
                <small style={{ color: theme === 'dark' ? '#999' : '#666' }}>Dimensiones de la caja</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Cabezal</label>
                <textarea
                  name="cabezal"
                  value={formData.cabezal}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Ej: 8 X 28 más 2 suplementos de 3.7 X 28"
                />
              </div>
              <div className="form-group">
                <label>Costado</label>
                <textarea
                  name="costado"
                  value={formData.costado}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Ej: 3 tablas de 5.7 X 48"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fondo</label>
                <input
                  type="text"
                  name="fondo"
                  value={formData.fondo}
                  onChange={handleInputChange}
                  placeholder="Ej: CONVENCIONAL o 5 tablas de 5.8 X 50"
                />
              </div>
              <div className="form-group">
                <label>Taco</label>
                <input
                  type="text"
                  name="taco"
                  value={formData.taco}
                  onChange={handleInputChange}
                  placeholder="Ej: CONVENCIONAL"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Esquinero</label>
                <input
                  type="text"
                  name="esquinero"
                  value={formData.esquinero}
                  onChange={handleInputChange}
                  placeholder='Ej: A 17" / Holgura: TOP 1.5 CM'
                />
              </div>
              <div className="form-group">
                <label>Despeje</label>
                <input
                  type="text"
                  name="despeje"
                  value={formData.despeje}
                  onChange={handleInputChange}
                  placeholder="Ej: arriba 4,5CM"
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              type="submit" 
              className="btn btn-success"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (editingArticulo ? '⏳ Actualizando...' : '⏳ Guardando...') 
                : (editingArticulo ? '💾 Actualizar' : '✅ Guardar')
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
      <div style={{ 
        marginTop: '20px', 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f9f9f9', 
        borderRadius: '8px',
        border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>🔍 Filtros de Artículos</h3>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setFiltros({
                busqueda: '',
                precioMinimo: '',
                precioMaximo: '',
                estado: ''
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
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Buscar (código/nombre/descripción)</label>
            <input
              type="text"
              value={filtros.busqueda}
              onChange={(e) => {
                setFiltros({ ...filtros, busqueda: e.target.value });
                setPaginaActual(1);
              }}
              placeholder="Buscar por código, nombre o descripción..."
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
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Precio mínimo</label>
            <input
              type="text"
              value={filtros.precioMinimo === '' ? '' : formatearNumeroVisual(filtros.precioMinimo.toString())}
              onChange={(e) => {
                const valorLimpio = limpiarFormatoNumero(e.target.value);
                setFiltros({ ...filtros, precioMinimo: valorLimpio });
                setPaginaActual(1);
              }}
              onWheel={(e) => e.target.blur()}
              placeholder="0"
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
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Precio máximo</label>
            <input
              type="text"
              value={filtros.precioMaximo === '' ? '' : formatearNumeroVisual(filtros.precioMaximo.toString())}
              onChange={(e) => {
                const valorLimpio = limpiarFormatoNumero(e.target.value);
                setFiltros({ ...filtros, precioMaximo: valorLimpio });
                setPaginaActual(1);
              }}
              onWheel={(e) => e.target.blur()}
              placeholder="0"
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
            <label style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => {
                setFiltros({ ...filtros, estado: e.target.value });
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
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
        </div>
      </div>
      </div>

      {/* Controles de paginación ARRIBA */}
      {(() => {
        const totalPaginas = Math.ceil(articulosFiltrados.length / registrosPorPagina);
        return totalPaginas > 1 && (
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

      {/* Tabla de Artículos */}
      <div className="card">
        <div className="table-container">
          <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th style={{ width: '60px' }}>Imagen</th>
              <th style={{ width: '80px' }}>Código</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Precio Base</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {articulos.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center">No hay artículos registrados</td>
              </tr>
            ) : articulosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center">No hay artículos que coincidan con los filtros</td>
              </tr>
            ) : (() => {
              // Paginación
              const totalPaginas = Math.ceil(articulosFiltrados.length / registrosPorPagina);
              const inicioIndex = (paginaActual - 1) * registrosPorPagina;
              const finIndex = inicioIndex + registrosPorPagina;
              const articulosPaginados = articulosFiltrados.slice(inicioIndex, finIndex);
              
              return (
                <>
                  {articulosPaginados.map(articulo => {
                    const estaExpandido = articulosExpandidos.has(articulo.id);
                    const tieneDetalles = articulo.medida || articulo.cabezal || articulo.costado || articulo.fondo || articulo.taco || articulo.esquinero;
                    
                    return (
                      <React.Fragment key={articulo.id}>
                        <tr style={{ cursor: tieneDetalles ? 'pointer' : 'default' }} onClick={() => tieneDetalles && toggleArticuloExpandido(articulo.id)}>
                          <td style={{ textAlign: 'center', width: '40px' }}>
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
                                  toggleArticuloExpandido(articulo.id);
                                }}
                                title={estaExpandido ? 'Contraer' : 'Expandir'}
                              >
                                {estaExpandido ? '▼' : '▶'}
                              </button>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', padding: '5px' }}>
                            {(() => {
                              // Parsear imágenes (puede ser JSON array o string simple)
                              let imagenesArray = [];
                              if (articulo.imagen_url) {
                                try {
                                  const parsed = JSON.parse(articulo.imagen_url);
                                  imagenesArray = Array.isArray(parsed) ? parsed : [articulo.imagen_url];
                                } catch (e) {
                                  imagenesArray = [articulo.imagen_url];
                                }
                              }
                              
                              if (imagenesArray.length === 0) {
                                return <span style={{ color: theme === 'dark' ? '#666' : '#ccc', fontSize: '20px' }}>📦</span>;
                              }
                              
                              const primeraImagen = imagenesArray[0];
                              return (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                  <img 
                                    src={primeraImagen} 
                                    alt={articulo.nombre}
                                    style={{ 
                                      width: '40px', 
                                      height: '40px', 
                                      objectFit: 'cover', 
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setImagenModal({ abierto: true, url: primeraImagen, imagenes: imagenesArray, index: 0 });
                                    }}
                                  />
                                  {imagenesArray.length > 1 && (
                                    <div style={{
                                      position: 'absolute',
                                      bottom: '-5px',
                                      right: '-5px',
                                      backgroundColor: theme === 'dark' ? '#4a90d9' : '#17a2b8',
                                      color: 'white',
                                      borderRadius: '50%',
                                      width: '20px',
                                      height: '20px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '10px',
                                      fontWeight: 'bold',
                                      border: `2px solid ${theme === 'dark' ? '#2d2d2d' : '#fff'}`,
                                      cursor: 'pointer'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setImagenModal({ abierto: true, url: primeraImagen, imagenes: imagenesArray, index: 0 });
                                    }}
                                    title={`${imagenesArray.length} imágenes`}
                                    >
                                      {imagenesArray.length}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td style={{ 
                            fontFamily: 'monospace', 
                            fontWeight: 'bold', 
                            fontSize: '14px',
                            textAlign: 'center',
                            color: theme === 'dark' ? '#5dade2' : '#007bff'
                          }}>
                            {articulo.codigo || '-'}
                          </td>
                          <td><strong>{articulo.nombre}</strong></td>
                          <td>{articulo.descripcion || '-'}</td>
                          <td>{formatearMonedaConSimbolo(articulo.precio_base || 0)}</td>
                          <td>
                            {articulo.cliente_id ? (
                              <span className="badge badge-info" title={`Exclusivo para: ${clientes.find(c => c.id === articulo.cliente_id)?.nombre || 'Cliente'}`}>
                                👤 Cliente
                              </span>
                            ) : (
                              <span className="badge badge-primary" title="Disponible para todos los clientes">
                                🌐 Universal
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${articulo.activo ? 'badge-success' : 'badge-secondary'}`}>
                              {articulo.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <button className="btn btn-success" style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }} onClick={() => handleEdit(articulo)}>
                              ✏️
                            </button>
                            {articulo.activo && (
                              <button 
                                className="btn btn-danger" 
                                style={{ 
                                  padding: '5px 10px', 
                                  fontSize: '12px',
                                  opacity: eliminandoId === articulo.id ? 0.5 : 1,
                                  cursor: eliminandoId === articulo.id ? 'not-allowed' : 'pointer'
                                }} 
                                onClick={() => handleDelete(articulo.id)}
                                disabled={eliminandoId === articulo.id}
                                title={eliminandoId === articulo.id ? 'Desactivando...' : 'Desactivar artículo'}
                              >
                                {eliminandoId === articulo.id ? '⏳' : '🗑️'}
                              </button>
                            )}
                          </td>
                        </tr>
                        {estaExpandido && tieneDetalles && (
                          <tr style={{ backgroundColor: theme === 'dark' ? '#333' : '#f9f9f9' }}>
                            <td colSpan="8" style={{ padding: '15px', paddingLeft: '50px' }}>
                              <div style={{ marginLeft: '20px' }}>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center',
                                  marginBottom: '15px',
                                  flexWrap: 'wrap',
                                  gap: '10px'
                                }}>
                                  <h4 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : 'inherit', fontSize: '16px' }}>
                                    📐 Detalles de la Caja
                                  </h4>
                                  {articulo.cliente_id && (
                                    <div style={{
                                      padding: '8px 15px',
                                      backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e7f3ff',
                                      borderRadius: '5px',
                                      fontSize: '14px',
                                      color: theme === 'dark' ? '#5dade2' : '#0066cc',
                                      fontWeight: 'bold'
                                    }}>
                                      👤 Cliente Exclusivo: {clientes.find(c => c.id === articulo.cliente_id)?.nombre || 'Cliente no encontrado'}
                                    </div>
                                  )}
                                  {!articulo.cliente_id && (
                                    <div style={{
                                      padding: '8px 15px',
                                      backgroundColor: theme === 'dark' ? '#2d4a2d' : '#e7f5e7',
                                      borderRadius: '5px',
                                      fontSize: '14px',
                                      color: theme === 'dark' ? '#90ee90' : '#006600',
                                      fontWeight: 'bold'
                                    }}>
                                      🌐 Artículo Universal
                                    </div>
                                  )}
                                </div>
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
                          Mostrando {inicioIndex + 1} - {Math.min(finIndex, articulosFiltrados.length)} de {articulosFiltrados.length} artículo(s)
                          {articulosFiltrados.length !== articulos.length && (
                            <span style={{ color: theme === 'dark' ? '#5dade2' : '#007bff', marginLeft: '10px' }}>
                              (filtrados de {articulos.length} total)
                            </span>
                          )}
                        </div>
                        
                        {totalPaginas > 1 && (
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
                        )}
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
          const totalPaginas = Math.ceil(articulosFiltrados.length / registrosPorPagina);
          return totalPaginas > 1 && (
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
      </div>

      {/* Modal flotante para editar o crear artículo */}
      {false && (
        <div 
          key={`modal-articulo-disabled`}
          data-modal-overlay="true"
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
              if (!editingArticulo) {
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
              maxWidth: '800px',
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
                {editingArticulo ? `✏️ Editar Artículo: ${editingArticulo.nombre}` : '➕ Nuevo Artículo'}
              </h2>
              <button 
                className="btn btn-danger"
                onClick={() => {
                  if (!editingArticulo) {
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
              {/* Copiar todo el formulario aquí - es el mismo que showForm */}
              {/* Por brevedad, copio solo las partes esenciales */}
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre del Artículo *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: Cajón Estándar, Cajón Pequeño..."
                  />
                </div>
                <div className="form-group">
                  <label>Precio Base</label>
                  <input
                    type="text"
                    name="precio_base"
                    value={formData.precio_base === 0 || formData.precio_base === '' || formData.precio_base === null || formData.precio_base === undefined ? '' : formatearNumeroVisual(formData.precio_base.toString())}
                    onChange={handleInputChange}
                    placeholder="0"
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Descripción del artículo..."
                />
              </div>

              {/* Selector de tipo de artículo */}
              <div style={{ 
                marginTop: '20px', 
                padding: '15px', 
                backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f0f0f0', 
                borderRadius: '8px',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
              }}>
                <h3 style={{ margin: '0 0 15px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit', fontSize: '16px' }}>
                  🏷️ Tipo de Artículo
                </h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo *</label>
                    <select
                      name="tipo_articulo"
                      value={formData.tipo_articulo}
                      onChange={(e) => {
                        const nuevoTipo = e.target.value;
                        if (nuevoTipo === 'universal') {
                          setFormData({ 
                            ...formData, 
                            tipo_articulo: nuevoTipo,
                            cliente_id: null
                          });
                          setBusquedaCliente('');
                          setClientesFiltrados([]);
                          setMostrarListaClientes(false);
                        } else {
                          setFormData({ 
                            ...formData, 
                            tipo_articulo: nuevoTipo
                          });
                        }
                      }}
                      required
                      style={{ 
                        padding: '8px', 
                        borderRadius: '4px', 
                        border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                        backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
                        color: theme === 'dark' ? '#e0e0e0' : 'inherit',
                        width: '100%'
                      }}
                    >
                      <option value="universal">🌐 Universal (Disponible para todos los clientes)</option>
                      <option value="cliente">👤 Único para Cliente (Solo disponible para un cliente específico)</option>
                    </select>
                    <small style={{ color: theme === 'dark' ? '#999' : '#666' }}>
                      {formData.tipo_articulo === 'universal' 
                        ? 'Este artículo estará disponible para todos los clientes' 
                        : 'Este artículo solo estará disponible para el cliente seleccionado'}
                    </small>
                  </div>
                </div>

                {formData.tipo_articulo === 'cliente' && (
                  <div className="form-group" style={{ marginTop: '15px', position: 'relative' }}>
                    <label>Cliente *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={formData.cliente_id ? (clientes.find(c => c.id === formData.cliente_id)?.nombre || busquedaCliente) : busquedaCliente}
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
                        placeholder="Buscar cliente..."
                        required={formData.tipo_articulo === 'cliente' && !formData.cliente_id}
                        style={{ 
                          width: '100%', 
                          paddingRight: formData.cliente_id ? '80px' : '10px',
                          padding: '8px',
                          borderRadius: '4px', 
                          border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                          backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
                          color: theme === 'dark' ? '#e0e0e0' : 'inherit'
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
                          zIndex: 1003,
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
                    <small style={{ color: theme === 'dark' ? '#999' : '#666' }}>
                      Busca y selecciona el cliente para el cual este artículo será exclusivo
                    </small>
                  </div>
                )}
              </div>

              {/* Sección de Medidas y Detalles */}
              <div style={{ 
                marginTop: '20px', 
                padding: '15px', 
                backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f0f0f0', 
                borderRadius: '8px',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
              }}>
                <h3 style={{ margin: '0 0 15px 0', color: theme === 'dark' ? '#e0e0e0' : 'inherit', fontSize: '16px' }}>
                  📐 Medidas y Detalles de la Caja
                </h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Medida (Dimensiones)</label>
                    <input
                      type="text"
                      name="medida"
                      value={formData.medida}
                      onChange={handleInputChange}
                      placeholder="Ej: 20 X 28 X 48"
                    />
                    <small style={{ color: theme === 'dark' ? '#999' : '#666' }}>Dimensiones de la caja</small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Cabezal</label>
                    <textarea
                      name="cabezal"
                      value={formData.cabezal}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="Ej: 8 X 28 más 2 suplementos de 3.7 X 28"
                    />
                  </div>
                  <div className="form-group">
                    <label>Costado</label>
                    <textarea
                      name="costado"
                      value={formData.costado}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="Ej: 3 tablas de 5.7 X 48"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Fondo</label>
                    <input
                      type="text"
                      name="fondo"
                      value={formData.fondo}
                      onChange={handleInputChange}
                      placeholder="Ej: CONVENCIONAL o 5 tablas de 5.8 X 50"
                    />
                  </div>
                  <div className="form-group">
                    <label>Taco</label>
                    <input
                      type="text"
                      name="taco"
                      value={formData.taco}
                      onChange={handleInputChange}
                      placeholder="Ej: CONVENCIONAL"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Esquinero</label>
                    <input
                      type="text"
                      name="esquinero"
                      value={formData.esquinero}
                      onChange={handleInputChange}
                      placeholder='Ej: A 17" / Holgura: TOP 1.5 CM'
                    />
                  </div>
                  <div className="form-group">
                    <label>Despeje</label>
                    <input
                      type="text"
                      name="despeje"
                      value={formData.despeje}
                      onChange={handleInputChange}
                      placeholder="Ej: arriba 4,5CM"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="activo"
                    checked={formData.activo === 1}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked ? 1 : 0 })}
                  />
                  {' '}Activo
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => {
                    if (!editingArticulo) {
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
                    ? (editingArticulo ? '⏳ Actualizando...' : '⏳ Guardando...') 
                    : (editingArticulo ? '💾 Actualizar' : '✅ Guardar')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver imagen ampliada con navegación */}
      {imagenModal.abierto && imagenModal.url && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            cursor: 'pointer'
          }}
          onClick={(e) => {
            // Solo cerrar si se hace clic fuera de la imagen y botones
            if (e.target === e.currentTarget) {
              setImagenModal({ abierto: false, url: null, imagenes: [], index: 0 });
            }
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={(e) => e.stopPropagation()}>
            <img 
              src={imagenModal.url} 
              alt={`Imagen ${(imagenModal.index || 0) + 1}`} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '90vh', 
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
            
            {/* Navegación entre imágenes */}
            {imagenModal.imagenes && imagenModal.imagenes.length > 1 && (
              <>
                <button 
                  style={{
                    position: 'absolute',
                    left: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.3)',
                    border: 'none',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '15px 20px',
                    borderRadius: '50%',
                    fontWeight: 'bold'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const nuevoIndex = (imagenModal.index || 0) > 0 
                      ? (imagenModal.index || 0) - 1 
                      : imagenModal.imagenes.length - 1;
                    setImagenModal({ 
                      ...imagenModal, 
                      url: imagenModal.imagenes[nuevoIndex], 
                      index: nuevoIndex 
                    });
                  }}
                  title="Imagen anterior"
                >
                  ‹
                </button>
                <button 
                  style={{
                    position: 'absolute',
                    right: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.3)',
                    border: 'none',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '15px 20px',
                    borderRadius: '50%',
                    fontWeight: 'bold'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const nuevoIndex = (imagenModal.index || 0) < imagenModal.imagenes.length - 1
                      ? (imagenModal.index || 0) + 1 
                      : 0;
                    setImagenModal({ 
                      ...imagenModal, 
                      url: imagenModal.imagenes[nuevoIndex], 
                      index: nuevoIndex 
                    });
                  }}
                  title="Imagen siguiente"
                >
                  ›
                </button>
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  padding: '8px 15px',
                  borderRadius: '20px',
                  fontSize: '14px'
                }}>
                  {(imagenModal.index || 0) + 1} / {imagenModal.imagenes.length}
                </div>
              </>
            )}
            
            {/* Botón cerrar */}
            <button 
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '10px 15px',
                borderRadius: '50%'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setImagenModal({ abierto: false, url: null, imagenes: [], index: 0 });
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Articulos;


