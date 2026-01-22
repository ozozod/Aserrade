const db = require('../config/database');

const getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM articulos WHERE activo = 1 ORDER BY nombre');
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo artículos:', error);
    res.status(500).json({ error: 'Error al obtener artículos' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM articulos WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error obteniendo artículo:', error);
    res.status(500).json({ error: 'Error al obtener artículo' });
  }
};

const create = async (req, res) => {
  try {
    const { nombre, descripcion, precio_base, activo } = req.body;
    const [result] = await db.query(
      'INSERT INTO articulos (nombre, descripcion, precio_base, activo) VALUES (?, ?, ?, ?)',
      [nombre, descripcion || null, precio_base || 0, activo !== undefined ? activo : 1]
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (error) {
    console.error('Error creando artículo:', error);
    res.status(500).json({ error: 'Error al crear artículo' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio_base, activo } = req.body;
    await db.query(
      'UPDATE articulos SET nombre = ?, descripcion = ?, precio_base = ?, activo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nombre, descripcion || null, precio_base || 0, activo !== undefined ? activo : 1, id]
    );
    res.json({ id, ...req.body });
  } catch (error) {
    console.error('Error actualizando artículo:', error);
    res.status(500).json({ error: 'Error al actualizar artículo' });
  }
};

const deleteArticulo = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE articulos SET activo = 0 WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando artículo:', error);
    res.status(500).json({ error: 'Error al eliminar artículo' });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteArticulo
};

