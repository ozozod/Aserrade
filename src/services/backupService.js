import { exportBackupSQL } from './databaseService';

/**
 * Servicio de backups (Hostinger/MySQL).
 * Genera un SQL completo desde MySQL vía IPC y lo devuelve como Blob para descarga.
 * Todo queda en MySQL / archivo local generado por la app.
 */
class BackupService {
  async generarBackup(observaciones = null) {
    const res = await exportBackupSQL({ observaciones });
    if (!res?.success) {
      throw new Error(res?.error || 'No se pudo generar el backup');
    }
    const sqlContent = res.sql || '';
    const blob = new Blob([sqlContent], { type: 'application/sql' });
    return {
      success: true,
      nombreArchivo: res.nombreArchivo,
      blob,
      tamañoBytes: sqlContent.length,
      guardadoRemoto: false
    };
  }

  // Compatibilidad con la UI existente (no hay historial remoto de backups)
  async listarBackups() {
    return [];
  }

  async obtenerEstadisticas() {
    return null;
  }

  async descargarBackup() {
    throw new Error('Descarga de backups antiguos no disponible (solo backup SQL actual)');
  }

  async limpiarBackupsAntiguos() {
    return { success: true, eliminados: 0, mensaje: 'No aplica (sin historial remoto)' };
  }
}

export const backupService = new BackupService();

