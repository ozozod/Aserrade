const mysql = require('mysql2/promise');

async function verificar() {
  const pool = mysql.createPool({
    host: '31.97.246.42',
    port: 3306,
    user: 'aserradero_user',
    password: 'Aserradero2025#',
    database: 'aserradero_db'
  });
  
  const hoy = new Date().toISOString().split('T')[0];
  console.log('=== FECHA DE HOY:', hoy, '===\n');
  
  try {
    // 1. Query exacta del resumen general CON filtro de fecha
    console.log('=== QUERY EXACTA DE getResumenGeneral (filtro HOY) ===');
    const [pagadoResult] = await pool.execute(`
      SELECT COALESCE(SUM(p.monto), 0) as total 
      FROM pagos p
      LEFT JOIN remitos r ON p.remito_id = r.id
      WHERE (p.observaciones NOT LIKE '%REMITOS_DETALLE:%' OR p.observaciones IS NULL)
      AND (p.cheque_rebotado = 0 OR p.cheque_rebotado IS NULL)
      AND (
        (p.fecha >= ? AND p.fecha <= ?) 
        OR 
        (r.fecha >= ? AND r.fecha <= ?)
      )
    `, [hoy, hoy, hoy, hoy]);
    console.log('Total Pagado (HOY):', pagadoResult[0].total);

    // 2. Query SIN filtro de fecha
    console.log('\n=== QUERY SIN FILTRO DE FECHA ===');
    const [sinFiltro] = await pool.execute(`
      SELECT COALESCE(SUM(p.monto), 0) as total 
      FROM pagos p
      LEFT JOIN remitos r ON p.remito_id = r.id
      WHERE (p.observaciones NOT LIKE '%REMITOS_DETALLE:%' OR p.observaciones IS NULL)
      AND (p.cheque_rebotado = 0 OR p.cheque_rebotado IS NULL)
    `);
    console.log('Total Pagado (TODOS):', sinFiltro[0].total);
    
    // 3. Listar pagos incluidos en el filtro de HOY
    console.log('\n=== PAGOS QUE SE SUMAN EN "HOY" ===');
    const [pagosHoy] = await pool.execute(`
      SELECT p.id, p.fecha, p.monto, SUBSTRING(p.observaciones, 1, 50) as obs, r.fecha as remito_fecha
      FROM pagos p
      LEFT JOIN remitos r ON p.remito_id = r.id
      WHERE (p.observaciones NOT LIKE '%REMITOS_DETALLE:%' OR p.observaciones IS NULL)
      AND (p.cheque_rebotado = 0 OR p.cheque_rebotado IS NULL)
      AND (
        (p.fecha >= ? AND p.fecha <= ?) 
        OR 
        (r.fecha >= ? AND r.fecha <= ?)
      )
      ORDER BY p.monto DESC
    `, [hoy, hoy, hoy, hoy]);
    
    if (pagosHoy.length === 0) {
      console.log('No hay pagos para hoy');
    } else {
      pagosHoy.forEach(p => {
        const fechaPago = p.fecha ? new Date(p.fecha).toISOString().split('T')[0] : 'N/A';
        const fechaRemito = p.remito_fecha ? new Date(p.remito_fecha).toISOString().split('T')[0] : 'N/A';
        console.log(`ID:${p.id} | Pago:${fechaPago} | Remito:${fechaRemito} | $${p.monto} | ${p.obs || ''}`);
      });
    }
    
    // 4. Remitos de HOY
    console.log('\n=== REMITOS DE HOY ===');
    const [remitosHoy] = await pool.execute(`
      SELECT COUNT(*) as total FROM remitos WHERE fecha = ?
    `, [hoy]);
    console.log('Total remitos hoy:', remitosHoy[0].total);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificar();

