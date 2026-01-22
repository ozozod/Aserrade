/**
 * Script de Backup Completo: Base de Datos + Imágenes
 * 
 * Este script genera un backup completo que incluye:
 * 1. Backup SQL de todas las tablas
 * 2. Todas las imágenes del bucket 'remitos-fotos'
 * 3. Un archivo ZIP con todo el contenido
 * 4. Guardado en Google Drive (o carpeta local)
 * 
 * USO:
 * node scripts/backup-completo-con-imagenes.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');

// Función para cargar credenciales de Supabase
function cargarCredencialesSupabase() {
  let SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
  let SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  if (SUPABASE_URL && SUPABASE_KEY) {
    console.log('✅ Credenciales cargadas desde .env');
    return { url: SUPABASE_URL, key: SUPABASE_KEY };
  }
  
  const configPath = path.join(process.cwd(), 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.supabase && config.supabase.url && config.supabase.anonKey) {
        console.log('✅ Credenciales cargadas desde config.json');
        return { url: config.supabase.url, key: config.supabase.anonKey };
      }
    } catch (error) {
      console.warn('⚠️ Error leyendo config.json:', error.message);
    }
  }
  
  const defaultUrl = 'https://uoisgayimsbqugablshq.supabase.co';
  const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaXNnYXlpbXNicXVnYWJsc2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDE3MjEsImV4cCI6MjA3OTIxNzcyMX0.Aswdut5lDyocIqyfksjTXmi_CaUevaAAGIv_kv7ygew';
  
  console.log('⚠️ Usando credenciales por defecto (desarrollo)');
  return { url: defaultUrl, key: defaultKey };
}

// Cargar credenciales
const credenciales = cargarCredencialesSupabase();
const supabase = createClient(credenciales.url, credenciales.key);

const BUCKET_NAME = 'remitos-fotos';

// Función para encontrar carpeta de Google Drive
function encontrarCarpetaGoogleDrive() {
  const os = require('os');
  const homeDir = os.homedir();
  
  if (process.env.BACKUP_DESTINO) {
    const carpetaDestino = process.env.BACKUP_DESTINO;
    if (!fs.existsSync(carpetaDestino)) {
      fs.mkdirSync(carpetaDestino, { recursive: true });
    }
    return carpetaDestino;
  }
  
  const rutasPosibles = [
    path.join(homeDir, 'Google Drive', 'Backups_Aserradero'),
    path.join(homeDir, 'OneDrive', 'Google Drive', 'Backups_Aserradero'),
    path.join(homeDir, 'Downloads', 'Backups_Aserradero')
  ];
  
  for (const ruta of rutasPosibles) {
    const carpetaGoogleDrive = path.dirname(ruta);
    if (fs.existsSync(carpetaGoogleDrive)) {
      if (!fs.existsSync(ruta)) {
        fs.mkdirSync(ruta, { recursive: true });
      }
      return ruta;
    }
  }
  
  const carpetaDefault = rutasPosibles[0];
  if (!fs.existsSync(carpetaDefault)) {
    fs.mkdirSync(carpetaDefault, { recursive: true });
  }
  return carpetaDefault;
}

// Función para descargar una imagen desde una URL
function descargarImagen(url, rutaDestino) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const archivo = fs.createWriteStream(rutaDestino);
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Error descargando imagen: ${response.statusCode}`));
        return;
      }
      
      response.pipe(archivo);
      
      archivo.on('finish', () => {
        archivo.close();
        resolve();
      });
      
      archivo.on('error', (err) => {
        fs.unlink(rutaDestino, () => {}); // Eliminar archivo parcial
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Función para generar backup SQL
async function generarBackupSQL() {
  console.log('\n📦 Generando backup SQL...');
  
  let sqlContent = `-- =====================================================\n`;
  sqlContent += `-- BACKUP COMPLETO: BASE DE DATOS + IMÁGENES\n`;
  sqlContent += `-- FECHA: ${new Date().toLocaleString('es-AR')}\n`;
  sqlContent += `-- =====================================================\n\n`;
  
  const tablas = ['clientes', 'articulos', 'remitos', 'remito_articulos', 'pagos'];
  const tablasIncluidas = [];
  let totalRegistros = 0;
  
  for (const tabla of tablas) {
    try {
      console.log(`📦 Respaldando tabla: ${tabla}...`);
      const { data, error } = await supabase
        .from(tabla)
        .select('*')
        .order('id', { ascending: true });
      
      if (error) {
        console.error(`❌ Error en ${tabla}:`, error.message);
        sqlContent += `-- ERROR obteniendo datos de ${tabla}: ${error.message}\n\n`;
        continue;
      }
      
      if (data && data.length > 0) {
        const columnas = Object.keys(data[0]);
        const columnasStr = columnas.map(col => `"${col}"`).join(', ');
        
        sqlContent += `-- ============================================\n`;
        sqlContent += `-- BACKUP DE TABLA: ${tabla}\n`;
        sqlContent += `-- Total de registros: ${data.length}\n`;
        sqlContent += `-- ============================================\n\n`;
        
        data.forEach(registro => {
          const valores = columnas.map(col => {
            const valor = registro[col];
            if (valor === null || valor === undefined) {
              return 'NULL';
            }
            if (typeof valor === 'string') {
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
          
          sqlContent += `INSERT INTO ${tabla} (${columnasStr}) VALUES (${valores.join(', ')});\n`;
        });
        
        sqlContent += `\n`;
        tablasIncluidas.push(tabla);
        totalRegistros += data.length;
        console.log(`✅ ${tabla}: ${data.length} registros`);
      } else {
        sqlContent += `-- Tabla ${tabla}: Sin datos\n\n`;
        console.log(`⚠️ ${tabla}: Sin datos`);
      }
    } catch (error) {
      console.error(`❌ Error procesando ${tabla}:`, error.message);
      sqlContent += `-- ERROR en tabla ${tabla}: ${error.message}\n\n`;
    }
  }
  
  sqlContent += `-- =====================================================\n`;
  sqlContent += `-- FIN DEL BACKUP SQL\n`;
  sqlContent += `-- Total de tablas respaldadas: ${tablasIncluidas.length}\n`;
  sqlContent += `-- Total de registros: ${totalRegistros}\n`;
  sqlContent += `-- =====================================================\n`;
  
  return { sqlContent, tablasIncluidas, totalRegistros };
}

// Función para descargar todas las imágenes
async function descargarTodasLasImagenes(carpetaImagenes) {
  console.log('\n📸 Descargando todas las imágenes...');
  
  try {
    // Listar todas las imágenes del bucket
    const { data: archivos, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list();
    
    if (listError) {
      if (listError.message.includes('not found') || listError.message.includes('does not exist')) {
        console.log('⚠️ El bucket "remitos-fotos" no existe o está vacío');
        return { descargadas: 0, total: 0, errores: [] };
      }
      throw listError;
    }
    
    if (!archivos || archivos.length === 0) {
      console.log('✅ No hay imágenes para respaldar');
      return { descargadas: 0, total: 0, errores: [] };
    }
    
    console.log(`📋 Encontradas ${archivos.length} imagen(es) en el bucket`);
    
    const errores = [];
    let descargadas = 0;
    
    // Crear carpeta de imágenes si no existe
    if (!fs.existsSync(carpetaImagenes)) {
      fs.mkdirSync(carpetaImagenes, { recursive: true });
    }
    
    // Descargar cada imagen
    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];
      const nombreArchivo = archivo.name;
      
      try {
        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(nombreArchivo);
        
        // Ruta de destino
        const rutaDestino = path.join(carpetaImagenes, nombreArchivo);
        
        // Descargar imagen
        await descargarImagen(publicUrl, rutaDestino);
        descargadas++;
        
        if ((i + 1) % 10 === 0 || i === archivos.length - 1) {
          console.log(`📥 Descargadas ${i + 1}/${archivos.length} imágenes...`);
        }
      } catch (error) {
        console.error(`❌ Error descargando ${nombreArchivo}:`, error.message);
        errores.push({ archivo: nombreArchivo, error: error.message });
      }
    }
    
    console.log(`✅ ${descargadas}/${archivos.length} imagen(es) descargada(s)`);
    
    if (errores.length > 0) {
      console.log(`⚠️ ${errores.length} error(es) al descargar imágenes`);
    }
    
    return { descargadas, total: archivos.length, errores };
  } catch (error) {
    console.error('❌ Error descargando imágenes:', error.message);
    return { descargadas: 0, total: 0, errores: [{ archivo: 'general', error: error.message }] };
  }
}

// Función principal
async function ejecutarBackupCompleto() {
  const fecha = new Date();
  const fechaStr = fecha.toISOString().split('T')[0];
  const horaStr = fecha.toTimeString().split(' ')[0].replace(/:/g, '');
  const prefijoBackup = `backup_completo_${fechaStr}_${horaStr}`;
  
  console.log('='.repeat(60));
  console.log('💾 BACKUP COMPLETO: BASE DE DATOS + IMÁGENES');
  console.log('='.repeat(60));
  console.log(`📅 Fecha: ${fecha.toLocaleString('es-AR')}`);
  console.log(`📁 Prefijo: ${prefijoBackup}`);
  
  try {
    // Encontrar carpeta de destino
    const carpetaDestino = encontrarCarpetaGoogleDrive();
    console.log(`📂 Carpeta destino: ${carpetaDestino}`);
    
    // Crear carpeta temporal para este backup
    const carpetaTempBackup = path.join(carpetaDestino, prefijoBackup);
    if (!fs.existsSync(carpetaTempBackup)) {
      fs.mkdirSync(carpetaTempBackup, { recursive: true });
    }
    
    const carpetaImagenes = path.join(carpetaTempBackup, 'imagenes');
    
    // Paso 1: Generar backup SQL
    const { sqlContent, tablasIncluidas, totalRegistros } = await generarBackupSQL();
    
    // Guardar SQL
    const archivoSQL = path.join(carpetaTempBackup, 'backup_database.sql');
    fs.writeFileSync(archivoSQL, sqlContent, 'utf8');
    const tamañoSQL = fs.statSync(archivoSQL).size;
    
    console.log(`✅ Backup SQL guardado: ${archivoSQL} (${(tamañoSQL / 1024).toFixed(2)} KB)`);
    
    // Paso 2: Descargar todas las imágenes
    const { descargadas, total, errores } = await descargarTodasLasImagenes(carpetaImagenes);
    
    // Crear archivo de información del backup
    const infoBackup = {
      fecha: fecha.toISOString(),
      fecha_legible: fecha.toLocaleString('es-AR'),
      sql: {
        archivo: 'backup_database.sql',
        tamaño_bytes: tamañoSQL,
        tablas: tablasIncluidas,
        total_registros: totalRegistros
      },
      imagenes: {
        total: total,
        descargadas: descargadas,
        errores: errores,
        carpeta: 'imagenes'
      }
    };
    
    const archivoInfo = path.join(carpetaTempBackup, 'info_backup.json');
    fs.writeFileSync(archivoInfo, JSON.stringify(infoBackup, null, 2), 'utf8');
    
    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('✅ BACKUP COMPLETO FINALIZADO');
    console.log('='.repeat(60));
    console.log(`📁 Carpeta: ${carpetaTempBackup}`);
    console.log(`📊 SQL: ${tablasIncluidas.length} tablas, ${totalRegistros} registros`);
    console.log(`📸 Imágenes: ${descargadas}/${total} descargadas`);
    console.log(`📄 Info: info_backup.json`);
    
    if (errores.length > 0) {
      console.log(`\n⚠️ Errores al descargar imágenes: ${errores.length}`);
      console.log('   Revisa info_backup.json para más detalles');
    }
    
    // Verificar si está en Google Drive
    const estaEnGoogleDrive = carpetaDestino.includes('Google Drive');
    if (estaEnGoogleDrive) {
      console.log('\n☁️ El backup se subirá automáticamente a Google Drive');
      console.log('   (Sincronización automática de Google Drive Desktop)');
    }
    
    console.log('='.repeat(60));
    
    return {
      success: true,
      carpeta: carpetaTempBackup,
      sql: {
        archivo: archivoSQL,
        tamaño: tamañoSQL,
        tablas: tablasIncluidas,
        registros: totalRegistros
      },
      imagenes: {
        descargadas,
        total,
        errores
      }
    };
    
  } catch (error) {
    console.error('\n❌ Error en backup completo:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarBackupCompleto()
    .then((resultado) => {
      console.log('\n✅ Script finalizado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script finalizado con errores');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { ejecutarBackupCompleto };

