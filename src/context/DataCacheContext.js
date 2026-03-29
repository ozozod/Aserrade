import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import * as db from '../services/databaseService';

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
          const data = await db.getClientes();
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
      const data = await db.getArticulos();
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
      const data = await db.getRemitos();
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
      const data = await db.getPagos();
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
      const data = await db.getResumenGeneral();
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
  // Nota: sincronización en tiempo real deshabilitada (la app refresca vía MySQL/IPC).

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

