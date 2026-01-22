const mysql = require('mysql2/promise');

// Configuración MySQL Producción
const pool = mysql.createPool({
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db'
});

async function limpiar() {
  console.log('🗑️  Limpiando base de datos de PRODUCCIÓN...\n');
  
  try {
    // Desactivar verificación de claves foráneas temporalmente
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Función auxiliar para contar registros (maneja tablas que no existen)
    const contarRegistros = async (tabla) => {
      try {
        const [result] = await pool.execute(`SELECT COUNT(*) as cnt FROM ${tabla}`);
        return result[0].cnt;
      } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
          return 'N/A (tabla no existe)';
        }
        throw error;
      }
    };
    
    // Función auxiliar para eliminar registros (maneja tablas que no existen)
    const eliminarRegistros = async (tabla) => {
      try {
        await pool.execute(`DELETE FROM ${tabla}`);
        return true;
      } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
          return false;
        }
        throw error;
      }
    };
    
    // Contar registros antes de eliminar
    console.log('📊 Contando registros actuales...');
    const pagosCount = await contarRegistros('pagos');
    const remitoArticulosCount = await contarRegistros('remito_articulos');
    const remitosCount = await contarRegistros('remitos');
    const articulosCount = await contarRegistros('articulos');
    const clientesCount = await contarRegistros('clientes');
    const auditoriaCount = await contarRegistros('auditoria');
    
    console.log(`   Pagos: ${pagosCount}`);
    console.log(`   Remito-Artículos: ${remitoArticulosCount}`);
    console.log(`   Remitos: ${remitosCount}`);
    console.log(`   Artículos: ${articulosCount}`);
    console.log(`   Clientes: ${clientesCount}`);
    console.log(`   Auditoría: ${auditoriaCount}\n`);
    
    // Eliminar datos en orden (respetando dependencias)
    console.log('⏳ Eliminando datos...');
    
    if (await eliminarRegistros('pagos')) {
      console.log('   ✅ Pagos eliminados');
    } else {
      console.log('   ⚠️  Tabla pagos no existe');
    }
    
    if (await eliminarRegistros('remito_articulos')) {
      console.log('   ✅ Remito-Artículos eliminados');
    } else {
      console.log('   ⚠️  Tabla remito_articulos no existe');
    }
    
    if (await eliminarRegistros('remitos')) {
      console.log('   ✅ Remitos eliminados');
    } else {
      console.log('   ⚠️  Tabla remitos no existe');
    }
    
    if (await eliminarRegistros('articulos')) {
      console.log('   ✅ Artículos eliminados');
    } else {
      console.log('   ⚠️  Tabla articulos no existe');
    }
    
    if (await eliminarRegistros('clientes')) {
      console.log('   ✅ Clientes eliminados');
    } else {
      console.log('   ⚠️  Tabla clientes no existe');
    }
    
    if (await eliminarRegistros('auditoria')) {
      console.log('   ✅ Auditoría eliminada');
    } else {
      console.log('   ⚠️  Tabla auditoria no existe');
    }
    
    // Reactivar verificación de claves foráneas
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    // Verificar que todo esté vacío
    console.log('\n📊 Verificando que todo esté vacío...');
    const pagosFinal = await contarRegistros('pagos');
    const remitoArticulosFinal = await contarRegistros('remito_articulos');
    const remitosFinal = await contarRegistros('remitos');
    const articulosFinal = await contarRegistros('articulos');
    const clientesFinal = await contarRegistros('clientes');
    const auditoriaFinal = await contarRegistros('auditoria');
    
    console.log(`   Pagos: ${pagosFinal}`);
    console.log(`   Remito-Artículos: ${remitoArticulosFinal}`);
    console.log(`   Remitos: ${remitosFinal}`);
    console.log(`   Artículos: ${articulosFinal}`);
    console.log(`   Clientes: ${clientesFinal}`);
    console.log(`   Auditoría: ${auditoriaFinal}\n`);
    
    console.log('✅ ¡Base de datos de PRODUCCIÓN limpiada exitosamente!');
    console.log('   Todas las tablas están vacías.');
    
  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error.message);
  } finally {
    await pool.end();
  }
}

limpiar();

