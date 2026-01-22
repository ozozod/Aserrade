-- ============================================
-- LIMPIAR BASE DE DATOS DE PRODUCCIÓN
-- Elimina todos los datos excepto usuarios
-- ============================================
-- ⚠️ IMPORTANTE: Este script elimina TODOS los datos de producción
-- Ejecutar en la base de datos: aserradero_db
-- ============================================

USE aserradero_db;

-- Desactivar verificación de foreign keys temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar datos en orden (respetando foreign keys)
-- 1. Pagos (referencian remitos)
TRUNCATE TABLE pagos;

-- 2. Remito_articulos (referencian remitos y artículos)
TRUNCATE TABLE remito_articulos;

-- 3. Remitos (referencian clientes)
TRUNCATE TABLE remitos;

-- 4. Artículos (referencian clientes)
TRUNCATE TABLE articulos;

-- 5. Clientes
TRUNCATE TABLE clientes;

-- 6. Auditoría (referencian usuarios, pero queremos limpiarla también)
TRUNCATE TABLE auditoria;

-- Reactivar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar que solo queden usuarios
SELECT 
    'clientes' as tabla, COUNT(*) as registros FROM clientes
UNION ALL
SELECT 'articulos', COUNT(*) FROM articulos
UNION ALL
SELECT 'remitos', COUNT(*) FROM remitos
UNION ALL
SELECT 'remito_articulos', COUNT(*) FROM remito_articulos
UNION ALL
SELECT 'pagos', COUNT(*) FROM pagos
UNION ALL
SELECT 'auditoria', COUNT(*) FROM auditoria
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios;

-- Mensaje de confirmación
SELECT '✅ Base de datos limpiada. Solo quedan usuarios.' as resultado;


