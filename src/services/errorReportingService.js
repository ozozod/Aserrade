import { createClient } from '@supabase/supabase-js';
import { getErrorReportingConfig, initErrorReportingConfig } from '../config/errorReporting';

// Cliente de Supabase para reporte de errores (se inicializa dinámicamente)
let supabaseErrorClient = null;

// Función para obtener el cliente de Supabase para errores
const getErrorClient = async () => {
  if (supabaseErrorClient) {
    return supabaseErrorClient;
  }
  
  const config = await initErrorReportingConfig();
  if (config && config.enabled && config.supabaseUrl && config.supabaseKey) {
    supabaseErrorClient = createClient(config.supabaseUrl, config.supabaseKey);
    return supabaseErrorClient;
  }
  
  return null;
};

/**
 * Reporta un error a Supabase
 * @param {Error} error - El objeto Error
 * @param {Object} context - Contexto adicional (componente, props, etc.)
 * @returns {Promise<void>}
 */
export const reportError = async (error, context = {}) => {
  try {
    const config = await initErrorReportingConfig();
    
    // Si el sistema está deshabilitado, no hacer nada
    if (!config || !config.enabled) {
      console.log('Error reporting está deshabilitado');
      return;
    }

    const client = await getErrorClient();
    if (!client) {
      console.log('No se pudo inicializar el cliente de reporte de errores');
      return;
    }
    // Obtener información del error
    const errorMessage = error?.message || 'Error desconocido';
    const errorStack = error?.stack || '';
    const errorType = error?.name || 'Error';
    
    // Obtener información del contexto
    const componentName = context?.componentName || 'Unknown';
    const url = window.location?.href || 'Unknown';
    const userAgent = navigator?.userAgent || 'Unknown';
    
    // Obtener versión de la app (si está disponible)
    const appVersion = process.env.REACT_APP_VERSION || '1.0.0';
    
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

    // Insertar en Supabase
    const { data, error: insertError } = await client
      .from(config.tableName)
      .insert([
        {
          error_message: errorMessage,
          error_stack: errorStack,
          error_type: errorType,
          component_name: componentName,
          user_agent: userAgent,
          url: url,
          app_version: appVersion,
          additional_data: additionalData
        }
      ]);

    if (insertError) {
      console.error('Error al reportar error a Supabase:', insertError);
    } else {
      console.log('Error reportado exitosamente a Supabase');
    }
  } catch (reportingError) {
    // No queremos que el sistema de reporte de errores cause más errores
    console.error('Error crítico en el sistema de reporte de errores:', reportingError);
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
  await reportError(error, context);
};

/**
 * Obtiene todos los errores no resueltos
 * @returns {Promise<Array>}
 */
export const getUnresolvedErrors = async () => {
  try {
    const config = await initErrorReportingConfig();
    if (!config || !config.enabled) {
      return [];
    }
    
    const client = await getErrorClient();
    if (!client) {
      return [];
    }
    
    const { data, error } = await client
      .from(config.tableName)
      .select('*')
      .eq('resolved', false)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error al obtener errores:', error);
      return [];
    }

    return data || [];
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
    const config = await initErrorReportingConfig();
    if (!config || !config.enabled) {
      return false;
    }
    
    const client = await getErrorClient();
    if (!client) {
      return false;
    }
    
    const { error } = await client
      .from(config.tableName)
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        notes: notes
      })
      .eq('id', errorId);

    if (error) {
      console.error('Error al marcar error como resuelto:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error crítico al marcar error como resuelto:', err);
    return false;
  }
};

