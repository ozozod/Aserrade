const mysql = require('mysql2/promise');

async function contar() {
  const pool = mysql.createPool({
    host: '31.97.246.42',
    port: 3306,
    user: 'aserradero_user',
    password: 'Aserradero2025#',
    database: 'aserradero_db'
  });
  
  try {
    // Contar todos los pagos
    const [total] = await pool.execute('SELECT COUNT(*) as cnt, COALESCE(SUM(monto), 0) as suma FROM pagos');
    console.log('=== TODOS LOS PAGOS ===');
    console.log('Total:', total[0].cnt, '| Suma:', total[0].suma);
    
    // Pagos excluyendo REMITOS_DETALLE y cheques rebotados
    const [filtrado] = await pool.execute(`
      SELECT COUNT(*) as cnt, COALESCE(SUM(monto), 0) as suma 
      FROM pagos 
      WHERE (observaciones NOT LIKE '%REMITOS_DETALLE:%' OR observaciones IS NULL)
      AND (cheque_rebotado = 0 OR cheque_rebotado IS NULL)
    `);
    console.log('\n=== PAGOS FILTRADOS (sin REMITOS_DETALLE) ===');
    console.log('Total:', filtrado[0].cnt, '| Suma:', filtrado[0].suma);
    
    // Pagos de hoy
    const hoy = new Date().toISOString().split('T')[0];
    const [deHoy] = await pool.execute(`
      SELECT COUNT(*) as cnt, COALESCE(SUM(monto), 0) as suma 
      FROM pagos 
      WHERE fecha = ?
      AND (observaciones NOT LIKE '%REMITOS_DETALLE:%' OR observaciones IS NULL)
      AND (cheque_rebotado = 0 OR cheque_rebotado IS NULL)
    `, [hoy]);
    console.log('\n=== PAGOS DE HOY (' + hoy + ') ===');
    console.log('Total:', deHoy[0].cnt, '| Suma:', deHoy[0].suma);
    
    // Listar los últimos 10 pagos
    const [ultimos] = await pool.execute(`
      SELECT id, fecha, monto, SUBSTRING(observaciones, 1, 40) as obs
      FROM pagos
      ORDER BY id DESC
      LIMIT 10
    `);
    console.log('\n=== ÚLTIMOS 10 PAGOS ===');
    ultimos.forEach(p => console.log(`ID:${p.id} | ${p.fecha} | $${p.monto} | ${p.obs || 'N/A'}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

contar();

