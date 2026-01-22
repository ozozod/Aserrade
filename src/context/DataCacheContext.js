import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import * as supabaseService from '../services/databaseService';
import { supabase, initSupabase } from '../config/supabase';

const DataCacheContext = createContext();

export const useDataCache = () => {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error('useDataCache debe usarse dentro de DataCacheProvider');
  }
  return context;
};

export const DataCacheProvider = ({ children }) => {
  // Estados para caché de datos
  const [clientes, setClientes] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [remitos, setRemitos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [resumen, setResumen] = useState(null);
  
  // Estados de carga
  const [loading, setLoading] = useState({
    clientes: false,
    articulos: false,
    remitos: false,
    pagos: false,
    resumen: false
  });
  
  // Estados de última actualización
  const [lastUpdate, setLastUpdate] = useState({
    clientes: null,
    articulos: null,
    remitos: null,
    pagos: null,
    resumen: null
  });

  // Función para cargar clientes
  const loadClientes = useCallback(async (force = false) => {
    // Usar estado funcional para evitar dependencias que cambien
    setLoading(prev => {
      // Si ya hay datos y no es forzado y no está cargando, no recargar
      if (clientes.length > 0 && !force && !prev.clientes) {
        return prev;
      }
      
      // Iniciar carga
      (async () => {
        try {
          const data = await supabaseService.getClientes();
          setClientes(data);
          setLastUpdate(prevUpdate => ({ ...prevUpdate, clientes: new Date() }));
        } catch (error) {
          console.error('Error cargando clientes:', error);
          throw error;
        } finally {
          setLoading(prevLoading => ({ ...prevLoading, clientes: false }));
        }
      })();
      
      return { ...prev, clientes: true };
    });
    
    // Retornar datos actuales mientras carga
    return clientes;
  }, []); // Sin dependencias para evitar recreaciones constantes

  // Función para cargar artículos
  const loadArticulos = useCallback(async (force = false) => {
    if (articulos.length > 0 && !force && !loading.articulos) {
      return articulos;
    }
    
    setLoading(prev => ({ ...prev, articulos: true }));
    try {
      const data = await supabaseService.getArticulos();
      setArticulos(data);
      setLastUpdate(prev => ({ ...prev, articulos: new Date() }));
      return data;
    } catch (error) {
      console.error('Error cargando artículos:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, articulos: false }));
    }
  }, [articulos, loading.articulos]);

  // Refs para evitar múltiples cargas simultáneas y bucles infinitos
  const cargandoRemitosRef = useRef(false);
  const remitosRef = useRef([]);
  
  // Actualizar ref cuando cambie el estado
  useEffect(() => {
    remitosRef.current = remitos;
  }, [remitos]);
  
  // Función para cargar remitos
  const loadRemitos = useCallback(async (force = false) => {
    // Si ya está cargando, retornar los datos actuales del ref
    if (cargandoRemitosRef.current) {
      return remitosRef.current;
    }
    
    // Si ya hay datos y no es forzado, retornar inmediatamente
    if (remitosRef.current.length > 0 && !force) {
      return remitosRef.current;
    }
    
    // Marcar como cargando
    cargandoRemitosRef.current = true;
    setLoading(prev => ({ ...prev, remitos: true }));
    
    try {
      const data = await supabaseService.getRemitos();
      remitosRef.current = data; // Actualizar ref inmediatamente
      setRemitos(data);
      setLastUpdate(prev => ({ ...prev, remitos: new Date() }));
      return data;
    } catch (error) {
      console.error('Error cargando remitos:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, remitos: false }));
      cargandoRemitosRef.current = false;
    }
  }, []); // Sin dependencias - usar refs para estado interno

  // Función para cargar pagos
  const loadPagos = useCallback(async (force = false) => {
    if (pagos.length > 0 && !force && !loading.pagos) {
      return pagos;
    }
    
    setLoading(prev => ({ ...prev, pagos: true }));
    try {
      const data = await supabaseService.getPagos();
      setPagos(data);
      setLastUpdate(prev => ({ ...prev, pagos: new Date() }));
      return data;
    } catch (error) {
      console.error('Error cargando pagos:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, pagos: false }));
    }
  }, [pagos, loading.pagos]);

  // Función para cargar resumen
  const loadResumen = useCallback(async (force = false) => {
    if (resumen && !force && !loading.resumen) {
      return resumen;
    }
    
    setLoading(prev => ({ ...prev, resumen: true }));
    try {
      const data = await supabaseService.getResumenGeneral();
      setResumen(data);
      setLastUpdate(prev => ({ ...prev, resumen: new Date() }));
      return data;
    } catch (error) {
      console.error('Error cargando resumen:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, resumen: false }));
    }
  }, [resumen, loading.resumen]);

  // Función para invalidar caché COMPLETAMENTE (marcar como obsoleto y limpiar localStorage)
  const invalidateCache = useCallback((type) => {
    console.log(`🧹 Invalidando caché: ${type}`);
    
    // Limpiar localStorage relacionado
    const limpiarLocalStorage = (prefijo) => {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(prefijo) || key.includes('cache') || key.includes('resumen')) {
          localStorage.removeItem(key);
        }
      });
    };
    
    switch (type) {
      case 'clientes':
        setClientes([]);
        setLastUpdate(prev => ({ ...prev, clientes: null }));
        limpiarLocalStorage('clientes');
        break;
      case 'articulos':
        setArticulos([]);
        setLastUpdate(prev => ({ ...prev, articulos: null }));
        limpiarLocalStorage('articulos');
        break;
      case 'remitos':
        setRemitos([]);
        setLastUpdate(prev => ({ ...prev, remitos: null }));
        limpiarLocalStorage('remitos');
        break;
      case 'pagos':
        setPagos([]);
        setLastUpdate(prev => ({ ...prev, pagos: null }));
        limpiarLocalStorage('pagos');
        break;
      case 'resumen':
        setResumen(null);
        setLastUpdate(prev => ({ ...prev, resumen: null }));
        limpiarLocalStorage('resumen');
        break;
      case 'all':
        setClientes([]);
        setArticulos([]);
        setRemitos([]);
        setPagos([]);
        setResumen(null);
        setLastUpdate({
          clientes: null,
          articulos: null,
          remitos: null,
          pagos: null,
          resumen: null
        });
        // Limpiar TODO el localStorage de caché
        limpiarLocalStorage('cache');
        limpiarLocalStorage('resumen');
        limpiarLocalStorage('clientes');
        limpiarLocalStorage('articulos');
        limpiarLocalStorage('remitos');
        limpiarLocalStorage('pagos');
        break;
    }
  }, []);

  // Función para recargar datos relacionados cuando se modifica algo
  const refreshRelated = useCallback((type) => {
    // Cuando se modifica un remito, también invalidar pagos y resumen
    if (type === 'remitos') {
      invalidateCache('pagos');
      invalidateCache('resumen');
    }
    // Cuando se modifica un pago, invalidar remitos (para actualizar estados) y resumen
    if (type === 'pagos') {
      invalidateCache('remitos');
      invalidateCache('resumen');
    }
    // Cuando se modifica un cliente, invalidar remitos y pagos
    if (type === 'clientes') {
      invalidateCache('remitos');
      invalidateCache('pagos');
      invalidateCache('resumen');
    }
    // Cuando se modifica un artículo, invalidar remitos
    if (type === 'articulos') {
      invalidateCache('remitos');
    }
  }, [invalidateCache]);

  // Referencias para los listeners de Realtime
  const channelsRef = useRef({
    clientes: null,
    articulos: null,
    remitos: null,
    pagos: null
  });
  
  // Ref para controlar recargas y evitar loops
  const recargandoRef = useRef({});
  const debounceTimersRef = useRef({});
  
  // Función helper para recargar con debounce (usa las funciones de carga definidas arriba)
  const recargarConDebounce = useCallback((tipo, fnLoad, delay = 2000) => {
    // Si ya está recargando, ignorar
    if (recargandoRef.current[tipo]) {
      return;
    }
    
    // Limpiar timer anterior
    if (debounceTimersRef.current[tipo]) {
      clearTimeout(debounceTimersRef.current[tipo]);
    }
    
    // Establecer que está recargando
    recargandoRef.current[tipo] = true;
    
    // Recargar después del delay
    debounceTimersRef.current[tipo] = setTimeout(async () => {
      try {
        await fnLoad(true);
      } catch (error) {
        console.error(`Error recargando ${tipo}:`, error);
      } finally {
        // Liberar el flag después de un pequeño delay adicional
        setTimeout(() => {
          recargandoRef.current[tipo] = false;
        }, 500);
      }
    }, delay);
  }, []); // Sin dependencias porque fnLoad se pasa como parámetro

  // Configurar listeners de Supabase Realtime para sincronización automática
  useEffect(() => {
    // Esperar a que Supabase esté inicializado
    const setupRealtime = async () => {
      // Si supabase no está inicializado, intentar inicializarlo
      if (!supabase) {
        try {
          await initSupabase();
        } catch (error) {
          console.error('Error inicializando Supabase para Realtime:', error);
          return;
        }
      }
      
      // Verificar nuevamente después de intentar inicializar
      if (!supabase) {
        console.warn('Supabase no está disponible para Realtime');
        return;
      }

    // Listener para clientes
    const clientesChannel = supabase
      .channel('clientes-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'clientes' },
        (payload) => {
          console.log('Cambio detectado en clientes:', payload);
          // Invalidar caché para forzar recarga
          invalidateCache('clientes');
          invalidateCache('remitos');
          invalidateCache('pagos');
          invalidateCache('resumen');
          refreshRelated('clientes');
          // Recargar con debounce para evitar loops
          recargarConDebounce('clientes', loadClientes, 2000);
          recargarConDebounce('remitos', loadRemitos, 2500);
          recargarConDebounce('pagos', loadPagos, 3000);
        }
      )
      .subscribe();

    // Listener para artículos
    const articulosChannel = supabase
      .channel('articulos-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'articulos' },
        (payload) => {
          console.log('Cambio detectado en artículos:', payload);
          invalidateCache('articulos');
          invalidateCache('remitos');
          refreshRelated('articulos');
          // Recargar con debounce para evitar loops
          recargarConDebounce('articulos', loadArticulos, 2000);
          recargarConDebounce('remitos', loadRemitos, 2500);
        }
      )
      .subscribe();

    // Listener para remitos
    const remitosChannel = supabase
      .channel('remitos-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'remitos' },
        (payload) => {
          console.log('Cambio detectado en remitos:', payload);
          invalidateCache('remitos');
          invalidateCache('pagos');
          invalidateCache('resumen');
          refreshRelated('remitos');
          // Recargar con debounce para evitar loops
          recargarConDebounce('remitos', loadRemitos, 2000);
          recargarConDebounce('pagos', loadPagos, 2500);
        }
      )
      .subscribe();

    // Listener para pagos
    const pagosChannel = supabase
      .channel('pagos-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pagos' },
        (payload) => {
          console.log('Cambio detectado en pagos:', payload);
          invalidateCache('pagos');
          invalidateCache('remitos');
          invalidateCache('resumen');
          refreshRelated('pagos');
          // Recargar con debounce para evitar loops
          recargarConDebounce('pagos', loadPagos, 2000);
          recargarConDebounce('remitos', loadRemitos, 2500);
        }
      )
      .subscribe();

      // Guardar referencias para limpiar al desmontar
      channelsRef.current = {
        clientes: clientesChannel,
        articulos: articulosChannel,
        remitos: remitosChannel,
        pagos: pagosChannel
      };
    };
    
    // Ejecutar setup con un pequeño delay para asegurar que Supabase esté listo
    const timeoutId = setTimeout(() => {
      setupRealtime();
    }, 1000);

    // Limpiar listeners al desmontar
    return () => {
      clearTimeout(timeoutId);
      if (supabase && channelsRef.current) {
        if (channelsRef.current.clientes) {
          supabase.removeChannel(channelsRef.current.clientes);
        }
        if (channelsRef.current.articulos) {
          supabase.removeChannel(channelsRef.current.articulos);
        }
        if (channelsRef.current.remitos) {
          supabase.removeChannel(channelsRef.current.remitos);
        }
        if (channelsRef.current.pagos) {
          supabase.removeChannel(channelsRef.current.pagos);
        }
      }
    };
  }, []); // Solo ejecutar una vez al montar

  const value = {
    // Datos en caché
    clientes,
    articulos,
    remitos,
    pagos,
    resumen,
    
    // Estados de carga
    loading,
    
    // Última actualización
    lastUpdate,
    
    // Funciones de carga
    loadClientes,
    loadArticulos,
    loadRemitos,
    loadPagos,
    loadResumen,
    
    // Funciones de invalidación
    invalidateCache,
    refreshRelated,
    
    // Funciones para actualizar datos directamente (sin recargar)
    setClientes,
    setArticulos,
    setRemitos,
    setPagos,
    setResumen
  };

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  );
};

