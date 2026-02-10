const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');
const log = require('electron-log');

// Configurar logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

class AppUpdater {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.setupAutoUpdater();
  }

  setupAutoUpdater() {
    // Configurar repositorio de GitHub explícitamente
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'ozozod',
      repo: 'Aserrade',
      requestHeaders: {
        'User-Agent': 'Aserradero-App-Updater',
        'Accept': 'application/json'
      }
    });
    
    // Configuración de actualizaciones - AUTOMÁTICO AL INICIAR
    autoUpdater.autoDownload = true; // Descargar automáticamente
    autoUpdater.autoInstallOnAppQuit = true; // Instalar al cerrar

    // Evento: Verificando actualizaciones
    autoUpdater.on('checking-for-update', () => {
      log.info('🔍 Verificando actualizaciones...');
      this.sendStatusToWindow('checking-for-update');
    });

    // Evento: Actualización disponible
    autoUpdater.on('update-available', (info) => {
      log.info('✅ Actualización disponible:', info.version);
      this.sendStatusToWindow('update-available', info);
      // Descargar automáticamente (ya está configurado autoDownload = true)
      // No mostrar diálogo, solo notificar al renderer
    });

    // Evento: No hay actualizaciones
    autoUpdater.on('update-not-available', (info) => {
      log.info('✅ La aplicación está actualizada:', info?.version || 'versión actual');
      this.sendStatusToWindow('update-not-available', info || {});
    });

    // Evento: Error al actualizar (ej. no hay releases, sin red)
    autoUpdater.on('error', (err) => {
      log.warn('⚠️ Actualizador:', err.message, err.code || '');
      // Enviar como "sin actualización" para no asustar al usuario
      this.sendStatusToWindow('update-not-available', { version: 'current', skipped: true });
    });

    // Evento: Progreso de descarga
    autoUpdater.on('download-progress', (progressObj) => {
      let logMessage = `📥 Descargando: ${progressObj.percent.toFixed(2)}%`;
      logMessage += ` (${progressObj.transferred}/${progressObj.total})`;
      log.info(logMessage);
      this.sendStatusToWindow('download-progress', progressObj);
    });

    // Evento: Actualización descargada
    autoUpdater.on('update-downloaded', (info) => {
      log.info('✅ Actualización descargada:', info.version);
      this.sendStatusToWindow('update-downloaded', info);
      
      // Instalar automáticamente después de 2 segundos
      setTimeout(() => {
        log.info('🔄 Instalando actualización y reiniciando...');
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send('before-update');
        }
        // Instalar y reiniciar automáticamente
        autoUpdater.quitAndInstall(false, true);
      }, 2000);
    });
  }

  // Enviar estado al renderer process
  sendStatusToWindow(event, data = null) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-status', { event, data });
    }
  }

  // Verificar actualizaciones manualmente
  checkForUpdates() {
    return autoUpdater.checkForUpdates()
      .catch(err => {
        log.error('Error al verificar actualizaciones:', err);
        this.sendStatusToWindow('error', err);
        throw err;
      });
  }

  // Verificar actualizaciones al inicio (bloquea hasta terminar)
  checkForUpdatesOnStart() {
    log.info('🔍 Verificando actualizaciones al iniciar...');
    return new Promise((resolve) => {
      // Timeout de seguridad: si no hay respuesta en 10 segundos, continuar
      const timeout = setTimeout(() => {
        log.warn('⏱️ Timeout verificando actualizaciones, continuando...');
        this.sendStatusToWindow('update-not-available', { version: 'timeout' });
        resolve(null);
      }, 10000);
      
      autoUpdater.checkForUpdates()
        .then((result) => {
          clearTimeout(timeout);
          log.info('✅ Verificación de actualizaciones completada');
          resolve(result);
        })
        .catch(err => {
          clearTimeout(timeout);
          log.warn('⚠️ No se pudo verificar actualizaciones (sin conexión o sin releases):', err.message || err);
          // Tratar como "sin actualizaciones" para que la UI no muestre error
          this.sendStatusToWindow('update-not-available', { version: 'current', skipped: true });
          resolve(null);
        });
    });
  }

  // Verificar actualizaciones en segundo plano (sin molestar al usuario)
  checkForUpdatesQuietly() {
    log.info('🔍 Verificación silenciosa de actualizaciones...');
    autoUpdater.checkForUpdates()
      .catch(err => {
        log.error('Error en verificación silenciosa:', err);
      });
  }
}

module.exports = AppUpdater;
