const mysql = require('mysql2/promise');
const fs = require('fs');

async function backup() {
  console.log('📦 Exportando datos de Hostinger...\n');
  
  const conn = await mysql.createConnection({
    host: '31.97.246.42',
    user: 'aserradero_user',
    password: 'Aserradero2025#',
    database: 'aserradero_db'
  });

  let sql = '-- Backup Aserradero DB - ' + new Date().toISOString() + '\n\n';
  sql += 'SET FOREIGN_KEY_CHECKS = 0;\n\n';
  
  const tables = ['clientes', 'articulos', 'remitos', 'remito_articulos', 'pagos'];
  
  for (const table of tables) {
    const [rows] = await conn.execute('SELECT * FROM ' + table);
    sql += '-- Tabla: ' + table + ' (' + rows.length + ' registros)\n';
    sql += 'DELETE FROM ' + table + ';\n';
    
    if (rows.length > 0) {
      for (const row of rows) {
        const cols = Object.keys(row).join(', ');
        const vals = Object.values(row).map(v => {
          if (v === null) return 'NULL';
          if (typeof v === 'string') return "'" + v.replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
          if (v instanceof Date) return "'" + v.toISOString().slice(0,19).replace('T',' ') + "'";
          return v;
        }).join(', ');
        sql += 'INSERT INTO ' + table + ' (' + cols + ') VALUES (' + vals + ');\n';
      }
    }
    sql += '\n';
    console.log('  ✅ ' + table + ': ' + rows.length + ' registros');
  }
  
  sql += 'SET FOREIGN_KEY_CHECKS = 1;\n';
  
  const fecha = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const hora = new Date().toTimeString().slice(0,8).replace(/:/g,'');
  const filename = 'backups/backup_hostinger_' + fecha + '_' + hora + '.sql';
  
  // Crear carpeta backups si no existe
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups');
  }
  
  fs.writeFileSync(filename, sql);
  console.log('\n✅ Backup guardado en: ' + filename);
  
  await conn.end();
}

backup().catch(e => console.error('Error:', e.message));

