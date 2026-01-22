-- Script para crear datos de prueba completos
-- 60 clientes, 1 artículo por cliente, 2+ remitos por mes desde enero 2025 hasta noviembre 2025
-- MONTOS EN MILLONES - Ejecutar en SQL Editor de Supabase

-- Limpiar datos existentes - BORRAR TODO
DELETE FROM pagos;
DELETE FROM remito_articulos;
DELETE FROM remitos;
DELETE FROM articulos;
DELETE FROM clientes;

-- Insertar 60 clientes
INSERT INTO clientes (nombre, telefono, direccion, email)
SELECT 
  'Cliente ' || LPAD(serie::TEXT, 3, '0') || CASE 
    WHEN serie <= 20 THEN ' S.A.'
    WHEN serie <= 40 THEN ' S.R.L.'
    ELSE ' Ltda.'
  END,
  '+54 11 ' || LPAD((1000 + serie)::TEXT, 4, '0') || '-' || LPAD((2000 + serie)::TEXT, 4, '0'),
  'Calle ' || serie || ', Barrio ' || serie || ', CABA',
  'cliente' || LPAD(serie::TEXT, 3, '0') || '@email.com'
FROM generate_series(1, 60) AS serie;

-- Insertar 1 artículo único por cada cliente - PRECIOS EN MILLONES (3M a 6M)
INSERT INTO articulos (nombre, descripcion, precio_base, activo, cliente_id)
SELECT 
  'Producto Exclusivo ' || c.nombre,
  'Producto único para ' || c.nombre,
  (3000000 + (c.id % 4) * 1000000)::DECIMAL(15,2), -- Precios entre 3M y 6M
  true,
  c.id
FROM clientes c
ORDER BY c.id;

-- Generar remitos: 2 remitos por mes por cliente desde enero 2025 hasta noviembre 2025
-- Total: 60 clientes * 11 meses * 2 remitos = 1320 remitos
-- DEJAR ENTRE 2 Y 6 REMITOS PENDIENTES POR CLIENTE PARA PRUEBAS (los más recientes)
INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones)
WITH remitos_con_orden AS (
  SELECT 
    c.id as cliente_id,
    fecha_remito,
    'REM-' || LPAD((ROW_NUMBER() OVER (ORDER BY c.id, fecha_remito))::TEXT, 6, '0') as numero,
    ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY fecha_remito DESC) as orden_descendente,
    (2 + (c.id % 5)) as remitos_pendientes, -- Entre 2 y 6 remitos pendientes por cliente
    'Remito del ' || TO_CHAR(fecha_remito, 'DD/MM/YYYY') || ' para ' || c.nombre as observaciones
  FROM clientes c
  CROSS JOIN LATERAL (
    SELECT fecha_remito
    FROM generate_series(
      '2025-01-01'::DATE,
      '2025-11-30'::DATE,
      '1 day'::INTERVAL
    ) AS fecha_remito
    WHERE EXTRACT(DAY FROM fecha_remito) IN (10, 20) -- Exactamente 2 remitos por mes (días 10 y 20)
  ) AS fechas
)
SELECT 
  cliente_id,
  fecha_remito,
  numero,
  CASE 
    WHEN orden_descendente <= remitos_pendientes THEN 'Pendiente'
    ELSE 'Pagado'
  END as estado_pago,
  0 as monto_pagado,
  observaciones
FROM remitos_con_orden
ORDER BY cliente_id, fecha_remito;

-- Insertar artículos en los remitos (1 artículo por remito, el del cliente)
INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total)
SELECT 
  r.id,
  a.id,
  a.nombre,
  (20 + (r.id % 31))::INTEGER, -- Cantidad entera entre 20 y 50
  a.precio_base,
  ((20 + (r.id % 31))::INTEGER * a.precio_base)::DECIMAL(15,2)
FROM remitos r
INNER JOIN articulos a ON a.cliente_id = r.cliente_id
ORDER BY r.id;

-- Actualizar monto_pagado SOLO en remitos que están pagados
UPDATE remitos r
SET monto_pagado = COALESCE(
  (SELECT SUM(precio_total) FROM remito_articulos WHERE remito_id = r.id),
  0
)
WHERE EXISTS (SELECT 1 FROM remito_articulos WHERE remito_id = r.id)
  AND r.estado_pago = 'Pagado'; -- Solo actualizar monto_pagado para remitos pagados

-- Crear pagos SOLO para los remitos que están pagados
INSERT INTO pagos (remito_id, fecha, monto, observaciones)
SELECT 
  r.id,
  r.fecha, -- Pago el mismo día del remito
  r.monto_pagado, -- Monto completo igual al precio_total
  'Pago completo del remito ' || r.numero
FROM remitos r
WHERE r.estado_pago = 'Pagado' 
  AND r.monto_pagado > 0;

-- Actualizar estados de los remitos basándose en los pagos reales
-- Los triggers deberían actualizar automáticamente, pero ejecutamos la función para asegurar consistencia
-- NOTA: Esto se ejecuta DESPUÉS de crear los pagos para que los estados sean correctos
DO $$
DECLARE
  remito_record RECORD;
BEGIN
  -- Verificar si la función existe antes de usarla
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'recalcular_estado_remito') THEN
    FOR remito_record IN SELECT id FROM remitos ORDER BY id
    LOOP
      PERFORM recalcular_estado_remito(remito_record.id);
    END LOOP;
    RAISE NOTICE 'Estados de remitos recalculados correctamente.';
  ELSE
    RAISE NOTICE 'La función recalcular_estado_remito no existe. Los triggers actualizarán los estados automáticamente.';
  END IF;
END;
$$;

-- Verificar los datos creados
SELECT 
  'Clientes creados:' as tipo,
  COUNT(*)::TEXT as cantidad
FROM clientes

UNION ALL

SELECT 
  'Artículos creados:' as tipo,
  COUNT(*)::TEXT as cantidad
FROM articulos

UNION ALL

SELECT 
  'Remitos creados:' as tipo,
  COUNT(*)::TEXT as cantidad
FROM remitos

UNION ALL

SELECT 
  'Remito_Artículos creados:' as tipo,
  COUNT(*)::TEXT as cantidad
FROM remito_articulos

UNION ALL

SELECT 
  'Pagos creados:' as tipo,
  COUNT(*)::TEXT as cantidad
FROM pagos;
