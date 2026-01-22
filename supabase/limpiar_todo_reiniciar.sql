-- =====================================================
-- SCRIPT PARA BORRAR TODOS LOS DATOS Y REINICIAR CONTADORES
-- =====================================================
-- ⚠️ ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos
-- y reiniciará los contadores de IDs a 1.
-- 
-- ⚠️ IMPORTANTE: Este script NO elimina las imágenes de Supabase Storage.
-- Las imágenes quedan en el bucket 'remitos-fotos' y ocuparán espacio.
-- Para eliminar también las imágenes, usa el script JavaScript:
-- node scripts/limpiar-todo-con-imagenes.js
-- 
-- USO: Ejecutar en SQL Editor de Supabase
-- =====================================================

-- =====================================================
-- PASO 1: ELIMINAR TODOS LOS DATOS
-- =====================================================
-- Eliminar en orden para respetar las claves foráneas
-- (de más dependiente a menos dependiente)

-- Tablas dependientes primero
DELETE FROM pagos;
DELETE FROM remito_articulos;
DELETE FROM remitos;
DELETE FROM articulos;
DELETE FROM clientes;

-- Tablas adicionales (si existen)
-- DELETE FROM pagos_detalle;  -- Si existe esta tabla
-- DELETE FROM backups_historial;  -- Si existe esta tabla

-- =====================================================
-- PASO 2: REINICIAR LOS CONTADORES (SECUENCIAS)
-- =====================================================
-- Reiniciar las secuencias para que los IDs vuelvan a empezar desde 1

-- Función para reiniciar secuencia de forma segura
DO $$
DECLARE
    seq_name TEXT;
    seq_names TEXT[] := ARRAY[
        'clientes_id_seq',
        'articulos_id_seq',
        'remitos_id_seq',
        'remito_articulos_id_seq',
        'pagos_id_seq'
    ];
BEGIN
    FOREACH seq_name IN ARRAY seq_names
    LOOP
        -- Verificar si la secuencia existe antes de reiniciarla
        IF EXISTS (
            SELECT 1 
            FROM pg_sequences 
            WHERE schemaname = 'public' 
            AND sequencename = seq_name
        ) THEN
            EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1', seq_name);
            RAISE NOTICE '✅ Secuencia % reiniciada', seq_name;
        ELSE
            RAISE NOTICE '⚠️ Secuencia % no existe (puede ser normal)', seq_name;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- PASO 3: VERIFICACIÓN
-- =====================================================
-- Verificar que todo esté vacío y los contadores reiniciados

SELECT 
    'clientes' as tabla,
    (SELECT COUNT(*) FROM clientes) as registros,
    COALESCE((SELECT last_value FROM clientes_id_seq), 0) as siguiente_id
UNION ALL
SELECT 
    'articulos' as tabla,
    (SELECT COUNT(*) FROM articulos) as registros,
    COALESCE((SELECT last_value FROM articulos_id_seq), 0) as siguiente_id
UNION ALL
SELECT 
    'remitos' as tabla,
    (SELECT COUNT(*) FROM remitos) as registros,
    COALESCE((SELECT last_value FROM remitos_id_seq), 0) as siguiente_id
UNION ALL
SELECT 
    'remito_articulos' as tabla,
    (SELECT COUNT(*) FROM remito_articulos) as registros,
    COALESCE((SELECT last_value FROM remito_articulos_id_seq), 0) as siguiente_id
UNION ALL
SELECT 
    'pagos' as tabla,
    (SELECT COUNT(*) FROM pagos) as registros,
    COALESCE((SELECT last_value FROM pagos_id_seq), 0) as siguiente_id;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ LIMPIEZA DE DATOS COMPLETADA';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ Todos los datos han sido eliminados correctamente.';
    RAISE NOTICE '✅ Todos los contadores han sido reiniciados a 1.';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ IMPORTANTE: Las imágenes NO fueron eliminadas.';
    RAISE NOTICE '   Las imágenes siguen en Supabase Storage (bucket: remitos-fotos)';
    RAISE NOTICE '   y seguirán ocupando espacio.';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Para eliminar también las imágenes, ejecuta:';
    RAISE NOTICE '   node scripts/limpiar-todo-con-imagenes.js';
    RAISE NOTICE '=====================================================';
END $$;
