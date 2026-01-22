-- =====================================================
-- SISTEMA DE BACKUP DIARIO AUTOMÁTICO
-- =====================================================
-- Este sistema genera backups SQL diarios de todas las tablas críticas
-- y los guarda en Supabase Storage para su restauración posterior
-- =====================================================

-- 1. Crear tabla para registrar los backups realizados
CREATE TABLE IF NOT EXISTS backups_historial (
  id SERIAL PRIMARY KEY,
  fecha_backup TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  nombre_archivo TEXT NOT NULL,
  ruta_storage TEXT NOT NULL,
  tamaño_bytes BIGINT,
  tablas_incluidas TEXT[], -- Array con nombres de tablas incluidas
  observaciones TEXT,
  creado_por TEXT DEFAULT 'Sistema'
);

-- Índice para búsquedas rápidas por fecha
CREATE INDEX IF NOT EXISTS idx_backups_fecha ON backups_historial(fecha_backup DESC);

-- 2. Función para generar backup SQL de una tabla específica
CREATE OR REPLACE FUNCTION generar_backup_tabla(
  nombre_tabla TEXT,
  fecha_backup DATE DEFAULT CURRENT_DATE
) RETURNS TEXT AS $$
DECLARE
  sql_backup TEXT := '';
  registro RECORD;
  columnas TEXT;
  valores TEXT;
BEGIN
  -- Obtener columnas de la tabla
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
  INTO columnas
  FROM information_schema.columns
  WHERE table_name = nombre_tabla
    AND table_schema = 'public';
  
  -- Si no hay columnas, retornar vacío
  IF columnas IS NULL THEN
    RETURN '';
  END IF;
  
  -- Generar INSERT statements
  sql_backup := E'\n-- ============================================\n';
  sql_backup := sql_backup || '-- BACKUP DE TABLA: ' || nombre_tabla || E'\n';
  sql_backup := sql_backup || '-- FECHA: ' || fecha_backup::TEXT || E'\n';
  sql_backup := sql_backup || E'-- ============================================\n\n';
  sql_backup := sql_backup || '-- Eliminar datos existentes (opcional, comentar si no se desea)\n';
  sql_backup := sql_backup || '-- DELETE FROM ' || nombre_tabla || ';\n\n';
  sql_backup := sql_backup || '-- Insertar datos\n';
  
  -- Generar INSERT para cada registro
  FOR registro IN EXECUTE format('SELECT * FROM %I', nombre_tabla) LOOP
    valores := '';
    
    -- Construir valores del INSERT
    EXECUTE format('SELECT string_agg(
      CASE 
        WHEN value IS NULL THEN ''NULL''
        WHEN pg_typeof(value)::text LIKE ''%text%'' OR pg_typeof(value)::text LIKE ''%varchar%'' OR pg_typeof(value)::text LIKE ''%char%''
          THEN quote_literal(value)
        WHEN pg_typeof(value)::text LIKE ''%date%'' OR pg_typeof(value)::text LIKE ''%timestamp%''
          THEN quote_literal(value)
        ELSE value::text
      END, '', ''
    ) FROM jsonb_each(to_jsonb($1))', registro) INTO valores USING registro;
    
    sql_backup := sql_backup || 'INSERT INTO ' || nombre_tabla || ' (' || columnas || ') VALUES (' || valores || ');\n';
  END LOOP;
  
  sql_backup := sql_backup || E'\n';
  
  RETURN sql_backup;
EXCEPTION
  WHEN OTHERS THEN
    RETURN '-- ERROR generando backup de ' || nombre_tabla || ': ' || SQLERRM || E'\n';
END;
$$ LANGUAGE plpgsql;

-- 3. Función principal para generar backup completo
CREATE OR REPLACE FUNCTION generar_backup_completo(
  observaciones_param TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  backup_sql TEXT := '';
  fecha_backup DATE := CURRENT_DATE;
  nombre_archivo TEXT;
  tablas_backup TEXT[] := ARRAY[
    'clientes',
    'articulos',
    'remitos',
    'remito_articulos',
    'pagos'
  ];
  tabla TEXT;
  total_registros INTEGER := 0;
  resultado JSONB;
BEGIN
  -- Encabezado del backup
  backup_sql := E'-- =====================================================\n';
  backup_sql := backup_sql || '-- BACKUP COMPLETO DE BASE DE DATOS\n';
  backup_sql := backup_sql || '-- FECHA: ' || fecha_backup::TEXT || E'\n';
  backup_sql := backup_sql || '-- HORA: ' || CURRENT_TIMESTAMP::TEXT || E'\n';
  IF observaciones_param IS NOT NULL THEN
    backup_sql := backup_sql || '-- OBSERVACIONES: ' || observaciones_param || E'\n';
  END IF;
  backup_sql := backup_sql || E'-- =====================================================\n\n';
  
  -- Generar backup de cada tabla
  FOREACH tabla IN ARRAY tablas_backup LOOP
    BEGIN
      backup_sql := backup_sql || generar_backup_tabla(tabla, fecha_backup);
      
      -- Contar registros
      EXECUTE format('SELECT COUNT(*) FROM %I', tabla) INTO total_registros;
      backup_sql := backup_sql || '-- Total registros en ' || tabla || ': ' || total_registros || E'\n\n';
    EXCEPTION
      WHEN OTHERS THEN
        backup_sql := backup_sql || '-- ERROR en tabla ' || tabla || ': ' || SQLERRM || E'\n\n';
    END;
  END LOOP;
  
  -- Pie del backup
  backup_sql := backup_sql || E'-- =====================================================\n';
  backup_sql := backup_sql || '-- FIN DEL BACKUP\n';
  backup_sql := backup_sql || '-- Total de tablas respaldadas: ' || array_length(tablas_backup, 1) || E'\n';
  backup_sql := backup_sql || E'-- =====================================================\n';
  
  -- Generar nombre de archivo
  nombre_archivo := 'backup_' || TO_CHAR(fecha_backup, 'YYYY-MM-DD') || '_' || 
                    TO_CHAR(CURRENT_TIMESTAMP, 'HH24MISS') || '.sql';
  
  -- Retornar resultado
  resultado := jsonb_build_object(
    'success', true,
    'nombre_archivo', nombre_archivo,
    'fecha_backup', fecha_backup::TEXT,
    'backup_sql', backup_sql,
    'tablas_incluidas', tablas_backup,
    'tamaño_aprox', length(backup_sql)
  );
  
  RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para registrar backup en el historial
CREATE OR REPLACE FUNCTION registrar_backup(
  nombre_archivo_param TEXT,
  ruta_storage_param TEXT,
  tamaño_bytes_param BIGINT,
  tablas_incluidas_param TEXT[],
  observaciones_param TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  backup_id INTEGER;
BEGIN
  INSERT INTO backups_historial (
    nombre_archivo,
    ruta_storage,
    tamaño_bytes,
    tablas_incluidas,
    observaciones
  ) VALUES (
    nombre_archivo_param,
    ruta_storage_param,
    tamaño_bytes_param,
    tablas_incluidas_param,
    observaciones_param
  ) RETURNING id INTO backup_id;
  
  RETURN backup_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Función para listar backups disponibles
CREATE OR REPLACE FUNCTION listar_backups(
  limite INTEGER DEFAULT 30
) RETURNS TABLE (
  id INTEGER,
  fecha_backup TIMESTAMP,
  nombre_archivo TEXT,
  ruta_storage TEXT,
  tamaño_bytes BIGINT,
  tamaño_mb NUMERIC,
  tablas_incluidas TEXT[],
  observaciones TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.fecha_backup,
    b.nombre_archivo,
    b.ruta_storage,
    b.tamaño_bytes,
    ROUND(b.tamaño_bytes::NUMERIC / 1024 / 1024, 2) as tamaño_mb,
    b.tablas_incluidas,
    b.observaciones
  FROM backups_historial b
  ORDER BY b.fecha_backup DESC
  LIMIT limite;
END;
$$ LANGUAGE plpgsql;

-- 6. Función para obtener estadísticas de backups
CREATE OR REPLACE FUNCTION estadisticas_backups() RETURNS JSONB AS $$
DECLARE
  resultado JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_backups', COUNT(*),
    'backup_mas_reciente', MAX(fecha_backup),
    'backup_mas_antiguo', MIN(fecha_backup),
    'tamaño_total_mb', ROUND(SUM(tamaño_bytes)::NUMERIC / 1024 / 1024, 2),
    'tamaño_promedio_mb', ROUND(AVG(tamaño_bytes)::NUMERIC / 1024 / 1024, 2)
  ) INTO resultado
  FROM backups_historial;
  
  RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- NOTAS DE USO:
-- =====================================================
-- 1. Para generar un backup manualmente:
--    SELECT generar_backup_completo('Backup manual del día');
--
-- 2. Para listar backups:
--    SELECT * FROM listar_backups(10);
--
-- 3. Para ver estadísticas:
--    SELECT estadisticas_backups();
--
-- 4. El backup se debe subir a Supabase Storage usando
--    la función JavaScript (ver backupService.js)
-- =====================================================

