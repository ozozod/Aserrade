const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const isDev = require('electron-is-dev');
const sharp = require('sharp');
const log = require('electron-log');
const AppUpdater = require('./autoUpdater');

let mainWindow;
let appUpdater;

// Base de datos central: MySQL (Hostinger) vía IPC (`mysql:*`). Imágenes: base64/data URL en MySQL.

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev, // Habilitar seguridad en producción
      devTools: false, // NUNCA permitir DevTools (ni en desarrollo)
      enableRemoteModule: false,
      sandbox: true,
      // Asegurar que localStorage persista entre sesiones
      partition: 'persist:aserradero-session'
    },
    icon: path.join(__dirname, isDev ? 'build/icon.png' : 'build/icon.ico'),
    autoHideMenuBar: true, // SIEMPRE ocultar menú
    frame: true,
    titleBarStyle: 'default',
    show: false // No mostrar hasta que esté listo
  });
  
  // Ocultar menú completamente
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setMenu(null);

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, './build/index.html')}`;
  
  // NUNCA abrir DevTools, ni siquiera en desarrollo (solo si se fuerza explícitamente)
  if (process.env.ENABLE_DEVTOOLS === 'true' && isDev) {
    mainWindow.webContents.openDevTools();
  }
  
  // Bloquear DevTools SIEMPRE (excepto si se fuerza explícitamente)
  if (process.env.ENABLE_DEVTOOLS !== 'true') {
    // Bloquear acceso por teclado - TODOS los métodos posibles
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // Bloquear F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+Shift+U
      if (input.key === 'F12' || 
          input.key === 'F11' ||
          (input.control && input.shift && (input.key === 'I' || input.key === 'J' || input.key === 'C' || input.key === 'U' || input.key === 'K')) ||
          (input.control && input.key === 'U') ||
          (input.control && input.key === 'S') ||
          (input.control && input.key === 'P')) {
        event.preventDefault();
        return false;
      }
    });
    
    // Bloquear menú contextual (click derecho)
    mainWindow.webContents.on('context-menu', (event) => {
      event.preventDefault();
      return false;
    });
    
    // Cerrar DevTools inmediatamente si se abren de alguna manera
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
      // También intentar cerrar la ventana si alguien logra abrir DevTools
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.closeDevTools();
        }
      }, 100);
    });
    
    // Bloquear cualquier intento de inspección
    mainWindow.webContents.on('will-attach-webview', (event) => {
      event.preventDefault();
    });
    
    // Bloquear navegación a URLs sospechosas
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      if (parsedUrl.protocol === 'chrome-devtools:' || parsedUrl.protocol === 'devtools:') {
        event.preventDefault();
      }
    });
    
    // Bloquear nuevas ventanas (podrían ser DevTools)
    mainWindow.webContents.setWindowOpenHandler(() => {
      return { action: 'deny' };
    });
  }
  
  console.log('Cargando URL:', startUrl);
  console.log('Preload path:', path.join(__dirname, 'preload.js'));
  console.log('Is Dev:', isDev);
  console.log('__dirname:', __dirname);
  
  // Esperar a que el contenido esté listo
  mainWindow.webContents.once('did-finish-load', () => {
    if (isDev) {
      console.log('✓ Window loaded');
      // Verificar que electronAPI esté disponible solo en desarrollo
      mainWindow.webContents.executeJavaScript(`
        console.log('Verificando electronAPI en window...');
        console.log('window.electronAPI disponible:', typeof window.electronAPI !== 'undefined');
        if (window.electronAPI) {
          console.log('✓ electronAPI está disponible');
        } else {
          console.error('✗ electronAPI NO está disponible');
        }
      `).catch(err => console.error('Error ejecutando script de verificación:', err));
    }
    
    // Bloquear inspección de elementos SIEMPRE (excepto si se fuerza DevTools)
    // Esperar un poco para que React se inicialice primero
    setTimeout(() => {
      if (process.env.ENABLE_DEVTOOLS !== 'true') {
        mainWindow.webContents.executeJavaScript(`
          // Bloquear TODOS los atajos de teclado posibles
          document.addEventListener('keydown', function(e) {
            // Bloquear F12, F11
            if (e.key === 'F12' || e.key === 'F11') {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              return false;
            }
            // Bloquear Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+Shift+U, Ctrl+Shift+K
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'U' || e.key === 'K')) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              return false;
            }
            // Bloquear Ctrl+U (ver código fuente), Ctrl+S (guardar), Ctrl+P (imprimir)
            if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P')) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              return false;
            }
          }, true);
          
          // Bloquear click derecho completamente
          document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
          }, true);
          
          // BLOQUEADO: Este código bloqueaba los inputs después de cerrar modales en Electron
          // Se reemplaza por CSS user-select: none que es más seguro y no interfiere con eventos
          // El CSS ya está configurado en src/index.css
          // document.addEventListener('selectstart', function(e) {
          //   const elemento = e.target;
          //   if (elemento.tagName === 'INPUT' || 
          //       elemento.tagName === 'TEXTAREA' || 
          //       elemento.tagName === 'SELECT' ||
          //       elemento.closest('input') || 
          //       elemento.closest('textarea') ||
          //       elemento.closest('select')) {
          //     return true;
          //   }
          //   e.preventDefault();
          //   return false;
          // });
          
          // NO bloquear console completamente - solo en producción
          // Bloquear console puede interferir con el IPC y la inicialización
        `).catch(err => {
          // Silenciar errores de ejecución de script
          if (isDev) {
            console.error('Error ejecutando script de bloqueo:', err);
          }
        });
      }
    }, 2000); // Esperar 2 segundos para que React se inicialice
  });
  
  // Mostrar ventana solo cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  
  mainWindow.loadURL(startUrl);
  
  // Manejo de errores de carga
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Error cargando:', errorCode, errorDescription, validatedURL);
    if (!isDev) {
      // En producción, mostrar error en consola
      console.error('Error al cargar la aplicación. Verificando rutas...');
      console.error('Ruta esperada:', path.join(__dirname, './build/index.html'));
      console.error('¿Existe index.html?:', fs.existsSync(path.join(__dirname, './build/index.html')));
    }
  });

  // Limpiar sesión cuando se cierra la ventana (sin hacer logout)
  mainWindow.on('close', (event) => {
    // Limpiar localStorage de la sesión del usuario antes de cerrar
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        // Usar executeJavaScript de forma síncrona si es posible
        mainWindow.webContents.executeJavaScript(`
          localStorage.removeItem('aserradero_usuario');
          console.log('Sesión limpiada al cerrar la app');
        `).catch(err => console.error('Error limpiando sesión:', err));
      } catch (err) {
        console.error('Error al limpiar sesión:', err);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  
  // Inicializar sistema de actualizaciones cuando la ventana esté lista
  // Solo verificar actualizaciones en producción
  if (!isDev) {
    log.info('🚀 App iniciada - Versión:', app.getVersion());
    
    // Esperar a que la ventana esté lista
    if (mainWindow) {
      mainWindow.webContents.once('did-finish-load', async () => {
        // Esperar un momento para que React se inicialice
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Inicializar AppUpdater
        appUpdater = new AppUpdater(mainWindow);
        
        // Verificar actualizaciones INMEDIATAMENTE al iniciar
        // Esto bloqueará hasta que termine la verificación/actualización
        try {
          log.info('🔍 Iniciando verificación de actualizaciones...');
          await appUpdater.checkForUpdatesOnStart();
          log.info('✅ Verificación de actualizaciones completada');
        } catch (error) {
          log.error('❌ Error verificando actualizaciones al iniciar:', error);
          // Enviar evento de error al renderer para que continúe
          if (appUpdater) {
            appUpdater.sendStatusToWindow('error', { 
              message: error.message || 'Error al verificar actualizaciones',
              code: error.code || 'UNKNOWN'
            });
          }
        }
        
        // Verificar actualizaciones cada 6 horas (en segundo plano)
        setInterval(() => {
          if (appUpdater) {
            appUpdater.checkForUpdatesQuietly();
          }
        }, 6 * 60 * 60 * 1000); // 6 horas
      });
    }
  } else {
    log.info('🔧 Modo desarrollo - Actualizaciones automáticas deshabilitadas');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Limpiar sesión cuando se cierra la aplicación completamente
app.on('will-quit', (event) => {
  // Limpiar solo el item de sesión del usuario (no todo el localStorage)
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      // Ejecutar de forma síncrona antes de cerrar
      mainWindow.webContents.executeJavaScript(`
        localStorage.removeItem('aserradero_usuario');
      `).catch(() => {
        // Si falla, intentar limpiar usando la sesión de Electron
        const sesion = session.fromPartition('persist:aserradero-session');
        sesion.clearStorageData({
          storages: ['localstorage']
        }).catch(err => console.error('Error limpiando sesión:', err));
      });
    } catch (err) {
      console.error('Error al limpiar sesión:', err);
    }
  } else {
    // Si la ventana ya está cerrada, limpiar directamente usando la sesión
    const sesion = session.fromPartition('persist:aserradero-session');
    sesion.clearStorageData({
      storages: ['localstorage']
    }).catch(err => console.error('Error limpiando sesión:', err));
  }
});

// IPC principal: MySQL + utilidades de Electron (archivos, etc.)

// Leer configuración de credenciales desde archivo externo
let config = null;
const configPath = path.join(__dirname, 'config.json');
const configPathExample = path.join(__dirname, 'config.json.example');

// Valores por defecto (sin secretos). `config.json` es opcional para futuras extensiones.
const defaultConfig = {
  app: {
    name: 'Aserradero App'
  }
};

function loadConfig() {
  try {
    // 1. Intentar cargar config.json (prioridad)
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configData);
      console.log('✓ Configuración cargada desde config.json');
      return config;
    }
    
    // 2. Intentar cargar config.json.example (fallback)
    if (fs.existsSync(configPathExample)) {
      const configData = fs.readFileSync(configPathExample, 'utf8');
      config = JSON.parse(configData);
      console.log('✓ Configuración cargada desde config.json.example');
      return config;
    }
    
    // 3. Usar valores por defecto (último recurso)
    console.warn('⚠ config.json y config.json.example no encontrados, usando valores por defecto');
    config = defaultConfig;
    return config;
  } catch (error) {
    console.error('Error cargando configuración:', error);
    // En caso de error, usar valores por defecto
    console.warn('⚠ Usando valores por defecto debido a error al cargar configuración');
    config = defaultConfig;
    return config;
  }
}

// Cargar configuración al iniciar
loadConfig();

// IPC handler para obtener configuración de forma segura
ipcMain.handle('config:get', async () => {
  try {
    if (!config || typeof config !== 'object') {
      config = loadConfig();
    }
    if (!config || typeof config !== 'object') {
      config = defaultConfig;
    }

    // No exponer secretos.
    return {
      app: {
        name: String((config.app && config.app.name) || defaultConfig.app.name)
      }
    };
  } catch (error) {
    console.error('Error en config:get:', error);
    return {
      app: { name: defaultConfig.app.name }
    };
  }
});

// Manejo de archivos (fotos de remitos)
ipcMain.handle('file:selectImage', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Imágenes', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('file:compressImage', async (event, sourcePath, remitoId) => {
  try {
    // Verificar que el archivo existe y es válido
    if (!sourcePath || !fs.existsSync(sourcePath)) {
      console.warn('Archivo de imagen no existe o no se proporcionó:', sourcePath);
      return null; // Retornar null en vez de lanzar error
    }
    
    // Verificar que es un archivo de imagen válido
    try {
      const metadata = await sharp(sourcePath).metadata();
      if (!metadata || !metadata.format) {
        console.warn('Archivo no es una imagen válida:', sourcePath);
        return null;
      }
    } catch (sharpError) {
      console.warn('Error verificando imagen:', sharpError.message);
      return null; // Si no es una imagen válida, retornar null
    }
    
    const userDataPath = app.getPath('userData');
    const tempDir = path.join(userDataPath, 'temp_imagenes');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Usar siempre JPG para ahorrar espacio y comprimir agresivamente
    const tempPath = path.join(tempDir, `remito_${remitoId}_${Date.now()}.jpg`);
    
    // Comprimir y convertir la imagen a JPG con calidad 70% (más compresión)
    // Máximo 1600px de ancho para reducir aún más el tamaño
    await sharp(sourcePath)
      .resize(1600, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ 
        quality: 70, // Calidad más baja para ahorrar más espacio
        progressive: true,
        mozjpeg: true // Mejor compresión
      })
      .toFile(tempPath);
    
    // Leer el archivo comprimido como buffer para serializarlo a base64 (IPC)
    const imageBuffer = fs.readFileSync(tempPath);
    
    // Obtener el tamaño del archivo
    const stats = fs.statSync(tempPath);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);
    console.log(`Imagen comprimida: ${fileSizeInKB} KB`);
    
    // Convertir Buffer a base64 para serialización a través de IPC
    const base64Image = imageBuffer.toString('base64');
    
    // Eliminar el archivo temporal después de leerlo
    fs.unlinkSync(tempPath);
    
    // Retornar el buffer como base64 y el nombre del archivo
    return {
      buffer: base64Image, // Base64 para serialización IPC
      filename: `remito_${remitoId}.jpg`,
      mimeType: 'image/jpeg'
    };
  } catch (error) {
    console.error('Error comprimiendo imagen:', error);
    throw error;
  }
});

// Las imágenes se persisten como data URL/base64 en MySQL (no hay storage externo obligatorio)

// ============ MYSQL HOSTINGER SERVICE ============
const mysqlService = require('./database/mysqlService');

// Test de conexión MySQL
ipcMain.handle('mysql:testConnection', async () => {
  return await mysqlService.testConnection();
});

// CLIENTES
ipcMain.handle('mysql:getClientes', async () => {
  return await mysqlService.getClientes();
});
ipcMain.handle('mysql:getCliente', async (event, id) => {
  return await mysqlService.getCliente(id);
});
ipcMain.handle('mysql:createCliente', async (event, cliente, saldoInicialData) => {
  return await mysqlService.createCliente(cliente, saldoInicialData || null);
});
ipcMain.handle('mysql:updateCliente', async (event, id, cliente, saldoInicialData) => {
  return await mysqlService.updateCliente(id, cliente, saldoInicialData || null);
});
ipcMain.handle('mysql:deleteCliente', async (event, id) => {
  return await mysqlService.deleteCliente(id);
});

// ARTICULOS
ipcMain.handle('mysql:getArticulos', async (event, clienteId) => {
  return await mysqlService.getArticulos(clienteId);
});
ipcMain.handle('mysql:createArticulo', async (event, articulo) => {
  return await mysqlService.createArticulo(articulo);
});
ipcMain.handle('mysql:updateArticulo', async (event, id, articulo) => {
  return await mysqlService.updateArticulo(id, articulo);
});
ipcMain.handle('mysql:deleteArticulo', async (event, id) => {
  return await mysqlService.deleteArticulo(id);
});

// REMITOS
ipcMain.handle('mysql:getRemitos', async (event, clienteId) => {
  return await mysqlService.getRemitos(clienteId);
});
ipcMain.handle('mysql:getRemito', async (event, id) => {
  return await mysqlService.getRemito(id);
});
ipcMain.handle('mysql:createRemito', async (event, remito) => {
  return await mysqlService.createRemito(remito);
});
ipcMain.handle('mysql:updateRemito', async (event, id, remito) => {
  return await mysqlService.updateRemito(id, remito);
});
ipcMain.handle('mysql:deleteRemito', async (event, id) => {
  return await mysqlService.deleteRemito(id);
});

// PAGOS
ipcMain.handle('mysql:getPagos', async (event, remitoId) => {
  return await mysqlService.getPagos(remitoId);
});
ipcMain.handle('mysql:createPago', async (event, pago) => {
  return await mysqlService.createPago(pago);
});
ipcMain.handle('mysql:createPagosBatch', async (event, pagos) => {
  return await mysqlService.createPagosBatch(pagos);
});
ipcMain.handle('mysql:updatePago', async (event, id, pago) => {
  return await mysqlService.updatePago(id, pago);
});
ipcMain.handle('mysql:deletePago', async (event, id) => {
  return await mysqlService.deletePago(id);
});
ipcMain.handle('mysql:marcarPagoComoCheque', async (event, pagoId, esCheque) => {
  try {
    const mysqlService = require('./database/mysqlService');
    return await mysqlService.marcarPagoComoCheque(pagoId, esCheque);
  } catch (error) {
    console.error('Error en marcarPagoComoCheque:', error);
    throw error;
  }
});

ipcMain.handle('mysql:marcarChequeRebotado', async (event, pagoId, rebotado) => {
  return await mysqlService.marcarChequeRebotado(pagoId, rebotado);
});
ipcMain.handle('mysql:recalcularEstadosRemitosCliente', async (event, clienteId) => {
  return await mysqlService.recalcularEstadosRemitosCliente(clienteId);
});

// REPORTES
ipcMain.handle('mysql:getCuentaCorriente', async (event, clienteId) => {
  return await mysqlService.getCuentaCorriente(clienteId);
});
ipcMain.handle('mysql:getResumenGeneral', async (event, fechaDesde, fechaHasta) => {
  return await mysqlService.getResumenGeneral(fechaDesde, fechaHasta);
});

// SALDOS INICIALES
ipcMain.handle('mysql:getSaldoInicialCliente', async (event, clienteId) => {
  return await mysqlService.getSaldoInicialCliente(clienteId);
});
ipcMain.handle('mysql:setSaldoInicialCliente', async (event, data) => {
  return await mysqlService.setSaldoInicialCliente(data);
});

// ============ USUARIOS Y AUDITORÍA ============
// Login
ipcMain.handle('mysql:login', async (event, { username, password }) => {
  return await mysqlService.login(username, password);
});

// Usuarios
ipcMain.handle('mysql:getUsuarios', async () => {
  return await mysqlService.getUsuarios();
});

ipcMain.handle('mysql:createUsuario', async (event, usuario) => {
  return await mysqlService.createUsuario(usuario);
});

ipcMain.handle('mysql:updateUsuario', async (event, id, usuario) => {
  return await mysqlService.updateUsuario(id, usuario);
});

ipcMain.handle('mysql:deleteUsuario', async (event, id) => {
  return await mysqlService.deleteUsuario(id);
});
ipcMain.handle('mysql:cambiarPasswordPrimeraVez', async (event, userId, username, passwordNueva) => {
  return await mysqlService.cambiarPasswordPrimeraVez(userId, username, passwordNueva);
});

ipcMain.handle('mysql:toggleUsuario', async (event, { userId, activo }) => {
  return await mysqlService.toggleUsuario(userId, activo);
});

ipcMain.handle('mysql:cambiarPassword', async (event, { userId, username, passwordActual, passwordNueva }) => {
  return await mysqlService.cambiarPassword(userId, username, passwordActual, passwordNueva);
});

// Auditoría
ipcMain.handle('mysql:getAuditoria', async (event, params = {}) => {
  return await mysqlService.getAuditoria(params);
});

ipcMain.handle('mysql:registrarAuditoria', async (event, data) => {
  return await mysqlService.registrarAuditoria(data);
});

ipcMain.handle('mysql:deleteAuditoria', async (event, auditoriaId) => {
  return await mysqlService.deleteAuditoria(auditoriaId);
});

ipcMain.handle('mysql:deleteAuditoriaBulk', async (event, ids) => {
  return await mysqlService.deleteAuditoriaBulk(ids);
});

// ============ REPORTE DE ERRORES ============
ipcMain.handle('mysql:createErrorReport', async (event, payload) => {
  return await mysqlService.createErrorReport(payload);
});

ipcMain.handle('mysql:getErrorReports', async (event, params = {}) => {
  return await mysqlService.getErrorReports(params);
});

ipcMain.handle('mysql:markErrorReportAsResolved', async (event, id, meta = {}) => {
  return await mysqlService.markErrorReportAsResolved(id, meta);
});

// Backups (MySQL)
ipcMain.handle('mysql:exportBackupSQL', async (event, params = {}) => {
  return await mysqlService.exportBackupSQL(params);
});

// ===========================================
// SISTEMA DE ACTUALIZACIONES AUTOMÁTICAS
// ===========================================

// NOTA: La inicialización de actualizaciones se hace en app.whenReady() 
// después de que la ventana esté lista para poder comunicarse con el renderer

// IPC handler para verificar actualizaciones manualmente
ipcMain.handle('check-for-updates', async () => {
  if (!isDev && appUpdater) {
    appUpdater.checkForUpdates();
    return { checking: true };
  }
  return { checking: false, reason: 'Solo disponible en producción' };
});

// IPC handler para obtener versión actual
ipcMain.handle('get-app-version', async () => {
  return {
    version: app.getVersion(),
    name: app.getName()
  };
});
