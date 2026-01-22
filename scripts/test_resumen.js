const mysql = require('mysql2/promise');

const dbConfig = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db'
};

async function test() {
  const pool = mysql.createPool(dbConfig);
  
  try {
    console.log('Probando getResumenGeneral...\n');
    
    // Verificar estructura de pagos
    console.log('=== ESTRUCTURA TABLA PAGOS ===');
    const [columns] = await pool.execute('DESCRIBE pagos');
    columns.forEach(c => console.log(`${c.Field}: ${c.Type}`));
    
    // Probar consulta de clientes
    console.log('\n=== CLIENTES ===');
    const [clientes] = await pool.execute('SELECT COUNT(*) as total FROM clientes');
    console.log('Total clientes:', clientes[0].total);
    
    // Probar consulta de remitos
    console.log('\n=== REMITOS ===');
    const [remitos] = await pool.execute('SELECT COUNT(*) as total FROM remitos');
    console.log('Total remitos:', remitos[0].total);
    
    // Probar consulta de facturado
    console.log('\n=== FACTURADO ===');
    const [facturado] = await pool.execute(`
      SELECT COALESCE(SUM(ra.precio_total), 0) as total 
      FROM remito_articulos ra
      INNER JOIN remitos r ON ra.remito_id = r.id
    `);
    console.log('Total facturado:', facturado[0].total);
    
    // Probar consulta de pagado
    console.log('\n=== PAGADO ===');
    const [pagado] = await pool.execute(`
      SELECT COALESCE(SUM(p.monto), 0) as total 
      FROM pagos p
      LEFT JOIN remitos r ON p.remito_id = r.id
      WHERE (p.observaciones NOT LIKE '%REMITOS_DETALLE:%' OR p.observaciones IS NULL)
      AND (p.cheque_rebotado = 0 OR p.cheque_rebotado IS NULL)
    `);
    console.log('Total pagado:', pagado[0].total);
    
    console.log('\n✅ Todas las consultas funcionan');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

test();

