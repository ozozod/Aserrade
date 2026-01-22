const db = require('../config/database');

const getAll = async (req, res) => {
  try {
    const { cliente_id } = req.query;
    let query = `
      SELECT r.*, c.nombre as cliente_nombre,
             COALESCE(SUM(ra.precio_total), 0) as precio_total
      FROM remitos r
      JOIN clientes c ON r.cliente_id = c.id
      LEFT JOIN remito_articulos ra ON r.id = ra.remito_id
    `;
    const params = [];
    
    if (cliente_id) {
      query += ' WHERE r.cliente_id = ?';
      params.push(cliente_id);
    }
    
    query += ' GROUP BY r.id ORDER BY r.fecha DESC, r.id DESC';
    
    const [rows] = await db.query(query, params);
    
    // Obtener artículos para cada remito
    for (let remito of rows) {
      const [articulos] = await db.query(
        'SELECT * FROM remito_articulos WHERE remito_id = ? ORDER BY id',
        [remito.id]
      );
      remito.articulos = articulos;
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo remitos:', error);
    res.status(500).json({ error: 'Error al obtener remitos' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT r.*, c.nombre as cliente_nombre FROM remitos r JOIN clientes c ON r.cliente_id = c.id WHERE r.id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Remito no encontrado' });
    }
    
    const remito = rows[0];
    const [articulos] = await db.query(
      'SELECT * FROM remito_articulos WHERE remito_id = ? ORDER BY id',
      [id]
    );
    remito.articulos = articulos;
    
    res.json(remito);
  } catch (error) {
    console.error('Error obteniendo remito:', error);
    res.status(500).json({ error: 'Error al obtener remito' });
  }
};

const getArticulos = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT ra.*, a.nombre as articulo_nombre FROM remito_articulos ra LEFT JOIN articulos a ON ra.articulo_id = a.id WHERE ra.remito_id = ? ORDER BY ra.id',
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo artículos del remito:', error);
    res.status(500).json({ error: 'Error al obtener artículos' });
  }
};

const create = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, articulos } = req.body;
    const foto_path = req.file ? `/uploads/fotos_remitos/${req.file.filename}` : null;
    
    // Insertar remito
    const [result] = await connection.query(
      'INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [cliente_id, fecha, numero || null, estado_pago || 'Pendiente', monto_pagado || 0, observaciones || null, foto_path]
    );
    const remitoId = result.insertId;
    
    // Insertar artículos
    if (articulos && articulos.length > 0) {
      for (const articulo of articulos) {
        await connection.query(
          'INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) VALUES (?, ?, ?, ?, ?, ?)',
          [remitoId, articulo.articulo_id || null, articulo.articulo_nombre, articulo.cantidad, articulo.precio_unitario, articulo.precio_total]
        );
      }
    }
    
    await connection.commit();
    res.json({ id: remitoId, ...req.body, foto_path });
  } catch (error) {
    await connection.rollback();
    console.error('Error creando remito:', error);
    res.status(500).json({ error: 'Error al crear remito' });
  } finally {
    connection.release();
  }
};

const update = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, articulos } = req.body;
    
    // Si hay nueva foto, actualizar path
    let foto_path = null;
    if (req.file) {
      foto_path = `/uploads/fotos_remitos/${req.file.filename}`;
      // Opcional: eliminar foto anterior
    } else {
      // Mantener foto existente
      const [existing] = await connection.query('SELECT foto_path FROM remitos WHERE id = ?', [id]);
      if (existing.length > 0) {
        foto_path = existing[0].foto_path;
      }
    }
    
    // Actualizar remito
    await connection.query(
      'UPDATE remitos SET cliente_id = ?, fecha = ?, numero = ?, estado_pago = ?, monto_pagado = ?, observaciones = ?, foto_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [cliente_id, fecha, numero || null, estado_pago || 'Pendiente', monto_pagado || 0, observaciones || null, foto_path, id]
    );
    
    // Eliminar artículos antiguos
    await connection.query('DELETE FROM remito_articulos WHERE remito_id = ?', [id]);
    
    // Insertar nuevos artículos
    if (articulos && articulos.length > 0) {
      for (const articulo of articulos) {
        await connection.query(
          'INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) VALUES (?, ?, ?, ?, ?, ?)',
          [id, articulo.articulo_id || null, articulo.articulo_nombre, articulo.cantidad, articulo.precio_unitario, articulo.precio_total]
        );
      }
    }
    
    await connection.commit();
    res.json({ id, ...req.body, foto_path });
  } catch (error) {
    await connection.rollback();
    console.error('Error actualizando remito:', error);
    res.status(500).json({ error: 'Error al actualizar remito' });
  } finally {
    connection.release();
  }
};

const deleteRemito = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Eliminar pagos
    await connection.query('DELETE FROM pagos WHERE remito_id = ?', [id]);
    
    // Eliminar artículos (ON DELETE CASCADE debería hacerlo)
    await connection.query('DELETE FROM remito_articulos WHERE remito_id = ?', [id]);
    
    // Eliminar remito
    await connection.query('DELETE FROM remitos WHERE id = ?', [id]);
    
    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error eliminando remito:', error);
    res.status(500).json({ error: 'Error al eliminar remito' });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAll,
  getById,
  getArticulos,
  create,
  update,
  delete: deleteRemito
};

