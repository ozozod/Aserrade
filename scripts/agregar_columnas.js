const mysql = require('mysql2/promise');

async function agregarColumnas() {
  const pool = mysql.createPool({
    host: '31.97.246.42',
    port: 3306,
    user: 'aserradero_user',
    password: 'Aserradero2025#',
    database: 'aserradero_db'
  });

  const columnasArticulos = [
    { nombre: 'medida', tipo: 'VARCHAR(255) DEFAULT ""' },
    { nombre: 'cabezal', tipo: 'VARCHAR(255) DEFAULT ""' },
    { nombre: 'costado', tipo: 'VARCHAR(255) DEFAULT ""' },
    { nombre: 'fondo', tipo: 'VARCHAR(255) DEFAULT ""' },
    { nombre: 'taco', tipo: 'VARCHAR(255) DEFAULT ""' },
    { nombre: 'esquinero', tipo: 'VARCHAR(255) DEFAULT ""' },
    { nombre: 'despeje', tipo: 'VARCHAR(255) DEFAULT ""' },
    { nombre: 'precio_retirar', tipo: 'DECIMAL(12,2) DEFAULT 0' },
    { nombre: 'precio_entregado', tipo: 'DECIMAL(12,2) DEFAULT 0' }
  ];

  console.log('Agregando columnas a tabla articulos...');
  
  for (const col of columnasArticulos) {
    try {
      await pool.execute(`ALTER TABLE articulos ADD COLUMN ${col.nombre} ${col.tipo}`);
      console.log(`  ✅ Agregada: ${col.nombre}`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`  ⚠️  Ya existe: ${col.nombre}`);
      } else {
        console.log(`  ❌ Error: ${col.nombre} - ${e.message}`);
      }
    }
  }

  // También verificar columnas de remitos
  const columnasRemitos = [
    { nombre: 'foto_path', tipo: 'VARCHAR(500) DEFAULT NULL' }
  ];

  console.log('\nAgregando columnas a tabla remitos...');
  
  for (const col of columnasRemitos) {
    try {
      await pool.execute(`ALTER TABLE remitos ADD COLUMN ${col.nombre} ${col.tipo}`);
      console.log(`  ✅ Agregada: ${col.nombre}`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`  ⚠️  Ya existe: ${col.nombre}`);
      } else {
        console.log(`  ❌ Error: ${col.nombre} - ${e.message}`);
      }
    }
  }

  // Columnas de remito_articulos
  const columnasRA = [
    { nombre: 'articulo_nombre', tipo: 'VARCHAR(255) DEFAULT ""' },
    { nombre: 'articulo_codigo', tipo: 'VARCHAR(50) DEFAULT ""' }
  ];

  console.log('\nAgregando columnas a tabla remito_articulos...');
  
  for (const col of columnasRA) {
    try {
      await pool.execute(`ALTER TABLE remito_articulos ADD COLUMN ${col.nombre} ${col.tipo}`);
      console.log(`  ✅ Agregada: ${col.nombre}`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`  ⚠️  Ya existe: ${col.nombre}`);
      } else {
        console.log(`  ❌ Error: ${col.nombre} - ${e.message}`);
      }
    }
  }

  await pool.end();
  console.log('\n✅ Proceso completado');
}

agregarColumnas();

