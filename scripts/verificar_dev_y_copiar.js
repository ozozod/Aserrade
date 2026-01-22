const mysql = require('mysql2/promise');

// Base de datos de DESARROLLO
const devConfig = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_dev'  // Base de desarrollo
};

// Base de datos de PRODUCCIÓN
const prodConfig = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db'  // Base de producción
};

async function verificarYCopiar() {
  console.log('🔍 Verificando base de datos de DESARROLLO...\n');
  
  let devPool, prodPool;
  
  try {
    devPool = mysql.createPool(devConfig);
    
    // Verificar qué hay en desarrollo
    const [clientes] = await devPool.execute('SELECT COUNT(*) as cnt FROM clientes');
    const [articulos] = await devPool.execute('SELECT COUNT(*) as cnt FROM articulos');
    const [remitos] = await devPool.execute('SELECT COUNT(*) as cnt FROM remitos');
    const [remitoArticulos] = await devPool.execute('SELECT COUNT(*) as cnt FROM remito_articulos');
    const [pagos] = await devPool.execute('SELECT COUNT(*) as cnt FROM pagos');
    
    console.log('=== BASE DE DESARROLLO (aserradero_dev) ===');
    console.log(`  Clientes: ${clientes[0].cnt}`);
    console.log(`  Artículos: ${articulos[0].cnt}`);
    console.log(`  Remitos: ${remitos[0].cnt}`);
    console.log(`  Remito-Artículos: ${remitoArticulos[0].cnt}`);
    console.log(`  Pagos: ${pagos[0].cnt}`);
    
    const totalDatos = clientes[0].cnt + articulos[0].cnt + remitos[0].cnt + pagos[0].cnt;
    
    if (totalDatos === 0) {
      console.log('\n❌ La base de desarrollo está vacía. No hay datos que copiar.');
      return;
    }
    
    console.log('\n✅ Hay datos en desarrollo. Copiando a producción...\n');
    
    // Conectar a producción
    prodPool = mysql.createPool(prodConfig);
    
    // Limpiar producción
    console.log('🗑️  Limpiando base de producción...');
    await prodPool.execute('SET FOREIGN_KEY_CHECKS = 0');
    await prodPool.execute('DELETE FROM pagos');
    await prodPool.execute('DELETE FROM remito_articulos');
    await prodPool.execute('DELETE FROM remitos');
    await prodPool.execute('DELETE FROM articulos');
    await prodPool.execute('DELETE FROM clientes');
    await prodPool.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('   ✅ Producción limpiada');
    
    // Copiar clientes
    console.log('\n📝 Copiando clientes...');
    const [clientesData] = await devPool.execute('SELECT * FROM clientes');
    for (const c of clientesData) {
      await prodPool.execute(
        `INSERT INTO clientes (id, nombre, telefono, direccion, email, observaciones, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.nombre, c.telefono || '', c.direccion || '', c.email || '', c.observaciones || '', c.created_at, c.updated_at]
      );
    }
    console.log(`   ✅ ${clientesData.length} clientes copiados`);
    
    // Copiar artículos
    console.log('\n📝 Copiando artículos...');
    const [articulosData] = await devPool.execute('SELECT * FROM articulos');
    for (const a of articulosData) {
      await prodPool.execute(
        `INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, precio_retirar, precio_entregado, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.id, a.nombre, a.descripcion || '', a.precio_base || 0, a.activo, a.cliente_id || null, a.codigo || '', 
         a.medida || '', a.cabezal || '', a.costado || '', a.fondo || '', a.taco || '', a.esquinero || '', a.despeje || '',
         a.precio_retirar || 0, a.precio_entregado || 0, a.created_at, a.updated_at]
      );
    }
    console.log(`   ✅ ${articulosData.length} artículos copiados`);
    
    // Copiar remitos
    console.log('\n📝 Copiando remitos...');
    const [remitosData] = await devPool.execute('SELECT * FROM remitos');
    for (const r of remitosData) {
      // Verificar si la columna es numero o numero_remito
      const numero = r.numero_remito || r.numero || '';
      await prodPool.execute(
        `INSERT INTO remitos (id, numero, fecha, cliente_id, monto_pagado, estado_pago, observaciones, foto_path, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.id, numero, r.fecha, r.cliente_id, r.monto_pagado || 0, r.estado_pago || 'pendiente', r.observaciones || '', r.foto_path || null, r.created_at, r.updated_at]
      );
    }
    console.log(`   ✅ ${remitosData.length} remitos copiados`);
    
    // Copiar remito_articulos
    console.log('\n📝 Copiando remito-artículos...');
    const [raData] = await devPool.execute('SELECT * FROM remito_articulos');
    for (const ra of raData) {
      await prodPool.execute(
        `INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, articulo_codigo, cantidad, precio_unitario, precio_total, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ra.id, ra.remito_id, ra.articulo_id || null, ra.articulo_nombre || '', ra.articulo_codigo || '', 
         ra.cantidad, ra.precio_unitario, ra.precio_total, ra.created_at]
      );
    }
    console.log(`   ✅ ${raData.length} remito-artículos copiados`);
    
    // Copiar pagos
    console.log('\n📝 Copiando pagos...');
    const [pagosData] = await devPool.execute('SELECT * FROM pagos');
    for (const p of pagosData) {
      await prodPool.execute(
        `INSERT INTO pagos (id, remito_id, cliente_id, fecha, monto, observaciones, es_cheque, cheque_rebotado, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.remito_id || null, p.cliente_id || null, p.fecha, p.monto, p.observaciones || '', 
         p.es_cheque ? 1 : 0, p.cheque_rebotado ? 1 : 0, p.created_at]
      );
    }
    console.log(`   ✅ ${pagosData.length} pagos copiados`);
    
    console.log('\n✅ ¡Copia completada exitosamente!');
    console.log('   Los datos de DESARROLLO ahora están en PRODUCCIÓN');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (devPool) await devPool.end();
    if (prodPool) await prodPool.end();
  }
}

verificarYCopiar();

