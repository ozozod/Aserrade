// Script para recalcular todos los monto_pagado de remitos
const mysql = require('mysql2/promise');

const dbConfig = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db'
};

async function recalcular() {
  const pool = mysql.createPool(dbConfig);
  
  try {
    console.log('Conectando a MySQL...');
    
    // Obtener todos los remitos
    const [remitos] = await pool.execute('SELECT id, numero FROM remitos');
    console.log(`Encontrados ${remitos.length} remitos`);
    
    for (const remito of remitos) {
      // Calcular total de artículos
      const [articulos] = await pool.execute(
        'SELECT COALESCE(SUM(precio_total), 0) as total FROM remito_articulos WHERE remito_id = ?',
        [remito.id]
      );
      const totalRemito = parseFloat(articulos[0].total) || 0;
      
      // Calcular total pagado (excluyendo REMITOS_DETALLE y cheques rebotados)
      const [pagos] = await pool.execute(
        `SELECT COALESCE(SUM(monto), 0) as total 
         FROM pagos 
         WHERE remito_id = ? 
         AND (observaciones NOT LIKE '%REMITOS_DETALLE:%' OR observaciones IS NULL)
         AND (cheque_rebotado = 0 OR cheque_rebotado IS NULL)`,
        [remito.id]
      );
      const totalPagado = parseFloat(pagos[0].total) || 0;
      
      // Determinar estado
      let estado = 'Pendiente';
      if (totalPagado >= totalRemito && totalRemito > 0) {
        estado = 'Pagado';
      } else if (totalPagado > 0) {
        estado = 'Pago Parcial';
      }
      
      // Actualizar remito
      await pool.execute(
        'UPDATE remitos SET monto_pagado = ?, estado_pago = ? WHERE id = ?',
        [totalPagado, estado, remito.id]
      );
      
      console.log(`Remito ${remito.numero || remito.id}: Total=${totalRemito}, Pagado=${totalPagado}, Estado=${estado}`);
    }
    
    console.log('\n✅ Recálculo completado');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

recalcular();

