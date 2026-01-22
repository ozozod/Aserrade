-- Datos de Prueba para Aserradero App
-- Ejecutar en SQL Editor de Supabase DESPUÉS de crear las tablas
-- IMPORTANTE: Si ya hay datos, elimínalos primero

-- ============ LIMPIAR DATOS EXISTENTES (OPCIONAL) ============
-- Descomenta estas líneas si quieres limpiar todo primero:
-- DELETE FROM pagos;
-- DELETE FROM remito_articulos;
-- DELETE FROM remitos;
-- DELETE FROM articulos;
-- DELETE FROM clientes;

-- ============ CLIENTES ============
-- Insertar clientes y obtener sus IDs reales
DO $$
DECLARE
  cliente_denis_id INTEGER;
  cliente_maria_id INTEGER;
  cliente_juan_id INTEGER;
  cliente_carlos_id INTEGER;
  cliente_ana_id INTEGER;
  cliente_luis_id INTEGER;
  cliente_sofia_id INTEGER;
  remito_id_var INTEGER;
BEGIN
  -- Insertar clientes
  INSERT INTO clientes (nombre, telefono, direccion, email, observaciones) 
  VALUES ('Denis Mercado', '351-1234567', 'Av. Principal 123, Córdoba', 'denis.mercado@email.com', 'Cliente frecuente, paga a término')
  RETURNING id INTO cliente_denis_id;
  
  INSERT INTO clientes (nombre, telefono, direccion, email, observaciones) 
  VALUES ('María González', '351-2345678', 'Calle San Martín 456', 'maria.gonzalez@email.com', 'Nuevo cliente')
  RETURNING id INTO cliente_maria_id;
  
  INSERT INTO clientes (nombre, telefono, direccion, email, observaciones) 
  VALUES ('Juan Pérez', '351-3456789', 'Ruta 9 km 15', 'juan.perez@email.com', 'Cliente mayorista')
  RETURNING id INTO cliente_juan_id;
  
  INSERT INTO clientes (nombre, telefono, direccion, email, observaciones) 
  VALUES ('Carlos Rodríguez', '351-4567890', 'Barrio Centro, Mza 789', 'carlos.rodriguez@email.com', 'Paga contado')
  RETURNING id INTO cliente_carlos_id;
  
  INSERT INTO clientes (nombre, telefono, direccion, email, observaciones) 
  VALUES ('Ana Martínez', '351-5678901', 'Zona Norte, Lote 12', 'ana.martinez@email.com', 'Cliente regular')
  RETURNING id INTO cliente_ana_id;
  
  INSERT INTO clientes (nombre, telefono, direccion, email, observaciones) 
  VALUES ('Luis Fernández', '351-6789012', 'Av. Libertador 321', 'luis.fernandez@email.com', NULL)
  RETURNING id INTO cliente_luis_id;
  
  INSERT INTO clientes (nombre, telefono, direccion, email, observaciones) 
  VALUES ('Sofía López', '351-7890123', 'Calle Belgrano 654', 'sofia.lopez@email.com', 'Cliente nuevo, buen pagador')
  RETURNING id INTO cliente_sofia_id;

  -- ============ ARTÍCULOS/PRODUCTOS ============
  -- Insertar artículos (los IDs se generan automáticamente)
  INSERT INTO articulos (nombre, descripcion, precio_base, activo) VALUES
  ('Cajón Estándar', 'Cajón de madera estándar para frutas y verduras', 1500.00, true),
  ('Cajón Pequeño', 'Cajón pequeño para productos específicos', 1200.00, true),
  ('Cajón Grande', 'Cajón grande para mayor volumen', 1800.00, true),
  ('Media Caja', 'Media caja estándar', 750.00, true),
  ('Cajón Premium', 'Cajón de mejor calidad', 2000.00, true),
  ('Cajón Exportación', 'Cajón especial para exportación', 2200.00, true)
  ON CONFLICT (nombre) DO NOTHING;

  -- ============ REMITOS ============
  -- Remito 1: Denis Mercado - Pendiente
  INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones) 
  VALUES (cliente_denis_id, '2024-11-15', 'REM-001', 'Pendiente', 0, 'Entrega urgente')
  RETURNING id INTO remito_id_var;
  
  INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
  SELECT remito_id_var, id, 'Cajón Estándar', 50, 1500.00, 75000.00 FROM articulos WHERE nombre = 'Cajón Estándar'
  UNION ALL
  SELECT remito_id_var, id, 'Cajón Pequeño', 20, 1200.00, 24000.00 FROM articulos WHERE nombre = 'Cajón Pequeño';

  -- Remito 2: María González - Pagado
    INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones) 
    VALUES (cliente_maria_id, '2024-11-16', 'REM-002', 'Pagado', 45000.00, 'Pago completo recibido')
    RETURNING id INTO remito_id_var;
    
    INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
    SELECT remito_id_var, id, 'Cajón Estándar', 30, 1500.00, 45000.00 FROM articulos WHERE nombre = 'Cajón Estándar';

  -- Remito 3: Juan Pérez - Pago Parcial
    INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones) 
    VALUES (cliente_juan_id, '2024-11-17', 'REM-003', 'Pago Parcial', 50000.00, 'Pendiente saldo')
    RETURNING id INTO remito_id_var;
    
    INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
    SELECT remito_id_var, id, 'Cajón Grande', 40, 1800.00, 72000.00 FROM articulos WHERE nombre = 'Cajón Grande'
    UNION ALL
    SELECT remito_id_var, id, 'Media Caja', 10, 750.00, 7500.00 FROM articulos WHERE nombre = 'Media Caja';

  -- Remito 4: Carlos Rodríguez - Pendiente
    INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones) 
    VALUES (cliente_carlos_id, '2024-11-18', 'REM-004', 'Pendiente', 0, NULL)
    RETURNING id INTO remito_id_var;
    
    INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
    SELECT remito_id_var, id, 'Cajón Estándar', 25, 1500.00, 37500.00 FROM articulos WHERE nombre = 'Cajón Estándar'
    UNION ALL
    SELECT remito_id_var, id, 'Cajón Premium', 15, 2000.00, 30000.00 FROM articulos WHERE nombre = 'Cajón Premium';

  -- Remito 5: Ana Martínez - Pagado
    INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones) 
    VALUES (cliente_ana_id, '2024-11-19', 'REM-005', 'Pagado', 24000.00, 'Pago al contado')
    RETURNING id INTO remito_id_var;
    
    INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
    SELECT remito_id_var, id, 'Cajón Pequeño', 20, 1200.00, 24000.00 FROM articulos WHERE nombre = 'Cajón Pequeño';

  -- Remito 6: Luis Fernández - Pago Parcial
    INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones) 
    VALUES (cliente_luis_id, '2024-11-19', 'REM-006', 'Pago Parcial', 15000.00, 'Primer pago recibido')
    RETURNING id INTO remito_id_var;
    
    INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
    SELECT remito_id_var, id, 'Cajón Estándar', 40, 1500.00, 60000.00 FROM articulos WHERE nombre = 'Cajón Estándar'
    UNION ALL
    SELECT remito_id_var, id, 'Cajón Grande', 10, 1800.00, 18000.00 FROM articulos WHERE nombre = 'Cajón Grande';

  -- ============ MÁS REMITOS PARA PROBAR ============
  -- Remito 7: Denis Mercado - Pendiente (segundo remito)
    INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones) 
    VALUES (cliente_denis_id, '2024-11-20', 'REM-007', 'Pendiente', 0, 'Segundo pedido del mes')
    RETURNING id INTO remito_id_var;
    
    INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
    SELECT remito_id_var, id, 'Cajón Estándar', 30, 1500.00, 45000.00 FROM articulos WHERE nombre = 'Cajón Estándar'
    UNION ALL
    SELECT remito_id_var, id, 'Cajón Premium', 10, 2000.00, 20000.00 FROM articulos WHERE nombre = 'Cajón Premium';

  -- Remito 8: Denis Mercado - Pago Parcial (tercer remito)
    INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones) 
    VALUES (cliente_denis_id, '2024-11-21', 'REM-008', 'Pago Parcial', 25000.00, 'Pago parcial recibido')
    RETURNING id INTO remito_id_var;
    
    INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
    SELECT remito_id_var, id, 'Cajón Pequeño', 25, 1200.00, 30000.00 FROM articulos WHERE nombre = 'Cajón Pequeño'
    UNION ALL
    SELECT remito_id_var, id, 'Media Caja', 20, 750.00, 15000.00 FROM articulos WHERE nombre = 'Media Caja';

  -- Remito 9: Denis Mercado - Pendiente (cuarto remito)
    INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones) 
    VALUES (cliente_denis_id, '2024-11-22', 'REM-009', 'Pendiente', 0, 'Pedido urgente')
    RETURNING id INTO remito_id_var;
    
    INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
    SELECT remito_id_var, id, 'Cajón Grande', 35, 1800.00, 63000.00 FROM articulos WHERE nombre = 'Cajón Grande'
    UNION ALL
    SELECT remito_id_var, id, 'Cajón Exportación', 5, 2200.00, 11000.00 FROM articulos WHERE nombre = 'Cajón Exportación';

  -- Remito 10: María González - Pendiente (segundo remito)
    INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones) 
    VALUES (cliente_maria_id, '2024-11-20', 'REM-010', 'Pendiente', 0, 'Nuevo pedido')
    RETURNING id INTO remito_id_var;
    
    INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
    SELECT remito_id_var, id, 'Cajón Estándar', 20, 1500.00, 30000.00 FROM articulos WHERE nombre = 'Cajón Estándar'
    UNION ALL
    SELECT remito_id_var, id, 'Cajón Pequeño', 15, 1200.00, 18000.00 FROM articulos WHERE nombre = 'Cajón Pequeño';

  -- Remito 11: María González - Pago Parcial (tercer remito)
    INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones) 
    VALUES (cliente_maria_id, '2024-11-21', 'REM-011', 'Pago Parcial', 20000.00, 'Pago parcial')
    RETURNING id INTO remito_id_var;
    
    INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
    SELECT remito_id_var, id, 'Cajón Grande', 25, 1800.00, 45000.00 FROM articulos WHERE nombre = 'Cajón Grande'
    UNION ALL
    SELECT remito_id_var, id, 'Cajón Premium', 8, 2000.00, 16000.00 FROM articulos WHERE nombre = 'Cajón Premium';

  -- Remito 12: Juan Pérez - Pendiente (segundo remito)
    INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones) 
    VALUES (cliente_juan_id, '2024-11-20', 'REM-012', 'Pendiente', 0, 'Pedido mayorista')
    RETURNING id INTO remito_id_var;
    
    INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
    SELECT remito_id_var, id, 'Cajón Estándar', 60, 1500.00, 90000.00 FROM articulos WHERE nombre = 'Cajón Estándar'
    UNION ALL
    SELECT remito_id_var, id, 'Cajón Grande', 20, 1800.00, 36000.00 FROM articulos WHERE nombre = 'Cajón Grande';

  -- Remito 13: Juan Pérez - Pendiente (tercer remito)
    INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones) 
    VALUES (cliente_juan_id, '2024-11-22', 'REM-013', 'Pendiente', 0, 'Pedido adicional')
    RETURNING id INTO remito_id_var;
    
    INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
    SELECT remito_id_var, id, 'Cajón Pequeño', 40, 1200.00, 48000.00 FROM articulos WHERE nombre = 'Cajón Pequeño'
    UNION ALL
    SELECT remito_id_var, id, 'Media Caja', 30, 750.00, 22500.00 FROM articulos WHERE nombre = 'Media Caja';

  -- Remito 14: Carlos Rodríguez - Pago Parcial (segundo remito)
    INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones) 
    VALUES (cliente_carlos_id, '2024-11-20', 'REM-014', 'Pago Parcial', 30000.00, 'Pago parcial recibido')
    RETURNING id INTO remito_id_var;
    
    INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
    SELECT remito_id_var, id, 'Cajón Estándar', 35, 1500.00, 52500.00 FROM articulos WHERE nombre = 'Cajón Estándar'
    UNION ALL
    SELECT remito_id_var, id, 'Cajón Premium', 12, 2000.00, 24000.00 FROM articulos WHERE nombre = 'Cajón Premium';

  -- Remito 15: Ana Martínez - Pendiente (segundo remito)
    INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones) 
    VALUES (cliente_ana_id, '2024-11-21', 'REM-015', 'Pendiente', 0, 'Nuevo pedido')
    RETURNING id INTO remito_id_var;
    
    INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
    SELECT remito_id_var, id, 'Cajón Pequeño', 30, 1200.00, 36000.00 FROM articulos WHERE nombre = 'Cajón Pequeño'
    UNION ALL
    SELECT remito_id_var, id, 'Media Caja', 25, 750.00, 18750.00 FROM articulos WHERE nombre = 'Media Caja';

  -- Remito 16: Luis Fernández - Pendiente (segundo remito)
    INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones) 
    VALUES (cliente_luis_id, '2024-11-20', 'REM-016', 'Pendiente', 0, 'Pedido nuevo')
    RETURNING id INTO remito_id_var;
    
    INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
    SELECT remito_id_var, id, 'Cajón Estándar', 50, 1500.00, 75000.00 FROM articulos WHERE nombre = 'Cajón Estándar'
    UNION ALL
    SELECT remito_id_var, id, 'Cajón Grande', 15, 1800.00, 27000.00 FROM articulos WHERE nombre = 'Cajón Grande';

  -- Remito 17: Luis Fernández - Pendiente (tercer remito)
    INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones) 
    VALUES (cliente_luis_id, '2024-11-22', 'REM-017', 'Pendiente', 0, 'Pedido adicional')
    RETURNING id INTO remito_id_var;
    
    INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total) 
    SELECT remito_id_var, id, 'Cajón Premium', 20, 2000.00, 40000.00 FROM articulos WHERE nombre = 'Cajón Premium'
    UNION ALL
    SELECT remito_id_var, id, 'Cajón Exportación', 10, 2200.00, 22000.00 FROM articulos WHERE nombre = 'Cajón Exportación';

END $$;

-- ============ PAGOS ============
-- Los pagos usan subconsultas para encontrar el remito por número
INSERT INTO pagos (remito_id, fecha, monto, observaciones) 
SELECT id, '2024-11-16', 45000.00, 'Pago completo al contado'
FROM remitos WHERE numero = 'REM-002';

INSERT INTO pagos (remito_id, fecha, monto, observaciones) 
SELECT id, '2024-11-17', 30000.00, 'Primer pago'
FROM remitos WHERE numero = 'REM-003';

INSERT INTO pagos (remito_id, fecha, monto, observaciones) 
SELECT id, '2024-11-18', 20000.00, 'Segundo pago'
FROM remitos WHERE numero = 'REM-003';

INSERT INTO pagos (remito_id, fecha, monto, observaciones) 
SELECT id, '2024-11-19', 24000.00, 'Pago completo'
FROM remitos WHERE numero = 'REM-005';

INSERT INTO pagos (remito_id, fecha, monto, observaciones) 
SELECT id, '2024-11-19', 15000.00, 'Primer pago, pendiente saldo'
FROM remitos WHERE numero = 'REM-006';

-- ============ VERIFICACIÓN ============
-- Puedes ejecutar estas consultas para verificar los datos:

-- SELECT COUNT(*) as total_clientes FROM clientes;
-- SELECT COUNT(*) as total_articulos FROM articulos;
-- SELECT COUNT(*) as total_remitos FROM remitos;
-- SELECT COUNT(*) as total_pagos FROM pagos;
