import { supabase } from '../config/supabase';

// ============ ALMACENAMIENTO DE IMÁGENES ============
const BUCKET_NAME = 'remitos-fotos';

// ============ FUNCIONES HELPER ============
// Función helper para dividir arrays en chunks (lotes) - útil para evitar demasiadas peticiones simultáneas
const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// ============ AUDITORÍA ============
// Función helper para obtener información de la máquina/usuario
const obtenerInfoUsuario = async () => {
  try {
    // Intentar obtener desde Electron si está disponible
    if (window.electronAPI && window.electronAPI.getMachineInfo) {
      const info = await window.electronAPI.getMachineInfo();
      return info.identificador || info.maquina || 'Usuario@PC';
    }
    // Fallback: usar localStorage o navegador
    const usuarioGuardado = localStorage.getItem('usuario_auditoria');
    if (usuarioGuardado) {
      return usuarioGuardado;
    }
    // Generar un identificador basado en el navegador
    const navegadorId = `Usuario-${navigator.userAgent.slice(0, 20)}`;
    localStorage.setItem('usuario_auditoria', navegadorId);
    return navegadorId;
  } catch (error) {
    console.warn('Error obteniendo info de usuario:', error);
    return 'Usuario@PC';
  }
};

// Función helper para registrar auditoría
// TEMPORALMENTE DESHABILITADA - Se reactivará más adelante
const registrarAuditoria = async (tabla, registroId, accion, datosAnteriores = null, datosNuevos = null, cambios = null, observaciones = null) => {
  // Auditoría deshabilitada temporalmente
  return;
  /* COMENTADO TEMPORALMENTE
  try {
    // Obtener información del usuario que hace el cambio
    const usuarioInfo = await obtenerInfoUsuario();
    // Obtener datos anteriores si es UPDATE o DELETE
    let datosAnt = datosAnteriores;
    if ((accion === 'UPDATE' || accion === 'DELETE') && !datosAnt) {
      const { data: registroAnterior } = await supabase
        .from(tabla)
        .select('*')
        .eq('id', registroId)
        .single();
      
      if (registroAnterior) {
        datosAnt = registroAnterior;
      }
    }

    // Calcular cambios si es UPDATE
    let cambiosCalculados = cambios;
    if (accion === 'UPDATE' && datosAnt && datosNuevos && !cambiosCalculados) {
      cambiosCalculados = {};
      // Campos a ignorar (automáticos o no relevantes)
      const camposIgnorar = ['id', 'created_at', 'updated_at', 'fecha_hora'];
      
      // Obtener todas las claves de ambos objetos
      const todasLasClaves = new Set([...Object.keys(datosAnt), ...Object.keys(datosNuevos)]);
      
      todasLasClaves.forEach(key => {
        // Ignorar campos automáticos
        if (camposIgnorar.includes(key)) return;
        
        // Normalizar valores para comparación
        const normalizarValor = (val) => {
          if (val === null || val === undefined || val === '') return null;
          if (typeof val === 'string') return val.trim() || null;
          return val;
        };
        
        const valorAnterior = normalizarValor(datosAnt[key]);
        const valorNuevo = normalizarValor(datosNuevos[key]);
        
        // Comparar valores normalizados
        const valorAntStr = valorAnterior === null ? 'null' : JSON.stringify(valorAnterior);
        const valorNuevoStr = valorNuevo === null ? 'null' : JSON.stringify(valorNuevo);
        
        // Solo registrar si realmente hay diferencia
        if (valorAntStr !== valorNuevoStr) {
          cambiosCalculados[key] = {
            anterior: datosAnt[key] ?? null, // Guardar el valor original
            nuevo: datosNuevos[key] ?? null
          };
        }
      });
      
      // Si no hay cambios relevantes, establecer como null
      if (Object.keys(cambiosCalculados).length === 0) {
        cambiosCalculados = null;
      }
    }

    // Insertar directamente en la tabla de auditoría (usar nombres de columnas del SQL)
    const registroAuditoria = {
      tabla: tabla,
      registro_id: registroId,
      accion: accion,
      usuario: usuarioInfo, // Identificador de usuario/máquina
      datos_anteriores: datosAnt ? JSON.parse(JSON.stringify(datosAnt)) : null, // Clonar para evitar referencias
      datos_nuevos: datosNuevos ? JSON.parse(JSON.stringify(datosNuevos)) : null,
      cambios: cambiosCalculados && Object.keys(cambiosCalculados).length > 0 ? JSON.parse(JSON.stringify(cambiosCalculados)) : null,
      observaciones: observaciones
    };

    const { error } = await supabase
      .from('auditoria')
      .insert([registroAuditoria]);

    if (error) {
      console.warn('Error registrando auditoría:', error);
      // No lanzar error para no interrumpir la operación principal
    }
  } catch (error) {
    console.warn('Error en función de auditoría:', error);
    // No lanzar error para no interrumpir la operación principal
  }
  */
};

// Obtener registros de auditoría
export const getAuditoria = async (filtros = {}) => {
  let query = supabase
    .from('auditoria')
    .select('*')
    .order('created_at', { ascending: false });

  // Usar tabla_afectada si viene, sino tabla (compatibilidad)
  if (filtros.tabla_afectada) {
    query = query.eq('tabla', filtros.tabla_afectada);
  } else if (filtros.tabla) {
    query = query.eq('tabla', filtros.tabla);
  }
  
  if (filtros.registro_id) {
    query = query.eq('registro_id', filtros.registro_id);
  }
  if (filtros.accion) {
    query = query.eq('accion', filtros.accion);
  }
  if (filtros.fechaDesde) {
    query = query.gte('created_at', filtros.fechaDesde);
  }
  if (filtros.fechaHasta) {
    query = query.lte('created_at', filtros.fechaHasta);
  }
  if (filtros.limit) {
    query = query.limit(filtros.limit);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
};

// Subir imagen comprimida a Supabase Storage
export const uploadRemitoImage = async (imageBuffer, filename) => {
  try {
    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true // Sobrescribir si existe
      });
    
    if (error) throw error;
    
    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);
    
    return publicUrl;
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    throw error;
  }
};

// Eliminar imagen de Supabase Storage
export const deleteRemitoImage = async (imageUrl) => {
  try {
    // Extraer el nombre del archivo de la URL
    const filename = imageUrl.split('/').pop();
    
    if (!filename) return;
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filename]);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error eliminando imagen:', error);
    // No lanzar error para no bloquear la eliminación del remito
  }
};

// Obtener URL pública de una imagen
export const getPublicImageUrl = (filename) => {
  // Si ya es una URL completa, retornarla
  if (filename && (filename.startsWith('http://') || filename.startsWith('https://'))) {
    return filename;
  }
  
  // Si no, construir la URL pública
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);
  
  return data.publicUrl;
};

// Alias para compatibilidad
export const getRemitoImageUrl = getPublicImageUrl;

// ============ CLIENTES ============
export const getClientes = async () => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nombre');
  
  if (error) throw error;
  return data || [];
};

export const createCliente = async (cliente) => {
  const { data, error } = await supabase
    .from('clientes')
    .insert([cliente])
    .select()
    .single();
  
  if (error) throw error;
  
  // Registrar auditoría
  await registrarAuditoria('clientes', data.id, 'INSERT', null, data, null, 'Cliente creado');
  
  // Invalidar caché del resumen (el total de clientes cambió)
  invalidarCacheResumen();
  
  return data;
};

// Validar que un cliente existe antes de operar
export const validateClienteExists = async (id) => {
  const { data, error } = await supabase
    .from('clientes')
    .select('id')
    .eq('id', id)
    .single();
  
  if (error || !data) {
    throw new Error('El cliente no existe o fue eliminado por otro usuario');
  }
  return true;
};

export const updateCliente = async (id, cliente) => {
  // Validar que el cliente existe antes de actualizar
  await validateClienteExists(id);
  
  // Obtener datos anteriores para auditoría
  const { data: datosAnteriores } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();
  
  const { data, error } = await supabase
    .from('clientes')
    .update(cliente)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  if (!data) {
    throw new Error('El cliente no existe o fue eliminado por otro usuario');
  }
  
  // Registrar auditoría
  await registrarAuditoria('clientes', id, 'UPDATE', datosAnteriores, data, null, 'Cliente actualizado');
  
  // Invalidar caché del resumen (aunque no cambie el total, por si acaso)
  invalidarCacheResumen();
  
  return data;
};

export const deleteCliente = async (id) => {
  // Validar que el cliente existe antes de eliminar
  await validateClienteExists(id);
  
  // Obtener datos antes de eliminar para auditoría
  const { data: datosAnteriores } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();
  
  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  
  // Registrar auditoría
  await registrarAuditoria('clientes', id, 'DELETE', datosAnteriores, null, null, 'Cliente eliminado');
  
  // Invalidar caché del resumen (el total de clientes cambió)
  invalidarCacheResumen();
  
  return { success: true };
};

// ============ ARTÍCULOS ============
export const getArticulos = async () => {
  const { data, error } = await supabase
    .from('articulos')
    .select('*')
    .eq('activo', true)
    .order('codigo', { ascending: true, nullsFirst: false });
  
  if (error) throw error;
  return data || [];
};

// Obtener el siguiente código disponible para un artículo
export const obtenerSiguienteCodigo = async () => {
  try {
    // Obtener todos los códigos existentes que sean numéricos
    const { data, error } = await supabase
      .from('articulos')
      .select('codigo')
      .not('codigo', 'is', null);
    
    if (error) throw error;
    
    // Extraer números de los códigos y encontrar el máximo
    const codigosNumericos = (data || [])
      .map(a => a.codigo)
      .filter(codigo => /^\d+$/.test(codigo)) // Solo códigos que sean solo números
      .map(codigo => parseInt(codigo, 10))
      .filter(num => !isNaN(num));
    
    const maxCodigo = codigosNumericos.length > 0 ? Math.max(...codigosNumericos) : 0;
    const siguienteCodigo = (maxCodigo + 1).toString().padStart(4, '0');
    
    return siguienteCodigo;
  } catch (error) {
    console.error('Error obteniendo siguiente código:', error);
    // Si hay error, retornar código por defecto
    return '0001';
  }
};

export const createArticulo = async (articulo) => {
  const { data, error } = await supabase
    .from('articulos')
    .insert([articulo])
    .select()
    .single();
  
  if (error) throw error;
  
  // Registrar auditoría
  await registrarAuditoria('articulos', data.id, 'INSERT', null, data, null, 'Artículo creado');
  
  return data;
};

// Validar que un artículo existe antes de operar
export const validateArticuloExists = async (id) => {
  const { data, error } = await supabase
    .from('articulos')
    .select('id')
    .eq('id', id)
    .single();
  
  if (error || !data) {
    throw new Error('El artículo no existe o fue eliminado por otro usuario');
  }
  return true;
};

export const updateArticulo = async (id, articulo) => {
  // Validar que el artículo existe antes de actualizar
  await validateArticuloExists(id);
  
  // Obtener datos anteriores para auditoría
  const { data: datosAnteriores } = await supabase
    .from('articulos')
    .select('*')
    .eq('id', id)
    .single();
  
  const { data, error } = await supabase
    .from('articulos')
    .update(articulo)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  if (!data) {
    throw new Error('El artículo no existe o fue eliminado por otro usuario');
  }
  
  // Registrar auditoría
  await registrarAuditoria('articulos', id, 'UPDATE', datosAnteriores, data, null, 'Artículo actualizado');
  
  return data;
};

export const deleteArticulo = async (id) => {
  // Validar que el artículo existe antes de eliminar
  await validateArticuloExists(id);
  
  // Obtener datos antes de eliminar para auditoría
  const { data: datosAnteriores } = await supabase
    .from('articulos')
    .select('*')
    .eq('id', id)
    .single();
  
  // Eliminar realmente de la base de datos
  const { error } = await supabase
    .from('articulos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  
  // Registrar auditoría (como DELETE)
  await registrarAuditoria('articulos', id, 'DELETE', datosAnteriores, null, null, 'Artículo eliminado');
  
  return { success: true };
};

// ============ REMITOS ============
export const getRemitos = async (clienteId = null) => {
  // Obtener remitos
  let query = supabase
    .from('remitos')
    .select('*')
    .order('fecha', { ascending: false })
    .order('id', { ascending: false });
  
  if (clienteId) {
    query = query.eq('cliente_id', clienteId);
  }
  
  const { data: remitos, error } = await query;
  if (error) throw error;
  
  if (!remitos || remitos.length === 0) {
    return [];
  }
  
  // Obtener clientes para mapear nombres
  const { data: clientes } = await supabase.from('clientes').select('id, nombre');
  const clientesMap = {};
  (clientes || []).forEach(c => clientesMap[c.id] = c.nombre);
  
  // Obtener todos los artículos de todos los remitos en lotes (más eficiente)
  const remitosIds = remitos.map(r => r.id);
  const articulosPorRemito = {}; // Mapa: remito_id -> array de artículos
  
  // Dividir en chunks para evitar problemas con consultas muy grandes
  const CHUNK_SIZE = 500;
  const chunks = chunkArray(remitosIds, CHUNK_SIZE);
  
  // Obtener artículos por lotes
  for (const chunk of chunks) {
    try {
      const { data: articulos, error: articulosError } = await supabase
        .from('remito_articulos')
        .select('*')
        .in('remito_id', chunk)
        .order('remito_id')
        .order('id');
      
      if (articulosError) {
        console.warn('Error obteniendo artículos de remitos en chunk:', articulosError);
        continue;
      }
      
      // Obtener IDs únicos de artículos para buscar sus códigos
      const articuloIds = [...new Set((articulos || []).map(a => a.articulo_id).filter(id => id))];
      const codigosMap = {};
      
      if (articuloIds.length > 0) {
        // Obtener códigos de artículos en lotes
        const articuloChunks = chunkArray(articuloIds, CHUNK_SIZE);
        for (const artChunk of articuloChunks) {
          const { data: articulosData } = await supabase
            .from('articulos')
            .select('id, codigo')
            .in('id', artChunk);
          
          (articulosData || []).forEach(art => {
            codigosMap[art.id] = art.codigo;
          });
        }
      }
      
      // Agrupar artículos por remito_id y agregar código
      (articulos || []).forEach(articulo => {
        const remitoId = articulo.remito_id;
        if (!articulosPorRemito[remitoId]) {
          articulosPorRemito[remitoId] = [];
        }
        // Agregar código del artículo si está disponible
        const articuloConCodigo = {
          ...articulo,
          articulo_codigo: articulo.articulo_id ? (codigosMap[articulo.articulo_id] || null) : null
        };
        articulosPorRemito[remitoId].push(articuloConCodigo);
      });
    } catch (chunkError) {
      console.warn('Error procesando chunk de artículos:', chunkError);
      continue;
    }
  }
  
  // Combinar remitos con sus artículos
  const remitosConDatos = remitos.map((remito) => {
    const articulos = articulosPorRemito[remito.id] || [];
    const precioTotal = articulos.reduce((sum, art) => sum + parseFloat(art.precio_total || 0), 0);
    
    // Asegurar que el número del remito siempre tenga un valor válido
    const numeroRemito = remito.numero && remito.numero.trim() !== '' 
      ? remito.numero 
      : `AUTO-${remito.id}`; // Fallback usando el ID si no hay número
    
    return {
      ...remito,
      numero: numeroRemito, // Asegurar que siempre haya un número
      cliente_nombre: clientesMap[remito.cliente_id] || '',
      articulos: articulos,
      precio_total: precioTotal
    };
  });
  
  return remitosConDatos;
};

export const getRemitoArticulos = async (remitoId) => {
  const { data, error } = await supabase
    .from('remito_articulos')
    .select('*')
    .eq('remito_id', remitoId)
    .order('id');
  
  if (error) throw error;
  
  // El nombre del artículo ya está en articulo_nombre
  return data || [];
};

// Generar un número único automáticamente para remitos sin número
export const generarNumeroRemitoUnico = async () => {
  try {
    // Obtener la fecha actual en formato YYYYMMDD
    const ahora = new Date();
    const fechaStr = ahora.toISOString().split('T')[0].replace(/-/g, '');
    const prefijo = `AUTO-${fechaStr}-`;
    
    // Buscar todos los números auto-generados del día usando ilike (case-insensitive)
    const { data: remitosHoy, error } = await supabase
      .from('remitos')
      .select('numero')
      .ilike('numero', `${prefijo}%`);
    
    if (error) {
      console.warn('Error buscando remitos del día, usando fallback:', error);
      // Fallback: usar timestamp si falla la consulta
      const timestamp = Date.now();
      return `AUTO-${timestamp}`;
    }
    
    // Si hay remitos auto-generados hoy, encontrar el máximo contador
    let contador = 1;
    if (remitosHoy && remitosHoy.length > 0) {
      const contadores = remitosHoy
        .map(r => {
          if (!r.numero || !r.numero.startsWith(prefijo)) return 0;
          const match = r.numero.match(new RegExp(`${prefijo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)`));
          return match ? parseInt(match[1]) : 0;
        })
        .filter(c => c > 0);
      
      if (contadores.length > 0) {
        contador = Math.max(...contadores) + 1;
      }
    }
    
    // Formato: AUTO-YYYYMMDD-XXX (donde XXX es un contador de 3 dígitos)
    return `${prefijo}${contador.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generando número único:', error);
    // Fallback: usar timestamp si falla la consulta
    const timestamp = Date.now();
    return `AUTO-${timestamp}`;
  }
};

export const createRemito = async (remito) => {
  const { articulos, ...remitoData } = remito;
  
  // Si el número está vacío o es solo espacios, generar uno único automáticamente
  if (!remitoData.numero || (typeof remitoData.numero === 'string' && remitoData.numero.trim() === '')) {
    try {
      remitoData.numero = await generarNumeroRemitoUnico();
    } catch (error) {
      console.error('Error generando número único, usando timestamp:', error);
      // Fallback seguro
      remitoData.numero = `AUTO-${Date.now()}`;
    }
  }
  
  // Validar que el cliente existe antes de crear el remito
  if (remitoData.cliente_id) {
    await validateClienteExists(remitoData.cliente_id);
  }
  
  // Crear remito
  const { data: remitoCreado, error: remitoError } = await supabase
    .from('remitos')
    .insert([remitoData])
    .select()
    .single();
  
  if (remitoError) throw remitoError;
  
  // Crear artículos si existen
  if (articulos && articulos.length > 0) {
    const articulosData = articulos.map(art => ({
      ...art,
      remito_id: remitoCreado.id
    }));
    
    const { error: articulosError } = await supabase
      .from('remito_articulos')
      .insert(articulosData);
    
    if (articulosError) throw articulosError;
  }
  
  // Actualizar estado del remito después de crear los artículos
  // Los triggers en la base de datos también lo harán, pero lo hacemos aquí para consistencia inmediata
  await actualizarEstadoRemito(remitoCreado.id);
  
  // Si el remito tiene monto_pagado > 0, crear automáticamente un pago en la tabla pagos
  // Esto asegura que los pagos aparezcan en la pestaña de Pagos
  const montoPagado = parseFloat(remitoData.monto_pagado || 0);
  if (montoPagado > 0) {
    try {
      // Crear el pago directamente usando supabase para evitar dependencias circulares
      const { data: pagoCreado, error: pagoError } = await supabase
        .from('pagos')
        .insert([{
          remito_id: remitoCreado.id,
          fecha: remitoData.fecha || new Date().toISOString().split('T')[0],
          monto: montoPagado,
          observaciones: `Pago inicial del remito ${remitoCreado.numero || remitoCreado.id}`
        }])
        .select()
        .single();
      
      if (pagoError) throw pagoError;
      
      // Actualizar estado del remito después de crear el pago
      await actualizarEstadoRemito(remitoCreado.id);
    } catch (pagoError) {
      console.error('Error creando pago automático al crear remito:', pagoError);
      // No fallar la creación del remito si falla el pago, pero advertir
      console.warn('El remito se creó pero no se pudo crear el pago automático. Debe crearse manualmente.');
    }
  }
  
  // Registrar auditoría
  await registrarAuditoria('remitos', remitoCreado.id, 'INSERT', null, remitoCreado, null, `Remito creado: ${remitoCreado.numero || remitoCreado.id}`);
  
  // Invalidar caché del resumen (cambió el total de remitos, facturado, etc.)
  invalidarCacheResumen();
  
  return remitoCreado;
};

// Validar que un remito existe antes de operar
export const validateRemitoExists = async (id) => {
  const { data, error } = await supabase
    .from('remitos')
    .select('id')
    .eq('id', id)
    .single();
  
  if (error || !data) {
    throw new Error('El remito no existe o fue eliminado por otro usuario');
  }
  return true;
};

export const updateRemito = async (id, remito) => {
  // Validar que el remito existe antes de actualizar
  await validateRemitoExists(id);
  
  // Obtener datos anteriores para auditoría (con manejo de errores)
  let datosAnteriores = null;
  try {
    const { data, error } = await supabase
      .from('remitos')
      .select('*')
      .eq('id', id)
      .single();
    if (!error && data) {
      datosAnteriores = data;
    }
  } catch (error) {
    console.warn('Error obteniendo datos anteriores para auditoría:', error);
    // Continuar aunque falle la auditoría
  }
  
  const { articulos, ...remitoData } = remito;
  
  // Si el número está vacío al editar, mantener el número original
  // Obtener el remito actual para mantener su número si se borró
  if (!remitoData.numero || (typeof remitoData.numero === 'string' && remitoData.numero.trim() === '')) {
    try {
      const { data: remitoActual, error: fetchError } = await supabase
        .from('remitos')
        .select('numero')
        .eq('id', id)
        .single();
      
      if (!fetchError && remitoActual && remitoActual.numero) {
        remitoData.numero = remitoActual.numero; // Mantener el número original
      } else {
        // Si no hay número original, generar uno nuevo
        try {
          remitoData.numero = await generarNumeroRemitoUnico();
        } catch (error) {
          console.error('Error generando número único al editar, usando timestamp:', error);
          remitoData.numero = `AUTO-${Date.now()}`;
        }
      }
    } catch (error) {
      console.error('Error obteniendo remito actual:', error);
      // Si falla, intentar generar uno nuevo
      try {
        remitoData.numero = await generarNumeroRemitoUnico();
      } catch (genError) {
        console.error('Error generando número único, usando timestamp:', genError);
        remitoData.numero = `AUTO-${Date.now()}`;
      }
    }
  }
  
  // Validar que el cliente existe si se está cambiando
  if (remitoData.cliente_id) {
    await validateClienteExists(remitoData.cliente_id);
  }
  
  // Actualizar remito
  const { data: remitoActualizado, error: remitoError } = await supabase
    .from('remitos')
    .update(remitoData)
    .eq('id', id)
    .select()
    .single();
  
  if (remitoError) throw remitoError;
  
  // Eliminar artículos antiguos
  const { error: deleteError } = await supabase
    .from('remito_articulos')
    .delete()
    .eq('remito_id', id);
  
  if (deleteError) throw deleteError;
  
  // Insertar nuevos artículos
  if (articulos && articulos.length > 0) {
    const articulosData = articulos.map(art => ({
      ...art,
      remito_id: id
    }));
    
    const { error: articulosError } = await supabase
      .from('remito_articulos')
      .insert(articulosData);
    
    if (articulosError) throw articulosError;
  }
  
  // Actualizar estado del remito después de actualizar los artículos
  // Los triggers en la base de datos también lo harán, pero lo hacemos aquí para consistencia inmediata
  await actualizarEstadoRemito(id);
  
  // Si cambió el cliente, recalcular estados de ambos clientes
  if (datosAnteriores && datosAnteriores.cliente_id !== remitoActualizado.cliente_id) {
    // Recalcular estados del cliente anterior
    if (datosAnteriores.cliente_id) {
      await recalcularEstadosRemitosCliente(datosAnteriores.cliente_id);
    }
    // Recalcular estados del cliente nuevo
    if (remitoActualizado.cliente_id) {
      await recalcularEstadosRemitosCliente(remitoActualizado.cliente_id);
    }
  } else if (remitoActualizado.cliente_id) {
    // Si no cambió el cliente, solo recalcular los estados del cliente actual
    await recalcularEstadosRemitosCliente(remitoActualizado.cliente_id);
  }
  
  // Registrar auditoría de forma asíncrona (no bloquear la respuesta)
  registrarAuditoria('remitos', id, 'UPDATE', datosAnteriores, remitoActualizado, null, `Remito actualizado: ${remitoActualizado.numero || id}`).catch(error => {
    console.warn('Error registrando auditoría (no crítico):', error);
  });
  
  // Invalidar caché del resumen (cambió el monto pagado, facturado, etc.)
  invalidarCacheResumen();
  
  return remitoActualizado;
};

export const deleteRemito = async (id) => {
  // Validar que el remito existe antes de eliminar
  await validateRemitoExists(id);
  
  // Obtener el remito completo para auditoría y eliminar la imagen si existe
  const { data: remito } = await supabase
    .from('remitos')
    .select('*')
    .eq('id', id)
    .single();
  
  // Si el remito no existe, ya fue validado arriba, pero por si acaso
  if (!remito) {
    throw new Error('El remito no existe o fue eliminado por otro usuario');
  }
  
  // Eliminar imagen de Storage si existe
  if (remito.foto_path) {
    await deleteRemitoImage(remito.foto_path);
  }
  
  // Los artículos y pagos se eliminan automáticamente por CASCADE
  const { error } = await supabase
    .from('remitos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  
  // Registrar auditoría
  await registrarAuditoria('remitos', id, 'DELETE', remito, null, null, `Remito eliminado: ${remito.numero || id}`);
  
  // Invalidar caché del resumen (cambió el total de remitos, facturado, etc.)
  invalidarCacheResumen();
  
  return { success: true };
};

// ============ PAGOS ============
export const getPagos = async (remitoId = null) => {
  let query = supabase
    .from('pagos')
    .select('*')
    .order('fecha', { ascending: false })
    .order('id', { ascending: false }); // Orden secundario: si tienen la misma fecha, más recientes primero (ID más alto)
  
  if (remitoId) {
    query = query.eq('remito_id', remitoId);
  }
  
  const { data: pagos, error } = await query;
  if (error) throw error;
  
  // Obtener información de remitos
  const remitoIds = [...new Set((pagos || []).map(p => p.remito_id))];
  const { data: remitos } = await supabase
    .from('remitos')
    .select('id, numero, cliente_id')
    .in('id', remitoIds);
  
  const remitosMap = {};
  (remitos || []).forEach(r => remitosMap[r.id] = r);
  
  // Obtener clientes
  const clienteIds = [...new Set((remitos || []).map(r => r.cliente_id))];
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nombre')
    .in('id', clienteIds);
  
  const clientesMap = {};
  (clientes || []).forEach(c => clientesMap[c.id] = c.nombre);
  
  return (pagos || []).map(pago => {
    const remito = remitosMap[pago.remito_id];
    return {
      ...pago,
      remito_numero: remito?.numero || null,
      cliente_nombre: remito ? clientesMap[remito.cliente_id] : null
    };
  });
};

export const createPago = async (pago) => {
  // Validar que el remito existe antes de crear el pago
  await validateRemitoExists(pago.remito_id);
  
  const { data, error } = await supabase
    .from('pagos')
    .insert([pago])
    .select()
    .single();
  
  if (error) throw error;
  
  // Actualizar estado del remito específico
  // NOTA: Los triggers en la base de datos también actualizarán automáticamente,
  // pero lo hacemos aquí también para asegurar consistencia inmediata
  await actualizarEstadoRemito(pago.remito_id);
  
  // Obtener el cliente del remito para recalcular todos sus remitos si es necesario
  const { data: remito } = await supabase
    .from('remitos')
    .select('cliente_id')
    .eq('id', pago.remito_id)
    .single();
  
  // Si hay cliente, recalcular todos los remitos del cliente para asegurar consistencia
  // Esto es especialmente importante cuando hay saldo a favor que puede afectar otros remitos
  if (remito && remito.cliente_id) {
    await recalcularEstadosRemitosCliente(remito.cliente_id);
  }
  
  // Registrar auditoría
  await registrarAuditoria('pagos', data.id, 'INSERT', null, data, null, `Pago creado para remito ${pago.remito_id}: ${pago.monto}`);
  
  // Invalidar caché del resumen (cambió el total pagado)
  invalidarCacheResumen();
  
  return data;
};

export const updatePago = async (id, pago) => {
  // Obtener datos anteriores para auditoría
  const { data: datosAnteriores, error: fetchError } = await supabase
    .from('pagos')
    .select('*')
    .eq('id', id)
    .single();
  
  if (fetchError || !datosAnteriores) {
    throw new Error('El pago no existe o fue eliminado por otro usuario');
  }
  
  // Validar que el remito existe si se está cambiando
  if (pago.remito_id && pago.remito_id !== datosAnteriores.remito_id) {
    await validateRemitoExists(pago.remito_id);
  }
  
  // Actualizar pago
  const { data, error } = await supabase
    .from('pagos')
    .update(pago)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  if (!data) {
    throw new Error('El pago no existe o fue eliminado por otro usuario');
  }
  
  // Actualizar estado del remito (tanto el antiguo como el nuevo si cambió)
  await actualizarEstadoRemito(data.remito_id);
  
  // Si cambió el remito_id, actualizar también el remito anterior
  if (datosAnteriores.remito_id !== data.remito_id) {
    await actualizarEstadoRemito(datosAnteriores.remito_id);
    
    // Recalcular estados de todos los remitos del cliente anterior
    const { data: remitoAnterior } = await supabase
      .from('remitos')
      .select('cliente_id')
      .eq('id', datosAnteriores.remito_id)
      .single();
    
    if (remitoAnterior && remitoAnterior.cliente_id) {
      await recalcularEstadosRemitosCliente(remitoAnterior.cliente_id);
    }
  }
  
  // Recalcular estados de todos los remitos del cliente actual
  const { data: remito } = await supabase
    .from('remitos')
    .select('cliente_id')
    .eq('id', data.remito_id)
    .single();
  
  if (remito && remito.cliente_id) {
    await recalcularEstadosRemitosCliente(remito.cliente_id);
  }
  
  // Registrar auditoría
  await registrarAuditoria('pagos', id, 'UPDATE', datosAnteriores, data, null, `Pago actualizado: ${data.monto}`);
  
  // Invalidar caché del resumen
  invalidarCacheResumen();
  
  return data;
};

export const deletePago = async (id) => {
  // Obtener datos antes de eliminar para auditoría y actualizar remitos
  const { data: datosAnteriores, error: fetchError } = await supabase
    .from('pagos')
    .select('*')
    .eq('id', id)
    .single();
  
  if (fetchError || !datosAnteriores) {
    throw new Error('El pago no existe o fue eliminado por otro usuario');
  }
  
  const remitoId = datosAnteriores.remito_id;
  
  // Eliminar pago
  const { error } = await supabase
    .from('pagos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  
  // Actualizar estado del remito específico
  await actualizarEstadoRemito(remitoId);
  
  // Recalcular estados de TODOS los remitos del cliente para asegurar consistencia
  // Esto es importante porque cuando se elimina un pago, puede afectar el saldo a favor
  // y cambiar el estado de otros remitos del mismo cliente
  const { data: remito } = await supabase
    .from('remitos')
    .select('cliente_id')
    .eq('id', remitoId)
    .single();
  
  if (remito && remito.cliente_id) {
    await recalcularEstadosRemitosCliente(remito.cliente_id);
  }
  
  // Registrar auditoría
  await registrarAuditoria('pagos', id, 'DELETE', datosAnteriores, null, null, `Pago eliminado: ${datosAnteriores.monto}`);
  
  // Invalidar caché del resumen
  invalidarCacheResumen();
  
  return { success: true };
};

// Marcar cheque como rebotado
export const marcarChequeRebotado = async (pagoId, rebotado = true) => {
  const { data, error } = await supabase
    .from('pagos')
    .update({ cheque_rebotado: rebotado })
    .eq('id', pagoId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Si tiene remito, actualizar su estado
  if (data.remito_id) {
    await actualizarEstadoRemito(data.remito_id);
  }
  
  // Invalidar caché
  invalidarCacheResumen();
  
  return { success: true, rebotado };
};

async function actualizarEstadoRemito(remitoId) {
  // Calcular total pagado
  const { data: pagos } = await supabase
    .from('pagos')
    .select('monto')
    .eq('remito_id', remitoId);
  
  const totalPagado = (pagos || []).reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
  
  // Calcular precio total del remito
  const { data: articulos } = await supabase
    .from('remito_articulos')
    .select('precio_total')
    .eq('remito_id', remitoId);
  
  const precioTotal = (articulos || []).reduce((sum, a) => sum + parseFloat(a.precio_total || 0), 0);
  
  // Determinar estado: si el monto pagado es >= precio total, está pagado
  // Si hay saldo a favor (totalPagado > precioTotal), también está pagado
  let estadoPago = 'Pendiente';
  if (precioTotal > 0 && totalPagado >= precioTotal) {
    estadoPago = 'Pagado';
  } else if (totalPagado > 0 && precioTotal > 0) {
    estadoPago = 'Pago Parcial';
  } else if (totalPagado > 0 && precioTotal === 0) {
    // Si pagaron pero el remito no tiene precio total, considerar pagado
    estadoPago = 'Pagado';
  }
  
  // Actualizar remito - siempre actualizar monto_pagado para reflejar la realidad
  await supabase
    .from('remitos')
    .update({ estado_pago: estadoPago, monto_pagado: totalPagado })
    .eq('id', remitoId);
  
  // Invalidar caché del resumen cuando se actualiza el estado de pago
  invalidarCacheResumen();
}

// Función para recalcular estados de todos los remitos de un cliente
export const recalcularEstadosRemitosCliente = async (clienteId) => {
  try {
    // Obtener todos los remitos del cliente
    const remitos = await getRemitos(clienteId);
    
    // Recalcular estado para cada remito
    for (const remito of remitos) {
      await actualizarEstadoRemito(remito.id);
    }
    
    return { success: true, remitosActualizados: remitos.length };
  } catch (error) {
    console.error('Error recalculando estados de remitos:', error);
    throw error;
  }
};

// ============ REPORTES ============
export const getCuentaCorriente = async (clienteId) => {
  const remitos = await getRemitos(clienteId);
  
  // Obtener todos los pagos del cliente (de todos sus remitos)
  const remitosIds = remitos.map(r => r.id);
  let pagosCliente = [];
  
  if (remitosIds.length > 0) {
    const { data: pagos, error: pagosError } = await supabase
      .from('pagos')
      .select('*')
      .in('remito_id', remitosIds)
      .order('fecha', { ascending: false })
      .order('id', { ascending: false });
    
    if (!pagosError && pagos) {
      // Agregar información del remito a cada pago
      const remitosMap = {};
      remitos.forEach(r => remitosMap[r.id] = r);
      
      pagosCliente = pagos.map(pago => ({
        ...pago,
        remito_numero: remitosMap[pago.remito_id]?.numero || `REM-${pago.remito_id}`,
        remito_fecha: remitosMap[pago.remito_id]?.fecha
      }));
    }
  }
  
  // Calcular totales
  let totalRemitos = 0;
  let totalPagado = 0;
  
  remitos.forEach(remito => {
    const precioTotal = parseFloat(remito.precio_total || 0);
    const montoPagado = parseFloat(remito.monto_pagado || 0);
    
    totalRemitos += precioTotal;
    totalPagado += montoPagado;
  });
  
  // Saldo inicial del cliente (si existe tabla saldos_iniciales)
  let saldoInicial = null;
  try {
    const { data: rowsSaldo, error: errSaldo } = await supabase
      .from('saldos_iniciales')
      .select('id, cliente_id, fecha_referencia, monto, descripcion')
      .eq('cliente_id', clienteId)
      .order('fecha_referencia', { ascending: false })
      .limit(1);
    if (!errSaldo && rowsSaldo && rowsSaldo.length > 0) {
      saldoInicial = rowsSaldo[0];
    }
  } catch (e) {
    // Tabla puede no existir
  }
  const montoSI = saldoInicial ? parseFloat(saldoInicial.monto || 0) : 0;
  // Saldo pendiente: facturado - pagado - saldo inicial (negativo = saldo a favor)
  const totalPendiente = totalRemitos - totalPagado - montoSI;
  
  return {
    cliente_id: clienteId,
    remitos,
    pagos: pagosCliente, // Incluir historial de pagos con fechas reales
    saldoInicial,
    totales: {
      total_remitos: totalRemitos,
      total_pagado: totalPagado,
      total_pendiente: totalPendiente
    }
  };
};

// Función para calcular el resumen general (sin caché)
const calcularResumenGeneral = async (fechaDesde = null, fechaHasta = null) => {
  try {
    // Construir query base para remitos con filtros de fecha
    let remitosQuery = supabase.from('remitos').select('id, fecha, monto_pagado');
    
    if (fechaDesde) {
      remitosQuery = remitosQuery.gte('fecha', fechaDesde);
    }
    if (fechaHasta) {
      remitosQuery = remitosQuery.lte('fecha', fechaHasta);
    }
    
    const { data: remitos, error: remitosError } = await remitosQuery;
    if (remitosError) throw remitosError;
    
    const remitosIds = (remitos || []).map(r => r.id);
    
    // Total clientes (siempre todos, no se filtra por fecha)
    const { count: totalClientes, error: clientesError } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true });
    if (clientesError) throw clientesError;
    
    // Total remitos en el período
    const totalRemitos = remitosIds.length;
    
    // Total facturado (suma de artículos de remitos en el período)
    // Dividir en chunks para evitar problemas con consultas muy grandes
    let totalFacturado = 0;
    if (remitosIds.length > 0) {
      // Supabase tiene límites en .in(), usar chunks de 500 IDs
      const CHUNK_SIZE = 500;
      const chunks = chunkArray(remitosIds, CHUNK_SIZE);
      
      // Procesar cada chunk y acumular resultados
      for (const chunk of chunks) {
        try {
          const { data: articulos, error: articulosError } = await supabase
            .from('remito_articulos')
            .select('precio_total')
            .in('remito_id', chunk);
          
          if (articulosError) {
            console.warn(`Error en chunk de remito_articulos:`, articulosError);
            // Continuar con el siguiente chunk aunque falle uno
            continue;
          }
          
          const chunkTotal = (articulos || []).reduce((sum, a) => sum + parseFloat(a.precio_total || 0), 0);
          totalFacturado += chunkTotal;
        } catch (chunkError) {
          console.warn(`Error procesando chunk de remitos:`, chunkError);
          // Continuar con el siguiente chunk
          continue;
        }
      }
    }
    
    // Total pagado (suma de monto_pagado de remitos en el período)
    const totalPagado = (remitos || []).reduce((sum, r) => sum + parseFloat(r.monto_pagado || 0), 0);
    
    return {
      total_clientes: totalClientes || 0,
      total_remitos: totalRemitos || 0,
      total_facturado: totalFacturado,
      total_pagado: totalPagado,
      total_pendiente: totalFacturado - totalPagado
    };
  } catch (error) {
    console.error('Error calculando resumen general:', error);
    throw error;
  }
};

// Función para obtener o crear la clave de caché
const getCacheKey = (fechaDesde, fechaHasta) => {
  return `resumen_${fechaDesde || 'all'}_${fechaHasta || 'all'}`;
};

export const getResumenGeneral = async (fechaDesde = null, fechaHasta = null, forceRefresh = false) => {
  try {
    const cacheKey = getCacheKey(fechaDesde, fechaHasta);
    
    // Intentar obtener desde caché en localStorage primero (más rápido)
    if (!forceRefresh) {
      const cachedResumen = localStorage.getItem(`resumen_cache_${cacheKey}`);
      const cachedTimestamp = localStorage.getItem(`resumen_cache_time_${cacheKey}`);
      
      if (cachedResumen && cachedTimestamp) {
        const cacheAge = Date.now() - parseInt(cachedTimestamp, 10);
        // Usar caché si tiene menos de 5 minutos
        if (cacheAge < 5 * 60 * 1000) {
          try {
            console.log('Resumen cargado desde caché (edad: ' + Math.round(cacheAge / 1000) + 's)');
            return JSON.parse(cachedResumen);
          } catch (e) {
            console.warn('Error parseando caché de resumen:', e);
            // Limpiar caché corrupto
            localStorage.removeItem(`resumen_cache_${cacheKey}`);
            localStorage.removeItem(`resumen_cache_time_${cacheKey}`);
          }
        } else {
          console.log('Caché de resumen expirado, recalculando...');
        }
      }
    }
    
    // Si no hay caché válido, calcular y guardar
    console.log('Calculando resumen general...');
    const resumen = await calcularResumenGeneral(fechaDesde, fechaHasta);
    
    // Guardar en localStorage para acceso rápido
    try {
      localStorage.setItem(`resumen_cache_${cacheKey}`, JSON.stringify(resumen));
      localStorage.setItem(`resumen_cache_time_${cacheKey}`, Date.now().toString());
      console.log('Resumen guardado en caché');
    } catch (e) {
      console.warn('Error guardando caché de resumen en localStorage:', e);
      // Si localStorage está lleno, intentar limpiar cachés antiguos
      try {
        const keys = Object.keys(localStorage);
        const oldCacheKeys = keys.filter(k => k.startsWith('resumen_cache_') || k.startsWith('resumen_cache_time_'));
        // Eliminar los más antiguos primero (limitando a los últimos 10 cachés)
        if (oldCacheKeys.length > 20) {
          oldCacheKeys.slice(0, oldCacheKeys.length - 20).forEach(k => localStorage.removeItem(k));
          // Intentar guardar de nuevo
          localStorage.setItem(`resumen_cache_${cacheKey}`, JSON.stringify(resumen));
          localStorage.setItem(`resumen_cache_time_${cacheKey}`, Date.now().toString());
        }
      } catch (cleanupError) {
        console.warn('No se pudo limpiar caché antiguo:', cleanupError);
      }
    }
    
    return resumen;
  } catch (error) {
    console.error('Error en getResumenGeneral:', error);
    
    // Si hay error, intentar devolver caché antiguo como fallback (incluso si está expirado)
    const cacheKey = getCacheKey(fechaDesde, fechaHasta);
    const cachedResumen = localStorage.getItem(`resumen_cache_${cacheKey}`);
    if (cachedResumen) {
      try {
        console.warn('Usando caché antiguo debido a error en la consulta');
        return JSON.parse(cachedResumen);
      } catch (e) {
        console.warn('Error parseando caché de respaldo:', e);
        // Limpiar caché corrupto
        localStorage.removeItem(`resumen_cache_${cacheKey}`);
        localStorage.removeItem(`resumen_cache_time_${cacheKey}`);
      }
    }
    
    // Si todo falla, devolver valores por defecto
    console.warn('Devolviendo valores por defecto debido a error');
    return {
      total_clientes: 0,
      total_remitos: 0,
      total_facturado: 0,
      total_pagado: 0,
      total_pendiente: 0
    };
  }
};

// Función para invalidar el caché del resumen
export const invalidarCacheResumen = () => {
  try {
    // Eliminar todos los cachés de resumen
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('resumen_cache_') || key.startsWith('resumen_cache_time_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Error invalidando caché de resumen:', error);
  }
};

// Exportar supabase para uso directo cuando sea necesario
export { supabase };

