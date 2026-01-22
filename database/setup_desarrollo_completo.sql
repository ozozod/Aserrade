-- ============================================
-- SETUP COMPLETO BASE DE DATOS DESARROLLO
-- Aserradero App v3 - Sistema de Auditorías
-- ============================================
-- 
-- ⚠️ IMPORTANTE: Esta base de datos es SOLO para DESARROLLO
-- La app de PRODUCCIÓN usa 'aserradero_db'
-- Esta app de DESARROLLO usa 'aserradero_dev'
--
-- Ejecutar este script completo en MySQL de Hostinger
-- ============================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS aserradero_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE aserradero_dev;

-- ============================================
-- TABLA DE CLIENTES
-- ============================================
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    direccion TEXT,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA DE ARTÍCULOS
-- ============================================
CREATE TABLE IF NOT EXISTS articulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50),
    precio_base DECIMAL(10, 2) DEFAULT 0,
    medida VARCHAR(100),
    cabezal VARCHAR(100),
    costado VARCHAR(100),
    fondo VARCHAR(100),
    taco VARCHAR(100),
    esquinero BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_nombre_cliente (nombre, cliente_id)
);

-- ============================================
-- TABLA DE REMITOS
-- ============================================
CREATE TABLE IF NOT EXISTS remitos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(50) UNIQUE,
    cliente_id INT NOT NULL,
    fecha DATE NOT NULL,
    precio_total DECIMAL(10, 2) DEFAULT 0,
    monto_pagado DECIMAL(10, 2) DEFAULT 0,
    estado_pago ENUM('Pendiente', 'Pago Parcial', 'Pagado') DEFAULT 'Pendiente',
    observaciones TEXT,
    foto_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- ============================================
-- TABLA DE REMITO_ARTICULOS
-- ============================================
CREATE TABLE IF NOT EXISTS remito_articulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    remito_id INT NOT NULL,
    articulo_id INT NOT NULL,
    cantidad DECIMAL(10, 2) DEFAULT 1,
    precio_unitario DECIMAL(10, 2) DEFAULT 0,
    subtotal DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (remito_id) REFERENCES remitos(id) ON DELETE CASCADE,
    FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE CASCADE
);

-- ============================================
-- TABLA DE PAGOS
-- ============================================
CREATE TABLE IF NOT EXISTS pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    remito_id INT,
    monto DECIMAL(10, 2) NOT NULL,
    fecha DATE NOT NULL,
    observaciones TEXT,
    es_cheque BOOLEAN DEFAULT FALSE,
    cheque_rebotado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (remito_id) REFERENCES remitos(id) ON DELETE CASCADE
);

-- ============================================
-- TABLA DE USUARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    rol ENUM('admin', 'usuario', 'solo_lectura') DEFAULT 'usuario',
    activo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA DE AUDITORÍA
-- ============================================
CREATE TABLE IF NOT EXISTS auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    usuario_nombre VARCHAR(100),
    accion ENUM('crear', 'editar', 'eliminar', 'login', 'logout') NOT NULL,
    tabla_afectada VARCHAR(50),
    registro_id INT,
    datos_anteriores JSON,
    datos_nuevos JSON,
    descripcion TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ============================================
-- ÍNDICES PARA MEJOR PERFORMANCE
-- ============================================
-- Nota: Si los índices ya existen, estos comandos fallarán silenciosamente
-- Eso está bien, significa que ya están creados
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(created_at);
CREATE INDEX idx_auditoria_tabla ON auditoria(tabla_afectada);
CREATE INDEX idx_auditoria_accion ON auditoria(accion);

-- ============================================
-- USUARIO ADMIN POR DEFECTO
-- ============================================
-- Usuario: admin
-- Contraseña: admin123
INSERT INTO usuarios (username, password_hash, nombre_completo, rol) 
VALUES ('admin', 'admin123', 'Administrador', 'admin')
ON DUPLICATE KEY UPDATE nombre_completo = 'Administrador', rol = 'admin';

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT '✅ Base de datos de desarrollo configurada correctamente' AS mensaje;
SELECT COUNT(*) AS total_tablas FROM information_schema.tables 
WHERE table_schema = 'aserradero_dev';

SELECT 'Tablas creadas:' AS info;
SHOW TABLES;

SELECT 'Usuario admin creado:' AS info;
SELECT id, username, nombre_completo, rol, activo FROM usuarios WHERE username = 'admin';

