-- Script para corregir los errores de "role mutable search_path" en Supabase
-- Ejecutar en SQL Editor de Supabase
-- Estos errores aparecen cuando las funciones no tienen un search_path fijo

-- Primero, eliminar la función calcular_cambios existente si tiene parámetros diferentes
DROP FUNCTION IF EXISTS public.calcular_cambios(JSONB, JSONB);

-- Corregir función calcular_cambios con los parámetros correctos (datos_viejos, datos_nuevos)
CREATE OR REPLACE FUNCTION public.calcular_cambios(
  datos_viejos JSONB,
  datos_nuevos JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cambios JSONB := '{}'::JSONB;
  key TEXT;
  valor_viejo JSONB;
  valor_nuevo JSONB;
BEGIN
  -- Iterar sobre las claves de los datos nuevos
  FOR key IN SELECT jsonb_object_keys(COALESCE(datos_nuevos, '{}'::JSONB))
  LOOP
    valor_viejo := datos_viejos->key;
    valor_nuevo := datos_nuevos->key;
    
    -- Si el valor cambió, agregarlo a cambios
    IF valor_viejo IS DISTINCT FROM valor_nuevo THEN
      cambios := cambios || jsonb_build_object(
        key,
        jsonb_build_object(
          'anterior', valor_viejo,
          'nuevo', valor_nuevo
        )
      );
    END IF;
  END LOOP;
  
  -- También verificar claves que existían antes pero no ahora
  FOR key IN SELECT jsonb_object_keys(COALESCE(datos_viejos, '{}'::JSONB))
  LOOP
    IF NOT (datos_nuevos ? key) THEN
      cambios := cambios || jsonb_build_object(
        key,
        jsonb_build_object(
          'anterior', datos_viejos->key,
          'nuevo', NULL
        )
      );
    END IF;
  END LOOP;
  
  RETURN cambios;
END;
$$;

-- Corregir función registrar_auditoria manteniendo los parámetros originales
DROP FUNCTION IF EXISTS public.registrar_auditoria(VARCHAR, INTEGER, VARCHAR, VARCHAR, JSONB, JSONB, JSONB, TEXT);

CREATE OR REPLACE FUNCTION public.registrar_auditoria(
  p_tabla VARCHAR,
  p_registro_id INTEGER,
  p_accion VARCHAR,
  p_usuario VARCHAR DEFAULT NULL,
  p_datos_anteriores JSONB DEFAULT NULL,
  p_datos_nuevos JSONB DEFAULT NULL,
  p_cambios JSONB DEFAULT NULL,
  p_observaciones TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO auditoria (
    tabla,
    registro_id,
    accion,
    usuario,
    datos_anteriores,
    datos_nuevos,
    cambios,
    observaciones
  ) VALUES (
    p_tabla,
    p_registro_id,
    p_accion,
    p_usuario,
    p_datos_anteriores,
    p_datos_nuevos,
    p_cambios,
    p_observaciones
  );
END;
$$;

-- Corregir función update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Verificar que las funciones estén corregidas
SELECT 
    routine_name, 
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN ('registrar_auditoria', 'calcular_cambios', 'update_updated_at_column');

