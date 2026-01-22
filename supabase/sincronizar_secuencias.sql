-- =====================================================
-- SCRIPT PARA SINCRONIZAR SECUENCIAS CON DATOS REALES
-- =====================================================
-- ⚠️ Este script sincroniza las secuencias (contadores) con los
-- IDs máximos reales en cada tabla. Esto corrige errores de:
-- "duplicate key value violates unique constraint"
-- 
-- USO: Ejecutar en SQL Editor de Supabase cuando tengas
-- errores de IDs duplicados al crear registros nuevos
-- =====================================================

-- Función para sincronizar secuencias de forma segura
DO $$
DECLARE
    max_id INTEGER;
    seq_name TEXT;
BEGIN
    -- =====================================================
    -- SINCRONIZAR SECUENCIA DE CLIENTES
    -- =====================================================
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM clientes;
    
    -- Asegurar que la secuencia esté al menos en max_id + 1
    IF max_id > 0 THEN
        EXECUTE format('SELECT setval(''clientes_id_seq'', %s, true)', max_id);
        RAISE NOTICE '✅ Secuencia clientes_id_seq sincronizada: siguiente ID será %', max_id + 1;
    ELSE
        EXECUTE 'ALTER SEQUENCE clientes_id_seq RESTART WITH 1';
        RAISE NOTICE '✅ Secuencia clientes_id_seq reiniciada a 1 (tabla vacía)';
    END IF;
    
    -- =====================================================
    -- SINCRONIZAR SECUENCIA DE ARTÍCULOS
    -- =====================================================
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM articulos;
    
    IF max_id > 0 THEN
        EXECUTE format('SELECT setval(''articulos_id_seq'', %s, true)', max_id);
        RAISE NOTICE '✅ Secuencia articulos_id_seq sincronizada: siguiente ID será %', max_id + 1;
    ELSE
        EXECUTE 'ALTER SEQUENCE articulos_id_seq RESTART WITH 1';
        RAISE NOTICE '✅ Secuencia articulos_id_seq reiniciada a 1 (tabla vacía)';
    END IF;
    
    -- =====================================================
    -- SINCRONIZAR SECUENCIA DE REMITOS
    -- =====================================================
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM remitos;
    
    IF max_id > 0 THEN
        EXECUTE format('SELECT setval(''remitos_id_seq'', %s, true)', max_id);
        RAISE NOTICE '✅ Secuencia remitos_id_seq sincronizada: siguiente ID será %', max_id + 1;
    ELSE
        EXECUTE 'ALTER SEQUENCE remitos_id_seq RESTART WITH 1';
        RAISE NOTICE '✅ Secuencia remitos_id_seq reiniciada a 1 (tabla vacía)';
    END IF;
    
    -- =====================================================
    -- SINCRONIZAR SECUENCIA DE REMITO_ARTICULOS
    -- =====================================================
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM remito_articulos;
    
    IF max_id > 0 THEN
        EXECUTE format('SELECT setval(''remito_articulos_id_seq'', %s, true)', max_id);
        RAISE NOTICE '✅ Secuencia remito_articulos_id_seq sincronizada: siguiente ID será %', max_id + 1;
    ELSE
        EXECUTE 'ALTER SEQUENCE remito_articulos_id_seq RESTART WITH 1';
        RAISE NOTICE '✅ Secuencia remito_articulos_id_seq reiniciada a 1 (tabla vacía)';
    END IF;
    
    -- =====================================================
    -- SINCRONIZAR SECUENCIA DE PAGOS
    -- =====================================================
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM pagos;
    
    IF max_id > 0 THEN
        EXECUTE format('SELECT setval(''pagos_id_seq'', %s, true)', max_id);
        RAISE NOTICE '✅ Secuencia pagos_id_seq sincronizada: siguiente ID será %', max_id + 1;
    ELSE
        EXECUTE 'ALTER SEQUENCE pagos_id_seq RESTART WITH 1';
        RAISE NOTICE '✅ Secuencia pagos_id_seq reiniciada a 1 (tabla vacía)';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ SINCRONIZACIÓN COMPLETA';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Todas las secuencias están sincronizadas correctamente.';
    RAISE NOTICE 'Ahora puedes crear nuevos registros sin errores.';
    RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Mostrar el estado actual de las secuencias y los IDs máximos
SELECT 
    'clientes' as tabla,
    (SELECT MAX(id) FROM clientes) as max_id_existente,
    (SELECT last_value FROM clientes_id_seq) as siguiente_id_secuencia,
    CASE 
        WHEN (SELECT MAX(id) FROM clientes) IS NULL THEN 1
        ELSE (SELECT MAX(id) FROM clientes) + 1
    END as siguiente_id_correcto
UNION ALL
SELECT 
    'articulos' as tabla,
    (SELECT MAX(id) FROM articulos) as max_id_existente,
    (SELECT last_value FROM articulos_id_seq) as siguiente_id_secuencia,
    CASE 
        WHEN (SELECT MAX(id) FROM articulos) IS NULL THEN 1
        ELSE (SELECT MAX(id) FROM articulos) + 1
    END as siguiente_id_correcto
UNION ALL
SELECT 
    'remitos' as tabla,
    (SELECT MAX(id) FROM remitos) as max_id_existente,
    (SELECT last_value FROM remitos_id_seq) as siguiente_id_secuencia,
    CASE 
        WHEN (SELECT MAX(id) FROM remitos) IS NULL THEN 1
        ELSE (SELECT MAX(id) FROM remitos) + 1
    END as siguiente_id_correcto
UNION ALL
SELECT 
    'remito_articulos' as tabla,
    (SELECT MAX(id) FROM remito_articulos) as max_id_existente,
    (SELECT last_value FROM remito_articulos_id_seq) as siguiente_id_secuencia,
    CASE 
        WHEN (SELECT MAX(id) FROM remito_articulos) IS NULL THEN 1
        ELSE (SELECT MAX(id) FROM remito_articulos) + 1
    END as siguiente_id_correcto
UNION ALL
SELECT 
    'pagos' as tabla,
    (SELECT MAX(id) FROM pagos) as max_id_existente,
    (SELECT last_value FROM pagos_id_seq) as siguiente_id_secuencia,
    CASE 
        WHEN (SELECT MAX(id) FROM pagos) IS NULL THEN 1
        ELSE (SELECT MAX(id) FROM pagos) + 1
    END as siguiente_id_correcto;

