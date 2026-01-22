// Ajustar tabla remitos en desarrollo para que coincida con producción
const mysql = require('mysql2/promise');

const configDev = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_dev'
};

async function ajustar() {
  const conn = await mysql.createConnection(configDev);
  
  try {
    console.log('🔧 Ajustando tabla remitos en desarrollo...\n');
    
    // Cambiar numero_remito a numero y hacerlo NULL
    console.log('1. Cambiando numero_remito a numero...');
    await conn.execute('ALTER TABLE remitos CHANGE numero_remito numero VARCHAR(100) NULL');
    console.log('   ✅ Campo numero actualizado\n');
    
    // Cambiar total a precio_total
    console.log('2. Cambiando total a precio_total...');
    await conn.execute('ALTER TABLE remitos CHANGE total precio_total DECIMAL(15,2) NULL DEFAULT 0.00');
    console.log('   ✅ Campo precio_total actualizado\n');
    
    // Cambiar estado_pago de ENUM a VARCHAR
    console.log('3. Cambiando estado_pago a VARCHAR...');
    await conn.execute('ALTER TABLE remitos MODIFY estado_pago VARCHAR(50) NOT NULL DEFAULT "Pendiente"');
    console.log('   ✅ Campo estado_pago actualizado\n');
    
    // Cambiar foto_path a MEDIUMTEXT
    console.log('4. Cambiando foto_path a MEDIUMTEXT...');
    await conn.execute('ALTER TABLE remitos MODIFY foto_path MEDIUMTEXT NULL');
    console.log('   ✅ Campo foto_path actualizado\n');
    
    console.log('✅ Tabla remitos ajustada correctamente!');
    
    // Verificar estructura final
    console.log('\n📋 Estructura final:');
    const [cols] = await conn.execute('SHOW COLUMNS FROM remitos');
    cols.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await conn.end();
  }
}

ajustar();

