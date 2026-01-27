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
      repo: 'Aserrade'
    });
    
    // Configuración de actualizaciones
    autoUpdater.autoDownload = false; // No descargar automáticamente
    autoUpdater.autoInstallOnAppQuit = true; // Instalar al cerrar

    // Evento: Verificando actualizaciones
    autoUpdater.on('checking-for-update', () => {
      log.info('🔍 Verificando actualizaciones...');
      this.sendStatusToWindow('checking-for-update');
    });

    // Evento: Actualización disponible
    autoUpdater.on('update-available', (info) => {
      log.info('✅ Actualización disponible:', info.version);
      
      // Mostrar diálogo al usuario
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Actualización Disponible',
        message: `Nueva versión ${info.version} disponible`,
        detail: '¿Deseas descargar e instalar la actualización ahora?\n\n' +
                'La aplicación se reiniciará después de la instalación.',
        buttons: ['Descargar e Instalar', 'Más Tarde'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
    });

    // Evento: No hay actualizaciones
    autoUpdater.on('update-not-available', (info) => {
      log.info('✅ La aplicación está actualizada:', info.version);
      this.sendStatusToWindow('update-not-available', info);
    });

    // Evento: Error al actualizar
    autoUpdater.on('error', (err) => {
      log.error('❌ Error en el actualizador:', err);
      this.sendStatusToWindow('error', err);
      
      // Mostrar error solo si el usuario está esperando una actualización
      // No mostrar en checks automáticos de fondo
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
      
      // Notificar al usuario que está lista para instalar
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Actualización Lista',
        message: `La versión ${info.version} está lista para instalar`,
        detail: 'La aplicación se reiniciará para completar la instalación.',
        buttons: ['Reiniciar Ahora', 'Reiniciar Después'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          // Cerrar sesión antes de actualizar (opcional)
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('before-update');
          }
          
          // Esperar un momento y luego instalar
          setTimeout(() => {
            autoUpdater.quitAndInstall(false, true);
          }, 1000);
        }
      });
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
    autoUpdater.checkForUpdates()
      .catch(err => {
        log.error('Error al verificar actualizaciones:', err);
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
