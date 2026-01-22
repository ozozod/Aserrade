const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db'
});

async function verificar() {
  try {
    const [total] = await pool.execute('SELECT COUNT(*) as cnt FROM pagos');
    console.log('Total pagos en MySQL:', total[0].cnt);
    
    const [pagos] = await pool.execute('SELECT id, fecha, monto, observaciones FROM pagos LIMIT 10');
    console.log('\nPrimeros 10 pagos:');
    pagos.forEach(p => {
      const obs = (p.observaciones || '').substring(0, 50);
      const esOculto = obs.includes('[OCULTO]');
      const tieneRemitosDetalle = obs.includes('REMITOS_DETALLE');
      console.log(`ID:${p.id} | ${p.fecha} | $${p.monto} | OCULTO:${esOculto} | REMITOS_DETALLE:${tieneRemitosDetalle} | ${obs}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificar();

