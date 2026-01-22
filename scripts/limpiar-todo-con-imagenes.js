/**
 * Script para borrar TODOS los datos Y las imágenes de Supabase
 * 
 * Este script:
 * 1. Borra todas las imágenes del bucket 'remitos-fotos' en Supabase Storage
 * 2. Borra todos los datos de las tablas
 * 3. Reinicia todos los contadores (secuencias) a 1
 * 
 * USO:
 * node scripts/limpiar-todo-con-imagenes.js
 * 
 * ⚠️ ADVERTENCIA: Esto eliminará TODOS los datos e imágenes permanentemente.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Función para cargar credenciales de Supabase desde múltiples fuentes
function cargarCredencialesSupabase() {
  // 1. Intentar desde .env (variables REACT_APP_)
  let SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
  let SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  if (SUPABASE_URL && SUPABASE_KEY) {
    console.log('✅ Credenciales cargadas desde .env');
    return { url: SUPABASE_URL, key: SUPABASE_KEY };
  }
  
  // 2. Intentar desde config.json (usado por Electron)
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
  
  // 3. Valores por defecto (desarrollo - del código fuente)
  const defaultUrl = 'https://uoisgayimsbqugablshq.supabase.co';
  const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaXNnYXlpbXNicXVnYWJsc2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDE3MjEsImV4cCI6MjA3OTIxNzcyMX0.Aswdut5lDyocIqyfksjTXmi_CaUevaAAGIv_kv7ygew';
  
  console.log('⚠️ Usando credenciales por defecto (desarrollo)');
  return { url: defaultUrl, key: defaultKey };
}

// Cargar credenciales
const credenciales = cargarCredencialesSupabase();
const supabase = createClient(credenciales.url, credenciales.key);

const BUCKET_NAME = 'remitos-fotos';

// Función para borrar todas las imágenes del Storage
async function borrarTodasLasImagenes() {
  console.log('\n📸 PASO 1: Borrando todas las imágenes del Storage...');
  
  try {
    // Listar todos los archivos en el bucket
    const { data: archivos, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list();
    
    if (listError) {
      if (listError.message.includes('not found') || listError.message.includes('does not exist')) {
        console.log('⚠️ El bucket "remitos-fotos" no existe o está vacío');
        return { borrados: 0, total: 0 };
      }
      throw listError;
    }
    
    if (!archivos || archivos.length === 0) {
      console.log('✅ No hay imágenes para borrar');
      return { borrados: 0, total: 0 };
    }
    
    console.log(`📋 Encontradas ${archivos.length} imagen(es) en el bucket`);
    
    // Extraer solo los nombres de los archivos
    const nombresArchivos = archivos.map(archivo => archivo.name);
    
    // Borrar todos los archivos
    const { data: borrados, error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(nombresArchivos);
    
    if (deleteError) {
      throw deleteError;
    }
    
    console.log(`✅ ${nombresArchivos.length} imagen(es) borrada(s) del Storage`);
    return { borrados: nombresArchivos.length, total: nombresArchivos.length };
    
  } catch (error) {
    console.error('❌ Error borrando imágenes:', error.message);
    // Continuar aunque falle, para que al menos borre los datos
    return { borrados: 0, total: 0, error: error.message };
  }
}

// Función para borrar todos los datos de las tablas
async function borrarTodosLosDatos() {
  console.log('\n🗑️ PASO 2: Borrando todos los datos de las tablas...');
  
  try {
    // Borrar en orden para respetar claves foráneas
    const tablas = ['pagos', 'remito_articulos', 'remitos', 'articulos', 'clientes'];
    
    for (const tabla of tablas) {
      const { error } = await supabase
        .from(tabla)
        .delete()
        .neq('id', 0); // Borrar todos (usando una condición que siempre es verdadera)
      
      if (error) {
        console.error(`❌ Error borrando ${tabla}:`, error.message);
      } else {
        console.log(`✅ ${tabla}: datos borrados`);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error borrando datos:', error.message);
    throw error;
  }
}

// Función para reiniciar los contadores
async function reiniciarContadores() {
  console.log('\n🔄 PASO 3: Reiniciando contadores (secuencias)...');
  
  try {
    const secuencias = [
      'clientes_id_seq',
      'articulos_id_seq',
      'remitos_id_seq',
      'remito_articulos_id_seq',
      'pagos_id_seq'
    ];
    
    for (const seq of secuencias) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `ALTER SEQUENCE ${seq} RESTART WITH 1;`
      });
      
      // Si la función RPC no existe, intentar directamente con SQL
      if (error && error.message.includes('function') && error.message.includes('not found')) {
        // Intentar con una consulta directa (puede que no funcione dependiendo de permisos)
        console.log(`⚠️ No se pudo reiniciar ${seq} automáticamente`);
        console.log(`   Ejecuta manualmente: ALTER SEQUENCE ${seq} RESTART WITH 1;`);
      } else if (error) {
        console.error(`❌ Error reiniciando ${seq}:`, error.message);
      } else {
        console.log(`✅ ${seq}: reiniciado a 1`);
      }
    }
    
    // Alternativa: usar SQL directo si tenemos acceso
    console.log('\n💡 Si los contadores no se reiniciaron, ejecuta este SQL en Supabase:');
    console.log('   supabase/limpiar_todo_reiniciar.sql');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error reiniciando contadores:', error.message);
    console.log('\n💡 Ejecuta el script SQL manualmente para reiniciar contadores:');
    console.log('   supabase/limpiar_todo_reiniciar.sql');
  }
}

// Función para verificar que todo esté limpio
async function verificarLimpieza() {
  console.log('\n✅ PASO 4: Verificando limpieza...');
  
  try {
    const tablas = ['clientes', 'articulos', 'remitos', 'remito_articulos', 'pagos'];
    
    for (const tabla of tablas) {
      const { count, error } = await supabase
        .from(tabla)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ Error verificando ${tabla}:`, error.message);
      } else {
        console.log(`   ${tabla}: ${count} registro(s)`);
      }
    }
    
    // Verificar imágenes
    const { data: archivos } = await supabase.storage
      .from(BUCKET_NAME)
      .list();
    
    const totalImagenes = archivos ? archivos.length : 0;
    console.log(`   Imágenes en Storage: ${totalImagenes}`);
    
  } catch (error) {
    console.error('❌ Error en verificación:', error.message);
  }
}

// Función principal
async function limpiarTodo() {
  console.log('='.repeat(60));
  console.log('🧹 LIMPIEZA COMPLETA DE BASE DE DATOS E IMÁGENES');
  console.log('='.repeat(60));
  console.log('⚠️ ADVERTENCIA: Esto eliminará TODOS los datos e imágenes');
  console.log('='.repeat(60));
  
  try {
    // Paso 1: Borrar imágenes
    const resultadoImagenes = await borrarTodasLasImagenes();
    
    // Paso 2: Borrar datos
    await borrarTodosLosDatos();
    
    // Paso 3: Reiniciar contadores (puede requerir ejecución manual del SQL)
    await reiniciarContadores();
    
    // Paso 4: Verificar
    await verificarLimpieza();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ LIMPIEZA COMPLETA FINALIZADA');
    console.log('='.repeat(60));
    console.log(`📸 Imágenes borradas: ${resultadoImagenes.borrados}`);
    console.log('🗑️ Datos borrados: ✅');
    console.log('🔄 Contadores: Verifica ejecutando el SQL manualmente');
    console.log('\n💡 Si los contadores no se reiniciaron automáticamente,');
    console.log('   ejecuta: supabase/limpiar_todo_reiniciar.sql en Supabase SQL Editor');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error en limpieza completa:', error);
    console.error('   Algunos datos pueden no haberse borrado correctamente');
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  limpiarTodo()
    .then(() => {
      console.log('\n✅ Script finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script finalizado con errores');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { limpiarTodo };
