// Script mejorado para copiar datos de producción a desarrollo
// Solo copia columnas que existen en ambas tablas
const mysql = require('mysql2/promise');

const configProduccion = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db'
};

const configDesarrollo = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_dev'
};

async function obtenerColumnas(connection, tabla) {
  const [columnas] = await connection.execute(`SHOW COLUMNS FROM ${tabla}`);
  return columnas.map(c => c.Field);
}

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
      
      // Verificar que ambas tablas existen
      try {
        await connProd.execute(`SELECT 1 FROM ${tabla} LIMIT 1`);
        await connDev.execute(`SELECT 1 FROM ${tabla} LIMIT 1`);
      } catch (error) {
        console.log(`   ⚠️ Tabla ${tabla} no existe en una de las bases, saltando...\n`);
        continue;
      }
      
      // Obtener columnas de ambas tablas
      const columnasProd = await obtenerColumnas(connProd, tabla);
      const columnasDev = await obtenerColumnas(connDev, tabla);
      
      // Solo usar columnas que existen en ambas
      const columnasComunes = columnasProd.filter(col => columnasDev.includes(col));
      console.log(`   - Columnas comunes: ${columnasComunes.length} de ${columnasProd.length}`);
      
      if (columnasComunes.length === 0) {
        console.log(`   ⚠️ No hay columnas comunes, saltando...\n`);
        continue;
      }
      
      // Obtener datos de producción (solo columnas comunes)
      const [datos] = await connProd.execute(`SELECT ${columnasComunes.join(', ')} FROM ${tabla}`);
      console.log(`   - Encontrados ${datos.length} registros en producción`);
      
      if (datos.length === 0) {
        console.log(`   ✅ Tabla ${tabla} copiada (vacía)\n`);
        continue;
      }
      
      // Desactivar restricciones temporalmente
      await connDev.execute('SET FOREIGN_KEY_CHECKS = 0');
      
      // Limpiar tabla de desarrollo
      await connDev.execute(`TRUNCATE TABLE ${tabla}`);
      console.log(`   - Tabla ${tabla} limpiada en desarrollo`);
      
      // Construir query de inserción
      const placeholders = columnasComunes.map(() => '?').join(', ');
      const query = `INSERT INTO ${tabla} (${columnasComunes.join(', ')}) VALUES (${placeholders})`;
      
      // Insertar datos
      let insertados = 0;
      let errores = 0;
      
      for (const registro of datos) {
        const valores = columnasComunes.map(col => {
          const valor = registro[col];
          // Manejar fechas
          if (valor instanceof Date) {
            return valor.toISOString().split('T')[0];
          }
          return valor === null ? null : valor;
        });
        
        try {
          await connDev.execute(query, valores);
          insertados++;
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            // Intentar con INSERT IGNORE
            const queryIgnore = `INSERT IGNORE INTO ${tabla} (${columnasComunes.join(', ')}) VALUES (${placeholders})`;
            await connDev.execute(queryIgnore, valores);
            insertados++;
          } else {
            console.log(`   ⚠️ Error insertando registro: ${error.message}`);
            errores++;
          }
        }
      }
      
      // Reactivar restricciones
      await connDev.execute('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log(`   ✅ ${insertados} registros copiados${errores > 0 ? `, ${errores} errores` : ''}\n`);
    }
    
    // Verificar datos copiados
    console.log('📊 Verificación de datos copiados:');
    for (const tabla of tablas) {
      try {
        const [count] = await connDev.execute(`SELECT COUNT(*) as total FROM ${tabla}`);
        console.log(`   - ${tabla}: ${count[0].total} registros`);
      } catch (error) {
        console.log(`   - ${tabla}: Error al contar`);
      }
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

