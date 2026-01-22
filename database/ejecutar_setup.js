// Script para ejecutar setup de base de datos de desarrollo
// Se conecta directamente a MySQL de Hostinger y ejecuta el SQL

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuración de conexión - BASE DE DESARROLLO
const dbConfig = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_dev', // Base de desarrollo
  charset: 'utf8mb4',
  multipleStatements: true // Permite ejecutar múltiples statements
};

async function ejecutarSetup() {
  let connection;
  
  try {
    console.log('🔌 Conectando a MySQL Hostinger...');
    
    // Primero conectarse sin especificar base de datos para crearla si no existe
    const connectionRoot = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true
    });
    
    console.log('✅ Conectado a MySQL');
    
    // Crear base de datos si no existe
    console.log('📦 Creando base de datos aserradero_dev si no existe...');
    await connectionRoot.execute(
      'CREATE DATABASE IF NOT EXISTS aserradero_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
    );
    console.log('✅ Base de datos verificada/creada');
    
    await connectionRoot.end();
    
    // Ahora conectarse a la base de datos específica
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a aserradero_dev');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'setup_desarrollo_completo.sql');
    console.log('📖 Leyendo archivo SQL...');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar el SQL (sin las líneas de CREATE DATABASE y USE que ya hicimos)
    const sqlLimpio = sql
      .replace(/CREATE DATABASE.*?;/gi, '')
      .replace(/USE aserradero_dev;/gi, '')
      .trim();
    
    // Dividir en statements individuales y ejecutar uno por uno
    const statements = sqlLimpio
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`🚀 Ejecutando ${statements.length} statements SQL...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      // Saltar comentarios y SELECT de verificación
      if (statement.startsWith('--') || statement.toUpperCase().startsWith('SELECT')) {
        continue;
      }
      
      try {
        await connection.query(statement);
        if (i % 5 === 0) {
          console.log(`   Progreso: ${i + 1}/${statements.length} statements...`);
        }
      } catch (error) {
        // Si es error de índice duplicado, ignorar
        if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('Duplicate key name')) {
          console.log(`   ⚠️ Índice ya existe, continuando...`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Script ejecutado correctamente!');
    
    // Verificar tablas creadas
    console.log('\n📋 Verificando tablas creadas...');
    const [tablas] = await connection.execute('SHOW TABLES');
    console.log(`✅ Tablas encontradas: ${tablas.length}`);
    tablas.forEach(t => {
      console.log(`   - ${Object.values(t)[0]}`);
    });
    
    // Verificar usuario admin
    console.log('\n👤 Verificando usuario admin...');
    const [usuarios] = await connection.execute('SELECT * FROM usuarios WHERE username = ?', ['admin']);
    if (usuarios.length > 0) {
      console.log('✅ Usuario admin creado:');
      console.log(`   - Usuario: ${usuarios[0].username}`);
      console.log(`   - Nombre: ${usuarios[0].nombre_completo}`);
      console.log(`   - Rol: ${usuarios[0].rol}`);
      console.log(`   - Contraseña: admin123`);
    } else {
      console.log('⚠️ Usuario admin no encontrado');
    }
    
    console.log('\n🎉 ¡Base de datos de desarrollo configurada correctamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Ejecutar la app: npm run dev');
    console.log('   2. Login con usuario: admin / contraseña: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.sql) {
      console.error('SQL Error:', error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
ejecutarSetup();

