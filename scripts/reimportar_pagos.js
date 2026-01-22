// Script para reimportar pagos a MySQL de Hostinger
const mysql = require('mysql2/promise');
const { createClient } = require('@supabase/supabase-js');

const dbConfig = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db'
};

const supabaseUrl = 'https://uoisgayimsbqugablshq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaXNnYXlpbXNicXVnYWJsc2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDE3MjEsImV4cCI6MjA3OTIxNzcyMX0.Aswdut5lDyocIqyfksjTXmi_CaUevaAAGIv_kv7ygew';

async function reimportar() {
  console.log('🔄 Reimportando pagos de Supabase a MySQL...\n');
  
  // Conectar a ambas bases
  const supabase = createClient(supabaseUrl, supabaseKey);
  const connection = await mysql.createConnection(dbConfig);
  
  // Obtener pagos de Supabase
  console.log('📥 Obteniendo pagos de Supabase...');
  const { data: pagos, error } = await supabase.from('pagos').select('*');
  
  if (error) {
    console.error('Error obteniendo pagos:', error);
    return;
  }
  
  console.log(`   Encontrados ${pagos.length} pagos\n`);
  
  // Mostrar datos de Supabase
  console.log('📋 Datos de Supabase:');
  pagos.forEach(p => {
    console.log(`   ID ${p.id}: ${p.observaciones ? p.observaciones.substring(0, 60) : 'NULL'}...`);
  });
  
  // Borrar pagos existentes en MySQL
  console.log('\n🗑️  Borrando pagos existentes en MySQL...');
  await connection.execute('DELETE FROM pagos');
  
  // Insertar pagos nuevos
  console.log('📤 Insertando pagos en MySQL...');
  for (const pago of pagos) {
    const fecha = pago.fecha ? pago.fecha.split('T')[0] : null;
    const createdAt = pago.created_at ? pago.created_at.substring(0, 19).replace('T', ' ') : null;
    
    await connection.execute(
      'INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [pago.id, pago.remito_id, fecha, pago.monto, pago.observaciones, createdAt]
    );
    console.log(`   ✅ Pago ID ${pago.id} insertado`);
  }
  
  // Resetear AUTO_INCREMENT
  const maxId = Math.max(...pagos.map(p => p.id));
  await connection.execute(`ALTER TABLE pagos AUTO_INCREMENT = ${maxId + 1}`);
  
  // Verificar resultado
  console.log('\n🔍 Verificando datos en MySQL:');
  const [mysqlPagos] = await connection.execute('SELECT id, observaciones FROM pagos');
  mysqlPagos.forEach(p => {
    const tieneOculto = p.observaciones && p.observaciones.includes('[OCULTO]');
    console.log(`   ID ${p.id}: ${tieneOculto ? '✅ Tiene [OCULTO]' : '❌ NO tiene [OCULTO]'}`);
  });
  
  await connection.end();
  console.log('\n✅ Reimportación completada!');
  console.log('🔄 Ahora reiniciá la app de Electron');
}

reimportar().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

