-- Script de creación de base de datos MySQL para Aserradero App
-- Ejecutar en MySQL después de crear la base de datos

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  direccion TEXT,
  email VARCHAR(255),
  observaciones TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de artículos/productos
CREATE TABLE IF NOT EXISTS articulos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  precio_base DECIMAL(10, 2) DEFAULT 0,
  activo TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de remitos
CREATE TABLE IF NOT EXISTS remitos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  fecha DATE NOT NULL,
  numero VARCHAR(100) UNIQUE,
  estado_pago VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
  monto_pagado DECIMAL(10, 2) DEFAULT 0,
  observaciones TEXT,
  foto_path VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de remito_articulos (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS remito_articulos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  remito_id INT NOT NULL,
  articulo_id INT,
  articulo_nombre VARCHAR(255) NOT NULL,
  cantidad DECIMAL(10, 2) NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  precio_total DECIMAL(10, 2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (remito_id) REFERENCES remitos(id) ON DELETE CASCADE,
  FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  remito_id INT NOT NULL,
  fecha DATE NOT NULL,
  monto DECIMAL(10, 2) NOT NULL,
  observaciones TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (remito_id) REFERENCES remitos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índices para optimización
CREATE INDEX idx_remitos_cliente ON remitos(cliente_id);
CREATE INDEX idx_remitos_fecha ON remitos(fecha);
CREATE INDEX idx_pagos_remito ON pagos(remito_id);
CREATE INDEX idx_remito_articulos_remito ON remito_articulos(remito_id);
CREATE INDEX idx_remito_articulos_articulo ON remito_articulos(articulo_id);
