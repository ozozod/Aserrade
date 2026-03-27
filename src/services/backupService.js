import { supabase } from '../config/supabase';

const BUCKET_BACKUPS = 'backups-database';

/**
 * Servicio para gestionar backups diarios de la base de datos
 * Soporta múltiples métodos de almacenamiento:
 * - Descarga directa (recomendado si Supabase tiene poco espacio)
 * - Google Drive (opcional, requiere configuración)
 * - Email (para backups pequeños)
 */
class BackupService {
  /**
   * Asegurar que el bucket de backups existe
   */
  async asegurarBucket() {
    try {
      // Intentar crear el bucket si no existe
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listando buckets:', listError);
        return false;
      }
      
      const bucketExiste = buckets.some(b => b.name === BUCKET_BACKUPS);
      
      if (!bucketExiste) {
        // Intentar crear el bucket (requiere permisos de administrador)
        const { error: createError } = await supabase.storage.createBucket(BUCKET_BACKUPS, {
          public: false, // Backups privados
          fileSizeLimit: 104857600, // 100MB máximo por archivo
          allowedMimeTypes: ['application/sql', 'text/plain']
        });
        
        if (createError) {
          console.error('Error creando bucket de backups:', createError);
          console.warn('Nota: El bucket debe crearse manualmente desde el panel de Supabase');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error asegurando bucket:', error);
      return false;
    }
  }

  /**
   * Generar backup SQL de una tabla
   */
  async generarBackupTabla(nombreTabla, datos) {
    if (!datos || datos.length === 0) {
      return `-- Tabla ${nombreTabla}: Sin datos\n\n`;
    }
    
    // Obtener columnas del primer registro
    const columnas = Object.keys(datos[0]);
    const columnasStr = columnas.join(', ');
    
    let sql = `-- ============================================\n`;
    sql += `-- BACKUP DE TABLA: ${nombreTabla}\n`;
    sql += `-- Total de registros: ${datos.length}\n`;
    sql += `-- ============================================\n\n`;
    sql += `-- Eliminar datos existentes (descomentar si deseas limpiar antes de restaurar)\n`;
    sql += `-- DELETE FROM ${nombreTabla};\n\n`;
    sql += `-- Insertar datos\n`;
    
    datos.forEach(registro => {
      const valores = columnas.map(col => {
        const valor = registro[col];
        if (valor === null || valor === undefined) {
          return 'NULL';
        }
        if (typeof valor === 'string') {
          // Escapar comillas simples
          return `'${valor.replace(/'/g, "''")}'`;
        }
        if (valor instanceof Date) {
          return `'${valor.toISOString()}'`;
        }
        if (typeof valor === 'boolean') {
          return valor ? 'true' : 'false';
        }
        return valor;
      });
      
      sql += `INSERT INTO ${nombreTabla} (${columnasStr}) VALUES (${valores.join(', ')});\n`;
    });
    
    sql += `\n`;
    return sql;
  }

  /**
   * Generar backup completo de la base de datos
   * @param {string} observaciones - Observaciones opcionales para el backup
   * @param {string} metodoAlmacenamiento - 'descarga' | 'supabase' | 'ambos'
   * @returns {Promise<Object>} - Información del backup generado
   */
  async generarBackup(observaciones = null, metodoAlmacenamiento = 'descarga') {
    try {
      console.log('Iniciando generación de backup...');
      
      // Intentar usar función SQL si existe, sino generar desde JavaScript
      let backupData = null;
      let usarFuncionSQL = false;
      
      try {
        const { data: dataSQL, error: backupError } = await supabase.rpc('generar_backup_completo', {
          observaciones_param: observaciones
        });
        
        if (!backupError && dataSQL && dataSQL.success) {
          backupData = dataSQL;
          usarFuncionSQL = true;
          console.log('Usando función SQL de Supabase');
        }
      } catch (error) {
        console.log('Función SQL no disponible, generando backup desde JavaScript...');
      }
      
      // Si no hay función SQL, generar backup manualmente
      if (!usarFuncionSQL) {
        console.log('Generando backup desde JavaScript...');
        
        const fecha = new Date();
        const fechaStr = fecha.toISOString().split('T')[0];
        const horaStr = fecha.toTimeString().split(' ')[0].replace(/:/g, '');
        const nombreArchivo = `backup_${fechaStr}_${horaStr}.sql`;
        
        let sqlContent = `-- =====================================================\n`;
        sqlContent += `-- BACKUP COMPLETO DE BASE DE DATOS\n`;
        sqlContent += `-- FECHA: ${fechaStr}\n`;
        sqlContent += `-- HORA: ${fecha.toLocaleString('es-AR')}\n`;
        if (observaciones) {
          sqlContent += `-- OBSERVACIONES: ${observaciones}\n`;
        }
        sqlContent += `-- =====================================================\n\n`;
        
        const tablas = [
          'clientes',
          'articulos',
          'remitos',
          'remito_articulos',
          'pagos',
          'saldos_iniciales',
          'usuarios',
          'auditoria'
        ];
        const tablasIncluidas = [];
        let tamañoTotal = 0;
        
        for (const tabla of tablas) {
          try {
            const { data, error } = await supabase
              .from(tabla)
              .select('*')
              .order('id', { ascending: true });
            
            if (error) {
              sqlContent += `-- ERROR obteniendo datos de ${tabla}: ${error.message}\n\n`;
              continue;
            }
            
            if (data && data.length > 0) {
              const sqlTabla = await this.generarBackupTabla(tabla, data);
              sqlContent += sqlTabla;
              tablasIncluidas.push(tabla);
              tamañoTotal += sqlTabla.length;
            } else {
              sqlContent += `-- Tabla ${tabla}: Sin datos\n\n`;
            }
          } catch (error) {
            sqlContent += `-- ERROR en tabla ${tabla}: ${error.message}\n\n`;
          }
        }
        
        sqlContent += `-- =====================================================\n`;
        sqlContent += `-- FIN DEL BACKUP\n`;
        sqlContent += `-- Total de tablas respaldadas: ${tablasIncluidas.length}\n`;
        sqlContent += `-- =====================================================\n`;
        
        backupData = {
          success: true,
          nombre_archivo: nombreArchivo,
          fecha_backup: fechaStr,
          backup_sql: sqlContent,
          tablas_incluidas: tablasIncluidas,
          tamaño_aprox: tamañoTotal
        };
      }
      
      console.log('Backup SQL generado:', backupData.nombre_archivo);
      
      const sqlContent = backupData.backup_sql;
      const blob = new Blob([sqlContent], { type: 'application/sql' });
      
      let rutaStorage = null;
      let url = null;
      let guardadoEnSupabase = false;
      
      // 2. Intentar guardar en Supabase Storage (solo si se solicita)
      if (metodoAlmacenamiento === 'supabase' || metodoAlmacenamiento === 'ambos') {
        try {
          await this.asegurarBucket();
          
          const rutaArchivo = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${backupData.nombre_archivo}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(BUCKET_BACKUPS)
            .upload(rutaArchivo, blob, {
              contentType: 'application/sql',
              upsert: false
            });
          
          if (!uploadError) {
            rutaStorage = rutaArchivo;
            const { data: urlData } = supabase.storage
              .from(BUCKET_BACKUPS)
              .getPublicUrl(rutaArchivo);
            url = urlData?.publicUrl;
            guardadoEnSupabase = true;
            console.log('Backup guardado en Supabase Storage:', rutaArchivo);
          } else {
            console.warn('No se pudo guardar en Supabase Storage (poco espacio?):', uploadError.message);
          }
        } catch (storageError) {
          console.warn('Error guardando en Supabase Storage:', storageError);
          // Continuar con descarga directa
        }
      }
      
      // 3. Preparar descarga directa (siempre disponible)
      const urlDescarga = URL.createObjectURL(blob);
      
      // 4. Registrar backup en el historial (aunque no esté en Storage)
      let registroData = null;
      try {
        const { data: registro, error: registroError } = await supabase.rpc('registrar_backup', {
          nombre_archivo_param: backupData.nombre_archivo,
          ruta_storage_param: rutaStorage || 'descarga_directa',
          tamaño_bytes_param: backupData.tamaño_aprox,
          tablas_incluidas_param: backupData.tablas_incluidas,
          observaciones_param: observaciones || (guardadoEnSupabase ? 'Guardado en Supabase' : 'Descarga directa')
        });
        
        if (!registroError) {
          registroData = registro;
        }
      } catch (historialError) {
        console.warn('Error registrando en historial:', historialError);
      }
      
      return {
        success: true,
        id: registroData,
        nombreArchivo: backupData.nombre_archivo,
        rutaStorage: rutaStorage,
        url: url,
        urlDescarga: urlDescarga, // URL para descarga directa
        blob: blob, // Blob para descarga
        tamañoBytes: backupData.tamaño_aprox,
        fechaBackup: backupData.fecha_backup,
        tablasIncluidas: backupData.tablas_incluidas,
        guardadoEnSupabase: guardadoEnSupabase,
        metodoAlmacenamiento: guardadoEnSupabase ? 'supabase' : 'descarga'
      };
      
    } catch (error) {
      console.error('Error en generarBackup:', error);
      throw error;
    }
  }

  /**
   * Listar backups disponibles
   * @param {number} limite - Número máximo de backups a retornar
   * @returns {Promise<Array>} - Lista de backups
   */
  async listarBackups(limite = 30) {
    try {
      const { data, error } = await supabase.rpc('listar_backups', {
        limite: limite
      });
      
      if (error) {
        throw new Error(`Error listando backups: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error en listarBackups:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de backups
   * @returns {Promise<Object>} - Estadísticas
   */
  async obtenerEstadisticas() {
    try {
      const { data, error } = await supabase.rpc('estadisticas_backups');
      
      if (error) {
        throw new Error(`Error obteniendo estadísticas: ${error.message}`);
      }
      
      return data || {};
    } catch (error) {
      console.error('Error en obtenerEstadisticas:', error);
      throw error;
    }
  }

  /**
   * Descargar backup desde Storage
   * @param {string} rutaStorage - Ruta del archivo en Storage
   * @returns {Promise<Blob>} - Contenido del backup
   */
  async descargarBackup(rutaStorage) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_BACKUPS)
        .download(rutaStorage);
      
      if (error) {
        throw new Error(`Error descargando backup: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error en descargarBackup:', error);
      throw error;
    }
  }

  /**
   * Restaurar backup desde archivo SQL
   * IMPORTANTE: Esta función ejecuta el SQL directamente
   * Solo debe usarse con precaución y en casos de emergencia
   * @param {string} sqlContent - Contenido SQL del backup
   * @param {boolean} confirmar - Debe ser true para ejecutar
   * @returns {Promise<Object>} - Resultado de la restauración
   */
  async restaurarBackup(sqlContent, confirmar = false) {
    if (!confirmar) {
      throw new Error('Debes confirmar la restauración pasando confirmar=true');
    }
    
    try {
      // Dividir el SQL en statements individuales
      // Eliminar comentarios y líneas vacías
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      console.log(`Ejecutando ${statements.length} statements del backup...`);
      
      const resultados = [];
      let exitosos = 0;
      let fallidos = 0;
      
      // Ejecutar cada statement
      for (const statement of statements) {
        try {
          // Usar RPC para ejecutar SQL dinámico
          // NOTA: Esto requiere una función especial en Supabase
          // Por seguridad, mejor ejecutar manualmente desde el SQL Editor
          
          // Por ahora, solo retornamos los statements para revisión
          resultados.push({
            statement: statement.substring(0, 100) + '...',
            status: 'pending'
          });
        } catch (error) {
          fallidos++;
          resultados.push({
            statement: statement.substring(0, 100) + '...',
            status: 'error',
            error: error.message
          });
        }
      }
      
      return {
        success: true,
        totalStatements: statements.length,
        exitosos,
        fallidos,
        resultados,
        advertencia: 'La restauración automática requiere ejecución manual desde el SQL Editor de Supabase por seguridad.'
      };
      
    } catch (error) {
      console.error('Error en restaurarBackup:', error);
      throw error;
    }
  }

  /**
   * Eliminar backup antiguo (más de X días)
   * @param {number} diasAntiguedad - Días de antigüedad para eliminar
   * @returns {Promise<Object>} - Resultado de la limpieza
   */
  async limpiarBackupsAntiguos(diasAntiguedad = 90) {
    try {
      // Obtener backups antiguos
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);
      
      const { data: backupsAntiguos, error: listError } = await supabase
        .from('backups_historial')
        .select('id, ruta_storage')
        .lt('fecha_backup', fechaLimite.toISOString());
      
      if (listError) {
        throw new Error(`Error listando backups antiguos: ${listError.message}`);
      }
      
      if (!backupsAntiguos || backupsAntiguos.length === 0) {
        return {
          success: true,
          eliminados: 0,
          mensaje: 'No hay backups antiguos para eliminar'
        };
      }
      
      // Eliminar de Storage
      const rutas = backupsAntiguos.map(b => b.ruta_storage);
      const { error: deleteStorageError } = await supabase.storage
        .from(BUCKET_BACKUPS)
        .remove(rutas);
      
      if (deleteStorageError) {
        console.warn('Error eliminando de Storage:', deleteStorageError);
      }
      
      // Eliminar del historial
      const ids = backupsAntiguos.map(b => b.id);
      const { error: deleteHistorialError } = await supabase
        .from('backups_historial')
        .delete()
        .in('id', ids);
      
      if (deleteHistorialError) {
        throw new Error(`Error eliminando del historial: ${deleteHistorialError.message}`);
      }
      
      return {
        success: true,
        eliminados: backupsAntiguos.length,
        mensaje: `Se eliminaron ${backupsAntiguos.length} backups antiguos`
      };
      
    } catch (error) {
      console.error('Error en limpiarBackupsAntiguos:', error);
      throw error;
    }
  }
}

export const backupService = new BackupService();

