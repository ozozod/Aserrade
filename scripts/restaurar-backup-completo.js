/**
 * Script para Restaurar Backup Completo: Base de Datos + Imágenes
 * 
 * Este script restaura un backup completo que incluye:
 * 1. Base de datos SQL (todas las tablas)
 * 2. Todas las imágenes del bucket 'remitos-fotos'
 * 
 * USO:
 * node scripts/restaurar-backup-completo.js "ruta/al/backup"
 * 
 * Ejemplo:
 * node scripts/restaurar-backup-completo.js "C:\Users\ozozo\Google Drive\Backups_Aserradero\backup_completo_2025-11-27_223000"
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function pregunta(pregunta) {
  return new Promise((resolve) => {
    rl.question(pregunta, (respuesta) => {
      resolve(respuesta);
    });
  });
}

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

// Función para ejecutar SQL en Supabase
async function ejecutarSQL(sqlContent) {
  // Dividir el SQL en statements individuales
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`📝 Ejecutando ${statements.length} sentencias SQL...`);
  
  let ejecutadas = 0;
  let errores = [];
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Saltar comentarios y líneas vacías
    if (statement.startsWith('--') || statement.length === 0) {
      continue;
    }
    
    try {
      // Ejecutar usando RPC si está disponible, o directamente
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        // Si la función RPC no existe, intentar ejecutar directamente
        if (error.message.includes('function') && error.message.includes('not found')) {
          // Intentar ejecutar directamente (puede que no funcione dependiendo de permisos)
          console.warn(`⚠️ No se puede ejecutar SQL directamente. Necesitas ejecutar manualmente en Supabase SQL Editor.`);
          console.warn(`   Statement ${i + 1}/${statements.length}: ${statement.substring(0, 100)}...`);
          errores.push({ statement: i + 1, error: 'RPC function not available' });
          continue;
        }
        
        // Si es un error de INSERT con duplicado, puede ser normal si ya existe
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
          console.log(`⚠️ Registro duplicado en statement ${i + 1} (puede ser normal): ${error.message.substring(0, 100)}`);
          ejecutadas++;
          continue;
        }
        
        throw error;
      }
      
      ejecutadas++;
      
      if ((i + 1) % 50 === 0) {
        console.log(`   Procesadas ${i + 1}/${statements.length} sentencias...`);
      }
    } catch (error) {
      console.error(`❌ Error en statement ${i + 1}:`, error.message);
      errores.push({ statement: i + 1, error: error.message, sql: statement.substring(0, 200) });
    }
  }
  
  return { ejecutadas, total: statements.length, errores };
}

// Función para subir imágenes al Storage
async function subirImagenes(carpetaImagenes) {
  console.log('\n📸 Subiendo imágenes al Storage...');
  
  if (!fs.existsSync(carpetaImagenes)) {
    console.log('⚠️ Carpeta de imágenes no existe:', carpetaImagenes);
    return { subidas: 0, total: 0, errores: [] };
  }
  
  const archivos = fs.readdirSync(carpetaImagenes)
    .filter(archivo => {
      const ext = path.extname(archivo).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
  
  if (archivos.length === 0) {
    console.log('✅ No hay imágenes para subir');
    return { subidas: 0, total: 0, errores: [] };
  }
  
  console.log(`📋 Encontradas ${archivos.length} imagen(es) para subir`);
  
  const errores = [];
  let subidas = 0;
  
  for (let i = 0; i < archivos.length; i++) {
    const archivo = archivos[i];
    const rutaCompleta = path.join(carpetaImagenes, archivo);
    
    try {
      // Leer archivo
      const buffer = fs.readFileSync(rutaCompleta);
      
      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(archivo, buffer, {
          contentType: `image/${path.extname(archivo).slice(1)}`,
          upsert: true // Sobrescribir si existe
        });
      
      if (error) {
        throw error;
      }
      
      subidas++;
      
      if ((i + 1) % 10 === 0 || i === archivos.length - 1) {
        console.log(`📤 Subidas ${i + 1}/${archivos.length} imágenes...`);
      }
    } catch (error) {
      console.error(`❌ Error subiendo ${archivo}:`, error.message);
      errores.push({ archivo, error: error.message });
    }
  }
  
  console.log(`✅ ${subidas}/${archivos.length} imagen(es) subida(s)`);
  
  if (errores.length > 0) {
    console.log(`⚠️ ${errores.length} error(es) al subir imágenes`);
  }
  
  return { subidas, total: archivos.length, errores };
}

// Función principal
async function restaurarBackup(rutaBackup) {
  console.log('='.repeat(60));
  console.log('🔄 RESTAURACIÓN DE BACKUP COMPLETO');
  console.log('='.repeat(60));
  console.log(`📁 Carpeta de backup: ${rutaBackup}`);
  
  // Verificar que la carpeta existe
  if (!fs.existsSync(rutaBackup)) {
    console.error(`❌ Error: La carpeta de backup no existe: ${rutaBackup}`);
    process.exit(1);
  }
  
  // Leer información del backup
  const archivoInfo = path.join(rutaBackup, 'info_backup.json');
  let infoBackup = null;
  
  if (fs.existsSync(archivoInfo)) {
    try {
      infoBackup = JSON.parse(fs.readFileSync(archivoInfo, 'utf8'));
      console.log(`📅 Fecha del backup: ${infoBackup.fecha_legible || infoBackup.fecha}`);
      console.log(`📊 Tablas: ${infoBackup.sql?.tablas?.join(', ') || 'N/A'}`);
      console.log(`📈 Registros: ${infoBackup.sql?.total_registros || 'N/A'}`);
      console.log(`📸 Imágenes: ${infoBackup.imagenes?.total || 0}`);
    } catch (error) {
      console.warn('⚠️ No se pudo leer info_backup.json:', error.message);
    }
  }
  
  // Confirmar restauración
  console.log('\n⚠️ ADVERTENCIA: Esta operación:');
  console.log('   1. Eliminará TODOS los datos actuales de las tablas');
  console.log('   2. Restaurará los datos del backup');
  console.log('   3. Reemplazará las imágenes en el Storage');
  
  const confirmar = await pregunta('\n¿Estás seguro de continuar? (escribe "SI" para confirmar): ');
  
  if (confirmar.toUpperCase() !== 'SI') {
    console.log('❌ Restauración cancelada');
    rl.close();
    return;
  }
  
  try {
    // Paso 1: Leer y ejecutar SQL
    const archivoSQL = path.join(rutaBackup, 'backup_database.sql');
    
    if (!fs.existsSync(archivoSQL)) {
      console.error(`❌ Error: No se encontró backup_database.sql en: ${rutaBackup}`);
      rl.close();
      process.exit(1);
    }
    
    console.log('\n📦 PASO 1: Restaurando base de datos SQL...');
    const sqlContent = fs.readFileSync(archivoSQL, 'utf8');
    
    // IMPORTANTE: El SQL debe ejecutarse manualmente en Supabase SQL Editor
    // porque no podemos ejecutar SQL arbitrario desde el cliente
    console.log('\n⚠️ IMPORTANTE: El SQL debe ejecutarse manualmente en Supabase SQL Editor');
    console.log('   1. Abre Supabase Dashboard → SQL Editor');
    console.log('   2. Copia y pega el contenido de: backup_database.sql');
    console.log('   3. Ejecuta el script');
    console.log(`\n📄 Archivo SQL: ${archivoSQL}`);
    
    const continuar = await pregunta('\n¿Ya ejecutaste el SQL manualmente? (s/n): ');
    
    if (continuar.toLowerCase() !== 's') {
      console.log('⚠️ Debes ejecutar el SQL primero. Restauración de imágenes cancelada.');
      rl.close();
      return;
    }
    
    // Paso 2: Subir imágenes
    const carpetaImagenes = path.join(rutaBackup, 'imagenes');
    
    if (fs.existsSync(carpetaImagenes)) {
      console.log('\n📸 PASO 2: Restaurando imágenes...');
      const resultadoImagenes = await subirImagenes(carpetaImagenes);
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ RESTAURACIÓN COMPLETA FINALIZADA');
      console.log('='.repeat(60));
      console.log(`📊 SQL: Ejecutado manualmente`);
      console.log(`📸 Imágenes: ${resultadoImagenes.subidas}/${resultadoImagenes.total} subidas`);
      
      if (resultadoImagenes.errores.length > 0) {
        console.log(`\n⚠️ Errores al subir imágenes: ${resultadoImagenes.errores.length}`);
        console.log('   Revisa los logs arriba para más detalles');
      }
      
      console.log('='.repeat(60));
    } else {
      console.log('\n⚠️ No se encontró carpeta de imágenes');
      console.log('✅ Restauración de SQL completada (ejecutada manualmente)');
    }
    
  } catch (error) {
    console.error('\n❌ Error en restauración:', error);
    throw error;
  } finally {
    rl.close();
  }
}

// Obtener ruta del backup desde argumentos o preguntar
const rutaBackupArg = process.argv[2];

if (rutaBackupArg) {
  restaurarBackup(rutaBackupArg)
    .then(() => {
      console.log('\n✅ Script finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script finalizado con errores');
      console.error(error);
      process.exit(1);
    });
} else {
  // Preguntar por la ruta
  pregunta('Ingresa la ruta completa de la carpeta de backup: ')
    .then((ruta) => {
      restaurarBackup(ruta.trim())
        .then(() => {
          console.log('\n✅ Script finalizado');
          process.exit(0);
        })
        .catch((error) => {
          console.error('\n❌ Script finalizado con errores');
          console.error(error);
          process.exit(1);
        });
    });
}

