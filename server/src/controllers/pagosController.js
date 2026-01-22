const db = require('../config/database');

const getAll = async (req, res) => {
  try {
    const { remitoId, clienteId } = req.query;
    let query = `
      SELECT p.*, r.numero as remito_numero, 
             COALESCE(c.nombre, c2.nombre) as cliente_nombre,
             COALESCE(r.cliente_id, p.cliente_id) as cliente_id
      FROM pagos p
      LEFT JOIN remitos r ON p.remito_id = r.id
      LEFT JOIN clientes c ON r.cliente_id = c.id
      LEFT JOIN clientes c2 ON p.cliente_id = c2.id
    `;
    const params = [];
    const conditions = [];
    
    if (remitoId) {
      conditions.push('p.remito_id = ?');
      params.push(remitoId);
    }
    
    if (clienteId) {
      conditions.push('(r.cliente_id = ? OR p.cliente_id = ?)');
      params.push(clienteId, clienteId);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY p.fecha DESC';
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo pagos:', error);
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM pagos WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error obteniendo pago:', error);
    res.status(500).json({ error: 'Error al obtener pago' });
  }
};

const create = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { remito_id, fecha, monto, observaciones, cliente_id } = req.body;
    
    // Insertar pago
    const [result] = await connection.query(
      'INSERT INTO pagos (remito_id, fecha, monto, observaciones, cliente_id) VALUES (?, ?, ?, ?, ?)',
      [remito_id || null, fecha, monto, observaciones || null, cliente_id || null]
    );
    
    // Actualizar estado del remito si existe
    if (remito_id) {
      await actualizarEstadoRemito(connection, remito_id);
    }
    
    await connection.commit();
    res.json({ id: result.insertId, ...req.body });
  } catch (error) {
    await connection.rollback();
    console.error('Error creando pago:', error);
    res.status(500).json({ error: 'Error al crear pago' });
  } finally {
    connection.release();
  }
};

const update = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { remito_id, fecha, monto, observaciones, cliente_id } = req.body;
    
    // Obtener remito_id anterior
    const [pagoAnterior] = await connection.query('SELECT remito_id FROM pagos WHERE id = ?', [id]);
    const remitoIdAnterior = pagoAnterior.length > 0 ? pagoAnterior[0].remito_id : null;
    
    // Actualizar pago
    await connection.query(
      'UPDATE pagos SET remito_id = ?, fecha = ?, monto = ?, observaciones = ?, cliente_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [remito_id || null, fecha, monto, observaciones || null, cliente_id || null, id]
    );
    
    // Actualizar estado del remito anterior si existe
    if (remitoIdAnterior) {
      await actualizarEstadoRemito(connection, remitoIdAnterior);
    }
    
    // Actualizar estado del remito nuevo si existe y es diferente
    if (remito_id && remito_id !== remitoIdAnterior) {
      await actualizarEstadoRemito(connection, remito_id);
    }
    
    await connection.commit();
    res.json({ id, ...req.body });
  } catch (error) {
    await connection.rollback();
    console.error('Error actualizando pago:', error);
    res.status(500).json({ error: 'Error al actualizar pago' });
  } finally {
    connection.release();
  }
};

const createBatch = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const pagos = req.body;
    const resultados = [];
    const remitosActualizados = new Set();
    
    for (const pago of pagos) {
      const { remito_id, fecha, monto, observaciones, cliente_id } = pago;
      
      const [result] = await connection.query(
        'INSERT INTO pagos (remito_id, fecha, monto, observaciones, cliente_id) VALUES (?, ?, ?, ?, ?)',
        [remito_id || null, fecha, monto, observaciones || null, cliente_id || null]
      );
      
      resultados.push({ id: result.insertId, ...pago });
      
      if (remito_id) {
        remitosActualizados.add(remito_id);
      }
    }
    
    // Actualizar estados de todos los remitos afectados
    for (const remitoId of remitosActualizados) {
      await actualizarEstadoRemito(connection, remitoId);
    }
    
    await connection.commit();
    res.json(resultados);
  } catch (error) {
    await connection.rollback();
    console.error('Error creando pagos en batch:', error);
    res.status(500).json({ error: 'Error al crear pagos' });
  } finally {
    connection.release();
  }
};

const marcarChequeRebotado = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { rebotado } = req.body;
    
    // Obtener remito_id
    const [pago] = await connection.query('SELECT remito_id FROM pagos WHERE id = ?', [id]);
    if (pago.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    const remito_id = pago[0].remito_id;
    
    // Actualizar cheque_rebotado
    await connection.query(
      'UPDATE pagos SET cheque_rebotado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [rebotado ? 1 : 0, id]
    );
    
    // Actualizar estado del remito si existe
    if (remito_id) {
      await actualizarEstadoRemito(connection, remito_id);
    }
    
    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error marcando cheque rebotado:', error);
    res.status(500).json({ error: 'Error al marcar cheque rebotado' });
  } finally {
    connection.release();
  }
};

const deletePago = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Obtener información completa del pago antes de eliminarlo
    const [pagos] = await connection.query('SELECT * FROM pagos WHERE id = ?', [id]);
    if (pagos.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    const pago = pagos[0];
    const observaciones = pago.observaciones || '';
    
    // Extraer TODOS los remitos afectados
    const remitosAfectados = new Set();
    if (pago.remito_id) {
      remitosAfectados.add(pago.remito_id);
    }
    
    // Si tiene REMITOS_DETALLE, extraer todos los remitos del pago agrupado
    if (observaciones.includes('REMITOS_DETALLE:')) {
      try {
        const match = observaciones.match(/REMITOS_DETALLE:(.+)$/);
        if (match) {
          const remitosDetalle = JSON.parse(match[1]);
          remitosDetalle.forEach(r => {
            if (r.remito_id) {
              remitosAfectados.add(r.remito_id);
            }
          });
        }
      } catch (e) {
        console.warn('Error parseando REMITOS_DETALLE:', e);
      }
    }
    
    // ========== PASO 1: ELIMINAR TODOS LOS PAGOS OCULTOS PRIMERO ==========
    if (remitosAfectados.size > 0) {
      const remitosArray = Array.from(remitosAfectados);
      const placeholders = remitosArray.map(() => '?').join(',');
      
      // Eliminar TODOS los pagos ocultos asociados a estos remitos
      await connection.query(
        `DELETE FROM pagos 
         WHERE remito_id IN (${placeholders}) 
         AND observaciones LIKE '%[OCULTO]%'
         AND id != ?`,
        [...remitosArray, id]
      );
    }
    
    // ========== PASO 2: ELIMINAR EL PAGO PRINCIPAL ==========
    await connection.query('DELETE FROM pagos WHERE id = ?', [id]);
    
    // ========== PASO 3: RECALCULAR ESTADOS DE TODOS LOS REMITOS ==========
    for (const remitoId of remitosAfectados) {
      await actualizarEstadoRemito(connection, remitoId);
    }
    
    // Si el pago tenía cliente_id, recalcular TODOS los remitos del cliente
    if (pago.cliente_id) {
      const [remitosCliente] = await connection.query(
        'SELECT id FROM remitos WHERE cliente_id = ?',
        [pago.cliente_id]
      );
      for (const remito of remitosCliente) {
        await actualizarEstadoRemito(connection, remito.id);
      }
    }
    
    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error eliminando pago:', error);
    res.status(500).json({ error: 'Error al eliminar pago' });
  } finally {
    connection.release();
  }
};

async function actualizarEstadoRemito(connection, remitoId) {
  if (!remitoId) return;
  
  // Obtener TODOS los pagos del remito
  const [pagos] = await connection.query(
    `SELECT monto, observaciones 
     FROM pagos 
     WHERE remito_id = ? 
     AND (cheque_rebotado = 0 OR cheque_rebotado IS NULL)`,
    [remitoId]
  );
  
  // Calcular total pagado correctamente:
  // - INCLUIR pagos normales (sin [OCULTO])
  // - INCLUIR pagos con [OCULTO] pero monto > 0 (son pagos reales de distribución)
  // - EXCLUIR pagos con monto = 0 y REMITOS_DETALLE (son solo encabezados)
  let totalPagado = 0;
  for (const pago of pagos) {
    const monto = parseFloat(pago.monto || 0);
    const obs = pago.observaciones || '';
    
    // Excluir pagos principales de distribución (monto 0 con REMITOS_DETALLE)
    if (monto === 0 && obs.includes('REMITOS_DETALLE:')) {
      continue;
    }
    
    // Incluir TODOS los demás pagos (incluye [OCULTO] con monto > 0)
    totalPagado += monto;
  }
  
  // Calcular precio total del remito
  const [articulos] = await connection.query(
    'SELECT COALESCE(SUM(precio_total), 0) as total FROM remito_articulos WHERE remito_id = ?',
    [remitoId]
  );
  const precioTotal = parseFloat(articulos[0].total) || 0;
  
  // Determinar estado
  let estadoPago = 'Pendiente';
  if (precioTotal > 0 && totalPagado >= precioTotal) {
    estadoPago = 'Pagado';
  } else if (totalPagado > 0) {
    estadoPago = 'Pago Parcial';
  }
  
  // Actualizar remito
  await connection.query(
    'UPDATE remitos SET estado_pago = ?, monto_pagado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [estadoPago, totalPagado, remitoId]
  );
}

module.exports = {
  getAll,
  getById,
  create,
  createBatch,
  update,
  marcarChequeRebotado,
  delete: deletePago
};
