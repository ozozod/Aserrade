const db = require('../config/database');

const getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM clientes ORDER BY nombre');
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
};

const create = async (req, res) => {
  try {
    const { nombre, telefono, direccion, email, observaciones } = req.body;
    const [result] = await db.query(
      'INSERT INTO clientes (nombre, telefono, direccion, email, observaciones) VALUES (?, ?, ?, ?, ?)',
      [nombre, telefono || null, direccion || null, email || null, observaciones || null]
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, direccion, email, observaciones } = req.body;
    await db.query(
      'UPDATE clientes SET nombre = ?, telefono = ?, direccion = ?, email = ?, observaciones = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nombre, telefono || null, direccion || null, email || null, observaciones || null, id]
    );
    res.json({ id, ...req.body });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
};

const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM clientes WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteCliente
};

