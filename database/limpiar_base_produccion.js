// Script para limpiar base de datos de producción
// Elimina todos los datos excepto usuarios

const mysql = require('mysql2/promise');

const dbConfig = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db', // Base de datos de PRODUCCIÓN
  charset: 'utf8mb4'
};

async function limpiarBaseDatos() {
  let connection;
  try {
    console.log('🔌 Conectando a la base de datos de producción...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a aserradero_db\n');

    // Desactivar verificación de foreign keys temporalmente
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('🔓 Foreign keys desactivadas\n');

    // Eliminar datos en orden
    console.log('🗑️  Eliminando datos...\n');

    await connection.execute('TRUNCATE TABLE pagos');
    console.log('   ✓ Pagos eliminados');

    await connection.execute('TRUNCATE TABLE remito_articulos');
    console.log('   ✓ Remito_articulos eliminados');

    await connection.execute('TRUNCATE TABLE remitos');
    console.log('   ✓ Remitos eliminados');

    await connection.execute('TRUNCATE TABLE articulos');
    console.log('   ✓ Artículos eliminados');

    await connection.execute('TRUNCATE TABLE clientes');
    console.log('   ✓ Clientes eliminados');

    await connection.execute('TRUNCATE TABLE auditoria');
    console.log('   ✓ Auditoría eliminada\n');

    // Reactivar verificación de foreign keys
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🔒 Foreign keys reactivadas\n');

    // Verificar que solo queden usuarios
    console.log('📊 Verificando estado de las tablas...\n');
    const [resultados] = await connection.execute(`
      SELECT 
        'clientes' as tabla, COUNT(*) as registros FROM clientes
      UNION ALL
      SELECT 'articulos', COUNT(*) FROM articulos
      UNION ALL
      SELECT 'remitos', COUNT(*) FROM remitos
      UNION ALL
      SELECT 'remito_articulos', COUNT(*) FROM remito_articulos
      UNION ALL
      SELECT 'pagos', COUNT(*) FROM pagos
      UNION ALL
      SELECT 'auditoria', COUNT(*) FROM auditoria
      UNION ALL
      SELECT 'usuarios', COUNT(*) FROM usuarios
    `);

    resultados.forEach(row => {
      console.log(`   ${row.tabla.padEnd(20)}: ${row.registros} registros`);
    });

    console.log('\n✅ Base de datos limpiada exitosamente. Solo quedan usuarios.');
    
  } catch (error) {
    console.error('❌ Error al limpiar base de datos:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
limpiarBaseDatos();


