-- Script para recalcular todos los estados de pago de los remitos
-- Basándose en los pagos actuales en la base de datos
-- Ejecutar en SQL Editor de Supabase

-- Función para recalcular el estado de un remito
CREATE OR REPLACE FUNCTION recalcular_estado_remito(remito_id_param INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_pagado_calculado DECIMAL(15,2) := 0;
  precio_total_calculado DECIMAL(15,2) := 0;
  nuevo_estado TEXT;
BEGIN
  -- Calcular total pagado desde la tabla pagos
  SELECT COALESCE(SUM(monto), 0) INTO total_pagado_calculado
  FROM pagos
  WHERE remito_id = remito_id_param;
  
  -- Calcular precio total desde remito_articulos
  SELECT COALESCE(SUM(precio_total), 0) INTO precio_total_calculado
  FROM remito_articulos
  WHERE remito_id = remito_id_param;
  
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
  WHERE id = remito_id_param;
END;
$$;

-- Recalcular todos los remitos
DO $$
DECLARE
  remito_record RECORD;
  contador INTEGER := 0;
BEGIN
  FOR remito_record IN SELECT id FROM remitos ORDER BY id
  LOOP
    PERFORM recalcular_estado_remito(remito_record.id);
    contador := contador + 1;
    
    -- Mostrar progreso cada 100 remitos
    IF contador % 100 = 0 THEN
      RAISE NOTICE 'Procesados % remitos...', contador;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Proceso completado. Total de remitos procesados: %', contador;
END;
$$;

-- Verificar resultados: mostrar algunos remitos para verificar
SELECT 
  r.id,
  r.numero,
  r.estado_pago,
  r.monto_pagado,
  COALESCE(SUM(p.monto), 0) as total_pagado_calculado,
  COALESCE(SUM(ra.precio_total), 0) as precio_total_calculado,
  CASE 
    WHEN COALESCE(SUM(ra.precio_total), 0) > 0 AND COALESCE(SUM(p.monto), 0) >= COALESCE(SUM(ra.precio_total), 0) THEN 'Pagado'
    WHEN COALESCE(SUM(p.monto), 0) > 0 AND COALESCE(SUM(ra.precio_total), 0) > 0 THEN 'Pago Parcial'
    WHEN COALESCE(SUM(p.monto), 0) > 0 AND COALESCE(SUM(ra.precio_total), 0) = 0 THEN 'Pagado'
    ELSE 'Pendiente'
  END as estado_calculado
FROM remitos r
LEFT JOIN pagos p ON p.remito_id = r.id
LEFT JOIN remito_articulos ra ON ra.remito_id = r.id
GROUP BY r.id, r.numero, r.estado_pago, r.monto_pagado
ORDER BY r.id
LIMIT 20;

