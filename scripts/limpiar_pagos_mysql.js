const mysql = require('mysql2/promise');

async function limpiar() {
  const pool = mysql.createPool({
    host: '31.97.246.42',
    port: 3306,
    user: 'aserradero_user',
    password: 'Aserradero2025#',
    database: 'aserradero_db'
  });
  
  try {
    console.log('=== ANTES DE LIMPIAR ===');
    const [antes] = await pool.execute('SELECT COUNT(*) as cnt, COALESCE(SUM(monto), 0) as suma FROM pagos');
    console.log('Total pagos:', antes[0].cnt, '| Suma:', antes[0].suma);
    
    // Eliminar TODOS los pagos
    console.log('\n⏳ Eliminando todos los pagos...');
    await pool.execute('DELETE FROM pagos');
    
    console.log('\n=== DESPUÉS DE LIMPIAR ===');
    const [despues] = await pool.execute('SELECT COUNT(*) as cnt, COALESCE(SUM(monto), 0) as suma FROM pagos');
    console.log('Total pagos:', despues[0].cnt, '| Suma:', despues[0].suma);
    
    // También actualizar estado de todos los remitos a Pendiente
    console.log('\n⏳ Actualizando estados de remitos a Pendiente...');
    await pool.execute('UPDATE remitos SET monto_pagado = 0, estado_pago = "Pendiente"');
    
    console.log('\n✅ Limpieza completada');
    console.log('MySQL ahora tiene 0 pagos y todos los remitos están en Pendiente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

limpiar();

