// Reporte de errores (Hostinger MySQL via IPC)
// Se guarda en tabla `error_reports` para que se pueda ver desde la app (Admin).

/**
 * Reporta un error a MySQL (tabla `error_reports`) vía Electron IPC.
 * @param {Error} error - El objeto Error
 * @param {Object} context - Contexto adicional (componente, props, etc.)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const reportError = async (error, context = {}) => {
  try {
    // Solo funciona en Electron (IPC a MySQL)
    if (!window?.electronAPI?.mysql?.createErrorReport) {
      console.warn('Reporte de errores no disponible (no Electron)');
      return { success: false, error: 'NO_ELECTRON' };
    }
    // Obtener información del error
    const errorMessage = error?.message || 'Error desconocido';
    const errorStack = error?.stack || '';
    const errorType = error?.name || 'Error';
    
    // Obtener información del contexto
    const componentName = context?.componentName || 'Unknown';
    const url = window.location?.href || 'Unknown';
    const userAgent = navigator?.userAgent || 'Unknown';
    
    // Versión: en Electron viene de package.json (app.getVersion)
    let appVersion = process.env.REACT_APP_VERSION || '1.0.0';
    try {
      if (window?.electronAPI?.getAppVersion) {
        const meta = await window.electronAPI.getAppVersion();
        if (meta?.version) appVersion = String(meta.version);
      }
    } catch (_) { /* ignorar */ }
    
    // Preparar datos adicionales
    const additionalData = {
      ...context,
      timestamp: new Date().toISOString(),
      platform: navigator?.platform || 'Unknown',
      language: navigator?.language || 'Unknown',
      screenWidth: window?.screen?.width || 0,
      screenHeight: window?.screen?.height || 0,
      windowWidth: window?.innerWidth || 0,
      windowHeight: window?.innerHeight || 0
    };

    const res = await window.electronAPI.mysql.createErrorReport({
      error_message: errorMessage,
      error_stack: errorStack,
      error_type: errorType,
      component_name: componentName,
      user_agent: userAgent,
      url: url,
      app_version: appVersion,
      additional_data: additionalData
    });
    if (!res?.success) {
      console.error('Error al guardar reporte de error en MySQL:', res);
      return { success: false, error: res?.error || 'MYSQL_INSERT_FAILED' };
    }
    return { success: true, id: res.id };
  } catch (reportingError) {
    // No queremos que el sistema de reporte de errores cause más errores
    console.error('Error crítico en el sistema de reporte de errores:', reportingError);
    return { success: false, error: reportingError?.message || String(reportingError) };
  }
};

/**
 * Reporta un error manualmente (para uso en catch blocks)
 * @param {string} message - Mensaje del error
 * @param {Object} context - Contexto adicional
 * @returns {Promise<void>}
 */
export const reportManualError = async (message, context = {}) => {
  const error = new Error(message);
  error.name = context.errorType || 'ManualError';
  return await reportError(error, context);
};

/**
 * Obtiene todos los errores no resueltos
 * @returns {Promise<Array>}
 */
export const getUnresolvedErrors = async () => {
  try {
    if (!window?.electronAPI?.mysql?.getErrorReports) return [];
    return await window.electronAPI.mysql.getErrorReports({ resolved: false, limit: 100 });
  } catch (err) {
    console.error('Error crítico al obtener errores:', err);
    return [];
  }
};

/**
 * Marca un error como resuelto
 * @param {number} errorId - ID del error
 * @param {string} resolvedBy - Quién resolvió el error
 * @param {string} notes - Notas sobre la resolución
 * @returns {Promise<boolean>}
 */
export const markErrorAsResolved = async (errorId, resolvedBy = 'System', notes = '') => {
  try {
    if (!window?.electronAPI?.mysql?.markErrorReportAsResolved) return false;
    const res = await window.electronAPI.mysql.markErrorReportAsResolved(errorId, {
      resolved_by: resolvedBy,
      notes
    });
    return !!res?.success;
  } catch (err) {
    console.error('Error crítico al marcar error como resuelto:', err);
    return false;
  }
};

