const { createClient } = require('@supabase/supabase-js');
const mysql = require('mysql2/promise');

// Supabase - URL correcta
const supabaseUrl = 'https://uoisgayimsbqugablshq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaXNnYXlpbXNicXVnYWJsc2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDE3MjEsImV4cCI6MjA3OTIxNzcyMX0.Aswdut5lDyocIqyfksjTXmi_CaUevaAAGIv_kv7ygew';
const supabase = createClient(supabaseUrl, supabaseKey);

// MySQL Hostinger
const mysqlConfig = {
  host: '31.97.246.42',
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db'
};

async function migrar() {
  console.log('🚀 Iniciando migración de Supabase a Hostinger...\n');
  
  const conn = await mysql.createConnection(mysqlConfig);
  
  try {
    // 1. Obtener datos de Supabase
    console.log('📥 Obteniendo datos de Supabase...');
    
    const { data: clientes } = await supabase.from('clientes').select('*');
    console.log(`   - Clientes: ${clientes?.length || 0}`);
    
    const { data: articulosTodos } = await supabase.from('articulos').select('*');
    const articulos = articulosTodos?.filter(a => a.activo !== false) || [];
    console.log(`   - Artículos: ${articulos?.length || 0} (de ${articulosTodos?.length || 0} totales, ${(articulosTodos?.length || 0) - articulos.length} inactivos)`);
    
    const { data: remitos } = await supabase.from('remitos').select('*');
    console.log(`   - Remitos: ${remitos?.length || 0}`);
    
    const { data: remitoArticulos } = await supabase.from('remito_articulos').select('*');
    console.log(`   - Remito-Artículos: ${remitoArticulos?.length || 0}`);
    
    const { data: pagos } = await supabase.from('pagos').select('*');
    console.log(`   - Pagos: ${pagos?.length || 0}`);
    
    // 2. Limpiar tablas en Hostinger (orden por FK)
    console.log('\n🗑️  Limpiando tablas en Hostinger...');
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
    await conn.execute('DELETE FROM pagos');
    await conn.execute('DELETE FROM remito_articulos');
    await conn.execute('DELETE FROM remitos');
    await conn.execute('DELETE FROM articulos');
    await conn.execute('DELETE FROM clientes');
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('   ✅ Tablas limpiadas');
    
    // Función helper para convertir undefined a null
    const n = (val) => val === undefined ? null : val;
    
    // 3. Insertar clientes (MySQL usa 'observaciones' en vez de 'notas')
    console.log('\n📤 Insertando clientes...');
    for (const c of clientes || []) {
      await conn.execute(
        'INSERT INTO clientes (id, nombre, telefono, direccion, email, observaciones, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [n(c.id), n(c.nombre), n(c.telefono), n(c.direccion), n(c.email), n(c.notas || c.observaciones), n(c.created_at)]
      );
    }
    console.log(`   ✅ ${clientes?.length || 0} clientes insertados`);
    
    // 4. Insertar artículos (MySQL usa precio_base y tiene más campos)
    console.log('\n📤 Insertando artículos...');
    for (const a of articulos || []) {
      await conn.execute(
        'INSERT INTO articulos (id, codigo, nombre, descripcion, precio_base, cliente_id, activo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [n(a.id), n(a.codigo), n(a.nombre), n(a.descripcion), n(a.precio || a.precio_base), n(a.cliente_id), 1, n(a.created_at)]
      );
    }
    console.log(`   ✅ ${articulos?.length || 0} artículos insertados`);
    
    // 5. Insertar remitos (MySQL usa 'numero' y 'foto_path')
    console.log('\n📤 Insertando remitos...');
    for (const r of remitos || []) {
      await conn.execute(
        `INSERT INTO remitos (id, numero, cliente_id, fecha, observaciones, estado_pago, monto_pagado, foto_path, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [n(r.id), n(r.numero_remito || r.numero), n(r.cliente_id), n(r.fecha), n(r.observaciones), n(r.estado_pago), r.monto_pagado || 0, n(r.imagen_url || r.foto_path), n(r.created_at)]
      );
    }
    console.log(`   ✅ ${remitos?.length || 0} remitos insertados`);
    
    // 6. Insertar remito_articulos (MySQL tiene articulo_nombre en vez de largo)
    console.log('\n📤 Insertando remito_articulos...');
    for (const ra of remitoArticulos || []) {
      // Obtener nombre del artículo si es posible
      const articuloNombre = articulos?.find(a => a.id === ra.articulo_id)?.nombre || '';
      await conn.execute(
        'INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [n(ra.id), n(ra.remito_id), n(ra.articulo_id), articuloNombre, n(ra.cantidad), n(ra.precio_unitario), n(ra.precio_total)]
      );
    }
    console.log(`   ✅ ${remitoArticulos?.length || 0} remito_articulos insertados`);
    
    // 7. Insertar pagos (MySQL no tiene cliente_id en pagos)
    console.log('\n📤 Insertando pagos...');
    for (const p of pagos || []) {
      await conn.execute(
        'INSERT INTO pagos (id, remito_id, monto, fecha, observaciones, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [n(p.id), n(p.remito_id), n(p.monto), n(p.fecha), n(p.observaciones), n(p.created_at)]
      );
    }
    console.log(`   ✅ ${pagos?.length || 0} pagos insertados`);
    
    // 8. Verificar
    console.log('\n📊 Verificando migración...');
    const [cliCount] = await conn.execute('SELECT COUNT(*) as c FROM clientes');
    const [artCount] = await conn.execute('SELECT COUNT(*) as c FROM articulos');
    const [remCount] = await conn.execute('SELECT COUNT(*) as c FROM remitos');
    const [pagCount] = await conn.execute('SELECT COUNT(*) as c FROM pagos');
    const [totalPag] = await conn.execute('SELECT SUM(monto) as t FROM pagos');
    
    console.log(`   - Clientes: ${cliCount[0].c}`);
    console.log(`   - Artículos: ${artCount[0].c}`);
    console.log(`   - Remitos: ${remCount[0].c}`);
    console.log(`   - Pagos: ${pagCount[0].c} (Total: $${totalPag[0].t || 0})`);
    
    console.log('\n✅ ¡MIGRACIÓN COMPLETADA!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await conn.end();
  }
}

migrar();

