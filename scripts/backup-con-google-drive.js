/**
 * Script de Backup Automático con Subida a Google Drive
 * 
 * OPCIÓN 1: Google Drive Desktop (Recomendado - Más Simple)
 * - Si tienes Google Drive Desktop instalado, solo configura la carpeta
 * - El backup se guarda localmente y Google Drive lo sube automáticamente
 * 
 * OPCIÓN 2: Google Drive API (Avanzado)
 * - Requiere configuración de OAuth2
 * - Sube directamente a Google Drive sin carpeta local
 * 
 * USO:
 * node scripts/backup-con-google-drive.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// OPCIÓN 1: Carpeta de Google Drive Desktop (Recomendado)
// Encuentra automáticamente la carpeta de Google Drive
function encontrarCarpetaGoogleDrive() {
  const os = require('os');
  const homeDir = os.homedir();
  
  // Si BACKUP_DESTINO está configurado en .env, usarlo directamente
  if (process.env.BACKUP_DESTINO) {
    const carpetaDestino = process.env.BACKUP_DESTINO;
    if (!fs.existsSync(carpetaDestino)) {
      fs.mkdirSync(carpetaDestino, { recursive: true });
      console.log(`📁 Carpeta creada desde .env: ${carpetaDestino}`);
    }
    return carpetaDestino;
  }
  
  // Rutas comunes de Google Drive Desktop (en orden de prioridad)
  const rutasPosibles = [
    path.join(homeDir, 'Google Drive', 'Backups_Aserradero'),  // Primera opción: Google Drive
    path.join(homeDir, 'OneDrive', 'Google Drive', 'Backups_Aserradero'), // Si está en OneDrive
    path.join(homeDir, 'Downloads', 'Backups_Aserradero')  // Fallback: Downloads
  ];
  
  // Buscar la primera carpeta de Google Drive que exista
  for (const ruta of rutasPosibles) {
    const carpetaGoogleDrive = path.dirname(ruta); // Carpeta padre (Google Drive o Downloads)
    if (fs.existsSync(carpetaGoogleDrive)) {
      // Si la carpeta de backups no existe, crearla
      if (!fs.existsSync(ruta)) {
        fs.mkdirSync(ruta, { recursive: true });
        console.log(`📁 Carpeta creada: ${ruta}`);
      }
      return ruta;
    }
  }
  
  // Si no existe ninguna, crear en la primera opción (Google Drive)
  const carpetaDefault = rutasPosibles[0];
  const carpetaGoogleDrive = path.dirname(carpetaDefault);
  
  // Crear carpeta de Google Drive si no existe (puede que no esté instalado)
  if (!fs.existsSync(carpetaGoogleDrive)) {
    console.log(`⚠️ Carpeta de Google Drive no encontrada en: ${carpetaGoogleDrive}`);
    console.log(`💡 Se creará en: ${carpetaDefault}`);
  }
  
  if (!fs.existsSync(carpetaDefault)) {
    fs.mkdirSync(carpetaDefault, { recursive: true });
    console.log(`📁 Carpeta creada: ${carpetaDefault}`);
  }
  
  return carpetaDefault;
}

// OPCIÓN 2: Subir a Google Drive usando API (requiere configuración)
async function subirAGoogleDriveAPI(archivoPath, nombreArchivo) {
  // Esta función requiere configuración de OAuth2
  // Por ahora, retornamos false para usar la opción 1
  return false;
  
  /* CÓDIGO PARA API (se implementará si lo necesitas):
  const { google } = require('googleapis');
  // ... configuración OAuth2 ...
  */
}

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
    return `-- Tabla ${nombreTabla}: Sin datos\n\n`;
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
  
  console.log('🔄 Iniciando backup automático con Google Drive...');
  console.log(`📅 Fecha: ${fecha.toLocaleString('es-AR')}`);
  console.log(`📁 Archivo: ${nombreArchivo}`);
  
  try {
    // Encontrar o crear carpeta de Google Drive
    const carpetaDestino = encontrarCarpetaGoogleDrive();
    console.log(`📂 Carpeta destino: ${carpetaDestino}`);
    
    // Verificar si Google Drive Desktop está activo
    // Verificar si la carpeta destino está dentro de Google Drive
    const carpetaGoogleDrive = path.join(require('os').homedir(), 'Google Drive');
    const googleDriveActivo = fs.existsSync(carpetaGoogleDrive);
    const estaEnGoogleDrive = carpetaDestino.includes('Google Drive');
    
    if (googleDriveActivo && estaEnGoogleDrive) {
      console.log('✅ Google Drive Desktop detectado - El archivo se subirá automáticamente');
    } else if (googleDriveActivo && !estaEnGoogleDrive) {
      console.log('⚠️ Google Drive Desktop está instalado, pero la carpeta destino no está en Google Drive');
      console.log(`💡 Considera mover los backups a: ${path.join(carpetaGoogleDrive, 'Backups_Aserradero')}`);
    } else {
      console.log('⚠️ Google Drive Desktop no detectado');
      console.log('💡 Instala Google Drive Desktop para sincronización automática');
      console.log('   Descarga desde: https://www.google.com/drive/download/');
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
    sqlContent += `-- Generado automáticamente\n`;
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
    
    // Guardar archivo en carpeta de Google Drive
    const rutaCompleta = path.join(carpetaDestino, nombreArchivo);
    fs.writeFileSync(rutaCompleta, sqlContent, 'utf8');
    
    const tamañoMB = (sqlContent.length / 1024 / 1024).toFixed(2);
    
    console.log('\n✅ Backup completado exitosamente');
    console.log(`📁 Guardado en: ${rutaCompleta}`);
    console.log(`📊 Tamaño: ${tamañoMB} MB`);
    console.log(`📋 Tablas: ${tablasIncluidas.join(', ')}`);
    console.log(`📈 Total registros: ${totalRegistros}`);
    
    if (googleDriveActivo && estaEnGoogleDrive) {
      console.log('\n☁️ El archivo se subirá automáticamente a Google Drive');
      console.log('   (Sincronización automática de Google Drive Desktop)');
    } else if (googleDriveActivo && !estaEnGoogleDrive) {
      console.log('\n💾 Archivo guardado localmente');
      console.log('   (No se subirá a Google Drive automáticamente)');
    } else {
      console.log('\n💾 Archivo guardado localmente');
      console.log('   (Instala Google Drive Desktop para sincronización automática)');
    }
    
    // Intentar subir por API si está configurado (opcional)
    const usarAPI = process.env.GOOGLE_DRIVE_API_ENABLED === 'true';
    if (usarAPI) {
      const subido = await subirAGoogleDriveAPI(rutaCompleta, nombreArchivo);
      if (subido) {
        console.log('✅ También subido por API de Google Drive');
      }
    }
    
    return {
      success: true,
      archivo: nombreArchivo,
      ruta: rutaCompleta,
      tamaño: tamañoMB,
      tablas: tablasIncluidas,
      registros: totalRegistros,
      googleDriveActivo: googleDriveActivo && estaEnGoogleDrive
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
      if (resultado.googleDriveActivo) {
        console.log('☁️ Sincronización con Google Drive en progreso...');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script finalizado con errores');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { ejecutarBackup };

