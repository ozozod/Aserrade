// Crear usuario admin en la base de datos de desarrollo
const mysql = require('mysql2/promise');

const dbConfig = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_dev'
};

async function crearAdmin() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('👤 Creando usuario admin...');
    
    await connection.execute(
      `INSERT INTO usuarios (username, password_hash, nombre_completo, rol) 
       VALUES ('admin', 'admin123', 'Administrador', 'admin')
       ON DUPLICATE KEY UPDATE nombre_completo = 'Administrador', rol = 'admin'`
    );
    
    console.log('✅ Usuario admin creado/actualizado');
    
    // Verificar
    const [usuarios] = await connection.execute('SELECT * FROM usuarios WHERE username = ?', ['admin']);
    if (usuarios.length > 0) {
      console.log('\n📋 Usuario admin:');
      console.log(`   - Usuario: ${usuarios[0].username}`);
      console.log(`   - Contraseña: admin123`);
      console.log(`   - Nombre: ${usuarios[0].nombre_completo}`);
      console.log(`   - Rol: ${usuarios[0].rol}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

crearAdmin();

