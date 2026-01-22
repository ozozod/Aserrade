-- Datos de prueba con saldos superiores al millón
-- Ejecutar en Supabase SQL Editor después de eliminar todos los datos

DO $$
DECLARE
  cliente_empresa_a_id INTEGER;
  cliente_empresa_b_id INTEGER;
  cliente_empresa_c_id INTEGER;
  cliente_empresa_d_id INTEGER;
  
  remito_1_id INTEGER;
  remito_2_id INTEGER;
  remito_3_id INTEGER;
  remito_4_id INTEGER;
  remito_5_id INTEGER;
  remito_6_id INTEGER;
  remito_7_id INTEGER;
  remito_8_id INTEGER;
  remito_9_id INTEGER;
  remito_10_id INTEGER;
  
  articulo_cajon_estandar_id INTEGER;
  articulo_cajon_grande_id INTEGER;
  articulo_cajon_premium_id INTEGER;
  articulo_cajon_exportacion_id INTEGER;
BEGIN
  -- Insertar artículos
  INSERT INTO articulos (nombre, descripcion, precio_base, activo)
  VALUES 
    ('Cajón Estándar', 'Cajón de madera estándar para frutas y verduras', 1500.00, true),
    ('Cajón Grande', 'Cajón de mayor capacidad para exportación', 2500.00, true),
    ('Cajón Premium', 'Cajón de alta calidad con tratamiento especial', 3200.00, true),
    ('Cajón Exportación', 'Cajón certificado para exportación', 4500.00, true)
  ON CONFLICT (nombre) DO NOTHING;
  
  -- Obtener IDs de artículos
  SELECT id INTO articulo_cajon_estandar_id FROM articulos WHERE nombre = 'Cajón Estándar';
  SELECT id INTO articulo_cajon_grande_id FROM articulos WHERE nombre = 'Cajón Grande';
  SELECT id INTO articulo_cajon_premium_id FROM articulos WHERE nombre = 'Cajón Premium';
  SELECT id INTO articulo_cajon_exportacion_id FROM articulos WHERE nombre = 'Cajón Exportación';
  
  -- Insertar clientes
  INSERT INTO clientes (nombre, telefono, direccion, email, observaciones)
  VALUES 
    ('Empresa Distribuidora S.A.', '0351-4567890', 'Av. Libertador 1500, Córdoba', 'contacto@distribuidora.com.ar', 'Cliente principal con grandes volúmenes'),
    ('Frutas y Verduras del Sur S.R.L.', '0299-1234567', 'Ruta 5 Km 120, Neuquén', 'ventas@frutasdelsur.com', 'Cliente con pedidos mensuales grandes'),
    ('Exportadora Patagónica', '0280-9876543', 'Puerto Madryn, Chubut', 'info@exportadorapatagonica.com', 'Cliente exportador'),
    ('Supermercados Unidos', '011-4567890', 'Av. Corrientes 2500, Buenos Aires', 'compras@superunidos.com', 'Cadena de supermercados');
  
  -- Obtener IDs de clientes
  SELECT id INTO cliente_empresa_a_id FROM clientes WHERE nombre = 'Empresa Distribuidora S.A.';
  SELECT id INTO cliente_empresa_b_id FROM clientes WHERE nombre = 'Frutas y Verduras del Sur S.R.L.';
  SELECT id INTO cliente_empresa_c_id FROM clientes WHERE nombre = 'Exportadora Patagónica';
  SELECT id INTO cliente_empresa_d_id FROM clientes WHERE nombre = 'Supermercados Unidos';
  
  -- Insertar remitos con valores superiores al millón
  
  -- Cliente A - Remitos con saldos pendientes grandes
  INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones)
  VALUES (cliente_empresa_a_id, '2024-11-15', 'REM-1001', 'Pendiente', 0, 'Pedido grande pendiente de pago')
  RETURNING id INTO remito_1_id;
  
  INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total)
  VALUES 
    (remito_1_id, articulo_cajon_estandar_id, 'Cajón Estándar', 500, 1500.00, 750000.00),
    (remito_1_id, articulo_cajon_grande_id, 'Cajón Grande', 200, 2500.00, 500000.00);
  
  INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones)
  VALUES (cliente_empresa_a_id, '2024-11-10', 'REM-1002', 'Pago Parcial', 500000.00, 'Pago parcial realizado')
  RETURNING id INTO remito_2_id;
  
  INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total)
  VALUES 
    (remito_2_id, articulo_cajon_premium_id, 'Cajón Premium', 400, 3200.00, 1280000.00);
  
  INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones)
  VALUES (cliente_empresa_a_id, '2024-11-05', 'REM-1003', 'Pagado', 2500000.00, 'Pago completo')
  RETURNING id INTO remito_3_id;
  
  INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total)
  VALUES 
    (remito_3_id, articulo_cajon_exportacion_id, 'Cajón Exportación', 500, 4500.00, 2250000.00),
    (remito_3_id, articulo_cajon_grande_id, 'Cajón Grande', 100, 2500.00, 250000.00);
  
  -- Cliente B - Remitos con valores muy altos
  INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones)
  VALUES (cliente_empresa_b_id, '2024-11-20', 'REM-2001', 'Pendiente', 0, 'Pedido masivo pendiente')
  RETURNING id INTO remito_4_id;
  
  INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total)
  VALUES 
    (remito_4_id, articulo_cajon_estandar_id, 'Cajón Estándar', 800, 1500.00, 1200000.00),
    (remito_4_id, articulo_cajon_grande_id, 'Cajón Grande', 300, 2500.00, 750000.00),
    (remito_4_id, articulo_cajon_premium_id, 'Cajón Premium', 200, 3200.00, 640000.00);
  
  INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones)
  VALUES (cliente_empresa_b_id, '2024-11-12', 'REM-2002', 'Pago Parcial', 1000000.00, 'Primera cuota pagada')
  RETURNING id INTO remito_5_id;
  
  INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total)
  VALUES 
    (remito_5_id, articulo_cajon_exportacion_id, 'Cajón Exportación', 600, 4500.00, 2700000.00);
  
  INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones)
  VALUES (cliente_empresa_b_id, '2024-11-01', 'REM-2003', 'Pagado', 3500000.00, 'Pago completo')
  RETURNING id INTO remito_6_id;
  
  INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total)
  VALUES 
    (remito_6_id, articulo_cajon_estandar_id, 'Cajón Estándar', 1000, 1500.00, 1500000.00),
    (remito_6_id, articulo_cajon_grande_id, 'Cajón Grande', 500, 2500.00, 1250000.00),
    (remito_6_id, articulo_cajon_premium_id, 'Cajón Premium', 250, 3200.00, 800000.00);
  
  -- Cliente C - Exportadora con valores altos
  INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones)
  VALUES (cliente_empresa_c_id, '2024-11-18', 'REM-3001', 'Pendiente', 0, 'Pedido para exportación')
  RETURNING id INTO remito_7_id;
  
  INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total)
  VALUES 
    (remito_7_id, articulo_cajon_exportacion_id, 'Cajón Exportación', 800, 4500.00, 3600000.00);
  
  INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones)
  VALUES (cliente_empresa_c_id, '2024-11-08', 'REM-3002', 'Pago Parcial', 2000000.00, 'Pago parcial')
  RETURNING id INTO remito_8_id;
  
  INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total)
  VALUES 
    (remito_8_id, articulo_cajon_exportacion_id, 'Cajón Exportación', 1000, 4500.00, 4500000.00);
  
  -- Cliente D - Supermercados con pedidos grandes
  INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones)
  VALUES (cliente_empresa_d_id, '2024-11-22', 'REM-4001', 'Pendiente', 0, 'Pedido mensual')
  RETURNING id INTO remito_9_id;
  
  INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total)
  VALUES 
    (remito_9_id, articulo_cajon_estandar_id, 'Cajón Estándar', 1200, 1500.00, 1800000.00),
    (remito_9_id, articulo_cajon_grande_id, 'Cajón Grande', 400, 2500.00, 1000000.00);
  
  INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones)
  VALUES (cliente_empresa_d_id, '2024-11-03', 'REM-4002', 'Pagado', 4200000.00, 'Pago completo')
  RETURNING id INTO remito_10_id;
  
  INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total)
  VALUES 
    (remito_10_id, articulo_cajon_estandar_id, 'Cajón Estándar', 1500, 1500.00, 2250000.00),
    (remito_10_id, articulo_cajon_grande_id, 'Cajón Grande', 500, 2500.00, 1250000.00),
    (remito_10_id, articulo_cajon_premium_id, 'Cajón Premium', 200, 3200.00, 640000.00);
  
  -- Actualizar estados de remitos basados en pagos
  -- Calcular precio_total desde remito_articulos y actualizar estados
  UPDATE remitos r
  SET estado_pago = CASE
    WHEN r.monto_pagado >= COALESCE((
      SELECT SUM(precio_total) 
      FROM remito_articulos 
      WHERE remito_id = r.id
    ), 0) THEN 'Pagado'
    WHEN r.monto_pagado > 0 AND r.monto_pagado < COALESCE((
      SELECT SUM(precio_total) 
      FROM remito_articulos 
      WHERE remito_id = r.id
    ), 0) THEN 'Pago Parcial'
    ELSE 'Pendiente'
  END;
  
  -- Insertar algunos pagos para los remitos con pago parcial
  INSERT INTO pagos (remito_id, fecha, monto, observaciones)
  SELECT id, fecha, monto_pagado, 'Pago inicial registrado'
  FROM remitos
  WHERE monto_pagado > 0 AND estado_pago = 'Pago Parcial';
  
  RAISE NOTICE 'Datos de prueba insertados correctamente con valores superiores al millón';
END $$;

-- Verificar los datos insertados
SELECT 
  c.nombre as cliente,
  COUNT(DISTINCT r.id) as total_remitos,
  COALESCE(SUM(ra.precio_total), 0) as total_facturado,
  SUM(r.monto_pagado) as total_pagado,
  COALESCE(SUM(ra.precio_total), 0) - COALESCE(SUM(r.monto_pagado), 0) as total_pendiente
FROM clientes c
LEFT JOIN remitos r ON c.id = r.cliente_id
LEFT JOIN remito_articulos ra ON r.id = ra.remito_id
GROUP BY c.id, c.nombre
ORDER BY total_facturado DESC;

