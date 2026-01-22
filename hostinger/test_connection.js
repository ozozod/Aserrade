/**
 * Script para probar la conexión a MySQL de Hostinger
 * 
 * Uso:
 * 1. Crea archivo .env con las credenciales
 * 2. Ejecuta: node test_connection.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  charset: 'utf8mb4'
};

async function testConnection() {
  console.log('🔌 Probando conexión a MySQL (Hostinger)...\n');
  console.log('Configuración:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Usuario: ${config.user}`);
  console.log(`  Base de datos: ${config.database}\n`);

  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Conexión exitosa!\n');
    
    // Probar algunas queries
    console.log('📊 Verificando tablas...\n');
    
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`Tablas encontradas: ${tables.length}`);
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });
    
    console.log('\n📈 Conteo de registros:\n');
    
    const tableNames = ['clientes', 'articulos', 'remitos', 'remito_articulos', 'pagos'];
    for (const table of tableNames) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${rows[0].count} registros`);
      } catch (error) {
        console.log(`  ${table}: ❌ Tabla no existe`);
      }
    }
    
    console.log('\n✅ Todo funciona correctamente!');
    
  } catch (error) {
    console.error('\n❌ Error de conexión:', error.message);
    console.error('\nVerifica:');
    console.error('  1. Las credenciales en el archivo .env');
    console.error('  2. Que la base de datos exista');
    console.error('  3. Que el usuario tenga permisos');
    console.error('  4. Que el host sea correcto');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

testConnection();

