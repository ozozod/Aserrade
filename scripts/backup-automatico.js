/**
 * Script de Backup Automático Diario
 * 
 * Este script genera un backup y lo descarga automáticamente
 * Se puede ejecutar desde:
 * - Task Scheduler (Windows) - Programado diariamente
 * - Cron (Linux/Mac) - Programado diariamente
 * - Manualmente desde terminal
 * - Desde una app web simple
 * 
 * USO:
 * node scripts/backup-automatico.js
 * 
 * O con variables de entorno:
 * BACKUP_DESTINO=/ruta/carpeta node scripts/backup-automatico.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuración de MySQL (Hostinger)
const DB_CONFIG = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db'
};

const BACKUP_DESTINO = process.env.BACKUP_DESTINO || path.join(require('os').homedir(), 'Downloads', 'Backups_Aserradero');

// Función para escapar strings SQL
function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'string') {
    // Escapar comillas simples y caracteres especiales
    return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
  }
  if (typeof str === 'boolean') return str ? '1' : '0';
  if (str instanceof Date) return `'${str.toISOString().slice(0, 19).replace('T', ' ')}'`;
  return str;
}

// Función para generar backup de una tabla desde MySQL
async function generarBackupTabla(connection, nombreTabla) {
  try {
    // Obtener todos los registros
    const [rows] = await connection.execute(`SELECT * FROM ${nombreTabla}`);
    
    if (!rows || rows.length === 0) {
      return { sql: `-- Tabla ${nombreTabla}: Sin datos\n\n`, count: 0 };
    }
    
    // Obtener nombres de columnas
    const columnas = Object.keys(rows[0]);
    const columnasStr = columnas.join(', ');
    
    let sql = `-- ============================================\n`;
    sql += `-- BACKUP DE TABLA: ${nombreTabla}\n`;
    sql += `-- Total de registros: ${rows.length}\n`;
    sql += `-- ============================================\n\n`;
    sql += `-- DELETE FROM ${nombreTabla};\n\n`;
    sql += `-- Insertar datos\n`;
    
    rows.forEach(registro => {
      const valores = columnas.map(col => escapeSQL(registro[col]));
      sql += `INSERT INTO ${nombreTabla} (${columnasStr}) VALUES (${valores.join(', ')});\n`;
    });
    
    sql += `\n`;
    return { sql, count: rows.length };
  } catch (error) {
    return { sql: `-- ERROR en tabla ${nombreTabla}: ${error.message}\n\n`, count: 0 };
  }
}

// Función principal
async function ejecutarBackup() {
  const fecha = new Date();
  const fechaStr = fecha.toISOString().split('T')[0];
  const horaStr = fecha.toTimeString().split(' ')[0].replace(/:/g, '');
  const nombreArchivo = `backup_${fechaStr}_${horaStr}.sql`;
  
  console.log('🔄 Iniciando backup automático...');
  console.log(`📅 Fecha: ${fecha.toLocaleString('es-AR')}`);
  console.log(`📁 Archivo: ${nombreArchivo}`);
  
  try {
    // Crear carpeta de destino si no existe
    if (!fs.existsSync(BACKUP_DESTINO)) {
      fs.mkdirSync(BACKUP_DESTINO, { recursive: true });
      console.log(`📁 Carpeta creada: ${BACKUP_DESTINO}`);
    }
    
    // Conectar a MySQL
    console.log('🔗 Conectando a MySQL (Hostinger)...');
    const connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado a MySQL');
    
    // Generar backup SQL
    console.log('📦 Generando backup SQL (incluye imágenes en base64)...');
    let sqlContent = `-- =====================================================\n`;
    sqlContent += `-- BACKUP AUTOMÁTICO DIARIO - MySQL (Hostinger)\n`;
    sqlContent += `-- FECHA: ${fechaStr}\n`;
    sqlContent += `-- HORA: ${fecha.toLocaleString('es-AR')}\n`;
    sqlContent += `-- Generado automáticamente por script\n`;
    sqlContent += `-- INCLUYE: Datos + Imágenes (base64 en foto_path e imagen_url)\n`;
    sqlContent += `-- =====================================================\n\n`;
    
    const tablas = ['clientes', 'articulos', 'remitos', 'remito_articulos', 'pagos'];
    const tablasIncluidas = [];
    let totalRegistros = 0;
    
    for (const tabla of tablas) {
      try {
        console.log(`📦 Respaldando tabla: ${tabla}...`);
        const resultado = await generarBackupTabla(connection, tabla);
        sqlContent += resultado.sql;
        
        if (resultado.count > 0) {
          tablasIncluidas.push(tabla);
          totalRegistros += resultado.count;
          console.log(`✅ ${tabla}: ${resultado.count} registros`);
        } else {
          console.log(`⚠️ ${tabla}: Sin datos`);
        }
      } catch (error) {
        console.error(`❌ Error procesando ${tabla}:`, error.message);
        sqlContent += `-- ERROR en tabla ${tabla}: ${error.message}\n\n`;
      }
    }
    
    // Cerrar conexión
    await connection.end();
    console.log('🔌 Desconectado de MySQL');
    
    sqlContent += `-- =====================================================\n`;
    sqlContent += `-- FIN DEL BACKUP\n`;
    sqlContent += `-- Total de tablas respaldadas: ${tablasIncluidas.length}\n`;
    sqlContent += `-- Total de registros: ${totalRegistros}\n`;
    sqlContent += `-- =====================================================\n`;
    
    // Guardar archivo
    const rutaCompleta = path.join(BACKUP_DESTINO, nombreArchivo);
    fs.writeFileSync(rutaCompleta, sqlContent, 'utf8');
    
    const tamañoMB = (sqlContent.length / 1024 / 1024).toFixed(2);
    
    console.log('✅ Backup completado exitosamente');
    console.log(`📁 Guardado en: ${rutaCompleta}`);
    console.log(`📊 Tamaño: ${tamañoMB} MB`);
    console.log(`📋 Tablas: ${tablasIncluidas.join(', ')}`);
    console.log(`📈 Total registros: ${totalRegistros}`);
    
    // Opcional: Subir a Google Drive (si tienes configuración)
    if (process.env.GOOGLE_DRIVE_ENABLED === 'true') {
      console.log('☁️ Intentando subir a Google Drive...');
      // Aquí podrías agregar lógica para subir a Google Drive
      // Requiere configuración adicional
    }
    
    return {
      success: true,
      archivo: nombreArchivo,
      ruta: rutaCompleta,
      tamaño: tamañoMB,
      tablas: tablasIncluidas,
      registros: totalRegistros
    };
    
  } catch (error) {
    console.error('❌ Error en backup automático:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarBackup()
    .then((resultado) => {
      console.log('\n✅ Script finalizado exitosamente');
      console.log(`📁 Archivo: ${resultado.archivo}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script finalizado con errores');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { ejecutarBackup };

