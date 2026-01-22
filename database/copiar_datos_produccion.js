// Script para copiar datos de producción (aserradero_db) a desarrollo (aserradero_dev)
const mysql = require('mysql2/promise');

const configProduccion = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db' // PRODUCCIÓN
};

const configDesarrollo = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_dev' // DESARROLLO
};

async function copiarDatos() {
  let connProd, connDev;
  
  try {
    console.log('🔌 Conectando a bases de datos...');
    connProd = await mysql.createConnection(configProduccion);
    connDev = await mysql.createConnection(configDesarrollo);
    console.log('✅ Conectado a ambas bases de datos\n');
    
    const tablas = ['clientes', 'articulos', 'remitos', 'remito_articulos', 'pagos'];
    
    for (const tabla of tablas) {
      console.log(`📋 Copiando tabla: ${tabla}...`);
      
      // Obtener datos de producción
      const [datos] = await connProd.execute(`SELECT * FROM ${tabla}`);
      console.log(`   - Encontrados ${datos.length} registros en producción`);
      
      if (datos.length === 0) {
        console.log(`   ⚠️ Tabla ${tabla} está vacía en producción, saltando...\n`);
        continue;
      }
      
      // Desactivar restricciones de claves foráneas temporalmente
      await connDev.execute('SET FOREIGN_KEY_CHECKS = 0');
      
      // Limpiar tabla de desarrollo
      await connDev.execute(`TRUNCATE TABLE ${tabla}`);
      console.log(`   - Tabla ${tabla} limpiada en desarrollo`);
      
      if (datos.length === 0) {
        await connDev.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log(`   ✅ Tabla ${tabla} copiada (vacía)\n`);
        continue;
      }
      
      // Obtener nombres de columnas
      const [columnas] = await connProd.execute(`SHOW COLUMNS FROM ${tabla}`);
      const nombresColumnas = columnas.map(c => c.Field);
      
      // Construir query de inserción
      const placeholders = nombresColumnas.map(() => '?').join(', ');
      const query = `INSERT INTO ${tabla} (${nombresColumnas.join(', ')}) VALUES (${placeholders})`;
      
      // Insertar datos en lotes para mejor performance
      const batchSize = 100;
      for (let i = 0; i < datos.length; i += batchSize) {
        const batch = datos.slice(i, i + batchSize);
        const values = batch.map(registro => 
          nombresColumnas.map(col => registro[col] === null ? null : registro[col])
        );
        
        // Insertar lote
        for (const registro of batch) {
          const valores = nombresColumnas.map(col => {
            const valor = registro[col];
            // Manejar fechas y otros tipos especiales
            if (valor instanceof Date) {
              return valor.toISOString().split('T')[0];
            }
            return valor === null ? null : valor;
          });
          
          try {
            await connDev.execute(query, valores);
          } catch (error) {
            // Si es error de duplicado, usar INSERT IGNORE o UPDATE
            if (error.code === 'ER_DUP_ENTRY') {
              console.log(`   ⚠️ Registro duplicado ignorado (ID: ${registro.id || 'N/A'})`);
              // Intentar con INSERT IGNORE
              const queryIgnore = `INSERT IGNORE INTO ${tabla} (${nombresColumnas.join(', ')}) VALUES (${placeholders})`;
              await connDev.execute(queryIgnore, valores);
            } else {
              throw error;
            }
          }
        }
      }
      
      // Reactivar restricciones
      await connDev.execute('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log(`   ✅ ${datos.length} registros copiados a desarrollo\n`);
    }
    
    // Verificar datos copiados
    console.log('📊 Verificación de datos copiados:');
    for (const tabla of tablas) {
      const [count] = await connDev.execute(`SELECT COUNT(*) as total FROM ${tabla}`);
      console.log(`   - ${tabla}: ${count[0].total} registros`);
    }
    
    console.log('\n✅ ¡Datos copiados correctamente de producción a desarrollo!');
    console.log('\n⚠️ IMPORTANTE: Los datos en desarrollo son una copia de producción.');
    console.log('   Cualquier cambio en desarrollo NO afectará producción.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
  } finally {
    if (connProd) await connProd.end();
    if (connDev) await connDev.end();
    console.log('🔌 Conexiones cerradas');
  }
}

copiarDatos();

