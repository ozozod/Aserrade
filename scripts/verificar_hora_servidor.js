// Verificar hora del servidor MySQL
const mysql = require('mysql2/promise');

const dbConfig = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db'
};

async function verificar() {
  const connection = await mysql.createConnection(dbConfig);
  
  const [result] = await connection.execute("SELECT NOW() as hora_servidor");
  const horaServidor = new Date(result[0].hora_servidor);
  
  // Hora Argentina (UTC-3)
  const horaArgentina = new Date();
  
  console.log('🕐 COMPARACIÓN DE HORAS:');
  console.log('========================');
  console.log(`Servidor MySQL:  ${horaServidor.toISOString()}`);
  console.log(`Tu PC (Argentina): ${horaArgentina.toLocaleString('es-AR')}`);
  console.log('');
  
  // Calcular diferencia
  const diffHoras = Math.round((horaServidor - horaArgentina) / (1000 * 60 * 60));
  console.log(`Diferencia: ${diffHoras} horas`);
  console.log('');
  
  // Calcular qué hora de Argentina son las 3:00 del servidor
  console.log('📅 Si el backup es a las 3:00 AM del servidor:');
  const backup3AM = 3; // 3:00 AM servidor
  const backupArgentina = backup3AM - diffHoras;
  console.log(`   En Argentina serían las ${backupArgentina < 0 ? backupArgentina + 24 : backupArgentina}:00 hs`);
  
  await connection.end();
}

verificar().catch(console.error);

