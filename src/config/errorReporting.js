// Configuración para el sistema de reporte de errores - Se carga dinámicamente desde Electron
let errorReportingConfig = null;

// Función para inicializar configuración de reporte de errores
export const initErrorReportingConfig = async () => {
  if (errorReportingConfig) {
    return errorReportingConfig;
  }
  
  try {
    // Si estamos en Electron, obtener credenciales de forma segura
    if (window.electronAPI && window.electronAPI.getConfig) {
      try {
        const config = await window.electronAPI.getConfig();
        if (config && config.errorReporting && config.errorReporting.url && config.errorReporting.anonKey) {
          errorReportingConfig = {
            supabaseUrl: String(config.errorReporting.url),
            supabaseKey: String(config.errorReporting.anonKey),
            enabled: config.errorReporting.enabled !== false,
            tableName: 'error_reports'
          };
          return errorReportingConfig;
        }
      } catch (configError) {
        console.error('Error obteniendo configuración de errores desde Electron:', configError);
        // Continuar con fallback
      }
    }
    
    // Fallback: usar valores por defecto solo en desarrollo web
    if (process.env.NODE_ENV === 'development' && !window.electronAPI) {
      errorReportingConfig = {
        supabaseUrl: 'https://sunwgbrfumgfurmwjqkb.supabase.co',
        supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1bndnYnJmdW1nZnVybXdqcWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NzE3MzMsImV4cCI6MjA3OTI0NzczM30.jqWZTJx-i-GJllMCuEKEPlIAQIIeErrWBAc1257p1i8',
        enabled: true,
        tableName: 'error_reports'
      };
      return errorReportingConfig;
    }
    
    // En producción sin Electron, deshabilitar
    errorReportingConfig = {
      enabled: false,
      tableName: 'error_reports'
    };
    return errorReportingConfig;
  } catch (error) {
    console.error('Error inicializando configuración de reporte de errores:', error);
    return {
      enabled: false,
      tableName: 'error_reports'
    };
  }
};

// Exportar getter para la configuración
export const getErrorReportingConfig = () => {
  return errorReportingConfig;
};

// NO inicializar automáticamente - se inicializará cuando se necesite
// Esto evita problemas de timing con Electron IPC

