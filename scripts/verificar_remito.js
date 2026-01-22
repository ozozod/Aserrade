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
    // Buscar todos los pagos del remito 29 (N°29167632)
    console.log('=== REMITO 29 (N°29167632) ===\n');
    const [pagos29] = await pool.execute(
      `SELECT * FROM pagos WHERE remito_id = 29`
    );
    console.log('Pagos encontrados:', pagos29.length);
    pagos29.forEach(p => {
      console.log(`ID:${p.id} | Monto:${p.monto} | Obs:${p.observaciones?.substring(0,80)}`);
    });
    
    // Buscar pagos que mencionen el remito en REMITOS_DETALLE
    console.log('\n=== PAGOS QUE MENCIONAN REMITO_ID:29 EN REMITOS_DETALLE ===\n');
    const [detalle29] = await pool.execute(
      `SELECT * FROM pagos WHERE observaciones LIKE '%"remito_id":29%' OR observaciones LIKE '%"remito_id": 29%'`
    );
    detalle29.forEach(p => {
      console.log(`ID:${p.id} | Remito:${p.remito_id} | Monto:${p.monto}`);
      console.log(`  Obs: ${p.observaciones?.substring(0,150)}`);
    });
    
    // Mostrar info del remito 29
    console.log('\n=== INFO REMITO 29 ===\n');
    const [remito] = await pool.execute(
      `SELECT * FROM remitos WHERE id = 29`
    );
    console.log(remito[0]);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

verificar();

