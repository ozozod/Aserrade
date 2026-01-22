-- Script de datos de prueba realistas para Supabase
-- 60 clientes con artículos exclusivos y remitos de últimos 2 meses
-- Ejecutar en SQL Editor de Supabase

-- Limpiar datos existentes
DELETE FROM pagos;
DELETE FROM remito_articulos;
DELETE FROM remitos;
DELETE FROM articulos;
DELETE FROM clientes;

-- Reiniciar secuencias
ALTER SEQUENCE clientes_id_seq RESTART WITH 1;
ALTER SEQUENCE articulos_id_seq RESTART WITH 1;
ALTER SEQUENCE remitos_id_seq RESTART WITH 1;
ALTER SEQUENCE pagos_id_seq RESTART WITH 1;

-- Insertar 60 clientes
WITH nombres_empresas AS (
  SELECT unnest(ARRAY[
    'Constructora San Martín', 'Inmobiliaria Norte', 'Maderas del Oeste', 'Carpintería Central',
    'Fábrica de Muebles', 'Aserradero Industrial', 'Maderas Premium', 'Construcciones Sur',
    'Carpintería Moderna', 'Industrias del Norte', 'Maderas Selectas', 'Muebles Artesanales',
    'Constructora Metropolitana', 'Maderas Finas', 'Carpintería Tradicional', 'Fábrica Colonial',
    'Maderas Tropicales', 'Construcciones Elite', 'Carpintería Express', 'Maderas Nobles',
    'Industria Maderera', 'Constructora Profesional', 'Maderas Especiales', 'Fábrica Moderna',
    'Carpintería Industrial', 'Maderas del Sur', 'Construcciones Integrales', 'Muebles Design',
    'Maderas Macizas', 'Carpintería Creativa', 'Fábrica Tradicional', 'Maderas Exclusivas',
    'Constructora Avanzada', 'Industrias Madereras', 'Carpintería Superior', 'Maderas Importadas',
    'Construcciones Urbanas', 'Fábrica Artesanal', 'Maderas de Calidad', 'Carpintería Master',
    'Constructora Moderna', 'Maderas Laminadas', 'Industria del Mueble', 'Carpintería Plus',
    'Maderas Engineered', 'Construcciones Pro', 'Fábrica Contemporánea', 'Maderas Técnicas',
    'Carpintería Deluxe', 'Maderas Compuestas', 'Constructora Premium', 'Industrias Forestales',
    'Maderas Sustentables', 'Carpintería Ecológica', 'Fábrica Verde', 'Maderas Renovables',
    'Construcciones Bio', 'Carpintería Natural', 'Maderas Orgánicas', 'Industria Sostenible'
  ]) as nombre,
  ROW_NUMBER() OVER() as rn
)
INSERT INTO clientes (nombre, telefono, direccion, email, observaciones)
SELECT 
  nombre || ' S.A.',
  '+54 11 ' || LPAD((1000 + rn)::TEXT, 4, '0') || '-' || LPAD((2000 + rn)::TEXT, 4, '0'),
  'Calle ' || rn || ', Barrio ' || ((rn % 10) + 1) || ', CABA',
  'cliente' || LPAD(rn::TEXT, 3, '0') || '@empresa.com',
  CASE 
    WHEN rn % 5 = 0 THEN 'Cliente Premium - Descuento especial'
    WHEN rn % 3 = 0 THEN 'Cliente mayorista'
    ELSE 'Cliente estándar'
  END
FROM nombres_empresas
WHERE rn <= 60;

-- Insertar 1 artículo exclusivo por cliente  
INSERT INTO articulos (nombre, descripcion, precio_base, cliente_id, medida, cabezal, costado, fondo, taco, esquinero, activo)
SELECT 
  'Producto Exclusivo Cliente ' || LPAD(c.id::TEXT, 3, '0'),
  'Producto exclusivo diseñado para ' || c.nombre || ' según especificaciones técnicas requeridas.',
  (200 + (RANDOM() * 300))::INTEGER, -- Entre 200 y 500
  c.id,
  -- Medidas variadas
  CASE 
    WHEN c.id <= 10 THEN '20x20x15'
    WHEN c.id <= 20 THEN '30x20x15' 
    WHEN c.id <= 30 THEN '40x30x20'
    WHEN c.id <= 40 THEN '50x40x25'
    WHEN c.id <= 50 THEN '60x40x30'
    ELSE '25x25x18'
  END,
  -- Cabezales variados
  CASE 
    WHEN c.id <= 15 THEN '2 tablas de 21mm'
    WHEN c.id <= 30 THEN '3 tablas de 18mm'
    WHEN c.id <= 45 THEN '1 tabla de 25mm'
    ELSE '2 tablones reforzados'
  END,
  CASE 
    WHEN c.id % 4 = 0 THEN '4 tablas de ' || (15 + (c.id % 10)) || 'mm'
    WHEN c.id % 4 = 1 THEN '3 listones clavados'
    WHEN c.id % 4 = 2 THEN '2 paneles laterales'
    ELSE '5 tablitas ensambladas'
  END,
  CASE 
    WHEN c.id % 3 = 0 THEN 'Fondo machimbrado'
    WHEN c.id % 3 = 1 THEN 'Base reforzada'
    ELSE 'Fondo calado'
  END,
  CASE 
    WHEN c.id % 5 = 0 THEN 'Con tacos de 15mm'
    WHEN c.id % 5 = 1 THEN 'Tacos reforzados'
    WHEN c.id % 5 = 2 THEN 'Sin tacos'
    ELSE 'Tacos opcionales'
  END,
  CASE 
    WHEN c.id % 6 = 0 THEN 'Esquineros metálicos'
    WHEN c.id % 6 = 1 THEN 'Refuerzos de madera'
    ELSE 'Sin refuerzos'
  END,
  true
FROM clientes c;

-- Insertar segundo artículo para algunos clientes (clientes pares)
INSERT INTO articulos (nombre, descripcion, precio_base, cliente_id, medida, cabezal, costado, fondo, taco, esquinero, activo)
SELECT 
  'Producto Secundario Cliente ' || LPAD(c.id::TEXT, 3, '0') || '-B',
  'Segundo producto personalizado para ' || c.nombre || ' con diferentes especificaciones.',
  (150 + (RANDOM() * 250))::INTEGER, -- Entre 150 y 400
  c.id,
  CASE 
    WHEN c.id % 3 = 0 THEN '15x15x12'
    WHEN c.id % 3 = 1 THEN '25x20x15'
    ELSE '30x25x18'
  END,
  '1 tabla simple',
  '2 laterales básicos',
  'Fondo simple',
  'Sin tacos',
  'Esquinas normales',
  true
FROM clientes c
WHERE c.id % 2 = 0; -- Solo clientes pares tienen segundo artículo

-- Generar remitos para últimos 2 meses (octubre y noviembre 2025)
WITH fechas_remitos AS (
  -- Generar fechas de octubre y noviembre 2025
  SELECT 
    ('2025-10-' || LPAD(dia::TEXT, 2, '0'))::DATE as fecha,
    ROW_NUMBER() OVER() as fecha_num
  FROM generate_series(1, 31) as dia
  WHERE ('2025-10-' || LPAD(dia::TEXT, 2, '0'))::DATE <= '2025-10-31'
  
  UNION ALL
  
  SELECT 
    ('2025-11-' || LPAD(dia::TEXT, 2, '0'))::DATE as fecha,
    ROW_NUMBER() OVER() + 31 as fecha_num
  FROM generate_series(1, 30) as dia
  WHERE ('2025-11-' || LPAD(dia::TEXT, 2, '0'))::DATE <= '2025-11-30'
),
remitos_por_cliente AS (
  SELECT 
    c.id as cliente_id,
    c.nombre as cliente_nombre,
    -- Cada cliente tiene entre 2 y 7 remitos
    gs.num as remito_num,
    -- Distribuir fechas aleatoriamente
    (SELECT fecha FROM fechas_remitos WHERE fecha_num = ((c.id * 7 + gs.num) % 61 + 1)) as fecha_remito
  FROM clientes c
  CROSS JOIN generate_series(1, (2 + (c.id % 6))) as gs(num)
)
INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones)
SELECT 
  cliente_id,
  fecha_remito,
  'REM-' || LPAD(ROW_NUMBER() OVER (ORDER BY cliente_id, fecha_remito)::TEXT, 6, '0'),
  'Pendiente', -- Inicialmente todos pendientes
  0,
  'Remito generado automáticamente para ' || cliente_nombre
FROM remitos_por_cliente;

-- Insertar artículos en remitos (cada remito tiene 1 artículo del cliente)
WITH remitos_con_articulos AS (
  SELECT 
    r.id as remito_id,
    r.cliente_id,
    -- Seleccionar artículo del cliente (alternando entre el primero y segundo si tiene)
    COALESCE(
      (SELECT id FROM articulos WHERE cliente_id = r.cliente_id AND activo = true ORDER BY id OFFSET ((r.id % 2)) LIMIT 1),
      (SELECT id FROM articulos WHERE cliente_id = r.cliente_id AND activo = true LIMIT 1)
    ) as articulo_id,
    -- Cantidad aleatoria entre 100 y 500 para generar remitos de 2M-6M
    (100 + (RANDOM() * 400))::INTEGER as cantidad,
    ROUND(20000 + (RANDOM() * 40000))::INTEGER as precio_unitario_calculado
  FROM remitos r
  WHERE EXISTS (SELECT 1 FROM articulos WHERE cliente_id = r.cliente_id AND activo = true)
)
INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total)
SELECT 
  rca.remito_id,
  rca.articulo_id,
  a.nombre,
  rca.cantidad,
  rca.precio_unitario_calculado,
  rca.cantidad * rca.precio_unitario_calculado
FROM remitos_con_articulos rca
JOIN articulos a ON a.id = rca.articulo_id;

-- Los remitos en Supabase no tienen precio_total, se calcula dinámicamente desde remito_articulos
-- No necesitamos este UPDATE

-- Generar estados de pago realistas y pagos
WITH remitos_con_totales AS (
  SELECT 
    r.id, 
    r.cliente_id, 
    r.fecha,
    COALESCE((SELECT SUM(ra.precio_total) FROM remito_articulos ra WHERE ra.remito_id = r.id), 0) as precio_total_calculado,
    ROW_NUMBER() OVER (PARTITION BY r.cliente_id ORDER BY r.fecha) as orden_cliente,
    COUNT(*) OVER (PARTITION BY r.cliente_id) as total_remitos_cliente
  FROM remitos r
)
UPDATE remitos 
SET 
  estado_pago = CASE
    -- 40% pagados completos (remitos más antiguos)
    WHEN rct.orden_cliente <= (rct.total_remitos_cliente * 0.4) THEN 'Pagado'
    -- 30% pagos parciales  
    WHEN rct.orden_cliente <= (rct.total_remitos_cliente * 0.7) THEN 'Parcial'
    -- 30% pendientes (remitos más nuevos)
    ELSE 'Pendiente'
  END,
  monto_pagado = CASE
    -- Pagados completos: monto total
    WHEN rct.orden_cliente <= (rct.total_remitos_cliente * 0.4) THEN rct.precio_total_calculado
    -- Pagos parciales: 40-80% del total
    WHEN rct.orden_cliente <= (rct.total_remitos_cliente * 0.7) THEN (rct.precio_total_calculado * (0.4 + (RANDOM() * 0.4)))::NUMERIC(10,2)
    -- Pendientes: $0
    ELSE 0
  END
FROM remitos_con_totales rct
WHERE remitos.id = rct.id;

-- Crear pagos para remitos pagados y parciales
INSERT INTO pagos (remito_id, fecha, monto, observaciones)
SELECT 
  r.id,
  r.fecha + INTERVAL '1 day' * (1 + (RANDOM() * 15))::INTEGER, -- Pagos 1-15 días después del remito
  r.monto_pagado,
  CASE 
    WHEN r.estado_pago = 'Pagado' THEN 'Pago completo del remito'
    WHEN r.estado_pago = 'Parcial' THEN 'Pago parcial - Saldo pendiente'
    ELSE 'Sin pagos'
  END
FROM remitos r
WHERE r.estado_pago IN ('Pagado', 'Parcial') AND r.monto_pagado > 0;

-- Estadísticas finales
DO $$
DECLARE
  total_clientes INTEGER;
  total_articulos INTEGER;
  total_remitos INTEGER;
  total_pagos INTEGER;
  total_facturado NUMERIC;
  total_pagado NUMERIC;
  total_pendiente NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_clientes FROM clientes;
  SELECT COUNT(*) INTO total_articulos FROM articulos;
  SELECT COUNT(*) INTO total_remitos FROM remitos;
  SELECT COUNT(*) INTO total_pagos FROM pagos;
  -- Calcular total facturado desde remito_articulos (no desde remitos.precio_total)
  SELECT COALESCE(SUM(precio_total), 0) INTO total_facturado FROM remito_articulos;
  SELECT COALESCE(SUM(monto_pagado), 0) INTO total_pagado FROM remitos;
  SELECT total_facturado - total_pagado INTO total_pendiente;
  
  RAISE NOTICE 'DATOS GENERADOS EXITOSAMENTE:';
  RAISE NOTICE 'Clientes: %', total_clientes;
  RAISE NOTICE 'Artículos: %', total_articulos;
  RAISE NOTICE 'Remitos: %', total_remitos;
  RAISE NOTICE 'Pagos: %', total_pagos;
  RAISE NOTICE 'Total Facturado: $%', to_char(total_facturado, 'FM999,999,999,999');
  RAISE NOTICE 'Total Pagado: $%', to_char(total_pagado, 'FM999,999,999,999');
  RAISE NOTICE 'Total Pendiente: $%', to_char(total_pendiente, 'FM999,999,999,999');
END $$;
