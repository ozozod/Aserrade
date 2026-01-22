/**
 * Script para migrar datos desde Supabase (PostgreSQL) a Hostinger (MySQL)
 * 
 * Uso:
 * 1. Instalar dependencias: npm install mysql2 @supabase/supabase-js dotenv
 * 2. Crear archivo .env con las credenciales
 * 3. Ejecutar: node migrar_datos_supabase_a_hostinger.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuración desde variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uoisgayimsbqugablshq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'tu_key_aqui';

// Configuración MySQL (Hostinger)
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'usuario',
  password: process.env.MYSQL_PASSWORD || 'contraseña',
  database: process.env.MYSQL_DATABASE || 'aserradero_db',
  charset: 'utf8mb4'
};

// Inicializar clientes
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Escapa valores para SQL seguro
 */
function escapeSQL(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return value.toString();
  // Escapar comillas simples y barras invertidas
  return `'${String(value).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

/**
 * Genera INSERT SQL para una tabla
 */
function generateInsertSQL(tableName, rows) {
  if (!rows || rows.length === 0) return '';
  
  const columns = Object.keys(rows[0]);
  const sqlStatements = [];
  
  // Generar INSERT por lotes de 100 para mejor rendimiento
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const values = batch.map(row => 
      `(${columns.map(col => escapeSQL(row[col])).join(', ')})`
    ).join(',\n    ');
    
    sqlStatements.push(
      `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n    ${values};`
    );
  }
  
  return sqlStatements.join('\n\n');
}

/**
 * Migra datos de una tabla
 */
async function migrateTable(tableName, connection) {
  console.log(`\n📦 Migrando tabla: ${tableName}...`);
  
  try {
    // Obtener datos de Supabase
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      console.error(`❌ Error obteniendo datos de ${tableName}:`, error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log(`⚠️  No hay datos en ${tableName}`);
      return;
    }
    
    console.log(`   ✅ Obtenidos ${data.length} registros de Supabase`);
    
    // Limpiar tabla en MySQL (opcional, comentar si quieres mantener datos existentes)
    await connection.query(`TRUNCATE TABLE ${tableName}`);
    console.log(`   🗑️  Tabla ${tableName} limpiada`);
    
    // Generar SQL de inserción
    const insertSQL = generateInsertSQL(tableName, data);
    
    // Guardar en archivo
    const outputFile = path.join(__dirname, `datos_${tableName}.sql`);
    fs.writeFileSync(outputFile, `-- Datos migrados de Supabase para tabla ${tableName}\n-- Total: ${data.length} registros\n\n${insertSQL}\n`);
    console.log(`   💾 SQL guardado en: ${outputFile}`);
    
    // Insertar directamente en MySQL
    if (insertSQL) {
      const statements = insertSQL.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await connection.query(statement);
        }
      }
      console.log(`   ✅ Datos insertados en MySQL`);
    }
    
  } catch (error) {
    console.error(`❌ Error migrando ${tableName}:`, error.message);
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando migración de Supabase a Hostinger...\n');
  
  let connection;
  
  try {
    // Conectar a MySQL
    console.log('📡 Conectando a MySQL (Hostinger)...');
    connection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ Conectado a MySQL\n');
    
    // Orden de migración (respetando foreign keys)
    const tables = [
      'clientes',
      'articulos',
      'remitos',
      'remito_articulos',
      'pagos',
      'error_reports' // Si existe
    ];
    
    // Migrar cada tabla
    for (const table of tables) {
      await migrateTable(table, connection);
    }
    
    // Verificar migración
    console.log('\n📊 Verificando migración...\n');
    for (const table of tables) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ${table}: ${rows[0].count} registros`);
      } catch (error) {
        // Tabla no existe, ignorar
      }
    }
    
    console.log('\n✅ Migración completada exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
if (require.main === module) {
  main();
}

module.exports = { main };

