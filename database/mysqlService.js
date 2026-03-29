// Servicio de MySQL para Hostinger
// Se ejecuta en el proceso principal de Electron

const mysql = require('mysql2/promise');

// Configuración de conexión - BASE DE DATOS DE DESARROLLO
// ⚠️ IMPORTANTE: Esta es la base de datos de DESARROLLO, NO de producción
// La app de producción usa 'aserradero_db', esta usa 'aserradero_db_dev'
const dbConfig = {
  host: '31.97.246.42',
  port: 3306,
  user: 'aserradero_user',
  password: 'Aserradero2025#',
  database: 'aserradero_db', // Base de datos de DESARROLLO (no usar aserradero_db que es producción)
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;
let saldosInicialesReadyPromise = null;
let errorReportsReadyPromise = null;

// Usuario actual para auditoría
let usuarioActual = null;

// Función para establecer el usuario actual
const setUsuarioActual = (usuario) => {
  usuarioActual = usuario;
};

// Función para obtener el usuario actual
const getUsuarioActual = () => {
  return usuarioActual || { id: null, nombre_completo: 'Sistema' };
};

// Inicializar pool de conexiones
const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    console.log('✓ Pool de MySQL creado');
  }
  return pool;
};

const ensureSaldosInicialesTable = async () => {
  if (!saldosInicialesReadyPromise) {
    saldosInicialesReadyPromise = getPool().execute(`
      CREATE TABLE IF NOT EXISTS saldos_iniciales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente_id INT NOT NULL,
        fecha_referencia DATE NOT NULL,
        monto DECIMAL(15,2) NOT NULL DEFAULT 0,
        descripcion VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_cliente (cliente_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `).then(() => {
      console.log('✓ Tabla saldos_iniciales lista');
    }).catch(err => {
      saldosInicialesReadyPromise = null;
      console.warn('No se pudo crear tabla saldos_iniciales:', err.message);
      throw err;
    });
  }
  return saldosInicialesReadyPromise;
};

const ensureErrorReportsTable = async () => {
  if (!errorReportsReadyPromise) {
    errorReportsReadyPromise = getPool().execute(`
      CREATE TABLE IF NOT EXISTS error_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        error_message TEXT,
        error_stack TEXT,
        error_type VARCHAR(120),
        component_name VARCHAR(255),
        user_agent TEXT,
        url TEXT,
        app_version VARCHAR(50),
        additional_data JSON,
        resolved TINYINT(1) NOT NULL DEFAULT 0,
        resolved_at DATETIME NULL,
        resolved_by VARCHAR(255) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `).then(() => {
      console.log('✓ Tabla error_reports lista');
    }).catch(err => {
      errorReportsReadyPromise = null;
      console.warn('No se pudo crear tabla error_reports:', err.message);
      throw err;
    });
  }
  return errorReportsReadyPromise;
};

// Probar conexión
const testConnection = async () => {
  try {
    const connection = await getPool().getConnection();
    await connection.ping();
    connection.release();
    return { success: true, message: 'Conectado a Hostinger MySQL correctamente' };
  } catch (error) {
    console.error('Error de conexión MySQL:', error);
    return { success: false, message: error.message };
  }
};

// Formatear fecha para MySQL (YYYY-MM-DD)
const formatearFechaMySQL = (fecha) => {
  if (!fecha) return null;
  
  // Si es string, convertir a Date
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  // Extraer año, mes, día
  const year = fechaObj.getFullYear();
  const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
  const day = String(fechaObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// ============ HELPERS PARA AUDITORÍA ============

// Formatear moneda en formato argentino (1.234,56)
const formatearMoneda = (valor) => {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return '0,00';
  }
  const numero = parseFloat(valor);
  const numeroFormateado = Math.abs(numero).toFixed(2);
  const [parteEntera, parteDecimal] = numeroFormateado.split('.');
  const parteEnteraFormateada = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${parteEnteraFormateada},${parteDecimal}`;
};

// Formatear cantidad con decimales (1.234,56)
const formatearCantidadDecimal = (valor) => {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return '0,00';
  }
  const numero = parseFloat(valor);
  const numeroFormateado = Math.abs(numero).toFixed(2);
  const [parteEntera, parteDecimal] = numeroFormateado.split('.');
  const parteEnteraFormateada = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${parteEnteraFormateada},${parteDecimal}`;
};

// Normalizar número para comparación (quita formato)
const normalizarNumero = (valor) => {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'number') return valor;
  const str = String(valor).replace(/\./g, '').replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
};

// Normalizar nombre para comparación
const normalizarNombre = (nombre) => {
  if (!nombre) return '';
  return String(nombre).trim().toLowerCase();
};

// Filtrar campos técnicos de los datos
const filtrarCamposTecnicos = (datos) => {
  if (!datos || typeof datos !== 'object') return datos;
  const camposIgnorar = ['id', 'created_at', 'updated_at', 'fecha_hora'];
  const filtrado = { ...datos };
  camposIgnorar.forEach(campo => {
    delete filtrado[campo];
  });
  return filtrado;
};

// Obtener nombre del campo en español
const getNombreCampo = (campo) => {
  const nombres = {
    'cliente_id': 'Cliente',
    'fecha': 'Fecha',
    'numero': 'Número de Remito',
    'estado_pago': 'Estado de Pago',
    'monto_pagado': 'Monto Pagado',
    'observaciones': 'Observaciones',
    'foto_path': 'Imagen',
    'articulo_nombre': 'Artículo',
    'cantidad': 'Cantidad',
    'precio_unitario': 'Precio Unitario',
    'precio_total': 'Precio Total'
  };
  return nombres[campo] || campo;
};

// Detectar cambios en artículos de remito
const detectarCambiosArticulos = (articulosAnteriores, articulosNuevos) => {
  const cambios = [];
  
  // Si no hay artículos anteriores, todos son nuevos
  if (!articulosAnteriores || articulosAnteriores.length === 0) {
    if (articulosNuevos && articulosNuevos.length > 0) {
      articulosNuevos.forEach((art, index) => {
        cambios.push({
          tipo: 'articulo_agregado',
          articulo: art.articulo_nombre,
          cantidad: formatearCantidadDecimal(art.cantidad),
          precio_unitario: formatearMoneda(art.precio_unitario),
          precio_total: formatearMoneda(art.precio_total)
        });
      });
    }
    return cambios;
  }
  
  // Si no hay artículos nuevos, todos fueron eliminados
  if (!articulosNuevos || articulosNuevos.length === 0) {
    articulosAnteriores.forEach((art) => {
      cambios.push({
        tipo: 'articulo_eliminado',
        articulo: art.articulo_nombre,
        cantidad: formatearCantidadDecimal(art.cantidad),
        precio_unitario: formatearMoneda(art.precio_unitario),
        precio_total: formatearMoneda(art.precio_total)
      });
    });
    return cambios;
  }
  
  // Comparar artículos: si tienen la misma cantidad, comparar por índice
  if (articulosAnteriores.length === articulosNuevos.length) {
    for (let i = 0; i < articulosAnteriores.length; i++) {
      const artAnt = articulosAnteriores[i];
      const artNuevo = articulosNuevos[i];
      
      const nombreAnt = normalizarNombre(artAnt.articulo_nombre);
      const nombreNuevo = normalizarNombre(artNuevo.articulo_nombre);
      
      // Si cambió el nombre
      if (nombreAnt !== nombreNuevo) {
        cambios.push({
          tipo: 'articulo_nombre',
          anterior: artAnt.articulo_nombre,
          nuevo: artNuevo.articulo_nombre
        });
      }
      
      // Si cambió la cantidad
      const cantAnt = normalizarNumero(artAnt.cantidad);
      const cantNuevo = normalizarNumero(artNuevo.cantidad);
      if (cantAnt !== cantNuevo) {
        cambios.push({
          tipo: 'articulo_cantidad',
          articulo: artNuevo.articulo_nombre,
          anterior: formatearCantidadDecimal(artAnt.cantidad),
          nuevo: formatearCantidadDecimal(artNuevo.cantidad)
        });
      }
      
      // Si cambió el precio unitario
      const precioAnt = normalizarNumero(artAnt.precio_unitario);
      const precioNuevo = normalizarNumero(artNuevo.precio_unitario);
      if (precioAnt !== precioNuevo) {
        cambios.push({
          tipo: 'articulo_precio',
          articulo: artNuevo.articulo_nombre,
          anterior: formatearMoneda(artAnt.precio_unitario),
          nuevo: formatearMoneda(artNuevo.precio_unitario)
        });
      }
    }
  } else {
    // Diferente cantidad de artículos: buscar coincidencias por ID o nombre
    const articulosNuevosMap = new Map();
    articulosNuevos.forEach(art => {
      const key = art.articulo_id || normalizarNombre(art.articulo_nombre);
      if (!articulosNuevosMap.has(key)) {
        articulosNuevosMap.set(key, []);
      }
      articulosNuevosMap.get(key).push(art);
    });
    
    // Verificar artículos eliminados
    articulosAnteriores.forEach(artAnt => {
      const key = artAnt.articulo_id || normalizarNombre(artAnt.articulo_nombre);
      const artsNuevos = articulosNuevosMap.get(key);
      
      if (!artsNuevos || artsNuevos.length === 0) {
        cambios.push({
          tipo: 'articulo_eliminado',
          articulo: artAnt.articulo_nombre,
          cantidad: formatearCantidadDecimal(artAnt.cantidad),
          precio_unitario: formatearMoneda(artAnt.precio_unitario),
          precio_total: formatearMoneda(artAnt.precio_total)
        });
      }
    });
    
    // Verificar artículos agregados
    const articulosAnterioresMap = new Map();
    articulosAnteriores.forEach(art => {
      const key = art.articulo_id || normalizarNombre(art.articulo_nombre);
      if (!articulosAnterioresMap.has(key)) {
        articulosAnterioresMap.set(key, []);
      }
      articulosAnterioresMap.get(key).push(art);
    });
    
    articulosNuevos.forEach(artNuevo => {
      const key = artNuevo.articulo_id || normalizarNombre(artNuevo.articulo_nombre);
      const artsAnt = articulosAnterioresMap.get(key);
      
      if (!artsAnt || artsAnt.length === 0) {
        cambios.push({
          tipo: 'articulo_agregado',
          articulo: artNuevo.articulo_nombre,
          cantidad: formatearCantidadDecimal(artNuevo.cantidad),
          precio_unitario: formatearMoneda(artNuevo.precio_unitario),
          precio_total: formatearMoneda(artNuevo.precio_total)
        });
      }
    });
  }
  
  return cambios;
};

// ============ CLIENTES ============
const getClientes = async () => {
  const [rows] = await getPool().execute('SELECT * FROM clientes ORDER BY nombre');
  return rows;
};

const getCliente = async (id) => {
  const [rows] = await getPool().execute('SELECT * FROM clientes WHERE id = ?', [id]);
  return rows[0] || null;
};

const createCliente = async (cliente, saldoInicialData = null) => {
  const { nombre, telefono, direccion, email, observaciones } = cliente;
  const [result] = await getPool().execute(
    'INSERT INTO clientes (nombre, telefono, direccion, email, observaciones) VALUES (?, ?, ?, ?, ?)',
    [nombre, telefono || '', direccion || '', email || '', observaciones || '']
  );
  const clienteCreado = { id: result.insertId, ...cliente };
  
  const usuario = getUsuarioActual();
  const nombreUsuario = usuario.nombre_completo || 'Sistema';
  const datosNuevosFiltrados = filtrarCamposTecnicos(clienteCreado);
  
  let descripcion = `Cliente "${nombre}" creado por ${nombreUsuario}`;
  
  if (saldoInicialData && saldoInicialData.monto != null && saldoInicialData.monto !== 0) {
    const m = saldoInicialData.monto;
    const signo = m >= 0 ? 'a favor' : 'en contra';
    descripcion += ` | Saldo inicial: $${formatearMoneda(Math.abs(m))} (${signo})`;
    datosNuevosFiltrados.saldo_inicial = m;
    datosNuevosFiltrados.saldo_fecha = saldoInicialData.fecha_referencia;
    datosNuevosFiltrados.saldo_descripcion = saldoInicialData.descripcion;
  }
  
  registrarAuditoria({
    accion: 'crear',
    tabla_afectada: 'clientes',
    registro_id: result.insertId,
    datos_nuevos: datosNuevosFiltrados,
    descripcion: descripcion
  }).catch(error => console.warn('Error registrando auditoría:', error));
  
  return clienteCreado;
};

const updateCliente = async (id, cliente, saldoInicialData = null) => {
  const [clientesAnteriores] = await getPool().execute('SELECT * FROM clientes WHERE id = ?', [id]);
  const datosAnteriores = clientesAnteriores[0];
  
  const { nombre, telefono, direccion, email, observaciones } = cliente;
  await getPool().execute(
    'UPDATE clientes SET nombre = ?, telefono = ?, direccion = ?, email = ?, observaciones = ? WHERE id = ?',
    [nombre, telefono || '', direccion || '', email || '', observaciones || '', id]
  );
  const clienteActualizado = { id, ...cliente };
  
  const usuario = getUsuarioActual();
  const nombreUsuario = usuario.nombre_completo || 'Sistema';
  
  const cambios = [];
  if (datosAnteriores.nombre !== nombre) {
    cambios.push({ campo: 'Nombre', anterior: datosAnteriores.nombre, nuevo: nombre });
  }
  if (String(datosAnteriores.telefono || '') !== String(telefono || '')) {
    cambios.push({ campo: 'Teléfono', anterior: datosAnteriores.telefono || 'Sin teléfono', nuevo: telefono || 'Sin teléfono' });
  }
  if (String(datosAnteriores.direccion || '') !== String(direccion || '')) {
    cambios.push({ campo: 'Dirección', anterior: datosAnteriores.direccion || 'Sin dirección', nuevo: direccion || 'Sin dirección' });
  }
  if (String(datosAnteriores.email || '') !== String(email || '')) {
    cambios.push({ campo: 'Email', anterior: datosAnteriores.email || 'Sin email', nuevo: email || 'Sin email' });
  }
  if (String(datosAnteriores.observaciones || '') !== String(observaciones || '')) {
    cambios.push({ campo: 'Observaciones', anterior: datosAnteriores.observaciones || 'Sin observaciones', nuevo: observaciones || 'Sin observaciones' });
  }
  
  // Incluir cambios de saldo inicial si se proporcionaron
  if (saldoInicialData && saldoInicialData.monto != null) {
    const saldoAnterior = saldoInicialData.anterior;
    const montoAnterior = saldoAnterior ? parseFloat(saldoAnterior.monto || 0) : 0;
    const montoNuevo = saldoInicialData.monto;
    if (montoAnterior !== montoNuevo) {
      const signoAnt = montoAnterior >= 0 ? 'a favor' : 'en contra';
      const signoNuevo = montoNuevo >= 0 ? 'a favor' : 'en contra';
      if (montoAnterior === 0 && montoNuevo !== 0) {
        cambios.push({ campo: 'Saldo Inicial', anterior: 'Sin saldo', nuevo: `$${formatearMoneda(Math.abs(montoNuevo))} (${signoNuevo})` });
      } else if (montoNuevo === 0) {
        cambios.push({ campo: 'Saldo Inicial', anterior: `$${formatearMoneda(Math.abs(montoAnterior))} (${signoAnt})`, nuevo: 'Sin saldo' });
      } else {
        cambios.push({ campo: 'Saldo Inicial', anterior: `$${formatearMoneda(Math.abs(montoAnterior))} (${signoAnt})`, nuevo: `$${formatearMoneda(Math.abs(montoNuevo))} (${signoNuevo})` });
      }
    }
  }
  
  const datosAnterioresFiltrados = filtrarCamposTecnicos(datosAnteriores);
  const datosNuevosFiltrados = filtrarCamposTecnicos(clienteActualizado);
  
  if (saldoInicialData) {
    if (saldoInicialData.anterior) {
      datosAnterioresFiltrados.saldo_inicial = parseFloat(saldoInicialData.anterior.monto || 0);
    }
    datosNuevosFiltrados.saldo_inicial = saldoInicialData.monto;
  }
  
  let descripcion = `Cliente "${nombre}" modificado por ${nombreUsuario}`;
  if (cambios.length > 0) {
    const cambiosTexto = cambios.map(c => `${c.campo}: ${c.anterior} → ${c.nuevo}`).join(' | ');
    descripcion += ` | Cambios: ${cambiosTexto}`;
  } else {
    descripcion += ' | Sin cambios específicos detectados';
  }
  
  registrarAuditoria({
    accion: 'editar',
    tabla_afectada: 'clientes',
    registro_id: id,
    datos_anteriores: datosAnterioresFiltrados,
    datos_nuevos: datosNuevosFiltrados,
    descripcion: descripcion
  }).catch(error => console.warn('Error registrando auditoría:', error));
  
  return clienteActualizado;
};

const deleteCliente = async (id) => {
  // Obtener datos antes de eliminar
  const [clientes] = await getPool().execute('SELECT * FROM clientes WHERE id = ?', [id]);
  const datosAnteriores = clientes[0];
  
  if (!datosAnteriores) {
    throw new Error('Cliente no encontrado');
  }
  
  // Obtener usuario actual
  const usuario = getUsuarioActual();
  const nombreUsuario = usuario.nombre_completo || 'Sistema';
  
  // Filtrar campos técnicos
  const datosAnterioresFiltrados = filtrarCamposTecnicos(datosAnteriores);
  
  await getPool().execute('DELETE FROM clientes WHERE id = ?', [id]);
  
  // Crear descripción detallada
  const descripcion = `Cliente "${datosAnteriores.nombre}" eliminado por ${nombreUsuario}`;
  
  // Registrar auditoría
  registrarAuditoria({
    accion: 'eliminar',
    tabla_afectada: 'clientes',
    registro_id: id,
    datos_anteriores: datosAnterioresFiltrados,
    descripcion: descripcion
  }).catch(error => console.warn('Error registrando auditoría:', error));
  
  return { success: true };
};

// ============ ARTICULOS ============
const getArticulos = async (clienteId = null) => {
  let query = 'SELECT * FROM articulos WHERE activo = 1';
  const params = [];
  
  if (clienteId) {
    query += ' AND (cliente_id = ? OR cliente_id IS NULL)';
    params.push(clienteId);
  }
  
  query += ' ORDER BY nombre';
  const [rows] = await getPool().execute(query, params);
  return rows;
};

const createArticulo = async (articulo) => {
  const { nombre, descripcion: descripcionArticulo, precio_base, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, imagen_url } = articulo;
  const [result] = await getPool().execute(
    `INSERT INTO articulos (nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, imagen_url) 
     VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre, descripcionArticulo || '', precio_base || 0, cliente_id || null, codigo || null, medida || '', cabezal || '', costado || '', fondo || '', taco || '', esquinero || '', despeje || '', imagen_url || null]
  );
  const articuloCreado = { id: result.insertId, ...articulo };
  
  // Obtener nombre del cliente
  let nombreCliente = 'Universal';
  if (cliente_id) {
    const [clientes] = await getPool().execute('SELECT nombre FROM clientes WHERE id = ?', [cliente_id]);
    if (clientes.length > 0) {
      nombreCliente = clientes[0].nombre;
    }
  }
  
  // Obtener usuario actual
  const usuario = getUsuarioActual();
  const nombreUsuario = usuario.nombre_completo || 'Sistema';
  
  // Filtrar campos técnicos
  const datosNuevosFiltrados = filtrarCamposTecnicos(articuloCreado);
  
  // Crear descripción detallada
  const descripcion = `Artículo "${nombre}" creado por ${nombreUsuario} (Cliente: ${nombreCliente})`;
  
  // Registrar auditoría
  registrarAuditoria({
    accion: 'crear',
    tabla_afectada: 'articulos',
    registro_id: result.insertId,
    datos_nuevos: datosNuevosFiltrados,
    descripcion: descripcion
  }).catch(error => console.warn('Error registrando auditoría:', error));
  
  return articuloCreado;
};

const updateArticulo = async (id, articulo) => {
  // Obtener datos anteriores
  const [articulosAnteriores] = await getPool().execute('SELECT * FROM articulos WHERE id = ?', [id]);
  const datosAnteriores = articulosAnteriores[0];
  
  const { nombre, descripcion: descripcionArticulo, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, imagen_url } = articulo;
  
  // Obtener nombre del cliente (anterior y nuevo)
  let nombreClienteAnt = 'Universal';
  if (datosAnteriores.cliente_id) {
    const [clientesAnt] = await getPool().execute('SELECT nombre FROM clientes WHERE id = ?', [datosAnteriores.cliente_id]);
    if (clientesAnt.length > 0) nombreClienteAnt = clientesAnt[0].nombre;
  }
  
  let nombreClienteNuevo = 'Universal';
  if (cliente_id) {
    const [clientesNuevo] = await getPool().execute('SELECT nombre FROM clientes WHERE id = ?', [cliente_id]);
    if (clientesNuevo.length > 0) nombreClienteNuevo = clientesNuevo[0].nombre;
  }
  
  // Si se proporciona imagen_url, actualizarla; si no, mantener la existente
  if (imagen_url !== undefined) {
    await getPool().execute(
      `UPDATE articulos SET nombre = ?, descripcion = ?, precio_base = ?, activo = ?, cliente_id = ?, codigo = ?, medida = ?, cabezal = ?, costado = ?, fondo = ?, taco = ?, esquinero = ?, despeje = ?, imagen_url = ? WHERE id = ?`,
      [nombre, descripcionArticulo || '', precio_base || 0, activo !== false ? 1 : 0, cliente_id || null, codigo || null, medida || '', cabezal || '', costado || '', fondo || '', taco || '', esquinero || '', despeje || '', imagen_url || null, id]
    );
  } else {
    await getPool().execute(
      `UPDATE articulos SET nombre = ?, descripcion = ?, precio_base = ?, activo = ?, cliente_id = ?, codigo = ?, medida = ?, cabezal = ?, costado = ?, fondo = ?, taco = ?, esquinero = ?, despeje = ? WHERE id = ?`,
      [nombre, descripcionArticulo || '', precio_base || 0, activo !== false ? 1 : 0, cliente_id || null, codigo || null, medida || '', cabezal || '', costado || '', fondo || '', taco || '', esquinero || '', despeje || '', id]
    );
  }
  
  const articuloActualizado = { id, ...articulo };
  
  // Obtener usuario actual
  const usuario = getUsuarioActual();
  const nombreUsuario = usuario.nombre_completo || 'Sistema';
  
  // Detectar cambios
  const cambios = [];
  if (datosAnteriores.nombre !== nombre) {
    cambios.push({ campo: 'Nombre', anterior: datosAnteriores.nombre, nuevo: nombre });
  }
  if (String(datosAnteriores.descripcion || '') !== String(descripcionArticulo || '')) {
    cambios.push({ campo: 'Descripción', anterior: datosAnteriores.descripcion || 'Sin descripción', nuevo: descripcionArticulo || 'Sin descripción' });
  }
  const precioAnt = normalizarNumero(datosAnteriores.precio_base);
  const precioNuevo = normalizarNumero(precio_base);
  if (precioAnt !== precioNuevo) {
    cambios.push({ campo: 'Precio Base', anterior: formatearMoneda(datosAnteriores.precio_base || 0), nuevo: formatearMoneda(precio_base || 0) });
  }
  if (datosAnteriores.cliente_id !== cliente_id) {
    cambios.push({ campo: 'Cliente', anterior: nombreClienteAnt, nuevo: nombreClienteNuevo });
  }
  if (String(datosAnteriores.codigo || '') !== String(codigo || '')) {
    cambios.push({ campo: 'Código', anterior: datosAnteriores.codigo || 'Sin código', nuevo: codigo || 'Sin código' });
  }
  if (String(datosAnteriores.medida || '') !== String(medida || '')) {
    cambios.push({ campo: 'Medida', anterior: datosAnteriores.medida || 'Sin medida', nuevo: medida || 'Sin medida' });
  }
  if (String(datosAnteriores.imagen_url || '') !== String(imagen_url || '')) {
    if (!datosAnteriores.imagen_url && imagen_url) {
      cambios.push({ campo: 'Imagen', cambio: 'Imagen agregada' });
    } else if (datosAnteriores.imagen_url && !imagen_url) {
      cambios.push({ campo: 'Imagen', cambio: 'Imagen eliminada' });
    } else {
      cambios.push({ campo: 'Imagen', cambio: 'Imagen cambiada' });
    }
  }
  
  // Filtrar campos técnicos
  const datosAnterioresFiltrados = filtrarCamposTecnicos(datosAnteriores);
  const datosNuevosFiltrados = filtrarCamposTecnicos(articuloActualizado);
  
  // Crear descripción detallada
  let descripcion = `Artículo "${nombre}" modificado por ${nombreUsuario} (Cliente: ${nombreClienteNuevo})`;
  if (cambios.length > 0) {
    const cambiosTexto = cambios.map(c => {
      if (c.campo === 'Imagen') {
        return `- ${c.cambio}`;
      } else {
        return `- ${c.campo}: ${c.anterior} → ${c.nuevo}`;
      }
    }).join(' | ');
    descripcion += ` | Cambios: ${cambiosTexto}`;
  } else {
    descripcion += ' | Sin cambios específicos detectados';
  }
  
  // Registrar auditoría
  registrarAuditoria({
    accion: 'editar',
    tabla_afectada: 'articulos',
    registro_id: id,
    datos_anteriores: datosAnterioresFiltrados,
    datos_nuevos: datosNuevosFiltrados,
    descripcion: descripcion
  }).catch(error => console.warn('Error registrando auditoría:', error));
  
  return articuloActualizado;
};

const deleteArticulo = async (id) => {
  // Obtener datos antes de desactivar
  const [articulos] = await getPool().execute('SELECT * FROM articulos WHERE id = ?', [id]);
  const datosAnteriores = articulos[0];
  
  if (!datosAnteriores) {
    throw new Error('Artículo no encontrado');
  }
  
  // Obtener nombre del cliente
  let nombreCliente = 'Universal';
  if (datosAnteriores.cliente_id) {
    const [clientes] = await getPool().execute('SELECT nombre FROM clientes WHERE id = ?', [datosAnteriores.cliente_id]);
    if (clientes.length > 0) {
      nombreCliente = clientes[0].nombre;
    }
  }
  
  // Obtener usuario actual
  const usuario = getUsuarioActual();
  const nombreUsuario = usuario.nombre_completo || 'Sistema';
  
  // Filtrar campos técnicos
  const datosAnterioresFiltrados = filtrarCamposTecnicos(datosAnteriores);
  
  // Soft delete - solo desactivar
  await getPool().execute('UPDATE articulos SET activo = 0 WHERE id = ?', [id]);
  
  // Crear descripción detallada
  const descripcion = `Artículo "${datosAnteriores.nombre}" eliminado por ${nombreUsuario} (Cliente: ${nombreCliente})`;
  
  // Registrar auditoría
  registrarAuditoria({
    accion: 'eliminar',
    tabla_afectada: 'articulos',
    registro_id: id,
    datos_anteriores: datosAnterioresFiltrados,
    descripcion: descripcion
  }).catch(error => console.warn('Error registrando auditoría:', error));
  
  return { success: true };
};

// ============ REMITOS ============
const getRemitos = async (clienteId = null) => {
  let query = `
    SELECT r.*, c.nombre as cliente_nombre
    FROM remitos r
    LEFT JOIN clientes c ON r.cliente_id = c.id
  `;
  const params = [];
  
  if (clienteId) {
    query += ' WHERE r.cliente_id = ?';
    params.push(clienteId);
  }
  
  query += ' ORDER BY r.fecha DESC, r.id DESC';
  const [remitos] = await getPool().execute(query, params);
  
  // Obtener artículos de cada remito con código del artículo
  for (const remito of remitos) {
    const [articulos] = await getPool().execute(
      `SELECT ra.*, a.codigo as articulo_codigo
       FROM remito_articulos ra
       LEFT JOIN articulos a ON ra.articulo_id = a.id
       WHERE ra.remito_id = ?
       ORDER BY ra.id`,
      [remito.id]
    );
    remito.articulos = articulos;
    
    // Calcular precio total
    remito.precio_total = articulos.reduce((sum, a) => sum + parseFloat(a.precio_total || 0), 0);
  }
  
  return remitos;
};

const getRemito = async (id) => {
  const [rows] = await getPool().execute(
    `SELECT r.*, c.nombre as cliente_nombre
     FROM remitos r
     LEFT JOIN clientes c ON r.cliente_id = c.id
     WHERE r.id = ?`,
    [id]
  );
  
  if (rows.length === 0) return null;
  
  const remito = rows[0];
  const [articulos] = await getPool().execute(
    `SELECT ra.*, a.codigo as articulo_codigo
     FROM remito_articulos ra
     LEFT JOIN articulos a ON ra.articulo_id = a.id
     WHERE ra.remito_id = ?
     ORDER BY ra.id`,
    [id]
  );
  remito.articulos = articulos;
  remito.precio_total = articulos.reduce((sum, a) => sum + parseFloat(a.precio_total || 0), 0);
  
  return remito;
};

const createRemito = async (remito) => {
  const connection = await getPool().getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, articulos } = remito;
    
    // Formatear fecha para MySQL
    const fechaMySQL = formatearFechaMySQL(fecha);
    
    // Obtener nombre del cliente
    let nombreCliente = 'Sin cliente';
    if (cliente_id) {
      const [clientes] = await connection.execute('SELECT nombre FROM clientes WHERE id = ?', [cliente_id]);
      if (clientes.length > 0) {
        nombreCliente = clientes[0].nombre;
      }
    }
    
    // Obtener usuario actual
    const usuario = getUsuarioActual();
    const nombreUsuario = usuario.nombre_completo || 'Sistema';
    
    // Crear remito
    const [result] = await connection.execute(
      `INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cliente_id, fechaMySQL, numero || null, estado_pago || 'Pendiente', monto_pagado || 0, observaciones || '', foto_path || null]
    );
    
    const remitoId = result.insertId;
    
    // Crear artículos del remito
    if (articulos && articulos.length > 0) {
      for (const art of articulos) {
        await connection.execute(
          `INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [remitoId, art.articulo_id || null, art.articulo_nombre, art.cantidad, art.precio_unitario, art.precio_total]
        );
      }
    }
    
    await connection.commit();
    
    // Obtener remito completo con artículos para auditoría
    const [remitoCompleto] = await connection.execute('SELECT * FROM remitos WHERE id = ?', [remitoId]);
    const [articulosRemito] = await connection.execute(
      'SELECT * FROM remito_articulos WHERE remito_id = ? ORDER BY id',
      [remitoId]
    );
    const remitoParaAuditoria = filtrarCamposTecnicos({
      ...remitoCompleto[0],
      articulos: articulosRemito
    });
    
    // Crear descripción detallada
    const numeroRemito = numero || remitoId;
    const descripcion = `Remito #${numeroRemito} creado por ${nombreUsuario} para cliente: ${nombreCliente}`;
    
    // Registrar auditoría (asíncrono, no bloquear)
    registrarAuditoria({
      accion: 'crear',
      tabla_afectada: 'remitos',
      registro_id: remitoId,
      datos_nuevos: remitoParaAuditoria,
      descripcion: descripcion
    }).catch(error => {
      console.warn('Error registrando auditoría (no crítico):', error);
    });
    
    return { id: remitoId, ...remito };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateRemito = async (id, remito) => {
  const connection = await getPool().getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Obtener datos anteriores completos para auditoría
    const [remitosAnteriores] = await connection.execute('SELECT * FROM remitos WHERE id = ?', [id]);
    const remitoAnterior = remitosAnteriores[0];
    
    // Obtener artículos anteriores
    const [articulosAnteriores] = await connection.execute(
      'SELECT * FROM remito_articulos WHERE remito_id = ? ORDER BY id',
      [id]
    );
    
    const { cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, articulos } = remito;
    
    // Formatear fecha para MySQL
    const fechaMySQL = formatearFechaMySQL(fecha);
    
    // Obtener nombre del cliente
    let nombreCliente = 'Sin cliente';
    if (cliente_id) {
      const [clientes] = await connection.execute('SELECT nombre FROM clientes WHERE id = ?', [cliente_id]);
      if (clientes.length > 0) {
        nombreCliente = clientes[0].nombre;
      }
    }
    
    // Obtener usuario actual
    const usuario = getUsuarioActual();
    const nombreUsuario = usuario.nombre_completo || 'Sistema';
    
    // Detectar cambios en campos del remito
    const cambiosRemito = [];
    
    // Cliente
    if (remitoAnterior.cliente_id !== cliente_id) {
      let clienteAnterior = 'Sin cliente';
      if (remitoAnterior.cliente_id) {
        const [clientesAnt] = await connection.execute('SELECT nombre FROM clientes WHERE id = ?', [remitoAnterior.cliente_id]);
        if (clientesAnt.length > 0) clienteAnterior = clientesAnt[0].nombre;
      }
      cambiosRemito.push({
        campo: 'Cliente',
        anterior: clienteAnterior,
        nuevo: nombreCliente
      });
    }
    
    // Fecha
    const fechaAnterior = formatearFechaMySQL(remitoAnterior.fecha);
    if (fechaAnterior !== fechaMySQL) {
      cambiosRemito.push({
        campo: 'Fecha',
        anterior: fechaAnterior || 'Sin fecha',
        nuevo: fechaMySQL || 'Sin fecha'
      });
    }
    
    // Número
    if (String(remitoAnterior.numero || '') !== String(numero || '')) {
      cambiosRemito.push({
        campo: 'Número de Remito',
        anterior: remitoAnterior.numero || 'Sin número',
        nuevo: numero || 'Sin número'
      });
    }
    
    // Estado de pago
    if (remitoAnterior.estado_pago !== estado_pago) {
      cambiosRemito.push({
        campo: 'Estado de Pago',
        anterior: remitoAnterior.estado_pago || 'Pendiente',
        nuevo: estado_pago || 'Pendiente'
      });
    }
    
    // Monto pagado
    const montoAnt = normalizarNumero(remitoAnterior.monto_pagado);
    const montoNuevo = normalizarNumero(monto_pagado);
    if (montoAnt !== montoNuevo) {
      cambiosRemito.push({
        campo: 'Monto Pagado',
        anterior: formatearMoneda(remitoAnterior.monto_pagado || 0),
        nuevo: formatearMoneda(monto_pagado || 0)
      });
    }
    
    // Observaciones
    if (String(remitoAnterior.observaciones || '') !== String(observaciones || '')) {
      cambiosRemito.push({
        campo: 'Observaciones',
        anterior: remitoAnterior.observaciones || 'Sin observaciones',
        nuevo: observaciones || 'Sin observaciones'
      });
    }
    
    // Imagen
    if (String(remitoAnterior.foto_path || '') !== String(foto_path || '')) {
      if (!remitoAnterior.foto_path && foto_path) {
        cambiosRemito.push({ campo: 'Imagen', cambio: 'Imagen agregada' });
      } else if (remitoAnterior.foto_path && !foto_path) {
        cambiosRemito.push({ campo: 'Imagen', cambio: 'Imagen eliminada' });
      } else {
        cambiosRemito.push({ campo: 'Imagen', cambio: 'Imagen cambiada' });
      }
    }
    
    // Actualizar remito
    await connection.execute(
      `UPDATE remitos SET cliente_id = ?, fecha = ?, numero = ?, estado_pago = ?, monto_pagado = ?, observaciones = ?, foto_path = ? WHERE id = ?`,
      [cliente_id, fechaMySQL, numero || null, estado_pago || 'Pendiente', monto_pagado || 0, observaciones || '', foto_path || null, id]
    );
    
    // Si hay artículos, actualizar
    let cambiosArticulos = [];
    if (articulos !== undefined) {
      // Detectar cambios en artículos antes de eliminarlos
      cambiosArticulos = detectarCambiosArticulos(articulosAnteriores, articulos);
      
      // Eliminar artículos existentes
      await connection.execute('DELETE FROM remito_articulos WHERE remito_id = ?', [id]);
      
      // Crear nuevos artículos
      if (articulos && articulos.length > 0) {
        for (const art of articulos) {
          await connection.execute(
            `INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, art.articulo_id || null, art.articulo_nombre, art.cantidad, art.precio_unitario, art.precio_total]
          );
        }
      }
    }
    
    await connection.commit();
    
    // Obtener datos nuevos completos para auditoría
    const [remitosNuevos] = await connection.execute('SELECT * FROM remitos WHERE id = ?', [id]);
    const remitoNuevo = remitosNuevos[0];
    const [articulosNuevos] = await connection.execute(
      'SELECT * FROM remito_articulos WHERE remito_id = ? ORDER BY id',
      [id]
    );
    
    const datosAnterioresFiltrados = filtrarCamposTecnicos({
      ...remitoAnterior,
      articulos: articulosAnteriores
    });
    const datosNuevosFiltrados = filtrarCamposTecnicos({
      ...remitoNuevo,
      articulos: articulosNuevos
    });
    
    // Crear descripción detallada de cambios
    const numeroRemito = numero || id;
    let descripcion = `Remito #${numeroRemito} modificado por ${nombreUsuario} (Cliente: ${nombreCliente})`;
    
    const todosLosCambios = [...cambiosRemito, ...cambiosArticulos];
    if (todosLosCambios.length > 0) {
      const cambiosTexto = todosLosCambios.map(cambio => {
        if (cambio.campo === 'Imagen') {
          return `- ${cambio.cambio}`;
        } else if (cambio.tipo === 'articulo_agregado') {
          return `- Artículo agregado: ${cambio.articulo} (Cantidad: ${cambio.cantidad}, Precio: ${cambio.precio_unitario}, Total: ${cambio.precio_total})`;
        } else if (cambio.tipo === 'articulo_eliminado') {
          return `- Artículo eliminado: ${cambio.articulo} (Cantidad: ${cambio.cantidad}, Precio: ${cambio.precio_unitario}, Total: ${cambio.precio_total})`;
        } else if (cambio.tipo === 'articulo_cantidad') {
          return `- Cantidad de "${cambio.articulo}": ${cambio.anterior} → ${cambio.nuevo}`;
        } else if (cambio.tipo === 'articulo_precio') {
          return `- Precio de "${cambio.articulo}": $${cambio.anterior} → $${cambio.nuevo}`;
        } else if (cambio.tipo === 'articulo_nombre') {
          return `- Nombre de artículo: "${cambio.anterior}" → "${cambio.nuevo}"`;
        } else {
          return `- ${cambio.campo}: ${cambio.anterior || 'Sin valor'} → ${cambio.nuevo || 'Sin valor'}`;
        }
      }).join(' | ');
      descripcion += ` | Cambios: ${cambiosTexto}`;
    } else {
      descripcion += ' | Sin cambios específicos detectados';
    }
    
    // Registrar auditoría (asíncrono, no bloquear)
    registrarAuditoria({
      accion: 'editar',
      tabla_afectada: 'remitos',
      registro_id: id,
      datos_anteriores: datosAnterioresFiltrados,
      datos_nuevos: datosNuevosFiltrados,
      descripcion: descripcion
    }).catch(error => {
      console.warn('Error registrando auditoría (no crítico):', error);
    });
    
    return { id, ...remito };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const deleteRemito = async (id) => {
  const connection = await getPool().getConnection();
  
  try {
    // Obtener datos completos del remito antes de eliminar (incluyendo artículos)
    const [remitos] = await connection.execute('SELECT * FROM remitos WHERE id = ?', [id]);
    
    if (remitos.length === 0) {
      throw new Error('Remito no encontrado');
    }
    
    const remito = remitos[0];
    
    // Obtener artículos del remito
    const [articulos] = await connection.execute(
      'SELECT * FROM remito_articulos WHERE remito_id = ? ORDER BY id',
      [id]
    );
    
    // Obtener nombre del cliente
    let nombreCliente = 'Sin cliente';
    if (remito.cliente_id) {
      const [clientes] = await connection.execute('SELECT nombre FROM clientes WHERE id = ?', [remito.cliente_id]);
      if (clientes.length > 0) {
        nombreCliente = clientes[0].nombre;
      }
    }
    
    // Obtener usuario actual
    const usuario = getUsuarioActual();
    const nombreUsuario = usuario.nombre_completo || 'Sistema';
    
    // Calcular precio total del remito desde los artículos
    const precioTotal = articulos.reduce((sum, art) => sum + parseFloat(art.precio_total || 0), 0);
    
    // Filtrar campos técnicos y agregar información adicional
    const remitoCompleto = {
      ...remito,
      articulos: articulos,
      cliente_nombre: nombreCliente, // Agregar nombre del cliente para facilitar visualización
      precio_total: precioTotal // Agregar precio total calculado
    };
    const datosAnterioresFiltrados = filtrarCamposTecnicos(remitoCompleto);
    
    // DEBUG: Verificar que los datos se están capturando correctamente
    console.log('🔍 [deleteRemito] Datos capturados antes de eliminar:');
    console.log('- Remito ID:', id);
    console.log('- Número:', remito.numero);
    console.log('- Cliente:', nombreCliente);
    console.log('- Artículos:', articulos.length);
    console.log('- Precio Total:', precioTotal);
    console.log('- Datos completos:', JSON.stringify(datosAnterioresFiltrados, null, 2));
    
    // Eliminar remito (los artículos se eliminan por CASCADE)
    await connection.execute('DELETE FROM remitos WHERE id = ?', [id]);
    
    // Crear descripción detallada
    const numeroRemito = remito.numero || id;
    const descripcion = `Remito #${numeroRemito} eliminado por ${nombreUsuario} (Cliente: ${nombreCliente})`;
    
    // Registrar auditoría
    await registrarAuditoria({
      accion: 'eliminar',
      tabla_afectada: 'remitos',
      registro_id: id,
      datos_anteriores: datosAnterioresFiltrados,
      descripcion: descripcion
    });
    
    console.log('✅ [deleteRemito] Auditoría registrada correctamente');
    
    return { success: true };
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
};

// ============ PAGOS ============
const getPagos = async (remitoId = null) => {
  let query = `
    SELECT p.id, p.remito_id, p.fecha, p.monto, p.observaciones, p.es_cheque, p.cheque_rebotado, p.created_at,
           r.numero as remito_numero, 
           COALESCE(c.nombre, c2.nombre) as cliente_nombre,
           COALESCE(r.cliente_id, p.cliente_id) as cliente_id
    FROM pagos p
    LEFT JOIN remitos r ON p.remito_id = r.id
    LEFT JOIN clientes c ON r.cliente_id = c.id
    LEFT JOIN clientes c2 ON p.cliente_id = c2.id
    WHERE (p.observaciones NOT LIKE '%[OCULTO]%' OR p.observaciones IS NULL)
  `;
  const params = [];
  
  if (remitoId) {
    query += ' AND p.remito_id = ?';
    params.push(remitoId);
  }
  
  query += ' ORDER BY p.fecha DESC, p.id DESC';
  const [rows] = await getPool().execute(query, params);
  return rows;
};

const createPago = async (pago) => {
  const { remito_id, cliente_id, fecha, monto, observaciones, es_cheque } = pago;
  
  const [result] = await getPool().execute(
    'INSERT INTO pagos (remito_id, cliente_id, fecha, monto, observaciones, es_cheque, cheque_rebotado) VALUES (?, ?, ?, ?, ?, ?, FALSE)',
    [remito_id || null, cliente_id || null, fecha, monto, observaciones || '', es_cheque ? 1 : 0]
  );
  
  // Solo actualizar estado del remito si hay remito_id (no es pago a cuenta)
  if (remito_id) {
    await actualizarEstadoRemito(remito_id);
  }
  
  // Obtener nombre del cliente
  let nombreCliente = 'Sin cliente';
  if (cliente_id) {
    const [clientes] = await getPool().execute('SELECT nombre FROM clientes WHERE id = ?', [cliente_id]);
    if (clientes.length > 0) {
      nombreCliente = clientes[0].nombre;
    }
  } else if (remito_id) {
    // Si no hay cliente_id pero hay remito_id, obtener cliente del remito
    const [remitos] = await getPool().execute('SELECT cliente_id FROM remitos WHERE id = ?', [remito_id]);
    if (remitos.length > 0 && remitos[0].cliente_id) {
      const [clientes] = await getPool().execute('SELECT nombre FROM clientes WHERE id = ?', [remitos[0].cliente_id]);
      if (clientes.length > 0) {
        nombreCliente = clientes[0].nombre;
      }
    }
  }
  
  // Obtener usuario actual
  const usuario = getUsuarioActual();
  const nombreUsuario = usuario.nombre_completo || 'Sistema';
  
  const pagoCreado = { id: result.insertId, ...pago };
  
  // Filtrar campos técnicos
  const datosNuevosFiltrados = filtrarCamposTecnicos(pagoCreado);
  
  // Crear descripción detallada
  const montoFormateado = formatearMoneda(monto);
  let tipoPago = '';
  if (es_cheque) {
    tipoPago = ' (Cheque)';
  } else if (!remito_id && cliente_id) {
    tipoPago = ' (Pago a cuenta)';
  }
  const descripcion = `Pago de $${montoFormateado}${tipoPago} creado por ${nombreUsuario} para cliente: ${nombreCliente}${remito_id ? ` (Remito #${remito_id})` : ''}`;
  
  // Registrar auditoría
  registrarAuditoria({
    accion: 'crear',
    tabla_afectada: 'pagos',
    registro_id: result.insertId,
    datos_nuevos: datosNuevosFiltrados,
    descripcion: descripcion
  }).catch(error => console.warn('Error registrando auditoría:', error));
  
  return pagoCreado;
};

// Crear múltiples pagos en batch (más eficiente)
const createPagosBatch = async (pagos) => {
  if (!pagos || pagos.length === 0) return [];
  
  const resultados = [];
  const remitosAfectados = new Set();
  
  // Obtener usuario actual una sola vez
  const usuario = getUsuarioActual();
  const nombreUsuario = usuario.nombre_completo || 'Sistema';
  
  for (const pago of pagos) {
    const { remito_id, cliente_id, fecha, monto, observaciones, es_cheque } = pago;
    
    const [result] = await getPool().execute(
      'INSERT INTO pagos (remito_id, cliente_id, fecha, monto, observaciones, es_cheque, cheque_rebotado) VALUES (?, ?, ?, ?, ?, ?, FALSE)',
      [remito_id || null, cliente_id || null, fecha, monto, observaciones || '', es_cheque ? 1 : 0]
    );
    
    const pagoCreado = { id: result.insertId, ...pago };
    resultados.push(pagoCreado);
    
    // Obtener nombre del cliente para auditoría
    let nombreCliente = 'Sin cliente';
    if (cliente_id) {
      const [clientes] = await getPool().execute('SELECT nombre FROM clientes WHERE id = ?', [cliente_id]);
      if (clientes.length > 0) {
        nombreCliente = clientes[0].nombre;
      }
    } else if (remito_id) {
      const [remitos] = await getPool().execute('SELECT cliente_id FROM remitos WHERE id = ?', [remito_id]);
      if (remitos.length > 0 && remitos[0].cliente_id) {
        const [clientes] = await getPool().execute('SELECT nombre FROM clientes WHERE id = ?', [remitos[0].cliente_id]);
        if (clientes.length > 0) {
          nombreCliente = clientes[0].nombre;
        }
      }
    }
    
    // Filtrar campos técnicos
    const datosNuevosFiltrados = filtrarCamposTecnicos(pagoCreado);
    
    // Crear descripción detallada
    const montoFormateado = formatearMoneda(monto);
    let tipoPago = '';
    if (es_cheque) {
      tipoPago = ' (Cheque)';
    } else if (!remito_id && cliente_id) {
      tipoPago = ' (Pago a cuenta)';
    }
    const descripcion = `Pago de $${montoFormateado}${tipoPago} creado por ${nombreUsuario} para cliente: ${nombreCliente}${remito_id ? ` (Remito #${remito_id})` : ''}`;
    
    // Registrar auditoría para cada pago
    registrarAuditoria({
      accion: 'crear',
      tabla_afectada: 'pagos',
      registro_id: result.insertId,
      datos_nuevos: datosNuevosFiltrados,
      descripcion: descripcion
    }).catch(error => console.warn('Error registrando auditoría:', error));
    
    if (remito_id) {
      remitosAfectados.add(remito_id);
    }
  }
  
  // Actualizar estados de todos los remitos afectados
  for (const remitoId of remitosAfectados) {
    await actualizarEstadoRemito(remitoId);
  }
  
  return resultados;
};

const updatePago = async (id, pago) => {
  // Obtener datos anteriores
  const [pagosAnteriores] = await getPool().execute('SELECT * FROM pagos WHERE id = ?', [id]);
  const datosAnteriores = pagosAnteriores[0];
  const oldRemitoId = datosAnteriores?.remito_id;
  
  const { remito_id, fecha, monto, observaciones, es_cheque } = pago;
  
  await getPool().execute(
    'UPDATE pagos SET remito_id = ?, fecha = ?, monto = ?, observaciones = ?, es_cheque = ? WHERE id = ?',
    [remito_id || null, fecha, monto, observaciones || '', es_cheque ? 1 : 0, id]
  );
  
  // Actualizar estados de remitos afectados
  if (oldRemitoId && oldRemitoId !== remito_id) {
    await actualizarEstadoRemito(oldRemitoId);
  }
  if (remito_id) {
    await actualizarEstadoRemito(remito_id);
  }
  
  // Obtener usuario actual
  const usuario = getUsuarioActual();
  const nombreUsuario = usuario.nombre_completo || 'Sistema';
  
  // Detectar cambios
  const cambios = [];
  const montoAnt = normalizarNumero(datosAnteriores.monto);
  const montoNuevo = normalizarNumero(monto);
  if (montoAnt !== montoNuevo) {
    cambios.push({ campo: 'Monto', anterior: formatearMoneda(datosAnteriores.monto || 0), nuevo: formatearMoneda(monto || 0) });
  }
  if (String(datosAnteriores.fecha || '') !== String(fecha || '')) {
    cambios.push({ campo: 'Fecha', anterior: datosAnteriores.fecha || 'Sin fecha', nuevo: fecha || 'Sin fecha' });
  }
  if (datosAnteriores.remito_id !== remito_id) {
    cambios.push({ campo: 'Remito', anterior: datosAnteriores.remito_id || 'Sin remito', nuevo: remito_id || 'Sin remito' });
  }
  if (datosAnteriores.es_cheque !== (es_cheque ? 1 : 0)) {
    cambios.push({ campo: 'Tipo', anterior: datosAnteriores.es_cheque ? 'Cheque' : 'Efectivo', nuevo: es_cheque ? 'Cheque' : 'Efectivo' });
  }
  if (String(datosAnteriores.observaciones || '') !== String(observaciones || '')) {
    cambios.push({ campo: 'Observaciones', anterior: datosAnteriores.observaciones || 'Sin observaciones', nuevo: observaciones || 'Sin observaciones' });
  }
  
  const pagoActualizado = { id, ...pago };
  
  // Filtrar campos técnicos
  const datosAnterioresFiltrados = filtrarCamposTecnicos(datosAnteriores);
  const datosNuevosFiltrados = filtrarCamposTecnicos(pagoActualizado);
  
  // Crear descripción detallada
  let descripcion = `Pago modificado por ${nombreUsuario}`;
  if (cambios.length > 0) {
    const cambiosTexto = cambios.map(c => `${c.campo}: ${c.anterior} → ${c.nuevo}`).join(' | ');
    descripcion += ` | Cambios: ${cambiosTexto}`;
  } else {
    descripcion += ' | Sin cambios específicos detectados';
  }
  
  // Registrar auditoría
  registrarAuditoria({
    accion: 'editar',
    tabla_afectada: 'pagos',
    registro_id: id,
    datos_anteriores: datosAnterioresFiltrados,
    datos_nuevos: datosNuevosFiltrados,
    descripcion: descripcion
  }).catch(error => console.warn('Error registrando auditoría:', error));
  
  return pagoActualizado;
};

const deletePago = async (id) => {
  // Obtener información completa del pago antes de borrarlo
  const [pagos] = await getPool().execute('SELECT * FROM pagos WHERE id = ?', [id]);
  if (pagos.length === 0) {
    throw new Error('Pago no encontrado');
  }
  
  const pago = pagos[0];
  const datosAnteriores = pago;
  const remitoId = pago.remito_id;
  const observaciones = pago.observaciones || '';
  
  // Obtener nombre del cliente
  let nombreCliente = 'Sin cliente';
  if (pago.cliente_id) {
    const [clientes] = await getPool().execute('SELECT nombre FROM clientes WHERE id = ?', [pago.cliente_id]);
    if (clientes.length > 0) {
      nombreCliente = clientes[0].nombre;
    }
  } else if (remitoId) {
    // Si no hay cliente_id pero hay remito_id, obtener cliente del remito
    const [remitos] = await getPool().execute('SELECT cliente_id FROM remitos WHERE id = ?', [remitoId]);
    if (remitos.length > 0 && remitos[0].cliente_id) {
      const [clientes] = await getPool().execute('SELECT nombre FROM clientes WHERE id = ?', [remitos[0].cliente_id]);
      if (clientes.length > 0) {
        nombreCliente = clientes[0].nombre;
      }
    }
  }
  
  // Obtener usuario actual
  const usuario = getUsuarioActual();
  const nombreUsuario = usuario.nombre_completo || 'Sistema';
  
  // Determinar tipo de pago
  let tipoPago = '';
  const esChequeRebotado = pago.cheque_rebotado === 1 || pago.cheque_rebotado === true || pago.cheque_rebotado === '1';
  if (pago.es_cheque) {
    if (esChequeRebotado) {
      tipoPago = ' (Cheque Rebotado)';
    } else {
      tipoPago = ' (Cheque)';
    }
  } else if (!remitoId && pago.cliente_id) {
    tipoPago = ' (Pago a cuenta)';
  }
  
  // Filtrar campos técnicos
  const datosAnterioresFiltrados = filtrarCamposTecnicos(datosAnteriores);
  
  // Extraer remitos afectados si tiene REMITOS_DETALLE
  const remitosAfectados = new Set();
  if (remitoId) {
    remitosAfectados.add(remitoId);
  }
  
  // Si tiene REMITOS_DETALLE, extraer todos los remitos afectados (capturar solo el JSON array, no el resto de la línea)
  if (observaciones.includes('REMITOS_DETALLE:')) {
    try {
      const match = observaciones.match(/REMITOS_DETALLE:(\[.*\])\s*(?:PAGO_GRUPO_ID:\S+)?/);
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
  
  // ========== PASO 1: ELIMINAR SOLO PAGOS OCULTOS DE ESTE PAGO ==========
  // Extraer REMITOS_DETALLE para identificar remitos afectados
  let remitosDetalle = [];
  if (observaciones.includes('REMITOS_DETALLE:')) {
    try {
      const match = observaciones.match(/REMITOS_DETALLE:(\[.*?\])\s*(?:PAGO_GRUPO_ID:\S+)?/);
      if (match) {
        remitosDetalle = JSON.parse(match[1]) || [];
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

  const pagoGrupoIdMatch = observaciones.match(/PAGO_GRUPO_ID:(\S+)/);
  const pagoGrupoId = pagoGrupoIdMatch ? pagoGrupoIdMatch[1].trim() : null;

  let ocultosEliminados = 0;
  if (pagoGrupoId) {
    // Eliminar en una sola query todos los ocultos del grupo
    const [result] = await getPool().execute(
      `DELETE FROM pagos 
       WHERE observaciones LIKE ? 
       AND observaciones LIKE '%[OCULTO]%'
       AND id != ?`,
      [`%PAGO_GRUPO_ID:${pagoGrupoId}%`, id]
    );
    ocultosEliminados = result.affectedRows || 0;
    console.log(`Eliminados ${ocultosEliminados} pagos ocultos del grupo ${pagoGrupoId}`);
  } else if (remitosDetalle.length > 0) {
    // Pagos antiguos: crear condiciones y eliminar en una sola query
    const pagoFecha = pago.fecha ? (typeof pago.fecha === 'string' ? pago.fecha.split('T')[0] : pago.fecha) : null;
    const condicionesSql = [];
    const parametros = [];
    
    for (const det of remitosDetalle) {
      if (det.remito_id && parseFloat(det.monto || 0) > 0) {
        condicionesSql.push(`(remito_id = ? AND ABS(COALESCE(monto, 0) - ?) < 0.01 AND (fecha = ? OR DATE(fecha) = ?))`);
        parametros.push(det.remito_id, parseFloat(det.monto), pagoFecha, pagoFecha);
      }
    }
    
    if (condicionesSql.length > 0) {
      const [result] = await getPool().execute(
        `DELETE FROM pagos 
         WHERE observaciones LIKE '%[OCULTO]%' AND id != ? AND (${condicionesSql.join(' OR ')})`,
        [id, ...parametros]
      );
      ocultosEliminados = result.affectedRows || 0;
      console.log(`Eliminados ${ocultosEliminados} ocultos por REMITOS_DETALLE (pago antiguo)`);
    }
  }
  
  // ========== PASO 2: REGISTRAR AUDITORÍA ANTES DE ELIMINAR ==========
  const montoFormateado = formatearMoneda(pago.monto || 0);
  const descripcion = `Pago de $${montoFormateado}${tipoPago} eliminado por ${nombreUsuario} (Cliente: ${nombreCliente}${remitoId ? `, Remito #${remitoId}` : ''})`;
  
  registrarAuditoria({
    accion: 'eliminar',
    tabla_afectada: 'pagos',
    registro_id: id,
    datos_anteriores: datosAnterioresFiltrados,
    descripcion: descripcion
  }).catch(error => console.warn('Error registrando auditoría:', error));
  
  // ========== PASO 3: ELIMINAR EL PAGO PRINCIPAL ==========
  await getPool().execute('DELETE FROM pagos WHERE id = ?', [id]);
  
  // ========== PASO 4: RECÁLCULO MASIVO FINAL ==========
  let clienteIdRecalc = pago.cliente_id || null;
  if (clienteIdRecalc == null && remitoId) {
    const [remitosRow] = await getPool().execute('SELECT cliente_id FROM remitos WHERE id = ?', [remitoId]);
    if (remitosRow && remitosRow.length > 0) {
      clienteIdRecalc = remitosRow[0].cliente_id;
    }
  }
  
  if (clienteIdRecalc != null) {
    console.log(`🔄 Recálculo masivo cliente ${clienteIdRecalc} tras eliminar pago ${id}`);
    
    // Recálculo masivo SQL para todos los remitos del cliente (precio_total desde remito_articulos)
    await getPool().execute(`
      UPDATE remitos r
      LEFT JOIN (
        SELECT remito_id, COALESCE(SUM(precio_total), 0) as precio_total_calculado
        FROM remito_articulos
        GROUP BY remito_id
      ) ra ON r.id = ra.remito_id
      SET 
        r.monto_pagado = COALESCE((
          SELECT SUM(CASE 
            WHEN p.monto = 0 AND p.observaciones LIKE '%REMITOS_DETALLE:%' THEN 0
            WHEN p.cheque_rebotado = 1 THEN 0
            ELSE COALESCE(p.monto, 0)
          END)
          FROM pagos p 
          WHERE p.remito_id = r.id
        ), 0),
        r.estado_pago = CASE
          WHEN COALESCE(ra.precio_total_calculado, 0) > 0 AND COALESCE((
            SELECT SUM(CASE 
              WHEN p.monto = 0 AND p.observaciones LIKE '%REMITOS_DETALLE:%' THEN 0
              WHEN p.cheque_rebotado = 1 THEN 0
              ELSE COALESCE(p.monto, 0)
            END)
            FROM pagos p 
            WHERE p.remito_id = r.id
          ), 0) >= COALESCE(ra.precio_total_calculado, 0) THEN 'Pagado'
          WHEN COALESCE((
            SELECT SUM(CASE 
              WHEN p.monto = 0 AND p.observaciones LIKE '%REMITOS_DETALLE:%' THEN 0
              WHEN p.cheque_rebotado = 1 THEN 0
              ELSE COALESCE(p.monto, 0)
            END)
            FROM pagos p 
            WHERE p.remito_id = r.id
          ), 0) > 0 THEN 'Pago Parcial'
          ELSE 'Pendiente'
        END
      WHERE r.cliente_id = ?
    `, [clienteIdRecalc]);
    
    console.log(`✅ Recálculo masivo completado para cliente ${clienteIdRecalc}`);
  } else {
    // Fallback: recalcular solo remitos específicos
    for (const remitoIdAfectado of remitosAfectados) {
      await actualizarEstadoRemito(remitoIdAfectado);
    }
  }
  
  return { success: true };
};

// Eliminar todos los pagos de un cliente (incluyendo pagos ocultos)
const deletePagosCliente = async (clienteId) => {
  // Obtener todos los remitos del cliente
  const [remitos] = await getPool().execute(
    'SELECT id FROM remitos WHERE cliente_id = ?',
    [clienteId]
  );
  const remitoIds = remitos.map(r => r.id);
  
  // Obtener todos los pagos del cliente (directos o a través de remitos)
  let pagosAEliminar = [];
  
  if (remitoIds.length > 0) {
    const placeholders = remitoIds.map(() => '?').join(',');
    const [pagos] = await getPool().execute(
      `SELECT id FROM pagos 
       WHERE cliente_id = ? OR remito_id IN (${placeholders})`,
      [clienteId, ...remitoIds]
    );
    pagosAEliminar = pagos;
  } else {
    const [pagos] = await getPool().execute(
      'SELECT id FROM pagos WHERE cliente_id = ?',
      [clienteId]
    );
    pagosAEliminar = pagos;
  }
  
  // Eliminar todos los pagos encontrados
  for (const pago of pagosAEliminar) {
    await getPool().execute('DELETE FROM pagos WHERE id = ?', [pago.id]);
  }
  
  // Recalcular estados de todos los remitos del cliente
  for (const remito of remitos) {
    await actualizarEstadoRemito(remito.id);
  }
  
  return { 
    success: true, 
    pagosEliminados: pagosAEliminar.length,
    remitosActualizados: remitos.length
  };
};

// Limpiar pagos huérfanos de un cliente (pagos que referencian remitos que no existen o están inconsistentes)
const limpiarPagosHuerfanosCliente = async (clienteId) => {
  // Obtener todos los remitos del cliente
  const [remitos] = await getPool().execute(
    'SELECT id FROM remitos WHERE cliente_id = ?',
    [clienteId]
  );
  const remitoIds = remitos.map(r => r.id);
  
  // Obtener todos los pagos del cliente
  let pagosCliente = [];
  if (remitoIds.length > 0) {
    const placeholders = remitoIds.map(() => '?').join(',');
    const [pagos] = await getPool().execute(
      `SELECT id, remito_id, observaciones FROM pagos 
       WHERE cliente_id = ? OR remito_id IN (${placeholders})`,
      [clienteId, ...remitoIds]
    );
    pagosCliente = pagos;
  } else {
    const [pagos] = await getPool().execute(
      'SELECT id, remito_id, observaciones FROM pagos WHERE cliente_id = ?',
      [clienteId]
    );
    pagosCliente = pagos;
  }
  
  // Identificar pagos huérfanos (que referencian remitos que no existen o no pertenecen al cliente)
  const pagosHuerfanos = [];
  for (const pago of pagosCliente) {
    if (pago.remito_id && !remitoIds.includes(pago.remito_id)) {
      // Verificar que el remito realmente no existe o no pertenece al cliente
      const [remitoCheck] = await getPool().execute(
        'SELECT id, cliente_id FROM remitos WHERE id = ?',
        [pago.remito_id]
      );
      
      if (remitoCheck.length === 0 || remitoCheck[0].cliente_id !== clienteId) {
        pagosHuerfanos.push(pago.id);
      }
    }
  }
  
  // Eliminar pagos huérfanos
  let eliminados = 0;
  for (const pagoId of pagosHuerfanos) {
    try {
      await getPool().execute('DELETE FROM pagos WHERE id = ?', [pagoId]);
      eliminados++;
    } catch (error) {
      console.warn(`Error eliminando pago huérfano ${pagoId}:`, error);
    }
  }
  
  // Recalcular estados de todos los remitos del cliente
  for (const remito of remitos) {
    await actualizarEstadoRemito(remito.id);
  }
  
  return { 
    success: true, 
    pagosHuerfanosEncontrados: pagosHuerfanos.length,
    pagosEliminados: eliminados,
    remitosActualizados: remitos.length
  };
};

// Marcar pago como cheque
const marcarPagoComoCheque = async (pagoId, esCheque = true) => {
  // Obtener info del pago
  const [pagos] = await getPool().execute('SELECT * FROM pagos WHERE id = ?', [pagoId]);
  const pago = pagos[0];
  
  if (!pago) {
    throw new Error('Pago no encontrado');
  }
  
  // Marcar como cheque
  await getPool().execute(
    'UPDATE pagos SET es_cheque = ? WHERE id = ?',
    [esCheque ? 1 : 0, pagoId]
  );
  
  return { success: true, es_cheque: esCheque };
};

// Marcar cheque como rebotado
const marcarChequeRebotado = async (pagoId, rebotado = true) => {
  // Obtener info del pago
  const [pagos] = await getPool().execute('SELECT * FROM pagos WHERE id = ?', [pagoId]);
  const pago = pagos[0];
  
  if (!pago) {
    throw new Error('Pago no encontrado');
  }
  
  // Marcar como rebotado
  await getPool().execute(
    'UPDATE pagos SET cheque_rebotado = ? WHERE id = ?',
    [rebotado ? 1 : 0, pagoId]
  );
  
  // Identificar todos los remitos afectados y pagos ocultos asociados
  const remitosAfectados = new Set();
  const pagosOcultosIds = [];
  
  // Si tiene remito directo
  if (pago.remito_id) {
    remitosAfectados.add(pago.remito_id);
  }
  
  // Si tiene REMITOS_DETALLE (pago agrupado), extraer todos los remitos y pagos ocultos asociados
  const observaciones = pago.observaciones || '';
  if (observaciones.includes('REMITOS_DETALLE:')) {
    try {
      const match = observaciones.match(/REMITOS_DETALLE:(.+)$/);
      if (match) {
        const remitosDetalle = JSON.parse(match[1]);
        const fechaPagoRebotado = new Date(pago.fecha).toISOString().split('T')[0]; // Solo fecha
        
        // Buscar pagos ocultos asociados a los remitos del detalle
        for (const r of remitosDetalle) {
          if (r.remito_id) {
            remitosAfectados.add(r.remito_id);
            
            // Buscar pagos ocultos asociados a este remito y misma fecha
            // Estos pagos ocultos también deben marcarse como rebotados
            try {
              const [pagosOcultos] = await getPool().execute(
                `SELECT id FROM pagos 
                 WHERE remito_id = ? 
                 AND cliente_id = ?
                 AND observaciones LIKE '%[OCULTO]%'
                 AND DATE(fecha) = ?`,
                [r.remito_id, pago.cliente_id, fechaPagoRebotado]
              );
              
              pagosOcultos.forEach(po => {
                pagosOcultosIds.push(po.id);
              });
            } catch (e) {
              console.warn('Error buscando pagos ocultos:', e);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error parseando REMITOS_DETALLE:', e);
    }
  }
  
  // Marcar pagos ocultos asociados como rebotados también
  if (pagosOcultosIds.length > 0) {
    const placeholders = pagosOcultosIds.map(() => '?').join(',');
    await getPool().execute(
      `UPDATE pagos SET cheque_rebotado = ? WHERE id IN (${placeholders})`,
      [rebotado ? 1 : 0, ...pagosOcultosIds]
    );
  }
  
  // Recalcular estados de todos los remitos afectados
  for (const remitoId of remitosAfectados) {
    await actualizarEstadoRemito(remitoId);
  }
  
  // Si tiene cliente_id, recalcular todos los remitos del cliente para asegurar consistencia
  if (pago.cliente_id) {
    await recalcularEstadosRemitosCliente(pago.cliente_id);
  }
  
  return { success: true, rebotado };
};

// ============ HELPERS ============
const actualizarEstadoRemito = async (remitoId) => {
  try {
  // Obtener total del remito
  const [articulos] = await getPool().execute(
    'SELECT SUM(precio_total) as total FROM remito_articulos WHERE remito_id = ?',
    [remitoId]
  );
  const totalRemito = parseFloat(articulos[0]?.total || 0);
  
    // Obtener SOLO pagos reales (aplicar filtro simplificado)
  const [pagos] = await getPool().execute(
      `SELECT monto, observaciones 
     FROM pagos 
     WHERE remito_id = ? 
     AND (cheque_rebotado = 0 OR cheque_rebotado IS NULL)`,
    [remitoId]
  );
    
    // Sumar SOLO pagos reales (filtro simplificado y correcto)
    let totalPagado = 0;
    for (const pago of pagos) {
      const monto = parseFloat(pago.monto || 0);
      const observaciones = pago.observaciones || '';
      
      // EXCLUIR: Pagos principales de distribución (monto 0 con REMITOS_DETALLE)
      if (monto === 0 && observaciones.includes('REMITOS_DETALLE:')) {
        continue;
      }
      
      // INCLUIR TODO LO DEMÁS: 
      // - Pagos simples (monto > 0, sin [OCULTO])
      // - Pagos ocultos con monto > 0 (pagos reales de distribución)
      totalPagado += monto;
    }
  
  // Determinar estado
  let estado = 'Pendiente';
  if (totalPagado >= totalRemito && totalRemito > 0) {
    estado = 'Pagado';
  } else if (totalPagado > 0) {
    estado = 'Pago Parcial';
  }
  
  // Actualizar remito
  await getPool().execute(
    'UPDATE remitos SET monto_pagado = ?, estado_pago = ? WHERE id = ?',
    [totalPagado, estado, remitoId]
  );
    
    console.log(`✅ Remito ${remitoId}: Total=${totalRemito}, Pagado=${totalPagado}, Estado=${estado}`);
  } catch (error) {
    console.error(`Error actualizando remito ${remitoId}:`, error);
  }
};

// Recalcular estados de todos los remitos de un cliente
const recalcularEstadosRemitosCliente = async (clienteId) => {
  try {
    // Recálculo masivo SQL (calcular precio_total desde remito_articulos)
    await getPool().execute(`
      UPDATE remitos r
      LEFT JOIN (
        SELECT remito_id, COALESCE(SUM(precio_total), 0) as precio_total_calculado
        FROM remito_articulos
        GROUP BY remito_id
      ) ra ON r.id = ra.remito_id
      SET 
        r.monto_pagado = COALESCE((
          SELECT SUM(CASE 
            WHEN p.monto = 0 AND p.observaciones LIKE '%REMITOS_DETALLE:%' THEN 0
            WHEN p.cheque_rebotado = 1 THEN 0
            ELSE COALESCE(p.monto, 0)
          END)
          FROM pagos p 
          WHERE p.remito_id = r.id
        ), 0),
        r.estado_pago = CASE
          WHEN COALESCE(ra.precio_total_calculado, 0) > 0 AND COALESCE((
            SELECT SUM(CASE 
              WHEN p.monto = 0 AND p.observaciones LIKE '%REMITOS_DETALLE:%' THEN 0
              WHEN p.cheque_rebotado = 1 THEN 0
              ELSE COALESCE(p.monto, 0)
            END)
            FROM pagos p 
            WHERE p.remito_id = r.id
          ), 0) >= COALESCE(ra.precio_total_calculado, 0) THEN 'Pagado'
          WHEN COALESCE((
            SELECT SUM(CASE 
              WHEN p.monto = 0 AND p.observaciones LIKE '%REMITOS_DETALLE:%' THEN 0
              WHEN p.cheque_rebotado = 1 THEN 0
              ELSE COALESCE(p.monto, 0)
            END)
            FROM pagos p 
            WHERE p.remito_id = r.id
          ), 0) > 0 THEN 'Pago Parcial'
          ELSE 'Pendiente'
        END
      WHERE r.cliente_id = ?
    `, [clienteId]);
    
    console.log(`✅ Recálculo SQL masivo completado para cliente ${clienteId}`);
    return { success: true };
  } catch (error) {
    console.error('Error recalculando estados de remitos:', error);
    throw error;
  }
};

// Eliminar TODOS los pagos huérfanos de la base de datos de una vez
const eliminarTodosPagosHuerfanos = async () => {
  try {
    // Eliminar pagos que referencian remitos que no existen
    const [pagosHuerfanos1] = await getPool().execute(
      `DELETE p FROM pagos p 
       LEFT JOIN remitos r ON p.remito_id = r.id 
       WHERE p.remito_id IS NOT NULL AND r.id IS NULL`
    );
    
    // Eliminar pagos que tienen remito_id pero el remito pertenece a otro cliente diferente al cliente_id del pago
    const [pagosHuerfanos2] = await getPool().execute(
      `DELETE p FROM pagos p 
       INNER JOIN remitos r ON p.remito_id = r.id 
       WHERE p.cliente_id IS NOT NULL 
       AND p.cliente_id != r.cliente_id 
       AND p.cliente_id != 0`
    );
    
    // Eliminar pagos ocultos que referencian remitos que no existen
    const [pagosHuerfanos3] = await getPool().execute(
      `DELETE p FROM pagos p 
       LEFT JOIN remitos r ON p.remito_id = r.id 
       WHERE p.observaciones LIKE '%[OCULTO]%' 
       AND p.remito_id IS NOT NULL 
       AND r.id IS NULL`
    );
    
    const totalEliminados = (pagosHuerfanos1.affectedRows || 0) + 
                            (pagosHuerfanos2.affectedRows || 0) + 
                            (pagosHuerfanos3.affectedRows || 0);
    
    // Recalcular estados de TODOS los remitos después de limpiar
    const [todosRemitos] = await getPool().execute('SELECT id FROM remitos');
    for (const remito of todosRemitos) {
      try {
        await actualizarEstadoRemito(remito.id);
      } catch (error) {
        console.warn(`Error actualizando remito ${remito.id}:`, error);
      }
    }
    
    console.log(`🧹 Eliminados ${totalEliminados} pagos huérfanos de la base de datos`);
    
    return { 
      success: true, 
      pagosEliminados: totalEliminados,
      remitosActualizados: todosRemitos.length
    };
  } catch (error) {
    console.error('Error eliminando pagos huérfanos:', error);
    throw error;
  }
};

// ============ REPORTES ============
const getCuentaCorriente = async (clienteId) => {
  // Obtener remitos del cliente
  const remitos = await getRemitos(clienteId);
  const remitoIds = remitos.map(r => r.id);
  
  // Obtener TODOS los pagos del cliente:
  // 1. Pagos cuyo remito pertenece al cliente
  // 2. Pagos con cliente_id = clienteId (adelantos y pagos agrupados)
  let pagosCliente = [];
  
  if (remitoIds.length > 0) {
    const placeholders = remitoIds.map(() => '?').join(',');
    const [pagos] = await getPool().execute(
      `SELECT DISTINCT p.*, r.numero as remito_numero 
       FROM pagos p 
       LEFT JOIN remitos r ON p.remito_id = r.id 
       WHERE (p.remito_id IN (${placeholders}) OR p.cliente_id = ?)
       ORDER BY p.fecha DESC`,
      [...remitoIds, clienteId]
    );
    pagosCliente = pagos;
  } else {
    // Si no hay remitos, buscar solo por cliente_id
    const [pagos] = await getPool().execute(
      `SELECT p.*, NULL as remito_numero 
       FROM pagos p 
       WHERE p.cliente_id = ?
       ORDER BY p.fecha DESC`,
      [clienteId]
    );
    pagosCliente = pagos;
  }
  
  // Calcular totales
  let totalRemitos = 0;
  let totalPagado = 0;
  
  // Total de remitos
  remitos.forEach(remito => {
    totalRemitos += parseFloat(remito.precio_total || 0);
  });
  
  // Identificar pagos principales rebotados y sus pagos ocultos asociados
  const pagosRebotadosIds = new Set();
  const pagosOcultosRebotadosIds = new Set();
  
  pagosCliente.forEach(pago => {
    const chequeRebotado = pago.cheque_rebotado === 1 || pago.cheque_rebotado === true;
    const obs = pago.observaciones || '';
    
    if (chequeRebotado) {
      // Marcar el pago rebotado para excluir
      pagosRebotadosIds.add(pago.id);
      
      // Si es un pago principal con REMITOS_DETALLE, identificar pagos ocultos asociados
      if (obs.includes('REMITOS_DETALLE:')) {
        try {
          const jsonMatch = obs.match(/REMITOS_DETALLE:(\[.*\])/);
          if (jsonMatch) {
            const remitosDetalle = JSON.parse(jsonMatch[1]);
            const fechaPagoRebotado = new Date(pago.fecha).toISOString().split('T')[0]; // Solo fecha, sin hora
            
            remitosDetalle.forEach(r => {
              if (r.remito_id) {
                // Buscar pagos ocultos asociados a estos remitos del mismo cliente y misma fecha
                pagosCliente.forEach(p => {
                  if (p.remito_id === r.remito_id && 
                      p.observaciones && 
                      p.observaciones.includes('[OCULTO]') &&
                      p.cliente_id === clienteId) {
                    // Comparar fechas (solo día, sin hora)
                    const fechaPagoOculto = new Date(p.fecha).toISOString().split('T')[0];
                    if (fechaPagoOculto === fechaPagoRebotado) {
                      pagosOcultosRebotadosIds.add(p.id);
                    }
                  }
                });
              }
            });
          }
        } catch (e) {
          console.warn('Error parseando REMITOS_DETALLE para cheques rebotados:', e);
        }
      }
    }
  });
  
  // Total pagado: sumar TODOS los pagos válidos (EXCLUYENDO cheques rebotados y sus pagos ocultos)
  // Nota: "Saldo a favor aplicado" NO es efectivo; es consumo de crédito. No debe contarse en total_pagado.
  pagosCliente.forEach(pago => {
    // Excluir pagos rebotados
    if (pagosRebotadosIds.has(pago.id) || pagosOcultosRebotadosIds.has(pago.id)) {
      return;
    }
    
    const monto = parseFloat(pago.monto || 0);
    const observaciones = pago.observaciones || '';
    
    // Excluir SOLO pagos principales con monto 0 (son encabezados)
    if (monto === 0 && observaciones.includes('REMITOS_DETALLE:')) {
      return;
    }

    // Excluir consumos de crédito (saldo a favor aplicado)
    if ((String(observaciones).toLowerCase()).includes('saldo a favor aplicado')) {
      return;
    }
    
    totalPagado += monto;
  });
  
  // Calcular monto_pagado por remito desde pagos (excluyendo cheques rebotados y sus pagos ocultos)
  const montoPorRemito = {};
  pagosCliente.forEach(pago => {
    // Excluir pagos rebotados y sus pagos ocultos
    if (pagosRebotadosIds.has(pago.id) || pagosOcultosRebotadosIds.has(pago.id)) {
      return;
    }
    
    if (pago.remito_id) {
      const monto = parseFloat(pago.monto || 0);
      const obs = pago.observaciones || '';
      // Excluir encabezados
      if (monto === 0 && obs.includes('REMITOS_DETALLE:')) return;
      montoPorRemito[pago.remito_id] = (montoPorRemito[pago.remito_id] || 0) + monto;
    }
  });
  
  // Usar SIEMPRE los montos calculados desde la tabla pagos para que la vista
  // coincida con los pagos reales (evita que tras borrar pagos siga mostrando "tiene pagos")
  remitos.forEach(remito => {
    remito.monto_pagado = montoPorRemito[remito.id] || 0;
  });

  // Saldo inicial del cliente (si existe en tabla saldos_iniciales)
  let saldoInicial = null;
  try {
    const pool = getPool();
    const [rowsSaldo] = await pool.execute(
      `SELECT id, cliente_id, fecha_referencia, monto, descripcion 
       FROM saldos_iniciales 
       WHERE cliente_id = ? 
       ORDER BY fecha_referencia DESC LIMIT 1`,
      [clienteId]
    );
    if (rowsSaldo && rowsSaldo.length > 0) {
      saldoInicial = rowsSaldo[0];
    }
  } catch (e) {
    console.warn('Tabla saldos_iniciales no encontrada o error al leer saldo inicial:', e.message);
  }

  const montoSI = saldoInicial ? parseFloat(saldoInicial.monto || 0) : 0;

  // Saldo inicial puede ser:
  // - positivo: crédito a favor (reduce lo que debe)
  // - negativo: deuda inicial (aumenta lo que debe)
  const creditoInicial = Math.max(0, montoSI);
  const deudaInicial = Math.max(0, -montoSI);

  // MODO MANUAL:
  // - El saldo inicial NO impacta el DEBE automáticamente.
  // - Solo impacta cuando existe un pago/movimiento "Saldo a favor aplicado".
  // Por eso, el pendiente descuenta SOLO lo aplicado (no el crédito restante).
  let sumaSaldoAFavorAplicado = 0;
  pagosCliente.forEach(p => {
    if ((String(p.observaciones || '').toLowerCase()).includes('saldo a favor aplicado')) {
      sumaSaldoAFavorAplicado += Math.abs(parseFloat(p.monto || 0) || 0);
    }
  });
  const creditoRestante = Math.max(0, creditoInicial - sumaSaldoAFavorAplicado);

  // Neto pendiente (DEBE): remitos - pagado - aplicado + deuda inicial
  const totalPendiente = totalRemitos - totalPagado - sumaSaldoAFavorAplicado + deudaInicial;

  return {
    cliente_id: clienteId,
    remitos,
    pagos: pagosCliente,
    totales: {
      total_remitos: totalRemitos,
      total_pagado: totalPagado,
      total_pendiente: totalPendiente
    },
    saldoInicial
  };
};

// Obtener saldo inicial de un cliente
const getSaldoInicialCliente = async (clienteId) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, cliente_id, fecha_referencia, monto, descripcion 
     FROM saldos_iniciales 
     WHERE cliente_id = ? 
     ORDER BY fecha_referencia DESC LIMIT 1`,
    [clienteId]
  );
  return rows && rows.length > 0 ? rows[0] : null;
};

// Establecer/actualizar saldo inicial de un cliente
const setSaldoInicialCliente = async ({ cliente_id, fecha_referencia, monto, descripcion }) => {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Obtener datos anteriores para auditoría
    const [existentes] = await connection.execute(
      'SELECT id, monto, fecha_referencia, descripcion FROM saldos_iniciales WHERE cliente_id = ? LIMIT 1',
      [cliente_id]
    );
    const anterior = existentes.length > 0 ? existentes[0] : null;
    const esCrear = !anterior;

    if (anterior) {
      await connection.execute(
        'UPDATE saldos_iniciales SET fecha_referencia = ?, monto = ?, descripcion = ? WHERE id = ?',
        [fecha_referencia, monto, descripcion || null, anterior.id]
      );
    } else {
      await connection.execute(
        'INSERT INTO saldos_iniciales (cliente_id, fecha_referencia, monto, descripcion) VALUES (?, ?, ?, ?)',
        [cliente_id, fecha_referencia, monto, descripcion || null]
      );
    }
    await connection.commit();
    return { success: true, esCrear, anterior };
  } catch (error) {
    await connection.rollback();
    console.error('Error estableciendo saldo inicial:', error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
};

// ============ REPORTE DE ERRORES ============
const createErrorReport = async (payload = {}) => {
  try {
    await ensureErrorReportsTable();
    const pool = getPool();
    const {
      error_message = null,
      error_stack = null,
      error_type = 'Error',
      component_name = null,
      user_agent = null,
      url = null,
      app_version = null,
      additional_data = null
    } = payload;

    let additionalJson = null;
    if (additional_data !== null && additional_data !== undefined) {
      try {
        additionalJson = JSON.stringify(additional_data);
      } catch (e) {
        additionalJson = JSON.stringify({ _serialization_error: String(e && e.message ? e.message : e) });
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO error_reports 
        (error_message, error_stack, error_type, component_name, user_agent, url, app_version, additional_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        error_message,
        error_stack,
        error_type,
        component_name,
        user_agent,
        url,
        app_version,
        additionalJson
      ]
    );

    return { success: true, id: result.insertId };
  } catch (error) {
    console.error('Error creando reporte en MySQL:', error);
    return { success: false, error: error.message || String(error) };
  }
};

const getErrorReports = async ({ resolved = false, limit = 100 } = {}) => {
  try {
    await ensureErrorReportsTable();
    const pool = getPool();
    const lim = Math.max(1, Math.min(500, parseInt(limit, 10) || 100));
    const [rows] = await pool.execute(
      `SELECT *
       FROM error_reports
       WHERE resolved = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [resolved ? 1 : 0, lim]
    );

    return (rows || []).map(r => {
      const out = { ...r };
      if (out.additional_data && typeof out.additional_data === 'string') {
        try { out.additional_data = JSON.parse(out.additional_data); } catch (e) {}
      }
      return out;
    });
  } catch (error) {
    console.error('Error leyendo reportes desde MySQL:', error);
    return [];
  }
};

const markErrorReportAsResolved = async (id, { resolved_by = 'Admin', notes = '' } = {}) => {
  try {
    await ensureErrorReportsTable();
    const pool = getPool();
    const rid = parseInt(id, 10);
    if (isNaN(rid)) {
      return { success: false, error: 'ID inválido' };
    }
    await pool.execute(
      `UPDATE error_reports 
       SET resolved = 1, resolved_at = NOW(), resolved_by = ?, notes = ?
       WHERE id = ?`,
      [String(resolved_by || 'Admin'), String(notes || ''), rid]
    );
    return { success: true };
  } catch (error) {
    console.error('Error marcando reporte como resuelto:', error);
    return { success: false, error: error.message || String(error) };
  }
};

const getResumenGeneral = async (fechaDesde = null, fechaHasta = null) => {
  // Total clientes (sin filtro por activo ya que la columna puede no existir)
  const [clientesResult] = await getPool().execute('SELECT COUNT(*) as total FROM clientes');
  const totalClientes = clientesResult[0].total;
  
  // Construir filtros de fecha
  let fechaConditionRemitos = '';
  const paramsRemitos = [];
  const paramsPagos = [];
  
  if (fechaDesde && fechaHasta) {
    fechaConditionRemitos = ' WHERE fecha >= ? AND fecha <= ?';
    paramsRemitos.push(fechaDesde, fechaHasta);
    paramsPagos.push(fechaDesde, fechaHasta, fechaDesde, fechaHasta);
  }
  
  // Total remitos en el período
  const [remitosResult] = await getPool().execute(
    `SELECT COUNT(*) as total FROM remitos${fechaConditionRemitos}`,
    paramsRemitos
  );
  const totalRemitos = remitosResult[0].total;
  
  // Total facturado en el período (desde remito_articulos unido con remitos)
  let queryFacturado = `
    SELECT COALESCE(SUM(ra.precio_total), 0) as total 
    FROM remito_articulos ra
    INNER JOIN remitos r ON ra.remito_id = r.id
  `;
  if (fechaDesde && fechaHasta) {
    queryFacturado += ' WHERE r.fecha >= ? AND r.fecha <= ?';
  }
  const [facturadoResult] = await getPool().execute(queryFacturado, paramsRemitos);
  const totalFacturado = parseFloat(facturadoResult[0].total || 0);
  
  // Total pagado en el período
  // Excluir: pagos principales de múltiples remitos (tienen REMITOS_DETALLE con monto 0)
  // Excluir: cheques rebotados
  // Incluir: pagos ocultos (tienen monto real) y pagos simples
  let queryPagado = `
    SELECT COALESCE(SUM(p.monto), 0) as total 
    FROM pagos p
    LEFT JOIN remitos r ON p.remito_id = r.id
    WHERE (p.observaciones NOT LIKE '%REMITOS_DETALLE:%' OR p.observaciones IS NULL)
    AND (p.cheque_rebotado = 0 OR p.cheque_rebotado IS NULL)
  `;
  if (fechaDesde && fechaHasta) {
    queryPagado += ` AND (
      (p.fecha >= ? AND p.fecha <= ?) 
      OR 
      (r.fecha >= ? AND r.fecha <= ?)
    )`;
  }
  const [pagadoResult] = await getPool().execute(queryPagado, paramsPagos);
  const totalPagado = parseFloat(pagadoResult[0].total || 0);
  
  return {
    total_clientes: totalClientes,
    total_remitos: totalRemitos,
    total_facturado: totalFacturado,
    total_pagado: totalPagado,
    total_pendiente: totalFacturado - totalPagado
  };
};

// ============ USUARIOS Y AUDITORÍA ============

// Login de usuario
const login = async (username, password) => {
  try {
    const pool = getPool();
    const [usuarios] = await pool.execute(
      'SELECT * FROM usuarios WHERE username = ? AND activo = 1',
      [username]
    );
    
    if (usuarios.length === 0) {
      return { success: false, error: 'Usuario no encontrado o inactivo' };
    }
    
    const usuario = usuarios[0];
    
    // Verificar contraseña (simple comparación por ahora)
    const passwordValido = usuario.password_hash === password;
    
    if (!passwordValido) {
      return { success: false, error: 'Contraseña incorrecta' };
    }
    
    // Actualizar último login
    await pool.execute(
      'UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?',
      [usuario.id]
    );
    
    // Establecer usuario actual para auditoría
    setUsuarioActual({ id: usuario.id, nombre_completo: usuario.nombre_completo || usuario.username });
    
    // NO registrar login en auditoría (no es necesario)
    
    return { 
      success: true, 
      usuario: {
        id: usuario.id,
        username: usuario.username,
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        rol: usuario.rol,
        debe_cambiar_contraseña: usuario.debe_cambiar_contraseña || false
      }
    };
  } catch (error) {
    console.error('Error en login:', error);
    return { success: false, error: error.message };
  }
};

// Obtener lista de usuarios
const getUsuarios = async () => {
  try {
    const pool = getPool();
    const [usuarios] = await pool.execute(
      'SELECT id, username, nombre_completo, email, rol, activo, ultimo_login, created_at, debe_cambiar_contraseña FROM usuarios ORDER BY nombre_completo'
    );
    return usuarios;
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    throw error;
  }
};

// Crear nuevo usuario
const createUsuario = async (data) => {
  try {
    const pool = getPool();
    const { username, password, nombre_completo, email, rol } = data;
    
    // Guardar password en texto plano por ahora
    // Establecer debe_cambiar_contraseña = true para que el usuario cambie su contraseña en el primer login
    const [result] = await pool.execute(
      'INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol, debe_cambiar_contraseña) VALUES (?, ?, ?, ?, ?, ?)',
      [username, password, nombre_completo, email || null, rol || 'usuario', true]
    );
    
    const usuarioCreado = {
      id: result.insertId,
      username,
      nombre_completo,
      email,
      rol,
      debe_cambiar_contraseña: true
    };
    
    // Registrar auditoría
    await registrarAuditoria({
      accion: 'crear',
      tabla_afectada: 'usuarios',
      registro_id: result.insertId,
      datos_nuevos: usuarioCreado,
      descripcion: `Usuario creado: ${nombre_completo} (${username})`
    });
    
    return usuarioCreado;
  } catch (error) {
    console.error('Error creando usuario:', error);
    throw error;
  }
};

// Actualizar usuario
const updateUsuario = async (id, data) => {
  try {
    const pool = getPool();
    
    // Obtener datos anteriores
    const [usuariosAnteriores] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [id]);
    const datosAnteriores = usuariosAnteriores[0];
    
    const { nombre_completo, email, rol } = data;
    
    await pool.execute(
      'UPDATE usuarios SET nombre_completo = ?, email = ?, rol = ? WHERE id = ?',
      [nombre_completo, email || null, rol, id]
    );
    
    const usuarioActualizado = { id, nombre_completo, email, rol };
    
    // Registrar auditoría
    await registrarAuditoria({
      accion: 'editar',
      tabla_afectada: 'usuarios',
      registro_id: id,
      datos_anteriores: datosAnteriores,
      datos_nuevos: usuarioActualizado,
      descripcion: `Usuario actualizado: ${nombre_completo}`
    });
    
    return usuarioActualizado;
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    throw error;
  }
};

// Eliminar usuario
const deleteUsuario = async (id) => {
  try {
    const pool = getPool();
    
    // Obtener datos antes de eliminar
    const [usuarios] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [id]);
    const datosAnteriores = usuarios[0];
    
    await pool.execute('DELETE FROM usuarios WHERE id = ?', [id]);
    
    // Registrar auditoría
    await registrarAuditoria({
      accion: 'eliminar',
      tabla_afectada: 'usuarios',
      registro_id: id,
      datos_anteriores: datosAnteriores,
      descripcion: `Usuario eliminado: ${datosAnteriores.nombre_completo}`
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    throw error;
  }
};

// Activar/desactivar usuario
const toggleUsuario = async (userId, activo) => {
  try {
    const pool = getPool();
    
    // Obtener datos anteriores
    const [usuariosAnteriores] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [userId]);
    const datosAnteriores = usuariosAnteriores[0];
    
    await pool.execute(
      'UPDATE usuarios SET activo = ? WHERE id = ?',
      [activo, userId]
    );
    
    const accion = activo ? 'activado' : 'desactivado';
    
    // Registrar auditoría
    await registrarAuditoria({
      accion: 'editar',
      tabla_afectada: 'usuarios',
      registro_id: userId,
      datos_anteriores: datosAnteriores,
      datos_nuevos: { ...datosAnteriores, activo },
      descripcion: `Usuario ${accion}: ${datosAnteriores.nombre_completo}`
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error actualizando estado de usuario:', error);
    throw error;
  }
};

// Cambiar contraseña (requiere contraseña actual)
const cambiarPassword = async (userId, username, passwordActual, passwordNueva) => {
  try {
    const pool = getPool();
    
    // Verificar contraseña actual
    const loginResult = await login(username, passwordActual);
    if (!loginResult.success) {
      return { success: false, error: 'Contraseña actual incorrecta' };
    }
    
    // Cambiar contraseña y marcar que ya no debe cambiar contraseña
    await pool.execute(
      'UPDATE usuarios SET password_hash = ?, debe_cambiar_contraseña = FALSE WHERE id = ?',
      [passwordNueva, userId]
    );
    
    // Registrar auditoría
    await registrarAuditoria({
      usuario_id: userId,
      accion: 'editar',
      tabla_afectada: 'usuarios',
      registro_id: userId,
      descripcion: `${username} cambió su contraseña`
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    return { success: false, error: error.message };
  }
};

// Cambiar contraseña en primer login (sin verificar contraseña actual)
const cambiarPasswordPrimeraVez = async (userId, username, passwordNueva) => {
  try {
    const pool = getPool();
    
    // Cambiar contraseña y marcar que ya no debe cambiar contraseña
    await pool.execute(
      'UPDATE usuarios SET password_hash = ?, debe_cambiar_contraseña = FALSE WHERE id = ?',
      [passwordNueva, userId]
    );
    
    // Registrar auditoría
    await registrarAuditoria({
      usuario_id: userId,
      accion: 'editar',
      tabla_afectada: 'usuarios',
      registro_id: userId,
      descripcion: `${username} cambió su contraseña (primer login)`
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error cambiando contraseña primera vez:', error);
    return { success: false, error: error.message };
  }
};

// Función helper para escapar valores SQL de forma segura
const escapeSQL = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return value.toString();
  // Escapar comillas simples y barras invertidas
  return `'${String(value).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
};

// Exporta un backup SQL completo para descarga desde la app (Hostinger/MySQL)
const exportBackupSQL = async ({ observaciones = null } = {}) => {
  const pool = getPool();
  await ensureSaldosInicialesTable().catch(() => {});
  await ensureErrorReportsTable().catch(() => {});

  const fecha = new Date();
  const fechaStr = fecha.toISOString().split('T')[0];
  const horaStr = fecha.toTimeString().split(' ')[0].replace(/:/g, '');
  const nombreArchivo = `backup_${fechaStr}_${horaStr}.sql`;

  const tablas = [
    'clientes',
    'articulos',
    'remitos',
    'remito_articulos',
    'pagos',
    'saldos_iniciales',
    'usuarios',
    'auditoria',
    'error_reports'
  ];

  let sql = `-- =====================================================\n`;
  sql += `-- BACKUP COMPLETO DE BASE DE DATOS (MySQL)\n`;
  sql += `-- FECHA: ${fechaStr}\n`;
  sql += `-- HORA: ${fecha.toLocaleString('es-AR')}\n`;
  if (observaciones) sql += `-- OBSERVACIONES: ${String(observaciones)}\n`;
  sql += `-- =====================================================\n\n`;
  sql += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

  const [rowsTables] = await pool.query(
    'SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()'
  );
  const existentes = new Set(rowsTables.map(r => r.TABLE_NAME || r.table_name));

  for (const tabla of tablas) {
    if (!existentes.has(tabla)) {
      sql += `-- Tabla ${tabla}: no existe\n\n`;
      continue;
    }

    const [rows] = await pool.query(`SELECT * FROM \`${tabla}\``);
    sql += `-- ============================================\n`;
    sql += `-- TABLA: ${tabla}\n`;
    sql += `-- REGISTROS: ${(rows || []).length}\n`;
    sql += `-- ============================================\n\n`;
    sql += `TRUNCATE TABLE \`${tabla}\`;\n`;

    if (!rows || rows.length === 0) {
      sql += `\n`;
      continue;
    }

    const columnas = Object.keys(rows[0]);
    const colsSql = columnas.map(c => `\`${c}\``).join(', ');
    for (const r of rows) {
      const vals = columnas.map(c => escapeSQL(r[c]));
      sql += `INSERT INTO \`${tabla}\` (${colsSql}) VALUES (${vals.join(', ')});\n`;
    }
    sql += `\n`;
  }

  sql += `SET FOREIGN_KEY_CHECKS=1;\n`;
  sql += `-- =====================================================\n`;
  sql += `-- FIN DEL BACKUP\n`;
  sql += `-- =====================================================\n`;

  return { success: true, nombreArchivo, sql };
};

// Obtener registros de auditoría
const getAuditoria = async (params = {}) => {
  try {
    const pool = getPool();
    const { limit = 100, offset = 0, tabla_afectada, tabla, usuario_id, usuario_nombre, usuario, accion, fechaDesde, fechaHasta, registro_id } = params;
    const usuarioNombreFiltro = usuario_nombre || usuario;
    
    const lim = limit != null ? parseInt(limit, 10) : 100;
    const off = offset != null ? parseInt(offset, 10) : 0;
    
    if (isNaN(lim) || lim < 1) {
      throw new Error('Limit debe ser un número válido mayor a 0');
    }
    if (isNaN(off) || off < 0) {
      throw new Error('Offset debe ser un número válido mayor o igual a 0');
    }

    const tablaFiltro = tabla_afectada || tabla;
    let query = 'SELECT * FROM auditoria WHERE 1=1';
    
    if (tablaFiltro) {
      query += ` AND tabla_afectada = ${escapeSQL(tablaFiltro)}`;
    }
    
    if (usuario_id) {
      query += ` AND usuario_id = ${escapeSQL(parseInt(usuario_id))}`;
    }
    if (usuarioNombreFiltro && String(usuarioNombreFiltro).trim()) {
      query += ` AND usuario_nombre LIKE ${escapeSQL('%' + String(usuarioNombreFiltro).trim() + '%')}`;
    }
    
    if (accion) {
      query += ` AND accion = ${escapeSQL(accion)}`;
    }
    
    if (registro_id != null && registro_id !== '') {
      const rid = parseInt(registro_id, 10);
      if (!isNaN(rid)) query += ` AND registro_id = ${rid}`;
    }
    
    if (fechaDesde) {
      query += ` AND DATE(created_at) >= ${escapeSQL(String(fechaDesde))}`;
    }
    if (fechaHasta) {
      query += ` AND DATE(created_at) <= ${escapeSQL(String(fechaHasta))}`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${lim} OFFSET ${off}`;
    
    // Usar query sin parámetros para evitar problemas con prepared statements
    const [registros] = await pool.query(query);
    
    // Parsear JSON strings en datos_anteriores y datos_nuevos
    const registrosParseados = registros.map(registro => {
      const registroParseado = { ...registro };
      
      // Parsear datos_anteriores si es string
      if (registro.datos_anteriores) {
        if (typeof registro.datos_anteriores === 'string') {
          try {
            registroParseado.datos_anteriores = JSON.parse(registro.datos_anteriores);
          } catch (e) {
            console.warn('⚠️ [getAuditoria] Error parseando datos_anteriores:', e);
            console.warn('⚠️ [getAuditoria] String recibido:', registro.datos_anteriores.substring(0, 200));
            registroParseado.datos_anteriores = null;
          }
        }
        // Si ya es objeto, dejarlo como está
      }
      
      // Parsear datos_nuevos si es string
      if (registro.datos_nuevos) {
        if (typeof registro.datos_nuevos === 'string') {
          try {
            registroParseado.datos_nuevos = JSON.parse(registro.datos_nuevos);
          } catch (e) {
            console.warn('⚠️ [getAuditoria] Error parseando datos_nuevos:', e);
            registroParseado.datos_nuevos = null;
          }
        }
        // Si ya es objeto, dejarlo como está
      }
      
      // DEBUG: Para registros DELETE de remitos, verificar que los datos estén parseados
      if (registroParseado.accion === 'eliminar' && registroParseado.tabla_afectada === 'remitos') {
        console.log('🔍 [getAuditoria] Registro DELETE de remito encontrado:');
        console.log('- ID:', registroParseado.id);
        console.log('- Registro ID:', registroParseado.registro_id);
        console.log('- Tiene datos_anteriores:', !!registroParseado.datos_anteriores);
        console.log('- Tipo datos_anteriores:', typeof registroParseado.datos_anteriores);
        if (registroParseado.datos_anteriores) {
          console.log('- Tiene articulos:', !!registroParseado.datos_anteriores.articulos);
          console.log('- Cantidad articulos:', registroParseado.datos_anteriores.articulos?.length || 0);
        }
      }
      
      return registroParseado;
    });
    
    return registrosParseados;
  } catch (error) {
    console.error('Error obteniendo auditoría:', error);
    throw error;
  }
};

// Registrar acción en auditoría
const registrarAuditoria = async (data) => {
  try {
    const pool = getPool();
    
    // Si no se proporciona usuario, usar el usuario actual
    const usuario = getUsuarioActual();
    const {
      usuario_id = null,
      usuario_nombre = null,
      accion,
      tabla_afectada = null,
      registro_id = null,
      datos_anteriores = null,
      datos_nuevos = null,
      descripcion = null
    } = data;
    
    const finalUsuarioId = usuario_id || usuario.id;
    const finalUsuarioNombre = usuario_nombre || usuario.nombre_completo || 'Sistema';
    
    await pool.execute(
      `INSERT INTO auditoria 
       (usuario_id, usuario_nombre, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos, descripcion) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalUsuarioId,
        finalUsuarioNombre,
        accion,
        tabla_afectada,
        registro_id,
        datos_anteriores ? JSON.stringify(datos_anteriores) : null,
        datos_nuevos ? JSON.stringify(datos_nuevos) : null,
        descripcion
      ]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error registrando auditoría:', error);
    // No fallar por errores de auditoría
    return { success: false, error: error.message };
  }
};

const deleteAuditoria = async (auditoriaId) => {
  try {
    const pool = getPool();
    
    // Verificar que el registro existe
    const [registros] = await pool.execute(
      'SELECT id FROM auditoria WHERE id = ?',
      [auditoriaId]
    );
    
    if (registros.length === 0) {
      return { success: false, error: 'Registro de auditoría no encontrado' };
    }
    
    // Eliminar el registro
    await pool.execute(
      'DELETE FROM auditoria WHERE id = ?',
      [auditoriaId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error eliminando auditoría:', error);
    return { success: false, error: error.message };
  }
};

// Eliminar varios registros de auditoría (solo admin)
const deleteAuditoriaBulk = async (ids) => {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return { success: false, error: 'No se especificaron IDs' };
  }
  const idsNum = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  if (idsNum.length === 0) {
    return { success: false, error: 'IDs inválidos' };
  }
  try {
    const pool = getPool();
    const placeholders = idsNum.map(() => '?').join(',');
    const [result] = await pool.execute(
      `DELETE FROM auditoria WHERE id IN (${placeholders})`,
      idsNum
    );
    return { success: true, deleted: result.affectedRows };
  } catch (error) {
    console.error('Error eliminando auditoría en lote:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  testConnection,
  getClientes,
  getCliente,
  createCliente,
  updateCliente,
  deleteCliente,
  getArticulos,
  createArticulo,
  updateArticulo,
  deleteArticulo,
  getRemitos,
  getRemito,
  createRemito,
  updateRemito,
  deleteRemito,
  getPagos,
  createPago,
  createPagosBatch,
  updatePago,
  deletePago,
  deletePagosCliente,
  marcarPagoComoCheque,
  marcarChequeRebotado,
  recalcularEstadosRemitosCliente,
  getCuentaCorriente,
  getResumenGeneral,
  
  // Funciones de usuarios y auditoría
  login,
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  toggleUsuario,
  cambiarPassword,
  cambiarPasswordPrimeraVez,
  getAuditoria,
  registrarAuditoria,
  deleteAuditoria,
  deleteAuditoriaBulk,
  getSaldoInicialCliente,
  setSaldoInicialCliente,

  // Reporte de errores
  createErrorReport,
  getErrorReports,
  markErrorReportAsResolved,

  // Backups
  exportBackupSQL
};

