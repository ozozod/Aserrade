const mysql = require('mysql2/promise');

const dbConfig = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db'
};

async function verificar() {
  const pool = mysql.createPool(dbConfig);
  
  try {
    console.log('=== ÚLTIMOS 20 PAGOS ===\n');
    const [pagos] = await pool.execute(
      `SELECT p.id, p.remito_id, p.monto, p.fecha, 
              SUBSTRING(p.observaciones, 1, 50) as obs_corta,
              r.numero as remito_num
       FROM pagos p
       LEFT JOIN remitos r ON p.remito_id = r.id
       ORDER BY p.id DESC LIMIT 20`
    );
    
    pagos.forEach(p => {
      console.log(`ID:${p.id} | Remito:${p.remito_num || 'N/A'} | Monto:${p.monto} | Obs:${p.obs_corta || 'N/A'}`);
    });
    
    console.log('\n=== PAGOS CON REMITOS_DETALLE ===\n');
    const [conDetalle] = await pool.execute(
      `SELECT id, remito_id, monto, SUBSTRING(observaciones, 1, 60) as obs 
       FROM pagos 
       WHERE observaciones LIKE '%REMITOS_DETALLE:%'
       ORDER BY id DESC LIMIT 10`
    );
    conDetalle.forEach(p => {
      console.log(`ID:${p.id} | Remito:${p.remito_id} | Monto:${p.monto} | Obs:${p.obs}`);
    });
    
    console.log('\n=== PAGOS OCULTOS ===\n');
    const [ocultos] = await pool.execute(
      `SELECT id, remito_id, monto, SUBSTRING(observaciones, 1, 60) as obs 
       FROM pagos 
       WHERE observaciones LIKE '%[OCULTO]%'
       ORDER BY id DESC LIMIT 10`
    );
    ocultos.forEach(p => {
      console.log(`ID:${p.id} | Remito:${p.remito_id} | Monto:${p.monto} | Obs:${p.obs}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

verificar();

