// Script de migración de Supabase a Hostinger (MySQL)
// Ejecutar con: node scripts/migrar_a_hostinger.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const SUPABASE_URL = 'https://uoisgayimsbqugablshq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaXNnYXlpbXNicXVnYWJsc2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDE3MjEsImV4cCI6MjA3OTIxNzcyMX0.Aswdut5lDyocIqyfksjTXmi_CaUevaAAGIv_kv7ygew';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Función para escapar valores para MySQL
const escapeValue = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return value.toString();
  if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
  // Escapar comillas simples y caracteres especiales
  const escaped = String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
  return `'${escaped}'`;
};

// Función para generar INSERT de una tabla
const generateInserts = (tableName, rows, columns) => {
  if (!rows || rows.length === 0) return '';
  
  let sql = `-- Datos de ${tableName}\n`;
  sql += `-- Total: ${rows.length} registros\n\n`;
  
  for (const row of rows) {
    const values = columns.map(col => escapeValue(row[col]));
    sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
  }
  
  sql += '\n';
  return sql;
};

async function migrate() {
  console.log('🚀 Iniciando migración de Supabase a Hostinger...\n');
  
  let sqlOutput = `-- ============================================
-- MIGRACIÓN DE DATOS: SUPABASE -> HOSTINGER
-- Fecha: ${new Date().toLocaleString('es-AR')}
-- ============================================

-- Deshabilitar verificaciones de FK temporalmente
SET FOREIGN_KEY_CHECKS = 0;

`;

  try {
    // 1. CLIENTES
    console.log('📋 Exportando clientes...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .order('id');
    
    if (clientesError) throw clientesError;
    console.log(`   ✅ ${clientes?.length || 0} clientes encontrados`);
    
    if (clientes && clientes.length > 0) {
      const clientesCols = ['id', 'nombre', 'telefono', 'direccion', 'email', 'observaciones', 'created_at', 'updated_at'];
      sqlOutput += generateInserts('clientes', clientes, clientesCols);
    }

    // 2. ARTICULOS
    console.log('📦 Exportando artículos...');
    const { data: articulos, error: articulosError } = await supabase
      .from('articulos')
      .select('*')
      .order('id');
    
    if (articulosError) throw articulosError;
    console.log(`   ✅ ${articulos?.length || 0} artículos encontrados`);
    
    if (articulos && articulos.length > 0) {
      const articulosCols = ['id', 'nombre', 'descripcion', 'precio_base', 'activo', 'cliente_id', 'codigo', 'medida', 'cabezal', 'costado', 'fondo', 'taco', 'esquinero', 'despeje', 'created_at', 'updated_at'];
      sqlOutput += generateInserts('articulos', articulos, articulosCols);
    }

    // 3. REMITOS
    console.log('📝 Exportando remitos...');
    const { data: remitos, error: remitosError } = await supabase
      .from('remitos')
      .select('*')
      .order('id');
    
    if (remitosError) throw remitosError;
    console.log(`   ✅ ${remitos?.length || 0} remitos encontrados`);
    
    if (remitos && remitos.length > 0) {
      const remitosCols = ['id', 'cliente_id', 'fecha', 'numero', 'estado_pago', 'monto_pagado', 'observaciones', 'foto_path', 'created_at', 'updated_at'];
      sqlOutput += generateInserts('remitos', remitos, remitosCols);
    }

    // 4. REMITO_ARTICULOS
    console.log('📎 Exportando artículos de remitos...');
    const { data: remitoArticulos, error: raError } = await supabase
      .from('remito_articulos')
      .select('*')
      .order('id');
    
    if (raError) throw raError;
    console.log(`   ✅ ${remitoArticulos?.length || 0} artículos de remitos encontrados`);
    
    if (remitoArticulos && remitoArticulos.length > 0) {
      const raCols = ['id', 'remito_id', 'articulo_id', 'articulo_nombre', 'cantidad', 'precio_unitario', 'precio_total', 'created_at'];
      sqlOutput += generateInserts('remito_articulos', remitoArticulos, raCols);
    }

    // 5. PAGOS
    console.log('💰 Exportando pagos...');
    const { data: pagos, error: pagosError } = await supabase
      .from('pagos')
      .select('*')
      .order('id');
    
    if (pagosError) throw pagosError;
    console.log(`   ✅ ${pagos?.length || 0} pagos encontrados`);
    
    if (pagos && pagos.length > 0) {
      const pagosCols = ['id', 'remito_id', 'fecha', 'monto', 'observaciones', 'created_at'];
      sqlOutput += generateInserts('pagos', pagos, pagosCols);
    }

    // Finalizar SQL
    sqlOutput += `
-- Rehabilitar verificaciones de FK
SET FOREIGN_KEY_CHECKS = 1;

-- Actualizar AUTO_INCREMENT de cada tabla
`;

    // Agregar comandos para actualizar AUTO_INCREMENT
    if (clientes && clientes.length > 0) {
      const maxClienteId = Math.max(...clientes.map(c => c.id)) + 1;
      sqlOutput += `ALTER TABLE clientes AUTO_INCREMENT = ${maxClienteId};\n`;
    }
    if (articulos && articulos.length > 0) {
      const maxArticuloId = Math.max(...articulos.map(a => a.id)) + 1;
      sqlOutput += `ALTER TABLE articulos AUTO_INCREMENT = ${maxArticuloId};\n`;
    }
    if (remitos && remitos.length > 0) {
      const maxRemitoId = Math.max(...remitos.map(r => r.id)) + 1;
      sqlOutput += `ALTER TABLE remitos AUTO_INCREMENT = ${maxRemitoId};\n`;
    }
    if (remitoArticulos && remitoArticulos.length > 0) {
      const maxRaId = Math.max(...remitoArticulos.map(ra => ra.id)) + 1;
      sqlOutput += `ALTER TABLE remito_articulos AUTO_INCREMENT = ${maxRaId};\n`;
    }
    if (pagos && pagos.length > 0) {
      const maxPagoId = Math.max(...pagos.map(p => p.id)) + 1;
      sqlOutput += `ALTER TABLE pagos AUTO_INCREMENT = ${maxPagoId};\n`;
    }

    sqlOutput += `
-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
`;

    // Guardar archivo SQL
    const outputPath = path.join(__dirname, '..', 'hostinger', 'migracion_datos.sql');
    fs.writeFileSync(outputPath, sqlOutput, 'utf8');
    
    console.log('\n✅ Migración completada!');
    console.log(`📁 Archivo generado: ${outputPath}`);
    console.log('\n📋 Resumen:');
    console.log(`   - Clientes: ${clientes?.length || 0}`);
    console.log(`   - Artículos: ${articulos?.length || 0}`);
    console.log(`   - Remitos: ${remitos?.length || 0}`);
    console.log(`   - Artículos de remitos: ${remitoArticulos?.length || 0}`);
    console.log(`   - Pagos: ${pagos?.length || 0}`);
    console.log('\n🚀 Próximo paso: Ejecutar el archivo SQL en el servidor de Hostinger');
    console.log('   mysql -u aserradero_user -p aserradero_db < migracion_datos.sql');

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    process.exit(1);
  }
}

migrate();

