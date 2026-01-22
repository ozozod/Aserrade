import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase - Se carga dinámicamente desde Electron
let supabaseClient = null;

// Función para inicializar Supabase con credenciales desde Electron
export const initSupabase = async () => {
  if (supabaseClient) {
    return supabaseClient;
  }
  
  try {
    // Si estamos en Electron, obtener credenciales de forma segura
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.getConfig) {
      try {
        const config = await window.electronAPI.getConfig();
        if (config && config.supabase && config.supabase.url && config.supabase.anonKey) {
          supabaseClient = createClient(config.supabase.url, config.supabase.anonKey);
          supabase = supabaseClient; // Actualizar exportación
          return supabaseClient;
        }
      } catch (configError) {
        console.error('Error obteniendo configuración desde Electron:', configError);
        // Continuar con fallback
      }
    }
    
    // Fallback: usar valores por defecto solo en desarrollo web
    if (process.env.NODE_ENV === 'development' && (!window || !window.electronAPI)) {
      const SUPABASE_URL = 'https://uoisgayimsbqugablshq.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaXNnYXlpbXNicXVnYWJsc2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDE3MjEsImV4cCI6MjA3OTIxNzcyMX0.Aswdut5lDyocIqyfksjTXmi_CaUevaAAGIv_kv7ygew';
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      supabase = supabaseClient; // Actualizar exportación
      return supabaseClient;
    }
    
    throw new Error('No se pudieron cargar las credenciales de Supabase');
  } catch (error) {
    console.error('Error inicializando Supabase:', error);
    throw error;
  }
};

// Exportar cliente - se inicializa automáticamente
// Crear un objeto placeholder que se reemplazará cuando se inicialice
export let supabase = null;

// Función para verificar conexión
export const testConnection = async () => {
  try {
    const client = supabaseClient || await initSupabase();
    if (!client) {
      throw new Error('Supabase no está inicializado');
    }
    const { data, error } = await client.from('clientes').select('count').limit(1);
    if (error) throw error;
    return { success: true, message: 'Conectado a Supabase correctamente' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

