-- =====================================================
-- ASIGNAR CÓDIGOS A ARTÍCULOS EXISTENTES
-- =====================================================
-- Este script asigna códigos automáticamente a todos los artículos
-- que no tienen código, empezando desde 0001 en orden ascendente
-- 
-- USO: Ejecutar en SQL Editor de Supabase DESPUÉS de ejecutar
--      agregar_codigo_articulos.sql
-- =====================================================

-- Actualizar artículos existentes sin código
-- Asignar códigos secuenciales empezando desde 0001
WITH articulos_sin_codigo AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY id ASC) as numero_secuencia
  FROM articulos
  WHERE codigo IS NULL OR codigo = ''
),
codigos_asignados AS (
  SELECT 
    id,
    LPAD(numero_secuencia::TEXT, 4, '0') as nuevo_codigo
  FROM articulos_sin_codigo
)
UPDATE articulos a
SET codigo = ca.nuevo_codigo
FROM codigos_asignados ca
WHERE a.id = ca.id;

-- Verificar que no haya códigos duplicados
-- Si hay artículos con códigos duplicados, se asignarán nuevos códigos
WITH articulos_duplicados AS (
  SELECT 
    id,
    codigo,
    ROW_NUMBER() OVER (PARTITION BY codigo ORDER BY id ASC) as rn
  FROM articulos
  WHERE codigo IS NOT NULL AND codigo != ''
),
articulos_a_renumerar AS (
  SELECT 
    id,
    codigo,
    ROW_NUMBER() OVER (ORDER BY id ASC) + 
    (SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(codigo, '[^0-9]', '', 'g') AS INTEGER)), 0) 
     FROM articulos 
     WHERE codigo IS NOT NULL 
       AND codigo ~ '^[0-9]+$'
       AND id NOT IN (SELECT id FROM articulos_duplicados WHERE rn = 1)) as nuevo_numero
  FROM articulos_duplicados
  WHERE rn > 1
)
UPDATE articulos a
SET codigo = LPAD(ar.nuevo_numero::TEXT, 4, '0')
FROM articulos_a_renumerar ar
WHERE a.id = ar.id;

-- Mostrar estadísticas
DO $$
DECLARE
  total_articulos INTEGER;
  articulos_con_codigo INTEGER;
  articulos_sin_codigo INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_articulos FROM articulos;
  SELECT COUNT(*) INTO articulos_con_codigo FROM articulos WHERE codigo IS NOT NULL AND codigo != '';
  SELECT COUNT(*) INTO articulos_sin_codigo FROM articulos WHERE codigo IS NULL OR codigo = '';
  
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ CÓDIGOS ASIGNADOS A ARTÍCULOS EXISTENTES';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Total de artículos: %', total_articulos;
  RAISE NOTICE 'Artículos con código: %', articulos_con_codigo;
  RAISE NOTICE 'Artículos sin código: %', articulos_sin_codigo;
  RAISE NOTICE '';
  RAISE NOTICE '💡 Los códigos se asignaron en orden ascendente por ID';
  RAISE NOTICE '   empezando desde 0001';
  RAISE NOTICE '=====================================================';
END $$;

-- Mostrar algunos ejemplos de artículos con sus códigos
SELECT 
  id,
  codigo,
  nombre,
  precio_base
FROM articulos
WHERE codigo IS NOT NULL AND codigo != ''
ORDER BY CAST(REGEXP_REPLACE(codigo, '[^0-9]', '', 'g') AS INTEGER) ASC
LIMIT 10;

