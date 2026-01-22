-- Script para crear triggers que actualicen automáticamente los estados de los remitos
-- cuando cambien los pagos o los artículos de los remitos
-- Ejecutar en SQL Editor de Supabase

-- Función para actualizar el estado de un remito cuando cambian los pagos
CREATE OR REPLACE FUNCTION actualizar_estado_remito_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remito_id_afectado INTEGER;
  total_pagado_calculado DECIMAL(15,2) := 0;
  precio_total_calculado DECIMAL(15,2) := 0;
  nuevo_estado TEXT;
BEGIN
  -- Determinar qué remito fue afectado
  IF TG_OP = 'DELETE' THEN
    remito_id_afectado := OLD.remito_id;
  ELSE
    remito_id_afectado := NEW.remito_id;
  END IF;
  
  -- Calcular total pagado desde la tabla pagos
  SELECT COALESCE(SUM(monto), 0) INTO total_pagado_calculado
  FROM pagos
  WHERE remito_id = remito_id_afectado;
  
  -- Calcular precio total desde remito_articulos
  SELECT COALESCE(SUM(precio_total), 0) INTO precio_total_calculado
  FROM remito_articulos
  WHERE remito_id = remito_id_afectado;
  
  -- Determinar estado basado en los cálculos
  IF precio_total_calculado > 0 AND total_pagado_calculado >= precio_total_calculado THEN
    nuevo_estado := 'Pagado';
  ELSIF total_pagado_calculado > 0 AND precio_total_calculado > 0 THEN
    nuevo_estado := 'Pago Parcial';
  ELSIF total_pagado_calculado > 0 AND precio_total_calculado = 0 THEN
    nuevo_estado := 'Pagado';
  ELSE
    nuevo_estado := 'Pendiente';
  END IF;
  
  -- Actualizar el remito
  UPDATE remitos
  SET 
    monto_pagado = total_pagado_calculado,
    estado_pago = nuevo_estado,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = remito_id_afectado;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Función para actualizar el estado de un remito cuando cambian los artículos
CREATE OR REPLACE FUNCTION actualizar_estado_remito_por_articulos_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remito_id_afectado INTEGER;
  total_pagado_calculado DECIMAL(15,2) := 0;
  precio_total_calculado DECIMAL(15,2) := 0;
  nuevo_estado TEXT;
BEGIN
  -- Determinar qué remito fue afectado
  IF TG_OP = 'DELETE' THEN
    remito_id_afectado := OLD.remito_id;
  ELSE
    remito_id_afectado := NEW.remito_id;
  END IF;
  
  -- Calcular total pagado desde la tabla pagos
  SELECT COALESCE(SUM(monto), 0) INTO total_pagado_calculado
  FROM pagos
  WHERE remito_id = remito_id_afectado;
  
  -- Calcular precio total desde remito_articulos
  SELECT COALESCE(SUM(precio_total), 0) INTO precio_total_calculado
  FROM remito_articulos
  WHERE remito_id = remito_id_afectado;
  
  -- Determinar estado basado en los cálculos
  IF precio_total_calculado > 0 AND total_pagado_calculado >= precio_total_calculado THEN
    nuevo_estado := 'Pagado';
  ELSIF total_pagado_calculado > 0 AND precio_total_calculado > 0 THEN
    nuevo_estado := 'Pago Parcial';
  ELSIF total_pagado_calculado > 0 AND precio_total_calculado = 0 THEN
    nuevo_estado := 'Pagado';
  ELSE
    nuevo_estado := 'Pendiente';
  END IF;
  
  -- Actualizar el remito
  UPDATE remitos
  SET 
    monto_pagado = total_pagado_calculado,
    estado_pago = nuevo_estado,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = remito_id_afectado;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS trigger_actualizar_estado_remito_insert ON pagos;
DROP TRIGGER IF EXISTS trigger_actualizar_estado_remito_update ON pagos;
DROP TRIGGER IF EXISTS trigger_actualizar_estado_remito_delete ON pagos;
DROP TRIGGER IF EXISTS trigger_actualizar_estado_remito_articulos_insert ON remito_articulos;
DROP TRIGGER IF EXISTS trigger_actualizar_estado_remito_articulos_update ON remito_articulos;
DROP TRIGGER IF EXISTS trigger_actualizar_estado_remito_articulos_delete ON remito_articulos;

-- Crear triggers para pagos (INSERT, UPDATE, DELETE)
CREATE TRIGGER trigger_actualizar_estado_remito_insert
  AFTER INSERT ON pagos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_estado_remito_trigger();

CREATE TRIGGER trigger_actualizar_estado_remito_update
  AFTER UPDATE ON pagos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_estado_remito_trigger();

CREATE TRIGGER trigger_actualizar_estado_remito_delete
  AFTER DELETE ON pagos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_estado_remito_trigger();

-- Crear triggers para remito_articulos (INSERT, UPDATE, DELETE)
CREATE TRIGGER trigger_actualizar_estado_remito_articulos_insert
  AFTER INSERT ON remito_articulos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_estado_remito_por_articulos_trigger();

CREATE TRIGGER trigger_actualizar_estado_remito_articulos_update
  AFTER UPDATE ON remito_articulos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_estado_remito_por_articulos_trigger();

CREATE TRIGGER trigger_actualizar_estado_remito_articulos_delete
  AFTER DELETE ON remito_articulos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_estado_remito_por_articulos_trigger();

-- Verificar que los triggers se crearon correctamente
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND (trigger_name LIKE '%actualizar_estado_remito%')
ORDER BY event_object_table, trigger_name;

