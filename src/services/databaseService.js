// Servicio de Base de Datos - SOLO MySQL Hostinger
// Imágenes: data URL / base64 persistido en MySQL vía IPC

// Importar servicios
import * as hostingerService from './hostingerService';

// ============================================================
// FORZAR USO DE MYSQL HOSTINGER
// ============================================================
const USE_HOSTINGER = true; // SIEMPRE MySQL

// Usar SOLO hostingerService para todos los datos
const activeService = hostingerService;

// Exportar funciones del servicio MySQL
export const testConnection = hostingerService.testConnection;
export const getClientes = hostingerService.getClientes;
export const getCliente = hostingerService.getCliente;
export const createCliente = hostingerService.createCliente;
export const updateCliente = hostingerService.updateCliente;
export const deleteCliente = hostingerService.deleteCliente;
export const getArticulos = hostingerService.getArticulos;
export const createArticulo = hostingerService.createArticulo;
export const updateArticulo = hostingerService.updateArticulo;
export const deleteArticulo = hostingerService.deleteArticulo;
export const getRemitos = hostingerService.getRemitos;
export const getRemito = hostingerService.getRemito;
export const createRemito = hostingerService.createRemito;
export const updateRemito = hostingerService.updateRemito;
export const deleteRemito = hostingerService.deleteRemito;
export const getPagos = hostingerService.getPagos;
export const createPago = hostingerService.createPago;
export const createPagosBatch = hostingerService.createPagosBatch;
export const updatePago = hostingerService.updatePago;
export const deletePago = hostingerService.deletePago;
export const deletePagosCliente = hostingerService.deletePagosCliente;
export const limpiarPagosHuerfanosCliente = hostingerService.limpiarPagosHuerfanosCliente;
export const eliminarTodosPagosHuerfanos = hostingerService.eliminarTodosPagosHuerfanos;
export const marcarPagoComoCheque = hostingerService.marcarPagoComoCheque;
export const marcarChequeRebotado = hostingerService.marcarChequeRebotado;
export const getCuentaCorriente = hostingerService.getCuentaCorriente;
export const getResumenGeneral = hostingerService.getResumenGeneral;
export const getSaldoInicialCliente = hostingerService.getSaldoInicialCliente;
export const setSaldoInicialCliente = hostingerService.setSaldoInicialCliente;

// Funciones de imágenes (ahora Hostinger - base64 en MySQL)
export const uploadRemitoImage = hostingerService.uploadRemitoImage;
export const deleteRemitoImage = hostingerService.deleteRemitoImage;
export const getPublicImageUrl = hostingerService.getPublicImageUrl;
export const getRemitoImageUrl = hostingerService.getPublicImageUrl;

// Funciones adicionales
export const obtenerSiguienteCodigo = hostingerService.obtenerSiguienteCodigo;
export const recalcularEstadosRemitosCliente = hostingerService.recalcularEstadosRemitosCliente;

// ============ AUDITORÍAS Y USUARIOS ============
export const login = hostingerService.login;
export const getUsuarios = hostingerService.getUsuarios;
export const createUsuario = hostingerService.createUsuario;
export const updateUsuario = hostingerService.updateUsuario;
export const deleteUsuario = hostingerService.deleteUsuario;
export const toggleUsuario = hostingerService.toggleUsuario;
export const cambiarPassword = hostingerService.cambiarPassword;
export const getAuditoria = hostingerService.getAuditoria;
export const registrarAuditoria = hostingerService.registrarAuditoria;

// ============ REPORTE DE ERRORES ============
export const createErrorReport = hostingerService.createErrorReport;
export const getErrorReports = hostingerService.getErrorReports;
export const markErrorReportAsResolved = hostingerService.markErrorReportAsResolved;

// ============ BACKUPS ============
export const exportBackupSQL = hostingerService.exportBackupSQL;

// Info del servicio activo
export const getServiceInfo = () => ({
  name: 'Hostinger MySQL',
  isHostinger: true
});

console.log('📦 Base de datos: HOSTINGER MySQL');

export default activeService;
