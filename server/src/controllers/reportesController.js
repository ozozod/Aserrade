const db = require('../config/database');

const getCuentaCorriente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    // Obtener remitos del cliente
    const [remitos] = await db.query(
      `SELECT r.*, c.nombre as cliente_nombre,
              COALESCE(SUM(ra.precio_total), 0) as precio_total
       FROM remitos r
       JOIN clientes c ON r.cliente_id = c.id
       LEFT JOIN remito_articulos ra ON r.id = ra.remito_id
       WHERE r.cliente_id = ?
       GROUP BY r.id
       ORDER BY r.fecha DESC, r.id DESC`,
      [clienteId]
    );
    
    // Obtener artículos para cada remito
    for (let remito of remitos) {
      const [articulos] = await db.query(
        'SELECT * FROM remito_articulos WHERE remito_id = ? ORDER BY id',
        [remito.id]
      );
      remito.articulos = articulos;
    }
    
    // Calcular totales
    let totalRemitos = 0;
    let totalPagado = 0;
    let totalPendiente = 0;
    
    remitos.forEach(remito => {
      const precioTotal = remito.precio_total || 0;
      totalRemitos += precioTotal;
      totalPagado += remito.monto_pagado || 0;
      totalPendiente += (precioTotal - (remito.monto_pagado || 0));
    });
    
    res.json({
      cliente_id: clienteId,
      remitos,
      totales: {
        total_remitos: totalRemitos,
        total_pagado: totalPagado,
        total_pendiente: totalPendiente
      }
    });
  } catch (error) {
    console.error('Error obteniendo cuenta corriente:', error);
    res.status(500).json({ error: 'Error al obtener cuenta corriente' });
  }
};

const getResumenGeneral = async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_clientes,
        COUNT(DISTINCT r.id) as total_remitos,
        COALESCE(SUM(ra.precio_total), 0) as total_facturado,
        COALESCE(SUM(r.monto_pagado), 0) as total_pagado
      FROM clientes c
      LEFT JOIN remitos r ON c.id = r.cliente_id
      LEFT JOIN remito_articulos ra ON r.id = ra.remito_id
    `);
    
    const row = result[0];
    res.json({
      total_clientes: row.total_clientes || 0,
      total_remitos: row.total_remitos || 0,
      total_facturado: parseFloat(row.total_facturado) || 0,
      total_pagado: parseFloat(row.total_pagado) || 0,
      total_pendiente: (parseFloat(row.total_facturado) || 0) - (parseFloat(row.total_pagado) || 0)
    });
  } catch (error) {
    console.error('Error obteniendo resumen general:', error);
    res.status(500).json({ error: 'Error al obtener resumen general' });
  }
};

module.exports = {
  getCuentaCorriente,
  getResumenGeneral
};

