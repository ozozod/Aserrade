// Script para verificar timezone en MySQL
const mysql = require('mysql2/promise');

const dbConfig = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db'
};

async function verificar() {
  console.log('🕐 Verificando zona horaria en MySQL...\n');
  
  const connection = await mysql.createConnection(dbConfig);
  
  // Verificar timezone del servidor
  const [tz] = await connection.execute("SELECT @@global.time_zone as global_tz, @@session.time_zone as session_tz, NOW() as hora_mysql");
  console.log('Zona horaria global:', tz[0].global_tz);
  console.log('Zona horaria sesión:', tz[0].session_tz);
  console.log('Hora actual MySQL:', tz[0].hora_mysql);
  console.log('Hora local PC:', new Date().toLocaleString('es-AR'));
  
  await connection.end();
}

verificar().catch(console.error);

