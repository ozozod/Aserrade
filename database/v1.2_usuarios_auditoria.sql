-- ============================================
-- ASERRADERO APP v1.2
-- Sistema de Usuarios y Auditoría
-- ============================================

-- TABLA DE USUARIOS
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

-- TABLA DE AUDITORÍA
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

-- ÍNDICES PARA MEJOR PERFORMANCE
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(created_at);
CREATE INDEX idx_auditoria_tabla ON auditoria(tabla_afectada);
CREATE INDEX idx_auditoria_accion ON auditoria(accion);

-- USUARIO ADMIN POR DEFECTO
-- Contraseña: admin123 (hasheada con bcrypt)
INSERT INTO usuarios (username, password_hash, nombre_completo, rol) 
VALUES ('admin', '$2b$10$rQZ5z5z5z5z5z5z5z5z5z.PLACEHOLDER_HASH_CAMBIAR', 'Administrador', 'admin');

-- ============================================
-- EJEMPLO DE REGISTROS DE AUDITORÍA
-- ============================================
-- INSERT INTO auditoria (usuario_id, usuario_nombre, accion, tabla_afectada, registro_id, datos_nuevos, descripcion)
-- VALUES (1, 'admin', 'crear', 'clientes', 5, '{"nombre": "Juan Pérez"}', 'Creó cliente Juan Pérez');

-- ============================================
-- VERSIÓN PARA SUPABASE (PostgreSQL)
-- ============================================
/*
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    rol VARCHAR(20) DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario', 'solo_lectura')),
    activo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_nombre VARCHAR(100),
    accion VARCHAR(20) NOT NULL CHECK (accion IN ('crear', 'editar', 'eliminar', 'login', 'logout')),
    tabla_afectada VARCHAR(50),
    registro_id INT,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    descripcion TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(created_at);
CREATE INDEX idx_auditoria_tabla ON auditoria(tabla_afectada);
*/


