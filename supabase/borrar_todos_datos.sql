-- Script para borrar TODOS los datos de la aplicación Y REINICIAR CONTADORES
-- ⚠️ ADVERTENCIA: Esto eliminará TODOS los datos y reiniciará los IDs a 1.
-- Usar solo para pruebas o reset completo.
-- Ejecutar en SQL Editor de Supabase

-- Desactivar temporalmente las restricciones de clave foránea
SET session_replication_role = 'replica';

-- Eliminar en orden para respetar las claves foráneas
DELETE FROM pagos;
DELETE FROM remito_articulos;
DELETE FROM remitos;
DELETE FROM articulos;
DELETE FROM clientes;

-- Reactivar las restricciones
SET session_replication_role = 'origin';

-- Reiniciar los contadores (secuencias) a 1
ALTER SEQUENCE clientes_id_seq RESTART WITH 1;
ALTER SEQUENCE articulos_id_seq RESTART WITH 1;
ALTER SEQUENCE remitos_id_seq RESTART WITH 1;
ALTER SEQUENCE remito_articulos_id_seq RESTART WITH 1;
ALTER SEQUENCE pagos_id_seq RESTART WITH 1;

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

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Todos los datos han sido eliminados correctamente.';
  RAISE NOTICE '✅ Todos los contadores han sido reiniciados a 1.';
END;
$$;

