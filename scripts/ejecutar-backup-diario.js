/**
 * Script para ejecutar backup diario automático
 * 
 * Este script puede ejecutarse:
 * 1. Manualmente: node scripts/ejecutar-backup-diario.js
 * 2. Con cron (Linux/Mac): 0 2 * * * node /ruta/al/script/ejecutar-backup-diario.js
 * 3. Con Task Scheduler (Windows): Programar tarea diaria
 * 4. Con servicios como cron-job.org (gratis)
 * 
 * IMPORTANTE: Configura las variables de entorno antes de usar
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Variables de entorno SUPABASE no configuradas');
  console.error('Asegúrate de tener REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY en tu .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET_BACKUPS = 'backups-database';

async function ejecutarBackup() {
  console.log('🔄 Iniciando backup diario automático...');
  console.log(`📅 Fecha: ${new Date().toLocaleString('es-AR')}`);
  
  try {
    // 1. Generar backup SQL
    console.log('📦 Generando backup SQL...');
    const { data: backupData, error: backupError } = await supabase.rpc('generar_backup_completo', {
      observaciones_param: 'Backup automático diario'
    });
    
    if (backupError) {
      throw new Error(`Error generando backup SQL: ${backupError.message}`);
    }
    
    if (!backupData || !backupData.success) {
      throw new Error('Error: La función de backup no retornó datos válidos');
    }
    
    console.log(`✅ Backup SQL generado: ${backupData.nombre_archivo}`);
    console.log(`📊 Tamaño aproximado: ${(backupData.tamaño_aprox / 1024 / 1024).toFixed(2)} MB`);
    
    // 2. Subir a Supabase Storage
    console.log('☁️ Subiendo a Supabase Storage...');
    const sqlContent = backupData.backup_sql;
    const blob = new Blob([sqlContent], { type: 'application/sql' });
    
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const rutaArchivo = `${año}/${mes}/${backupData.nombre_archivo}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_BACKUPS)
      .upload(rutaArchivo, blob, {
        contentType: 'application/sql',
        upsert: false
      });
    
    if (uploadError) {
      throw new Error(`Error subiendo backup a Storage: ${uploadError.message}`);
    }
    
    console.log(`✅ Backup subido a Storage: ${rutaArchivo}`);
    
    // 3. Registrar en historial
    console.log('📝 Registrando en historial...');
    const { data: registroData, error: registroError } = await supabase.rpc('registrar_backup', {
      nombre_archivo_param: backupData.nombre_archivo,
      ruta_storage_param: rutaArchivo,
      tamaño_bytes_param: backupData.tamaño_aprox,
      tablas_incluidas_param: backupData.tablas_incluidas,
      observaciones_param: 'Backup automático diario'
    });
    
    if (registroError) {
      console.warn('⚠️ Advertencia: Error registrando en historial:', registroError.message);
      console.warn('El backup se guardó correctamente, pero no se registró en el historial');
    } else {
      console.log(`✅ Backup registrado con ID: ${registroData}`);
    }
    
    // 4. Opcional: Guardar copia local
    const copiaLocal = process.env.BACKUP_COPIA_LOCAL === 'true';
    if (copiaLocal) {
      const carpetaLocal = process.env.BACKUP_CARPETA_LOCAL || './backups';
      if (!fs.existsSync(carpetaLocal)) {
        fs.mkdirSync(carpetaLocal, { recursive: true });
      }
      
      const rutaLocal = path.join(carpetaLocal, backupData.nombre_archivo);
      fs.writeFileSync(rutaLocal, sqlContent, 'utf8');
      console.log(`💾 Copia local guardada: ${rutaLocal}`);
    }
    
    console.log('✅ Backup diario completado exitosamente');
    return {
      success: true,
      nombreArchivo: backupData.nombre_archivo,
      rutaStorage: rutaArchivo,
      tamañoBytes: backupData.tamaño_aprox
    };
    
  } catch (error) {
    console.error('❌ Error en backup diario:', error);
    
    // Opcional: Enviar notificación por email o webhook
    if (process.env.BACKUP_WEBHOOK_ERROR) {
      try {
        await fetch(process.env.BACKUP_WEBHOOK_ERROR, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: error.message,
            fecha: new Date().toISOString()
          })
        });
      } catch (webhookError) {
        console.error('Error enviando notificación:', webhookError);
      }
    }
    
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarBackup()
    .then(() => {
      console.log('✅ Script finalizado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script finalizado con errores');
      process.exit(1);
    });
}

module.exports = { ejecutarBackup };

