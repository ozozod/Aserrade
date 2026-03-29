-- Script de creación de tablas para Hostinger (MySQL)
-- Ejecutar en phpMyAdmin o cliente MySQL de Hostinger
-- Versión adaptada desde PostgreSQL a MySQL

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  direccion TEXT,
  email VARCHAR(255),
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de artículos/productos
CREATE TABLE IF NOT EXISTS articulos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio_base DECIMAL(15, 2) DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  cliente_id INT,
  codigo VARCHAR(100),
  medida VARCHAR(100),
  cabezal TEXT,
  costado TEXT,
  fondo VARCHAR(100),
  taco VARCHAR(100),
  esquinero VARCHAR(100),
  despeje VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  -- Permitir nombres duplicados pero únicos por cliente (o universales)
  UNIQUE KEY unique_nombre_cliente (nombre, cliente_id),
  INDEX idx_cliente (cliente_id),
  INDEX idx_codigo (codigo),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de remitos
CREATE TABLE IF NOT EXISTS remitos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  fecha DATE NOT NULL,
  numero VARCHAR(100),
  estado_pago VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
  monto_pagado DECIMAL(15, 2) DEFAULT 0,
  observaciones TEXT,
  foto_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
  -- Permitir mismo número de remito para diferentes clientes
  -- pero no duplicados del mismo número para el mismo cliente
  UNIQUE KEY unique_cliente_numero (cliente_id, numero),
  INDEX idx_cliente (cliente_id),
  INDEX idx_fecha (fecha),
  INDEX idx_estado_pago (estado_pago)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de remito_articulos (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS remito_articulos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  remito_id INT NOT NULL,
  articulo_id INT,
  articulo_nombre VARCHAR(255) NOT NULL,
  cantidad DECIMAL(10, 2) NOT NULL,
  precio_unitario DECIMAL(15, 2) NOT NULL,
  precio_total DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (remito_id) REFERENCES remitos(id) ON DELETE CASCADE,
  FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE SET NULL,
  INDEX idx_remito (remito_id),
  INDEX idx_articulo (articulo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  remito_id INT NOT NULL,
  fecha DATE NOT NULL,
  monto DECIMAL(15, 2) NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (remito_id) REFERENCES remitos(id) ON DELETE CASCADE,
  INDEX idx_remito (remito_id),
  INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de error_reports (reportes desde la app)
CREATE TABLE IF NOT EXISTS error_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component_name VARCHAR(255),
  user_agent TEXT,
  url TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

