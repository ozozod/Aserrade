// Servicio de Hostinger MySQL para React
// Se comunica con el proceso principal de Electron via IPC O con el backend API si está en web

// URL del backend API (ajustar según tu configuración de producción)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Verificar si estamos en Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI && window.electronAPI.mysql;
};

// ============ TEST DE CONEXIÓN ============
export const testConnection = async () => {
  if (!isElectron()) {
    return { success: false, message: 'MySQL solo disponible en Electron' };
  }
  return await window.electronAPI.mysql.testConnection();
};

// ============ CLIENTES ============
export const getClientes = async () => {
  if (isElectron()) {
    return await window.electronAPI.mysql.getClientes();
  } else {
    // En navegador, retornar array vacío (no hay conexión a MySQL)
    return [];
  }
};

export const getCliente = async (id) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.getCliente(id);
  } else {
    // En navegador, retornar null (no hay conexión a MySQL)
    return null;
  }
};

export const createCliente = async (cliente, saldoInicialData = null) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.createCliente(cliente, saldoInicialData);
  } else {
    throw new Error('MySQL solo disponible en Electron');
  }
};

export const updateCliente = async (id, cliente, saldoInicialData = null) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.updateCliente(id, cliente, saldoInicialData);
  } else {
    throw new Error('MySQL solo disponible en Electron');
  }
};

export const deleteCliente = async (id) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.deleteCliente(id);
  } else {
    // En navegador, no hacer nada (no hay conexión a MySQL)
    throw new Error('MySQL solo disponible en Electron');
  }
};

// ============ ARTICULOS ============
export const getArticulos = async (clienteId = null) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.getArticulos(clienteId);
  } else {
    // En navegador, retornar array vacío (no hay conexión a MySQL)
    return [];
  }
};

export const createArticulo = async (articulo) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.createArticulo(articulo);
  } else {
    // En navegador, no hacer nada (no hay conexión a MySQL)
    throw new Error('MySQL solo disponible en Electron');
  }
};

export const updateArticulo = async (id, articulo) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.updateArticulo(id, articulo);
  } else {
    // En navegador, no hacer nada (no hay conexión a MySQL)
    throw new Error('MySQL solo disponible en Electron');
  }
};

export const deleteArticulo = async (id) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.deleteArticulo(id);
  } else {
    // En navegador, no hacer nada (no hay conexión a MySQL)
    throw new Error('MySQL solo disponible en Electron');
  }
};

// ============ REMITOS ============
export const getRemitos = async (clienteId = null) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.getRemitos(clienteId);
  } else {
    // En navegador, retornar array vacío (no hay conexión a MySQL)
    return [];
  }
};

export const getRemito = async (id) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.getRemito(id);
  } else {
    // En navegador, retornar null (no hay conexión a MySQL)
    return null;
  }
};

export const createRemito = async (remito) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.createRemito(remito);
  } else {
    // En navegador, no hacer nada (no hay conexión a MySQL)
    throw new Error('MySQL solo disponible en Electron');
  }
};

export const updateRemito = async (id, remito) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.updateRemito(id, remito);
  } else {
    // En navegador, no hacer nada (no hay conexión a MySQL)
    throw new Error('MySQL solo disponible en Electron');
  }
};

export const deleteRemito = async (id) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.deleteRemito(id);
  } else {
    // En navegador, no hacer nada (no hay conexión a MySQL)
    throw new Error('MySQL solo disponible en Electron');
  }
};

// ============ PAGOS ============
export const getPagos = async (remitoId = null) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.getPagos(remitoId);
  } else {
    // En navegador, retornar array vacío (no hay conexión a MySQL)
    return [];
  }
};

export const createPago = async (pago) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.createPago(pago);
  } else {
    // En navegador, no hacer nada (no hay conexión a MySQL)
    throw new Error('MySQL solo disponible en Electron');
  }
};

export const createPagosBatch = async (pagos) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.createPagosBatch(pagos);
  } else {
    // En navegador, no hacer nada (no hay conexión a MySQL)
    throw new Error('MySQL solo disponible en Electron');
  }
};

export const updatePago = async (id, pago) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.updatePago(id, pago);
  } else {
    // En navegador, no hacer nada (no hay conexión a MySQL)
    throw new Error('MySQL solo disponible en Electron');
  }
};

export const deletePago = async (id) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.deletePago(id);
  } else {
    // En navegador, no hacer nada (no hay conexión a MySQL)
    throw new Error('MySQL solo disponible en Electron');
  }
};

export const deletePagosCliente = async (clienteId) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.deletePagosCliente(clienteId);
  } else {
    // En navegador, no hacer nada (no hay conexión a MySQL)
    throw new Error('MySQL solo disponible en Electron');
  }
};

export const limpiarPagosHuerfanosCliente = async (clienteId) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.limpiarPagosHuerfanosCliente(clienteId);
  } else {
    // En navegador, no hacer nada (no hay conexión a MySQL)
    throw new Error('MySQL solo disponible en Electron');
  }
};

export const eliminarTodosPagosHuerfanos = async () => {
  if (isElectron()) {
    return await window.electronAPI.mysql.eliminarTodosPagosHuerfanos();
  } else {
    // En navegador, no hacer nada (no hay conexión a MySQL)
    throw new Error('MySQL solo disponible en Electron');
  }
};

export const marcarPagoComoCheque = async (pagoId, esCheque = true) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.marcarPagoComoCheque(pagoId, esCheque);
  } else {
    // En navegador, no hacer nada (no hay conexión a MySQL)
    throw new Error('MySQL solo disponible en Electron');
  }
};

export const marcarChequeRebotado = async (pagoId, rebotado = true) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.marcarChequeRebotado(pagoId, rebotado);
  } else {
    // En navegador, no hacer nada (no hay conexión a MySQL)
    throw new Error('MySQL solo disponible en Electron');
  }
};

// ============ REPORTES ============
export const getCuentaCorriente = async (clienteId) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.getCuentaCorriente(clienteId);
  } else {
    // En navegador, retornar objeto vacío (no hay conexión a MySQL)
    return { remitos: [], pagos: [], saldo: 0 };
  }
};

export const getResumenGeneral = async (fechaDesde = null, fechaHasta = null) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.getResumenGeneral(fechaDesde, fechaHasta);
  } else {
    // En navegador, retornar objeto vacío (no hay conexión a MySQL)
    return { totalRemitos: 0, totalPagos: 0, saldoPendiente: 0 };
  }
};

// ============ FUNCIONES NO IMPLEMENTADAS (compatibilidad) ============
// Estas funciones no están implementadas en MySQL todavía (stubs / compat)
// Convertir imagen a base64 para guardar en MySQL
export const uploadRemitoImage = async (imageBuffer, filename) => {
  try {
    // Si ya es base64, retornarlo directamente
    if (typeof imageBuffer === 'string' && imageBuffer.startsWith('data:image')) {
      return imageBuffer;
    }
    
    // Si es un File object, usar FileReader
    if (imageBuffer instanceof File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target.result); // Ya viene como data:image/jpeg;base64,...
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageBuffer);
      });
    }
    
    // Si es ArrayBuffer o Uint8Array, convertirlo a base64
    let uint8Array;
    if (imageBuffer instanceof ArrayBuffer) {
      uint8Array = new Uint8Array(imageBuffer);
    } else if (imageBuffer instanceof Uint8Array) {
      uint8Array = imageBuffer;
    } else if (typeof imageBuffer === 'object' && imageBuffer.buffer) {
      // Si es un objeto con propiedad buffer (como Buffer de Node)
      uint8Array = new Uint8Array(imageBuffer.buffer);
    } else {
      throw new Error('Formato de imagen no soportado');
    }
    
    // Convertir Uint8Array a base64 (funciona en navegador)
    const binary = [];
    for (let i = 0; i < uint8Array.length; i++) {
      binary.push(String.fromCharCode(uint8Array[i]));
    }
    const base64 = btoa(binary.join(''));
    const mimeType = 'image/jpeg'; // Siempre JPG después de compresión
    
    // Retornar como data URL para guardar en la base de datos
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error convirtiendo imagen a base64:', error);
    throw error;
  }
};

// Eliminar imagen (no hace nada, las imágenes están en la base de datos)
export const deleteRemitoImage = async (imageUrl) => {
  // Las imágenes están guardadas como base64 en la base de datos
  // No hay nada que eliminar externamente
  return true;
};

// Obtener URL de imagen desde base64 guardado en MySQL
export const getPublicImageUrl = (imageData) => {
  // Si ya es una URL completa (http/https), retornarla
  if (imageData && (imageData.startsWith('http://') || imageData.startsWith('https://'))) {
    return imageData;
  }
  
  // Si es base64 (data:image...), retornarlo directamente
  if (imageData && imageData.startsWith('data:image')) {
    return imageData;
  }
  
  // Si no hay imagen, retornar null
  return null;
};

export const getRemitoImageUrl = () => {
  console.warn('getRemitoImageUrl no implementado en MySQL');
  return null;
};

export const obtenerSiguienteCodigo = async (clienteId) => {
  // En MySQL, calcular el siguiente código basado en los artículos existentes
  const articulos = isElectron() 
    ? await window.electronAPI.mysql.getArticulos(clienteId)
    : await getArticulos(clienteId);
  const codigosExistentes = articulos
    .filter(a => a.codigo && a.codigo.match(/^\d+$/))
    .map(a => parseInt(a.codigo));
  const maxCodigo = codigosExistentes.length > 0 ? Math.max(...codigosExistentes) : 0;
  return String(maxCodigo + 1).padStart(3, '0');
};

export const recalcularEstadosRemitosCliente = async (clienteId) => {
  if (isElectron()) {
    return await window.electronAPI.mysql.recalcularEstadosRemitosCliente(clienteId);
  } else {
    // En navegador, no hacer nada (no hay conexión a MySQL)
    throw new Error('MySQL solo disponible en Electron');
  }
};

// ============ USUARIOS Y AUDITORÍA ============
export const login = async (username, password) => {
  if (!isElectron()) throw new Error('Login solo disponible en Electron');
  return await window.electronAPI.invoke('mysql:login', { username, password });
};

export const getUsuarios = async () => {
  if (!isElectron()) throw new Error('MySQL solo disponible en Electron');
  return await window.electronAPI.invoke('mysql:getUsuarios');
};

export const createUsuario = async (usuario) => {
  if (!isElectron()) throw new Error('MySQL solo disponible en Electron');
  return await window.electronAPI.invoke('mysql:createUsuario', usuario);
};

export const updateUsuario = async (id, usuario) => {
  if (!isElectron()) throw new Error('MySQL solo disponible en Electron');
  return await window.electronAPI.invoke('mysql:updateUsuario', id, usuario);
};

export const deleteUsuario = async (id) => {
  if (!isElectron()) throw new Error('MySQL solo disponible en Electron');
  return await window.electronAPI.invoke('mysql:deleteUsuario', id);
};

export const toggleUsuario = async (userId, activo) => {
  if (!isElectron()) throw new Error('MySQL solo disponible en Electron');
  return await window.electronAPI.invoke('mysql:toggleUsuario', { userId, activo });
};

export const cambiarPassword = async (userId, username, passwordActual, passwordNueva) => {
  if (!isElectron()) throw new Error('MySQL solo disponible en Electron');
  return await window.electronAPI.invoke('mysql:cambiarPassword', { userId, username, passwordActual, passwordNueva });
};

export const getAuditoria = async (params = {}) => {
  if (!isElectron()) throw new Error('MySQL solo disponible en Electron');
  return await window.electronAPI.invoke('mysql:getAuditoria', params);
};

export const registrarAuditoria = async (data) => {
  if (!isElectron()) throw new Error('MySQL solo disponible en Electron');
  return await window.electronAPI.invoke('mysql:registrarAuditoria', data);
};

// ============ REPORTE DE ERRORES ============
export const createErrorReport = async (payload) => {
  if (!isElectron()) throw new Error('MySQL solo disponible en Electron');
  return await window.electronAPI.mysql.createErrorReport(payload);
};

export const getErrorReports = async (params) => {
  if (!isElectron()) throw new Error('MySQL solo disponible en Electron');
  return await window.electronAPI.mysql.getErrorReports(params);
};

export const markErrorReportAsResolved = async (id, meta) => {
  if (!isElectron()) throw new Error('MySQL solo disponible en Electron');
  return await window.electronAPI.mysql.markErrorReportAsResolved(id, meta);
};

// ============ BACKUPS ============
export const exportBackupSQL = async (params) => {
  if (!isElectron()) throw new Error('MySQL solo disponible en Electron');
  return await window.electronAPI.mysql.exportBackupSQL(params);
};

// ============ SALDOS INICIALES ============
export const getSaldoInicialCliente = async (clienteId) => {
  if (!isElectron()) throw new Error('MySQL solo disponible en Electron');
  return await window.electronAPI.mysql.getSaldoInicialCliente(clienteId);
};

export const setSaldoInicialCliente = async ({ cliente_id, fecha_referencia, monto, descripcion }) => {
  if (!isElectron()) throw new Error('MySQL solo disponible en Electron');
  return await window.electronAPI.mysql.setSaldoInicialCliente({
    cliente_id,
    fecha_referencia,
    monto,
    descripcion
  });
};

// Export default con todas las funciones
const hostingerService = {
  testConnection,
  getClientes,
  getCliente,
  createCliente,
  updateCliente,
  deleteCliente,
  getArticulos,
  createArticulo,
  updateArticulo,
  deleteArticulo,
  getRemitos,
  getRemito,
  createRemito,
  updateRemito,
  deleteRemito,
  getPagos,
  createPago,
  updatePago,
  deletePago,
  deletePagosCliente,
  limpiarPagosHuerfanosCliente,
  eliminarTodosPagosHuerfanos,
  getCuentaCorriente,
  getResumenGeneral,
  uploadRemitoImage,
  deleteRemitoImage,
  getPublicImageUrl,
  getRemitoImageUrl,
  obtenerSiguienteCodigo,
  recalcularEstadosRemitosCliente,
  
  // Funciones de usuarios y auditoría
  login,
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  toggleUsuario,
  cambiarPassword,
  getAuditoria,
  registrarAuditoria,
  getSaldoInicialCliente,
  setSaldoInicialCliente
};

export default hostingerService;
