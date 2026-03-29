const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script cargado');

// Exponer electronAPI en window (MySQL vía IPC + utilidades de escritorio)
try {
  contextBridge.exposeInMainWorld('electronAPI', {
    // Archivos (solo para Electron)
    selectImage: () => ipcRenderer.invoke('file:selectImage'),
    compressImage: (sourcePath, remitoId) => ipcRenderer.invoke('file:compressImage', sourcePath, remitoId),
    // Configuración (credenciales de forma segura)
    getConfig: () => ipcRenderer.invoke('config:get'),
    // Información del sistema
    getMachineInfo: () => ipcRenderer.invoke('system:getMachineInfo'),
    
    // ============ MYSQL HOSTINGER API ============
    mysql: {
      // Test de conexión
      testConnection: () => ipcRenderer.invoke('mysql:testConnection'),
      
      // Clientes
      getClientes: () => ipcRenderer.invoke('mysql:getClientes'),
      getCliente: (id) => ipcRenderer.invoke('mysql:getCliente', id),
      createCliente: (cliente, saldoInicialData) => ipcRenderer.invoke('mysql:createCliente', cliente, saldoInicialData),
      updateCliente: (id, cliente, saldoInicialData) => ipcRenderer.invoke('mysql:updateCliente', id, cliente, saldoInicialData),
      deleteCliente: (id) => ipcRenderer.invoke('mysql:deleteCliente', id),
      
      // Artículos
      getArticulos: (clienteId) => ipcRenderer.invoke('mysql:getArticulos', clienteId),
      createArticulo: (articulo) => ipcRenderer.invoke('mysql:createArticulo', articulo),
      updateArticulo: (id, articulo) => ipcRenderer.invoke('mysql:updateArticulo', id, articulo),
      deleteArticulo: (id) => ipcRenderer.invoke('mysql:deleteArticulo', id),
      
      // Remitos
      getRemitos: (clienteId) => ipcRenderer.invoke('mysql:getRemitos', clienteId),
      getRemito: (id) => ipcRenderer.invoke('mysql:getRemito', id),
      createRemito: (remito) => ipcRenderer.invoke('mysql:createRemito', remito),
      updateRemito: (id, remito) => ipcRenderer.invoke('mysql:updateRemito', id, remito),
      deleteRemito: (id) => ipcRenderer.invoke('mysql:deleteRemito', id),
      
      // Pagos
      getPagos: (remitoId) => ipcRenderer.invoke('mysql:getPagos', remitoId),
      createPago: (pago) => ipcRenderer.invoke('mysql:createPago', pago),
      createPagosBatch: (pagos) => ipcRenderer.invoke('mysql:createPagosBatch', pagos),
      updatePago: (id, pago) => ipcRenderer.invoke('mysql:updatePago', id, pago),
      deletePago: (id) => ipcRenderer.invoke('mysql:deletePago', id),
      marcarPagoComoCheque: (pagoId, esCheque) => ipcRenderer.invoke('mysql:marcarPagoComoCheque', pagoId, esCheque),
      marcarChequeRebotado: (pagoId, rebotado) => ipcRenderer.invoke('mysql:marcarChequeRebotado', pagoId, rebotado),
      
      // Reportes
      getCuentaCorriente: (clienteId) => ipcRenderer.invoke('mysql:getCuentaCorriente', clienteId),
      getResumenGeneral: (fechaDesde, fechaHasta) => ipcRenderer.invoke('mysql:getResumenGeneral', fechaDesde, fechaHasta),
      
      // Saldos iniciales
      getSaldoInicialCliente: (clienteId) => ipcRenderer.invoke('mysql:getSaldoInicialCliente', clienteId),
      setSaldoInicialCliente: (data) => ipcRenderer.invoke('mysql:setSaldoInicialCliente', data),
      
      // Usuarios y autenticación
      login: (username, password) => ipcRenderer.invoke('mysql:login', { username, password }),
      getUsuarios: () => ipcRenderer.invoke('mysql:getUsuarios'),
      createUsuario: (usuario) => ipcRenderer.invoke('mysql:createUsuario', usuario),
      updateUsuario: (id, usuario) => ipcRenderer.invoke('mysql:updateUsuario', id, usuario),
      deleteUsuario: (id) => ipcRenderer.invoke('mysql:deleteUsuario', id),
      cambiarPasswordPrimeraVez: (userId, username, passwordNueva) => ipcRenderer.invoke('mysql:cambiarPasswordPrimeraVez', userId, username, passwordNueva),
      toggleUsuario: (params) => ipcRenderer.invoke('mysql:toggleUsuario', params),
      cambiarPassword: (params) => ipcRenderer.invoke('mysql:cambiarPassword', params),
      
      // Auditoría
      getAuditoria: (params) => ipcRenderer.invoke('mysql:getAuditoria', params),
      registrarAuditoria: (data) => ipcRenderer.invoke('mysql:registrarAuditoria', data),
      deleteAuditoria: (auditoriaId) => ipcRenderer.invoke('mysql:deleteAuditoria', auditoriaId),
      deleteAuditoriaBulk: (ids) => ipcRenderer.invoke('mysql:deleteAuditoriaBulk', ids),

      // Reporte de errores
      createErrorReport: (payload) => ipcRenderer.invoke('mysql:createErrorReport', payload),
      getErrorReports: (params) => ipcRenderer.invoke('mysql:getErrorReports', params),
      markErrorReportAsResolved: (id, meta) => ipcRenderer.invoke('mysql:markErrorReportAsResolved', id, meta),

      // Backups
      exportBackupSQL: (params) => ipcRenderer.invoke('mysql:exportBackupSQL', params)
    },
    
    // Actualizaciones automáticas
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    onUpdateStatus: (callback) => {
      ipcRenderer.on('update-status', (event, data) => callback(event, data));
    },
    removeUpdateStatusListener: (callback) => {
      ipcRenderer.removeAllListeners('update-status');
    },
    
    // Método invoke genérico para compatibilidad
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
  });
  console.log('electronAPI expuesto correctamente');
} catch (error) {
  console.error('Error exponiendo electronAPI:', error);
}

