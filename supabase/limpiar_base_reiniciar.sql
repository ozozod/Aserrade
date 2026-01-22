-- =====================================================
-- SCRIPT PARA BORRAR TODOS LOS DATOS Y REINICIAR CONTADORES
-- =====================================================
-- ⚠️ ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos
-- y reiniciará los contadores de IDs a 1.
-- 
-- USO: Ejecutar en SQL Editor de Supabase
-- =====================================================

-- Desactivar temporalmente las restricciones de clave foránea
SET session_replication_role = 'replica';

-- =====================================================
-- PASO 1: ELIMINAR TODOS LOS DATOS
-- =====================================================
-- Eliminar en orden para respetar las claves foráneas
-- (de más dependiente a menos dependiente)

DELETE FROM pagos;
DELETE FROM remito_articulos;
DELETE FROM remitos;
DELETE FROM articulos;
DELETE FROM clientes;

-- Reactivar las restricciones
SET session_replication_role = 'origin';

-- =====================================================
-- PASO 2: REINICIAR LOS CONTADORES (SECUENCIAS)
-- =====================================================
-- Reiniciar las secuencias para que los IDs vuelvan a empezar desde 1

-- Reiniciar secuencia de clientes
ALTER SEQUENCE clientes_id_seq RESTART WITH 1;

-- Reiniciar secuencia de articulos
ALTER SEQUENCE articulos_id_seq RESTART WITH 1;

-- Reiniciar secuencia de remitos
ALTER SEQUENCE remitos_id_seq RESTART WITH 1;

-- Reiniciar secuencia de remito_articulos
ALTER SEQUENCE remito_articulos_id_seq RESTART WITH 1;

-- Reiniciar secuencia de pagos
ALTER SEQUENCE pagos_id_seq RESTART WITH 1;

-- =====================================================
-- PASO 3: VERIFICACIÓN
-- =====================================================
-- Verificar que todo esté vacío y los contadores reiniciados

SELECT 
  'clientes' as tabla,
  (SELECT COUNT(*) FROM clientes) as registros,
  (SELECT last_value FROM clientes_id_seq) as siguiente_id
UNION ALL
SELECT 
  'articulos' as tabla,
  (SELECT COUNT(*) FROM articulos) as registros,
  (SELECT last_value FROM articulos_id_seq) as siguiente_id
UNION ALL
SELECT 
  'remitos' as tabla,
  (SELECT COUNT(*) FROM remitos) as registros,
  (SELECT last_value FROM remitos_id_seq) as siguiente_id
UNION ALL
SELECT 
  'remito_articulos' as tabla,
  (SELECT COUNT(*) FROM remito_articulos) as registros,
  (SELECT last_value FROM remito_articulos_id_seq) as siguiente_id
UNION ALL
SELECT 
  'pagos' as tabla,
  (SELECT COUNT(*) FROM pagos) as registros,
  (SELECT last_value FROM pagos_id_seq) as siguiente_id;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Todos los datos han sido eliminados correctamente.';
  RAISE NOTICE '✅ Todos los contadores han sido reiniciados a 1.';
  RAISE NOTICE '✅ La base de datos está lista para empezar desde cero.';
END;
$$;

