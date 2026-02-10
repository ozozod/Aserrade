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
    
    const remitoIds = remitos.map(r => r.id);
    let pagosCliente = [];
    if (remitoIds.length > 0) {
      const placeholders = remitoIds.map(() => '?').join(',');
      const [pagos] = await db.query(
        `SELECT p.*, r.numero as remito_numero
         FROM pagos p
         LEFT JOIN remitos r ON p.remito_id = r.id
         WHERE (p.remito_id IN (${placeholders}) OR p.cliente_id = ?)
         ORDER BY p.fecha DESC`,
        [...remitoIds, clienteId]
      );
      pagosCliente = pagos;
    } else {
      const [pagos] = await db.query(
        'SELECT p.*, NULL as remito_numero FROM pagos p WHERE p.cliente_id = ? ORDER BY p.fecha DESC',
        [clienteId]
      );
      pagosCliente = pagos;
    }
    
    // Identificar cheques rebotados y sus ocultos (misma lógica que mysqlService)
    const pagosRebotadosIds = new Set();
    const pagosOcultosRebotadosIds = new Set();
    pagosCliente.forEach(pago => {
      const rebotado = pago.cheque_rebotado === 1 || pago.cheque_rebotado === true;
      const obs = pago.observaciones || '';
      if (rebotado) {
        pagosRebotadosIds.add(pago.id);
        if (obs.includes('REMITOS_DETALLE:')) {
          try {
            const jsonMatch = obs.match(/REMITOS_DETALLE:(\[.*\])/);
            if (jsonMatch) {
              const remitosDetalle = JSON.parse(jsonMatch[1]);
              const fechaRebotado = new Date(pago.fecha).toISOString().split('T')[0];
              remitosDetalle.forEach(r => {
                if (r.remito_id) {
                  pagosCliente.forEach(p => {
                    if (p.remito_id === r.remito_id && p.observaciones && p.observaciones.includes('[OCULTO]') && p.cliente_id === parseInt(clienteId)) {
                      const fechaOculto = new Date(p.fecha).toISOString().split('T')[0];
                      if (fechaOculto === fechaRebotado) pagosOcultosRebotadosIds.add(p.id);
                    }
                  });
                }
              });
            }
          } catch (e) {}
        }
      }
    });
    
    let totalPagado = 0;
    const montoPorRemito = {};
    pagosCliente.forEach(pago => {
      if (pagosRebotadosIds.has(pago.id) || pagosOcultosRebotadosIds.has(pago.id)) return;
      const monto = parseFloat(pago.monto || 0);
      const obs = pago.observaciones || '';
      if (monto === 0 && obs.includes('REMITOS_DETALLE:')) return;
      totalPagado += monto;
      if (pago.remito_id) montoPorRemito[pago.remito_id] = (montoPorRemito[pago.remito_id] || 0) + monto;
    });
    
    // Obtener artículos y usar montos desde pagos (no desde remitos.monto_pagado)
    let totalRemitos = 0;
    for (let remito of remitos) {
      const [articulos] = await db.query(
        'SELECT * FROM remito_articulos WHERE remito_id = ? ORDER BY id',
        [remito.id]
      );
      remito.articulos = articulos;
      const precioTotal = parseFloat(remito.precio_total || 0);
      totalRemitos += precioTotal;
      remito.monto_pagado = montoPorRemito[remito.id] || 0;
    }
    
    res.json({
      cliente_id: clienteId,
      remitos,
      pagos: pagosCliente,
      totales: {
        total_remitos: totalRemitos,
        total_pagado: totalPagado,
        total_pendiente: totalRemitos - totalPagado
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

