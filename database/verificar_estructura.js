// Verificar estructura de tablas en producción vs desarrollo
const mysql = require('mysql2/promise');

const configProd = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db'
};

const configDev = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_dev'
};

async function verificar() {
  const connProd = await mysql.createConnection(configProd);
  const connDev = await mysql.createConnection(configDev);
  
  console.log('📋 Estructura de tabla REMITOS:\n');
  
  console.log('PRODUCCIÓN (aserradero_db):');
  const [colsProd] = await connProd.execute('SHOW COLUMNS FROM remitos');
  colsProd.forEach(col => {
    console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
  });
  
  console.log('\nDESARROLLO (aserradero_dev):');
  const [colsDev] = await connDev.execute('SHOW COLUMNS FROM remitos');
  colsDev.forEach(col => {
    console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
  });
  
  await connProd.end();
  await connDev.end();
}

verificar();

