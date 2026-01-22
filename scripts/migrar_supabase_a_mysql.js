// Script para migrar datos de Supabase a MySQL Hostinger (Producción)
const mysql = require('mysql2/promise');
const { createClient } = require('@supabase/supabase-js');

// Configuración Supabase
const SUPABASE_URL = 'https://uoisgayimsbqugablshq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaXNnYXlpbXNicXVnYWJsc2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDE3MjEsImV4cCI6MjA3OTIxNzcyMX0.Aswdut5lDyocIqyfksjTXmi_CaUevaAAGIv_kv7ygew';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuración MySQL Hostinger
const mysqlConfig = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db'
};

async function migrar() {
  console.log('🚀 Iniciando migración de Supabase a MySQL Producción...\n');
  
  const pool = mysql.createPool(mysqlConfig);
  
  try {
    // 1. Obtener datos de Supabase
    console.log('📥 Obteniendo datos de Supabase...');
    
    const { data: clientes, error: errClientes } = await supabase.from('clientes').select('*');
    if (errClientes) throw errClientes;
    console.log(`   ✅ Clientes: ${clientes.length}`);
    
    const { data: articulos, error: errArticulos } = await supabase.from('articulos').select('*').eq('activo', true);
    if (errArticulos) throw errArticulos;
    console.log(`   ✅ Artículos: ${articulos.length}`);
    
    const { data: remitos, error: errRemitos } = await supabase.from('remitos').select('*');
    if (errRemitos) throw errRemitos;
    console.log(`   ✅ Remitos: ${remitos.length}`);
    
    const { data: remitoArticulos, error: errRA } = await supabase.from('remito_articulos').select('*');
    if (errRA) throw errRA;
    console.log(`   ✅ Remito-Artículos: ${remitoArticulos.length}`);
    
    const { data: pagos, error: errPagos } = await supabase.from('pagos').select('*');
    if (errPagos) throw errPagos;
    console.log(`   ✅ Pagos: ${pagos.length}`);
    
    // 2. Limpiar tablas MySQL
    console.log('\n🗑️  Limpiando tablas en MySQL...');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    await pool.execute('DELETE FROM pagos');
    await pool.execute('DELETE FROM remito_articulos');
    await pool.execute('DELETE FROM remitos');
    await pool.execute('DELETE FROM articulos');
    await pool.execute('DELETE FROM clientes');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('   ✅ Tablas limpiadas');
    
    // 3. Insertar clientes
    console.log('\n📝 Insertando clientes...');
    for (const c of clientes) {
      await pool.execute(
        `INSERT INTO clientes (id, nombre, telefono, direccion, email, observaciones, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.nombre, c.telefono || '', c.direccion || '', c.email || '', c.observaciones || '', c.created_at, c.updated_at]
      );
    }
    console.log(`   ✅ ${clientes.length} clientes insertados`);
    
    // 4. Insertar artículos
    console.log('\n📝 Insertando artículos...');
    for (const a of articulos) {
      await pool.execute(
        `INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, precio_retirar, precio_entregado, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.id, a.nombre, a.descripcion || '', a.precio_base || 0, a.activo ? 1 : 0, a.cliente_id || null, a.codigo || '', 
         a.medida || '', a.cabezal || '', a.costado || '', a.fondo || '', a.taco || '', a.esquinero || '', a.despeje || '',
         a.precio_retirar || 0, a.precio_entregado || 0, a.created_at, a.updated_at]
      );
    }
    console.log(`   ✅ ${articulos.length} artículos insertados`);
    
    // 5. Insertar remitos
    console.log('\n📝 Insertando remitos...');
    for (const r of remitos) {
      const estadoPago = r.estado_pago === 'Pago Parcial' ? 'parcial' : 
                        r.estado_pago === 'Pagado' ? 'pagado' : 'pendiente';
      await pool.execute(
        `INSERT INTO remitos (id, numero, fecha, cliente_id, monto_pagado, estado_pago, observaciones, foto_path, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.id, r.numero || '', r.fecha, r.cliente_id, r.monto_pagado || 0, estadoPago, r.observaciones || '', r.foto_path || null, r.created_at, r.updated_at]
      );
    }
    console.log(`   ✅ ${remitos.length} remitos insertados`);
    
    // 6. Insertar remito_articulos
    console.log('\n📝 Insertando remito-artículos...');
    for (const ra of remitoArticulos) {
      await pool.execute(
        `INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, articulo_codigo, cantidad, precio_unitario, precio_total, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ra.id, ra.remito_id, ra.articulo_id || null, ra.articulo_nombre || ra.descripcion || '', ra.articulo_codigo || '', 
         ra.cantidad, ra.precio_unitario, ra.precio_total, ra.created_at]
      );
    }
    console.log(`   ✅ ${remitoArticulos.length} remito-artículos insertados`);
    
    // 7. Insertar pagos
    console.log('\n📝 Insertando pagos...');
    for (const p of pagos) {
      await pool.execute(
        `INSERT INTO pagos (id, remito_id, cliente_id, fecha, monto, observaciones, es_cheque, cheque_rebotado, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.remito_id || null, p.cliente_id || null, p.fecha, p.monto, p.observaciones || '', 
         p.es_cheque ? 1 : 0, p.cheque_rebotado ? 1 : 0, p.created_at]
      );
    }
    console.log(`   ✅ ${pagos.length} pagos insertados`);
    
    console.log('\n✅ ¡Migración completada exitosamente!');
    console.log(`   - Clientes: ${clientes.length}`);
    console.log(`   - Artículos: ${articulos.length}`);
    console.log(`   - Remitos: ${remitos.length}`);
    console.log(`   - Pagos: ${pagos.length}`);
    
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
  } finally {
    await pool.end();
  }
}

migrar();

