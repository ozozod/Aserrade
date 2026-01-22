-- =====================================================
-- AGREGAR CAMPO CÓDIGO A ARTÍCULOS
-- =====================================================
-- Este script agrega el campo 'codigo' a la tabla articulos
-- El código será único y se usará para identificar productos
-- 
-- USO: Ejecutar en SQL Editor de Supabase
-- =====================================================

-- Agregar columna codigo a la tabla articulos
ALTER TABLE articulos 
ADD COLUMN IF NOT EXISTS codigo VARCHAR(10) UNIQUE;

-- Crear índice para búsquedas rápidas por código
CREATE INDEX IF NOT EXISTS idx_articulos_codigo ON articulos(codigo);

-- Función para generar código automático si no se proporciona
-- Esta función se puede usar desde la aplicación para generar el siguiente código disponible
CREATE OR REPLACE FUNCTION obtener_siguiente_codigo_articulo()
RETURNS VARCHAR(10) AS $$
DECLARE
  max_codigo_num INTEGER;
  siguiente_codigo VARCHAR(10);
BEGIN
  -- Obtener el máximo código numérico existente
  SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(codigo, '[^0-9]', '', 'g') AS INTEGER)), 0)
  INTO max_codigo_num
  FROM articulos
  WHERE codigo IS NOT NULL 
    AND codigo ~ '^[0-9]+$';
  
  -- Generar siguiente código con formato 0001, 0002, etc.
  siguiente_codigo := LPAD((max_codigo_num + 1)::TEXT, 4, '0');
  
  RETURN siguiente_codigo;
END;
$$ LANGUAGE plpgsql;

-- Comentario en la columna
COMMENT ON COLUMN articulos.codigo IS 'Código único del artículo (formato: 0001, 0002, etc.)';

-- =====================================================
-- ASIGNAR CÓDIGOS A ARTÍCULOS EXISTENTES
-- =====================================================
-- Si ya hay artículos en la base de datos, asignarles códigos automáticamente

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

