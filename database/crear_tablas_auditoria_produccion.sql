-- ============================================
-- ASERRADERO APP - TABLAS DE AUDITORÍA PARA PRODUCCIÓN
-- ============================================
-- Ejecutar este script en la base de datos de producción (aserradero_db)

-- TABLA DE USUARIOS (si no existe)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    rol ENUM('admin', 'usuario', 'solo_lectura') DEFAULT 'usuario',
    activo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP NULL,
    debe_cambiar_contraseña BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Agregar campo debe_cambiar_contraseña si la tabla ya existe pero no tiene el campo
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'aserradero_db' 
    AND TABLE_NAME = 'usuarios' 
    AND COLUMN_NAME = 'debe_cambiar_contraseña');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE usuarios ADD COLUMN debe_cambiar_contraseña BOOLEAN DEFAULT FALSE', 
    'SELECT "Campo debe_cambiar_contraseña ya existe" AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- TABLA DE AUDITORÍA (si no existe)
CREATE TABLE IF NOT EXISTS auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    usuario_nombre VARCHAR(100),
    accion ENUM('crear', 'editar', 'eliminar', 'login', 'logout') NOT NULL,
    tabla_afectada VARCHAR(50),
    registro_id INT,
    datos_anteriores JSON,
    datos_nuevos JSON,
    cambios JSON,
    descripcion TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Agregar campo cambios si la tabla ya existe pero no tiene el campo
SET @col_exists_cambios = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'aserradero_db' 
    AND TABLE_NAME = 'auditoria' 
    AND COLUMN_NAME = 'cambios');
SET @sql_cambios = IF(@col_exists_cambios = 0, 
    'ALTER TABLE auditoria ADD COLUMN cambios JSON', 
    'SELECT "Campo cambios ya existe" AS mensaje');
PREPARE stmt_cambios FROM @sql_cambios;
EXECUTE stmt_cambios;
DEALLOCATE PREPARE stmt_cambios;

-- ÍNDICES PARA MEJOR PERFORMANCE (crear solo si no existen)
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(created_at);
CREATE INDEX idx_auditoria_tabla ON auditoria(tabla_afectada);
CREATE INDEX idx_auditoria_accion ON auditoria(accion);

-- ÍNDICES COMPUESTOS PARA OPTIMIZAR QUERIES CON ORDER BY
CREATE INDEX idx_auditoria_tabla_fecha ON auditoria(tabla_afectada, created_at DESC);
CREATE INDEX idx_auditoria_usuario_fecha ON auditoria(usuario_id, created_at DESC);
CREATE INDEX idx_auditoria_accion_fecha ON auditoria(accion, created_at DESC);

-- Actualizar usuarios existentes para que NO deban cambiar contraseña
UPDATE usuarios SET debe_cambiar_contraseña = FALSE WHERE debe_cambiar_contraseña IS NULL;
