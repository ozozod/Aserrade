const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class DB {
  constructor() {
    // Crear directorio de base de datos si no existe
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'database');
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    const dbPath = path.join(dbDir, 'aserradero.db');
    this.db = new Database(dbPath);
    this.init();
  }

  init() {
    // Tabla de clientes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        telefono TEXT,
        direccion TEXT,
        email TEXT,
        observaciones TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de artículos/productos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS articulos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        descripcion TEXT,
        precio_base REAL DEFAULT 0,
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de remitos (modificada para soportar múltiples artículos)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS remitos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        fecha DATE NOT NULL,
        numero TEXT UNIQUE,
        estado_pago TEXT NOT NULL DEFAULT 'Pendiente',
        monto_pagado REAL DEFAULT 0,
        observaciones TEXT,
        foto_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
      )
    `);

    // Tabla de remito_articulos (relación muchos a muchos)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS remito_articulos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        remito_id INTEGER NOT NULL,
        articulo_id INTEGER,
        articulo_nombre TEXT NOT NULL,
        cantidad REAL NOT NULL,
        precio_unitario REAL NOT NULL,
        precio_total REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (remito_id) REFERENCES remitos(id) ON DELETE CASCADE,
        FOREIGN KEY (articulo_id) REFERENCES articulos(id)
      )
    `);

    // Tabla de pagos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pagos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        remito_id INTEGER NOT NULL,
        fecha DATE NOT NULL,
        monto REAL NOT NULL,
        observaciones TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (remito_id) REFERENCES remitos(id)
      )
    `);

    // Índices
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_remitos_cliente ON remitos(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_remitos_fecha ON remitos(fecha);
      CREATE INDEX IF NOT EXISTS idx_pagos_remito ON pagos(remito_id);
      CREATE INDEX IF NOT EXISTS idx_remito_articulos_remito ON remito_articulos(remito_id);
      CREATE INDEX IF NOT EXISTS idx_remito_articulos_articulo ON remito_articulos(articulo_id);
    `);
  }

  // ============ CLIENTES ============
  getClientes() {
    const stmt = this.db.prepare('SELECT * FROM clientes ORDER BY nombre');
    return stmt.all();
  }

  createCliente(cliente) {
    const stmt = this.db.prepare(`
      INSERT INTO clientes (nombre, telefono, direccion, email, observaciones)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      cliente.nombre,
      cliente.telefono || null,
      cliente.direccion || null,
      cliente.email || null,
      cliente.observaciones || null
    );
    return { id: result.lastInsertRowid, ...cliente };
  }

  updateCliente(id, cliente) {
    const stmt = this.db.prepare(`
      UPDATE clientes 
      SET nombre = ?, telefono = ?, direccion = ?, email = ?, 
          observaciones = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      cliente.nombre,
      cliente.telefono || null,
      cliente.direccion || null,
      cliente.email || null,
      cliente.observaciones || null,
      id
    );
    return { id, ...cliente };
  }

  deleteCliente(id) {
    const stmt = this.db.prepare('DELETE FROM clientes WHERE id = ?');
    stmt.run(id);
    return { success: true };
  }

  // ============ ARTÍCULOS ============
  getArticulos() {
    const stmt = this.db.prepare('SELECT * FROM articulos WHERE activo = 1 ORDER BY nombre');
    return stmt.all();
  }

  getAllArticulos() {
    const stmt = this.db.prepare('SELECT * FROM articulos ORDER BY nombre');
    return stmt.all();
  }

  createArticulo(articulo) {
    const stmt = this.db.prepare(`
      INSERT INTO articulos (nombre, descripcion, precio_base, activo)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      articulo.nombre,
      articulo.descripcion || null,
      articulo.precio_base || 0,
      articulo.activo !== undefined ? articulo.activo : 1
    );
    return { id: result.lastInsertRowid, ...articulo };
  }

  updateArticulo(id, articulo) {
    const stmt = this.db.prepare(`
      UPDATE articulos 
      SET nombre = ?, descripcion = ?, precio_base = ?, activo = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      articulo.nombre,
      articulo.descripcion || null,
      articulo.precio_base || 0,
      articulo.activo !== undefined ? articulo.activo : 1,
      id
    );
    return { id, ...articulo };
  }

  deleteArticulo(id) {
    const stmt = this.db.prepare('UPDATE articulos SET activo = 0 WHERE id = ?');
    stmt.run(id);
    return { success: true };
  }

  // ============ REMITOS ============
  getRemitos(clienteId = null) {
    if (clienteId) {
      const stmt = this.db.prepare(`
        SELECT r.*, c.nombre as cliente_nombre,
               COALESCE(SUM(ra.precio_total), 0) as precio_total
        FROM remitos r
        JOIN clientes c ON r.cliente_id = c.id
        LEFT JOIN remito_articulos ra ON r.id = ra.remito_id
        WHERE r.cliente_id = ?
        GROUP BY r.id
        ORDER BY r.fecha DESC, r.id DESC
      `);
      return stmt.all(clienteId);
    } else {
      const stmt = this.db.prepare(`
        SELECT r.*, c.nombre as cliente_nombre,
               COALESCE(SUM(ra.precio_total), 0) as precio_total
        FROM remitos r
        JOIN clientes c ON r.cliente_id = c.id
        LEFT JOIN remito_articulos ra ON r.id = ra.remito_id
        GROUP BY r.id
        ORDER BY r.fecha DESC, r.id DESC
      `);
      return stmt.all();
    }
  }

  getRemitoArticulos(remitoId) {
    const stmt = this.db.prepare(`
      SELECT ra.*, a.nombre as articulo_nombre
      FROM remito_articulos ra
      LEFT JOIN articulos a ON ra.articulo_id = a.id
      WHERE ra.remito_id = ?
      ORDER BY ra.id
    `);
    return stmt.all(remitoId);
  }

  createRemito(remito) {
    const transaction = this.db.transaction((remitoData) => {
      // Insertar remito
      const stmtRemito = this.db.prepare(`
        INSERT INTO remitos 
        (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmtRemito.run(
        remitoData.cliente_id,
        remitoData.fecha,
        remitoData.numero || null,
        remitoData.estado_pago || 'Pendiente',
        remitoData.monto_pagado || 0,
        remitoData.observaciones || null,
        remitoData.foto_path || null
      );
      const remitoId = result.lastInsertRowid;

      // Insertar artículos del remito
      if (remitoData.articulos && remitoData.articulos.length > 0) {
        const stmtArticulo = this.db.prepare(`
          INSERT INTO remito_articulos 
          (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const articulo of remitoData.articulos) {
          stmtArticulo.run(
            remitoId,
            articulo.articulo_id || null,
            articulo.articulo_nombre,
            articulo.cantidad,
            articulo.precio_unitario,
            articulo.precio_total
          );
        }
      }

      return remitoId;
    });

    const remitoId = transaction(remito);
    return { id: remitoId, ...remito };
  }

  updateRemito(id, remito) {
    const transaction = this.db.transaction((remitoId, remitoData) => {
      // Actualizar remito
      const stmtRemito = this.db.prepare(`
        UPDATE remitos 
        SET cliente_id = ?, fecha = ?, numero = ?, estado_pago = ?, 
            monto_pagado = ?, observaciones = ?, foto_path = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmtRemito.run(
        remitoData.cliente_id,
        remitoData.fecha,
        remitoData.numero || null,
        remitoData.estado_pago || 'Pendiente',
        remitoData.monto_pagado || 0,
        remitoData.observaciones || null,
        remitoData.foto_path || null,
        remitoId
      );

      // Eliminar artículos antiguos
      const deleteArticulos = this.db.prepare('DELETE FROM remito_articulos WHERE remito_id = ?');
      deleteArticulos.run(remitoId);

      // Insertar nuevos artículos
      if (remitoData.articulos && remitoData.articulos.length > 0) {
        const stmtArticulo = this.db.prepare(`
          INSERT INTO remito_articulos 
          (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const articulo of remitoData.articulos) {
          stmtArticulo.run(
            remitoId,
            articulo.articulo_id || null,
            articulo.articulo_nombre,
            articulo.cantidad,
            articulo.precio_unitario,
            articulo.precio_total
          );
        }
      }
    });

    transaction(id, remito);
    return { id, ...remito };
  }

  deleteRemito(id) {
    const transaction = this.db.transaction((remitoId) => {
      // Eliminar pagos relacionados
      const deletePagos = this.db.prepare('DELETE FROM pagos WHERE remito_id = ?');
      deletePagos.run(remitoId);
      
      // Eliminar artículos del remito (ON DELETE CASCADE debería hacerlo, pero por si acaso)
      const deleteArticulos = this.db.prepare('DELETE FROM remito_articulos WHERE remito_id = ?');
      deleteArticulos.run(remitoId);
      
      // Eliminar remito
      const stmt = this.db.prepare('DELETE FROM remitos WHERE id = ?');
      stmt.run(remitoId);
    });

    transaction(id);
    return { success: true };
  }

  // ============ PAGOS ============
  getPagos(remitoId = null) {
    if (remitoId) {
      const stmt = this.db.prepare(`
        SELECT p.*, r.numero as remito_numero, c.nombre as cliente_nombre
        FROM pagos p
        JOIN remitos r ON p.remito_id = r.id
        JOIN clientes c ON r.cliente_id = c.id
        WHERE p.remito_id = ?
        ORDER BY p.fecha DESC
      `);
      return stmt.all(remitoId);
    } else {
      const stmt = this.db.prepare(`
        SELECT p.*, r.numero as remito_numero, c.nombre as cliente_nombre
        FROM pagos p
        JOIN remitos r ON p.remito_id = r.id
        JOIN clientes c ON r.cliente_id = c.id
        ORDER BY p.fecha DESC
      `);
      return stmt.all();
    }
  }

  createPago(pago) {
    const stmt = this.db.prepare(`
      INSERT INTO pagos (remito_id, fecha, monto, observaciones)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      pago.remito_id,
      pago.fecha,
      pago.monto,
      pago.observaciones || null
    );

    // Actualizar estado del remito
    this.actualizarEstadoRemito(pago.remito_id);

    return { id: result.lastInsertRowid, ...pago };
  }

  actualizarEstadoRemito(remitoId) {
    // Calcular total pagado del remito
    const stmtPagos = this.db.prepare('SELECT SUM(monto) as total FROM pagos WHERE remito_id = ?');
    const { total } = stmtPagos.get(remitoId);
    const totalPagado = total || 0;

    // Calcular precio total del remito (suma de artículos)
    const stmtArticulos = this.db.prepare('SELECT SUM(precio_total) as total FROM remito_articulos WHERE remito_id = ?');
    const { total: precioTotal } = stmtArticulos.get(remitoId);
    const precioTotalRemito = precioTotal || 0;

    // Determinar estado
    let estadoPago = 'Pendiente';
    if (precioTotalRemito > 0 && totalPagado >= precioTotalRemito) {
      estadoPago = 'Pagado';
    } else if (totalPagado > 0) {
      estadoPago = 'Pago Parcial';
    }

    // Actualizar remito
    const stmtUpdate = this.db.prepare(`
      UPDATE remitos 
      SET estado_pago = ?, monto_pagado = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmtUpdate.run(estadoPago, totalPagado, remitoId);
  }

  // ============ REPORTES ============
  getCuentaCorriente(clienteId) {
    const remitos = this.getRemitos(clienteId);
    
    // Obtener artículos para cada remito
    const remitosConArticulos = remitos.map(remito => {
      const articulos = this.getRemitoArticulos(remito.id);
      return { ...remito, articulos };
    });
    
    // Calcular totales
    let totalRemitos = 0;
    let totalPagado = 0;
    let totalPendiente = 0;

    remitosConArticulos.forEach(remito => {
      const precioTotal = remito.precio_total || 0;
      totalRemitos += precioTotal;
      totalPagado += remito.monto_pagado || 0;
      totalPendiente += (precioTotal - (remito.monto_pagado || 0));
    });

    return {
      cliente_id: clienteId,
      remitos: remitosConArticulos,
      totales: {
        total_remitos: totalRemitos,
        total_pagado: totalPagado,
        total_pendiente: totalPendiente
      }
    };
  }

  getResumenGeneral() {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(DISTINCT c.id) as total_clientes,
        COUNT(r.id) as total_remitos,
        SUM(r.precio_total) as total_facturado,
        SUM(r.monto_pagado) as total_pagado,
        SUM(r.precio_total - r.monto_pagado) as total_pendiente
      FROM clientes c
      LEFT JOIN remitos r ON c.id = r.cliente_id
    `);
    return stmt.get();
  }
}

module.exports = DB;

