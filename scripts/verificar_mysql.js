// Script para verificar datos en MySQL de Hostinger
const mysql = require('mysql2/promise');

const dbConfig = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db'
};

async function verificar() {
  console.log('🔍 Conectando a MySQL Hostinger...\n');
  
  const connection = await mysql.createConnection(dbConfig);
  
  // Verificar pagos
  console.log('📋 PAGOS EN MYSQL:');
  console.log('==================');
  const [pagos] = await connection.execute('SELECT id, remito_id, fecha, monto, observaciones FROM pagos ORDER BY id');
  
  pagos.forEach(p => {
    const tieneOculto = p.observaciones && p.observaciones.includes('[OCULTO]');
    console.log(`ID: ${p.id} | Monto: ${p.monto} | Oculto: ${tieneOculto ? 'SÍ' : 'NO'}`);
    console.log(`   Obs: ${p.observaciones ? p.observaciones.substring(0, 80) : 'NULL'}...`);
    console.log('');
  });
  
  console.log('\n📊 RESUMEN:');
  const conOculto = pagos.filter(p => p.observaciones && p.observaciones.includes('[OCULTO]')).length;
  const sinOculto = pagos.filter(p => !p.observaciones || !p.observaciones.includes('[OCULTO]')).length;
  console.log(`   Total pagos: ${pagos.length}`);
  console.log(`   Con [OCULTO]: ${conOculto}`);
  console.log(`   Sin [OCULTO]: ${sinOculto} (estos se muestran en la app)`);
  
  await connection.end();
  console.log('\n✅ Verificación completada');
}

verificar().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

