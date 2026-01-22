# 🚀 Aserradero App v3 - Base de Datos de DESARROLLO

## ⚠️ IMPORTANTE

Esta app está configurada para usar la **base de datos de DESARROLLO**, NO la de producción.

### Configuración de Bases de Datos

- **Producción** (`aserradero`): `aserradero_db` 
- **Desarrollo** (`aserradero v3`): `aserradero_dev` ✅

## 📋 Pasos para Configurar la Base de Datos de Desarrollo

### 1. Crear la Base de Datos

Ejecutar en phpMyAdmin de Hostinger:

```sql
-- Crear base de datos de desarrollo
CREATE DATABASE IF NOT EXISTS aserradero_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Copiar Estructura de Tablas de Producción

**Opción A: Desde phpMyAdmin**
1. Ir a la base de datos `aserradero_db` (producción)
2. Seleccionar todas las tablas: `clientes`, `articulos`, `remitos`, `remito_articulos`, `pagos`
3. Clic en "Exportar" → Solo estructura (sin datos)
4. En el SQL exportado, cambiar `aserradero_db` por `aserradero_dev`
5. Ejecutar el SQL en `aserradero_dev`

**Opción B: Usar el script SQL**
- Ejecutar `database/crear_base_desarrollo.sql` en phpMyAdmin
- Este script crea las tablas básicas y las de auditoría

### 3. Crear Tablas de Usuarios y Auditoría

Ejecutar el script:
```sql
database/v1.2_usuarios_auditoria.sql
```

O ejecutar directamente:
```sql
USE aserradero_dev;

-- Tabla usuarios
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

-- Tabla auditoría
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

-- Índices
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(created_at);
CREATE INDEX idx_auditoria_tabla ON auditoria(tabla_afectada);
CREATE INDEX idx_auditoria_accion ON auditoria(accion);

-- Usuario admin por defecto
INSERT INTO usuarios (username, password_hash, nombre_completo, rol) 
VALUES ('admin', 'admin123', 'Administrador', 'admin');
```

### 4. Verificar Conexión

La configuración en `database/mysqlService.js` ya está lista:

```javascript
database: 'aserradero_dev', // ✅ Base de datos de DESARROLLO
```

## 🔐 Credenciales de Acceso

- **Host**: `31.97.246.42`
- **Puerto**: `3306`
- **Usuario**: `aserradero_user`
- **Contraseña**: `Aserradero2025#`
- **Base de datos**: `aserradero_dev` ✅

## 👤 Usuario Admin por Defecto

- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Rol**: Administrador

## ✅ Verificación

Para verificar que todo está correcto:

1. Ejecutar la app:
```bash
cd "C:\Users\ozozo\Documents\aserradero v3"
npm run dev
```

2. Intentar login con:
   - Usuario: `admin`
   - Contraseña: `admin123`

3. Si funciona, la conexión a la base de desarrollo está correcta.

## 🚨 Recordatorio

- **NUNCA** cambiar la configuración para apuntar a `aserradero_db` (producción)
- La base de datos de desarrollo es `aserradero_dev` (sin el `_db`)
- Esta app es solo para desarrollo y pruebas
- Los datos de desarrollo son independientes de producción

