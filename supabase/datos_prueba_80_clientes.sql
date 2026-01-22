-- =====================================================
-- SCRIPT DE DATOS DE PRUEBA: 80 CLIENTES + 20 REMITOS POR CLIENTE
-- =====================================================
-- Este script genera:
-- - ~80 clientes nuevos
-- - ~20 remitos por cliente distribuidos a lo largo del año 2025
-- - Artículos con precios entre $2.000 y $4.000 (enteros)
-- - Estados de pago realistas (algunos pagados, otros pendientes)
-- 
-- USO: Ejecutar en SQL Editor de Supabase
-- =====================================================

-- =====================================================
-- PASO 1: INSERTAR 80 CLIENTES
-- =====================================================
-- NOTA: Este script agrega 80 clientes nuevos. 
-- Si ya tienes clientes existentes, estos se agregarán al final.
-- El script identificará automáticamente los clientes nuevos.
WITH nombres_empresas AS (
  SELECT unnest(ARRAY[
    'Aserradero San Rafael', 'Maderas del Valle', 'Constructora Sur', 'Carpintería Los Alamos',
    'Fábrica Muebles Premium', 'Maderas Selectas Norte', 'Construcciones Modernas', 'Carpintería Artesanal',
    'Industrias Forestales', 'Maderas Finas SRL', 'Constructora Horizonte', 'Muebles Elegantes',
    'Aserradero Central', 'Maderas del Litoral', 'Construcciones Integrales', 'Carpintería Master',
    'Fábrica Industrial', 'Maderas Premium Plus', 'Constructora Elite', 'Muebles Tradicionales',
    'Aserradero Express', 'Maderas Nobles', 'Construcciones Profesionales', 'Carpintería Superior',
    'Industria Maderera SA', 'Maderas Especializadas', 'Constructora Avanzada', 'Muebles Contemporáneos',
    'Aserradero Pro', 'Maderas Importadas', 'Construcciones Urbanas', 'Carpintería Creativa',
    'Fábrica Artesanal', 'Maderas de Calidad', 'Constructora Moderna', 'Muebles Design',
    'Aserradero Plus', 'Maderas Laminadas', 'Construcciones Pro', 'Carpintería Deluxe',
    'Industria del Mueble', 'Maderas Engineered', 'Constructora Premium', 'Muebles Exclusivos',
    'Aserradero Max', 'Maderas Compuestas', 'Construcciones Bio', 'Carpintería Ecológica',
    'Fábrica Verde', 'Maderas Sustentables', 'Constructora Natural', 'Muebles Orgánicos',
    'Aserradero Eco', 'Maderas Renovables', 'Construcciones Sostenibles', 'Carpintería Bio',
    'Industria Verde', 'Maderas Recicladas', 'Constructora Ecosistemas', 'Muebles Sustentables',
    'Aserradero Green', 'Maderas Certificadas', 'Construcciones Eco', 'Carpintería Natural',
    'Fábrica Sostenible', 'Maderas Responsables', 'Constructora Ambiental', 'Muebles Eco-Friendly',
    'Aserradero Forest', 'Maderas Tropicales', 'Construcciones Exóticas', 'Carpintería Internacional',
    'Industria Global', 'Maderas Mundial', 'Constructora Universal', 'Muebles Global'
  ]) as nombre,
  ROW_NUMBER() OVER() as rn
)
INSERT INTO clientes (nombre, telefono, direccion, email, observaciones)
SELECT 
  nombre || ' S.A.',
  '+54 11 ' || LPAD((2000 + rn)::TEXT, 4, '0') || '-' || LPAD((3000 + rn)::TEXT, 4, '0'),
  'Calle ' || (100 + rn) || ', Barrio ' || ((rn % 15) + 1) || ', CABA',
  'cliente' || LPAD((100 + rn)::TEXT, 3, '0') || '@empresa.com',
  CASE 
    WHEN rn % 7 = 0 THEN 'Cliente Premium - Descuento especial aplicado'
    WHEN rn % 4 = 0 THEN 'Cliente mayorista - Descuentos por volumen'
    WHEN rn % 3 = 0 THEN 'Cliente frecuente - Buena relación comercial'
    ELSE 'Cliente estándar - Relación comercial normal'
  END
FROM nombres_empresas
WHERE rn <= 80;

-- =====================================================
-- PASO 2: INSERTAR ARTÍCULOS PARA CADA CLIENTE
-- =====================================================
-- Cada cliente tendrá 1-2 artículos con precios entre $2.000 y $4.000

-- Artículo principal para cada cliente
INSERT INTO articulos (nombre, descripcion, precio_base, cliente_id, medida, cabezal, costado, fondo, taco, esquinero, activo)
SELECT 
  'Caja Estándar Cliente ' || LPAD(c.id::TEXT, 3, '0'),
  'Caja estándar diseñada para ' || c.nombre || ' según especificaciones técnicas requeridas.',
  (2000 + (RANDOM() * 2000))::INTEGER, -- Entre 2000 y 4000 (enteros)
  c.id,
  -- Medidas variadas
  CASE 
    WHEN c.id % 4 = 0 THEN '30x30x20'
    WHEN c.id % 4 = 1 THEN '40x30x25'
    WHEN c.id % 4 = 2 THEN '50x40x30'
    ELSE '35x35x25'
  END,
  -- Cabezales variados
  CASE 
    WHEN c.id % 3 = 0 THEN '2 tablas de 21mm reforzadas'
    WHEN c.id % 3 = 1 THEN '3 tablas de 18mm estándar'
    ELSE '1 tabla de 25mm premium'
  END,
  CASE 
    WHEN c.id % 4 = 0 THEN '4 tablas de ' || (15 + (c.id % 8)) || 'mm'
    WHEN c.id % 4 = 1 THEN '3 listones clavados'
    WHEN c.id % 4 = 2 THEN '2 paneles laterales reforzados'
    ELSE '5 tablitas ensambladas'
  END,
  CASE 
    WHEN c.id % 3 = 0 THEN 'Fondo machimbrado'
    WHEN c.id % 3 = 1 THEN 'Base reforzada de 18mm'
    ELSE 'Fondo calado'
  END,
  CASE 
    WHEN c.id % 5 = 0 THEN 'Con tacos de 15mm'
    WHEN c.id % 5 = 1 THEN 'Tacos reforzados de 20mm'
    WHEN c.id % 5 = 2 THEN 'Sin tacos'
    ELSE 'Tacos opcionales de 12mm'
  END,
  CASE 
    WHEN c.id % 6 = 0 THEN 'Esquineros metálicos'
    WHEN c.id % 6 = 1 THEN 'Refuerzos de madera'
    WHEN c.id % 6 = 2 THEN 'Refuerzos de acero'
    ELSE 'Sin refuerzos'
  END,
  true
FROM clientes c
WHERE c.id >= (SELECT COALESCE(MAX(id) - 79, 1) FROM clientes);

-- Segundo artículo para algunos clientes (clientes pares)
INSERT INTO articulos (nombre, descripcion, precio_base, cliente_id, medida, cabezal, costado, fondo, taco, esquinero, activo)
SELECT 
  'Caja Especial Cliente ' || LPAD(c.id::TEXT, 3, '0') || '-B',
  'Segunda caja personalizada para ' || c.nombre || ' con medidas especiales.',
  (2000 + (RANDOM() * 2000))::INTEGER, -- Entre 2000 y 4000
  c.id,
  CASE 
    WHEN c.id % 3 = 0 THEN '25x25x18'
    WHEN c.id % 3 = 1 THEN '35x30x22'
    ELSE '45x35x28'
  END,
  '2 tablas de 18mm',
  '3 laterales básicos',
  'Fondo estándar',
  'Sin tacos',
  'Esquinas normales',
  true
FROM clientes c
WHERE c.id > (SELECT COALESCE(MAX(id) - 80, 0) FROM clientes)
  AND c.id % 2 = 0; -- Solo clientes pares tienen segundo artículo

-- =====================================================
-- PASO 3: GENERAR ~20 REMITOS POR CLIENTE A LO LARGO DEL AÑO
-- =====================================================
-- Distribuir los remitos a lo largo del año 2025

WITH clientes_nuevos AS (
  SELECT id, nombre
  FROM clientes
  WHERE id >= (SELECT COALESCE(MAX(id) - 79, 1) FROM clientes)
),
fechas_2025 AS (
  -- Generar todas las fechas del año 2025
  SELECT 
    ('2025-01-01'::DATE + (dia - 1))::DATE as fecha,
    ROW_NUMBER() OVER() as fecha_num
  FROM generate_series(1, 365) as dia
  WHERE ('2025-01-01'::DATE + (dia - 1)) <= '2025-12-31'::DATE
),
remitos_por_cliente AS (
  SELECT 
    c.id as cliente_id,
    c.nombre as cliente_nombre,
    -- Cada cliente tiene ~20 remitos distribuidos a lo largo del año
    gs.num as remito_num,
    -- Distribuir fechas aleatoriamente pero distribuidas a lo largo del año
    (SELECT fecha FROM fechas_2025 
     WHERE fecha_num = ((c.id * 23 + gs.num * 7) % 365 + 1)) as fecha_remito
  FROM clientes_nuevos c
  CROSS JOIN generate_series(1, (15 + (c.id % 10))) as gs(num) -- Entre 15 y 24 remitos
)
INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones)
SELECT 
  cliente_id,
  fecha_remito,
  'REM-' || LPAD((ROW_NUMBER() OVER (ORDER BY cliente_id, fecha_remito))::TEXT, 7, '0'),
  'Pendiente', -- Inicialmente todos pendientes, se actualizará después
  0,
  'Remito generado automáticamente para ' || cliente_nombre
FROM remitos_por_cliente;

-- =====================================================
-- PASO 4: INSERTAR ARTÍCULOS EN REMITOS
-- =====================================================
-- Cada remito tiene 1-2 artículos del cliente con cantidades que generen totales realistas

WITH remitos_nuevos AS (
  SELECT 
    r.id as remito_id,
    r.cliente_id,
    r.fecha,
    ROW_NUMBER() OVER (PARTITION BY r.cliente_id ORDER BY r.fecha) as orden_remito
  FROM remitos r
  WHERE r.cliente_id >= (SELECT COALESCE(MAX(id) - 79, 1) FROM clientes)
),
remitos_con_articulos AS (
  SELECT 
    rn.remito_id,
    rn.cliente_id,
    -- Seleccionar artículo del cliente (alternando entre el primero y segundo si tiene)
    COALESCE(
      (SELECT id FROM articulos 
       WHERE cliente_id = rn.cliente_id AND activo = true 
       ORDER BY id OFFSET ((rn.orden_remito % 2)) LIMIT 1),
      (SELECT id FROM articulos 
       WHERE cliente_id = rn.cliente_id AND activo = true 
       LIMIT 1)
    ) as articulo_id,
    -- Cantidad entre 500 y 1000 para generar remitos de 1M-4M (con precios 2000-4000)
    (500 + (RANDOM() * 500))::INTEGER as cantidad,
    -- Precio unitario entre 2000 y 4000 (enteros)
    (2000 + (RANDOM() * 2000))::INTEGER as precio_unitario_calculado
  FROM remitos_nuevos rn
  WHERE EXISTS (SELECT 1 FROM articulos WHERE cliente_id = rn.cliente_id AND activo = true)
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

-- =====================================================
-- PASO 5: GENERAR ESTADOS DE PAGO REALISTAS
-- =====================================================
-- Distribuir pagos: algunos completos, algunos parciales, algunos pendientes

WITH remitos_con_totales AS (
  SELECT 
    r.id, 
    r.cliente_id, 
    r.fecha,
    COALESCE((SELECT SUM(ra.precio_total) FROM remito_articulos ra WHERE ra.remito_id = r.id), 0) as precio_total_calculado,
    ROW_NUMBER() OVER (PARTITION BY r.cliente_id ORDER BY r.fecha) as orden_cliente,
    COUNT(*) OVER (PARTITION BY r.cliente_id) as total_remitos_cliente
  FROM remitos r
  WHERE r.id > (SELECT COALESCE(MAX(id) - (80 * 20), 0) FROM remitos)
)
UPDATE remitos 
SET 
  estado_pago = CASE
    -- 35% pagados completos (remitos más antiguos)
    WHEN rct.orden_cliente <= (rct.total_remitos_cliente * 0.35) THEN 'Pagado'
    -- 30% pagos parciales  
    WHEN rct.orden_cliente <= (rct.total_remitos_cliente * 0.65) THEN 'Parcial'
    -- 35% pendientes (remitos más nuevos)
    ELSE 'Pendiente'
  END,
  monto_pagado = CASE
    -- Pagados completos: monto total (enteros)
    WHEN rct.orden_cliente <= (rct.total_remitos_cliente * 0.35) THEN rct.precio_total_calculado
    -- Pagos parciales: 30-70% del total (enteros)
    WHEN rct.orden_cliente <= (rct.total_remitos_cliente * 0.65) THEN 
      (rct.precio_total_calculado * (0.3 + (RANDOM() * 0.4)))::INTEGER
    -- Pendientes: $0
    ELSE 0
  END
FROM remitos_con_totales rct
WHERE remitos.id = rct.id;

-- =====================================================
-- PASO 6: CREAR PAGOS PARA REMITOS PAGADOS Y PARCIALES
-- =====================================================
INSERT INTO pagos (remito_id, fecha, monto, observaciones)
SELECT 
  r.id,
  r.fecha + INTERVAL '1 day' * (1 + (RANDOM() * 20))::INTEGER, -- Pagos 1-20 días después del remito
  r.monto_pagado,
  CASE 
    WHEN r.estado_pago = 'Pagado' THEN 'Pago completo del remito - Transferencia bancaria'
    WHEN r.estado_pago = 'Parcial' THEN 'Pago parcial - Saldo pendiente a definir'
    ELSE 'Sin pagos registrados'
  END
FROM remitos r
WHERE r.cliente_id >= (SELECT COALESCE(MAX(id) - 79, 1) FROM clientes)
  AND r.estado_pago IN ('Pagado', 'Parcial') 
  AND r.monto_pagado > 0;

-- =====================================================
-- PASO 7: ESTADÍSTICAS FINALES
-- =====================================================
DO $$
DECLARE
  total_clientes INTEGER;
  total_articulos INTEGER;
  total_remitos INTEGER;
  total_pagos INTEGER;
  total_facturado NUMERIC;
  total_pagado NUMERIC;
  total_pendiente NUMERIC;
  clientes_nuevos INTEGER;
  remitos_nuevos INTEGER;
BEGIN
  -- Totales generales
  SELECT COUNT(*) INTO total_clientes FROM clientes;
  SELECT COUNT(*) INTO total_articulos FROM articulos;
  SELECT COUNT(*) INTO total_remitos FROM remitos;
  SELECT COUNT(*) INTO total_pagos FROM pagos;
  
  -- Totales de los nuevos datos (últimos 80 clientes agregados)
  SELECT COUNT(*) INTO clientes_nuevos 
  FROM clientes 
  WHERE id >= (SELECT COALESCE(MAX(id) - 79, 1) FROM clientes);
  
  SELECT COUNT(*) INTO remitos_nuevos 
  FROM remitos 
  WHERE cliente_id >= (SELECT COALESCE(MAX(id) - 79, 1) FROM clientes);
  
  -- Calcular total facturado desde remito_articulos
  SELECT COALESCE(SUM(precio_total), 0) INTO total_facturado FROM remito_articulos;
  SELECT COALESCE(SUM(monto_pagado), 0) INTO total_pagado FROM remitos;
  SELECT total_facturado - total_pagado INTO total_pendiente;
  
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ DATOS GENERADOS EXITOSAMENTE';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 ESTADÍSTICAS GENERALES:';
  RAISE NOTICE '   Clientes totales: %', total_clientes;
  RAISE NOTICE '   Artículos totales: %', total_articulos;
  RAISE NOTICE '   Remitos totales: %', total_remitos;
  RAISE NOTICE '   Pagos totales: %', total_pagos;
  RAISE NOTICE '';
  RAISE NOTICE '📈 DATOS NUEVOS AGREGADOS:';
  RAISE NOTICE '   Clientes nuevos: %', clientes_nuevos;
  RAISE NOTICE '   Remitos nuevos: ~%', remitos_nuevos;
  RAISE NOTICE '';
  RAISE NOTICE '💰 FINANCIERO:';
  RAISE NOTICE '   Total Facturado: $%', to_char(total_facturado, 'FM999,999,999,999');
  RAISE NOTICE '   Total Pagado: $%', to_char(total_pagado, 'FM999,999,999,999');
  RAISE NOTICE '   Total Pendiente: $%', to_char(total_pendiente, 'FM999,999,999,999');
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
END $$;

