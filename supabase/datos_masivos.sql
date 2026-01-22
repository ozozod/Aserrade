-- Script para cargar datos masivos de prueba
-- 200 clientes, 1000 remitos, pagos variados
-- Ejecutar en Supabase SQL Editor

DO $$
DECLARE
  -- Variables para clientes
  cliente_ids INTEGER[] := ARRAY[]::INTEGER[];
  cliente_id INTEGER;
  
  -- Variables para artículos
  articulo_estandar_id INTEGER;
  articulo_grande_id INTEGER;
  articulo_premium_id INTEGER;
  articulo_exportacion_id INTEGER;
  
  -- Variables para remitos
  remito_id INTEGER;
  remito_counter INTEGER := 1;
  fecha_base DATE := CURRENT_DATE - INTERVAL '180 days';
  fecha_actual DATE;
  cliente_idx INTEGER;
  articulo_idx INTEGER;
  cantidad_articulos INTEGER;
  articulo_id INTEGER;
  cantidad DECIMAL(10,2);
  precio_unitario DECIMAL(10,2);
  precio_total_articulo DECIMAL(10,2);
  precio_total_remito DECIMAL(10,2);
  monto_pagado_var DECIMAL(10,2);
  estado_pago VARCHAR(50);
  
  -- Variables para pagos
  pago_id INTEGER;
  cantidad_pagos INTEGER;
  monto_restante DECIMAL(10,2);
  monto_pago_parcial DECIMAL(10,2);
  fecha_pago DATE;
  
  -- Precios base de artículos
  precio_estandar DECIMAL(10,2) := 1500;
  precio_grande DECIMAL(10,2) := 2500;
  precio_premium DECIMAL(10,2) := 3200;
  precio_exportacion DECIMAL(10,2) := 4500;
  
BEGIN
  -- PASO 1: Eliminar todos los datos existentes
  DELETE FROM pagos;
  DELETE FROM remito_articulos;
  DELETE FROM remitos;
  DELETE FROM articulos;
  DELETE FROM clientes;
  
  RAISE NOTICE 'Datos anteriores eliminados';
  
  -- PASO 2: Insertar artículos
  INSERT INTO articulos (nombre, descripcion, precio_base, activo) VALUES
    ('Cajón Estándar', 'Cajón de madera estándar para frutas y verduras', precio_estandar, true),
    ('Cajón Grande', 'Cajón de mayor capacidad para exportación', precio_grande, true),
    ('Cajón Premium', 'Cajón de alta calidad con tratamiento especial', precio_premium, true),
    ('Cajón Exportación', 'Cajón certificado para exportación', precio_exportacion, true)
  ON CONFLICT (nombre) DO NOTHING;
  
  -- Obtener los IDs de los artículos insertados
  SELECT id INTO articulo_estandar_id FROM articulos WHERE nombre = 'Cajón Estándar' LIMIT 1;
  SELECT id INTO articulo_grande_id FROM articulos WHERE nombre = 'Cajón Grande' LIMIT 1;
  SELECT id INTO articulo_premium_id FROM articulos WHERE nombre = 'Cajón Premium' LIMIT 1;
  SELECT id INTO articulo_exportacion_id FROM articulos WHERE nombre = 'Cajón Exportación' LIMIT 1;
  
  RAISE NOTICE 'Artículos insertados';
  
  -- PASO 3: Insertar 200 clientes
  FOR i IN 1..200 LOOP
    INSERT INTO clientes (nombre, telefono, direccion, email, observaciones)
    VALUES (
      CASE (i % 10)
        WHEN 0 THEN 'Supermercado ' || LPAD(i::TEXT, 3, '0') || ' S.A.'
        WHEN 1 THEN 'Distribuidora ' || LPAD(i::TEXT, 3, '0') || ' S.R.L.'
        WHEN 2 THEN 'Frutas y Verduras ' || LPAD(i::TEXT, 3, '0')
        WHEN 3 THEN 'Exportadora ' || LPAD(i::TEXT, 3, '0') || ' S.A.'
        WHEN 4 THEN 'Comercial ' || LPAD(i::TEXT, 3, '0') || ' Ltda.'
        WHEN 5 THEN 'Empresa ' || LPAD(i::TEXT, 3, '0') || ' S.A.'
        WHEN 6 THEN 'Negocio ' || LPAD(i::TEXT, 3, '0') || ' S.R.L.'
        WHEN 7 THEN 'Mayorista ' || LPAD(i::TEXT, 3, '0')
        WHEN 8 THEN 'Almacén ' || LPAD(i::TEXT, 3, '0') || ' S.A.'
        ELSE 'Comercio ' || LPAD(i::TEXT, 3, '0')
      END,
      '+54 11 ' || LPAD((3000 + i * 7)::TEXT, 8, '0'),
      'Calle ' || (i * 10) || ', Barrio ' || (i % 20 + 1) || ', CABA',
      'cliente' || LPAD(i::TEXT, 3, '0') || '@email.com',
      CASE WHEN i % 5 = 0 THEN 'Cliente frecuente' ELSE NULL END
    )
    RETURNING id INTO cliente_id;
    
    cliente_ids := array_append(cliente_ids, cliente_id);
  END LOOP;
  
  RAISE NOTICE '200 clientes insertados';
  
  -- PASO 4: Insertar 1000 remitos distribuidos en los últimos 180 días
  FOR i IN 1..1000 LOOP
    -- Seleccionar cliente aleatorio
    cliente_idx := (i % 200) + 1;
    cliente_id := cliente_ids[cliente_idx];
    
    -- Fecha aleatoria en los últimos 180 días (más recientes más probables)
    fecha_actual := fecha_base + (random() * (CURRENT_DATE - fecha_base))::INTEGER;
    
    -- Determinar estado de pago (70% pendiente, 20% pagado, 10% parcial)
    IF (i % 10) IN (0, 1) THEN
      estado_pago := 'Pagado';
    ELSIF (i % 10) = 2 THEN
      estado_pago := 'Pago Parcial';
    ELSE
      estado_pago := 'Pendiente';
    END IF;
    
    -- Insertar remito
    INSERT INTO remitos (cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones)
    VALUES (
      cliente_id,
      fecha_actual,
      'REM-' || LPAD(remito_counter::TEXT, 6, '0'),
      estado_pago,
      0,
      CASE 
        WHEN i % 20 = 0 THEN 'Pedido urgente'
        WHEN i % 15 = 0 THEN 'Entrega programada'
        ELSE NULL
      END
    )
    RETURNING id INTO remito_id;
    
    remito_counter := remito_counter + 1;
    
    -- Insertar 1 a 4 artículos por remito
    cantidad_articulos := (i % 4) + 1;
    precio_total_remito := 0;
    
    FOR j IN 1..cantidad_articulos LOOP
      -- Seleccionar artículo (pesado hacia estándar y grande)
      articulo_idx := (i + j) % 10;
      IF articulo_idx < 5 THEN
        articulo_id := articulo_estandar_id;
        precio_unitario := precio_estandar + (random() * 200);
      ELSIF articulo_idx < 7 THEN
        articulo_id := articulo_grande_id;
        precio_unitario := precio_grande + (random() * 300);
      ELSIF articulo_idx < 9 THEN
        articulo_id := articulo_premium_id;
        precio_unitario := precio_premium + (random() * 400);
      ELSE
        articulo_id := articulo_exportacion_id;
        precio_unitario := precio_exportacion + (random() * 500);
      END IF;
      
      -- Cantidad aleatoria entre 50 y 5000
      cantidad := 50 + (random() * 4950);
      
      -- Precio unitario variado (±20% del precio base)
      precio_total_articulo := cantidad * precio_unitario;
      precio_total_remito := precio_total_remito + precio_total_articulo;
      
      -- Insertar artículo del remito
      INSERT INTO remito_articulos (remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total)
      VALUES (
        remito_id,
        articulo_id,
        (SELECT nombre FROM articulos WHERE id = articulo_id LIMIT 1),
        cantidad,
        precio_unitario,
        precio_total_articulo
      );
    END LOOP;
    
    -- Determinar monto pagado según estado
    IF estado_pago = 'Pagado' THEN
      monto_pagado_var := precio_total_remito;
    ELSIF estado_pago = 'Pago Parcial' THEN
      -- Pago parcial entre 30% y 70%
      monto_pagado_var := precio_total_remito * (0.3 + random() * 0.4);
    ELSE
      monto_pagado_var := 0;
    END IF;
    
    -- Actualizar remito con monto pagado y recalcular estado si es necesario
    -- Renombrar variable local para evitar ambigüedad
    UPDATE remitos 
    SET monto_pagado = monto_pagado_var,
        estado_pago = CASE
          WHEN monto_pagado_var >= precio_total_remito THEN 'Pagado'
          WHEN monto_pagado_var > 0 THEN 'Pago Parcial'
          ELSE 'Pendiente'
        END
    WHERE id = remito_id;
    
    -- Insertar pagos si el remito tiene pagos
    IF monto_pagado_var > 0 THEN
      monto_restante := monto_pagado_var;
      cantidad_pagos := (i % 3) + 1; -- Entre 1 y 3 pagos
      
      -- Crear pagos para el remito
      FOR k IN 1..cantidad_pagos LOOP
        -- Si es el último pago, pagar el resto. Si no, pagar una parte
        IF k = cantidad_pagos THEN
          -- Último pago: pagar todo lo que queda
          fecha_pago := fecha_actual + (random() * (CURRENT_DATE - fecha_actual))::INTEGER;
          
          INSERT INTO pagos (remito_id, fecha, monto, observaciones)
          VALUES (
            remito_id,
            fecha_pago,
            monto_restante,
            'Remito ' || (SELECT numero FROM remitos WHERE id = remito_id LIMIT 1)
          );
        ELSE
          -- Pagos anteriores: pagar una fracción (30-60% del resto)
          fecha_pago := fecha_actual + (random() * (CURRENT_DATE - fecha_actual))::INTEGER;
          monto_pago_parcial := monto_restante * (0.3 + random() * 0.3);
          
          INSERT INTO pagos (remito_id, fecha, monto, observaciones)
          VALUES (
            remito_id,
            fecha_pago,
            monto_pago_parcial,
            'Remito ' || (SELECT numero FROM remitos WHERE id = remito_id LIMIT 1)
          );
          
          monto_restante := monto_restante - monto_pago_parcial;
        END IF;
      END LOOP;
    END IF;
    
    -- Mostrar progreso cada 100 remitos
    IF i % 100 = 0 THEN
      RAISE NOTICE 'Procesados % remitos de 1000', i;
    END IF;
  END LOOP;
  
  RAISE NOTICE '1000 remitos insertados con artículos y pagos';
  
  -- Resumen final
  RAISE NOTICE '=== RESUMEN DE DATOS INSERTADOS ===';
  RAISE NOTICE 'Clientes: %', (SELECT COUNT(*) FROM clientes);
  RAISE NOTICE 'Artículos: %', (SELECT COUNT(*) FROM articulos);
  RAISE NOTICE 'Remitos: %', (SELECT COUNT(*) FROM remitos);
  RAISE NOTICE 'Remito Artículos: %', (SELECT COUNT(*) FROM remito_articulos);
  RAISE NOTICE 'Pagos: %', (SELECT COUNT(*) FROM pagos);
  RAISE NOTICE 'Remitos Pendientes: %', (SELECT COUNT(*) FROM remitos WHERE remitos.estado_pago = 'Pendiente');
  RAISE NOTICE 'Remitos Pagados: %', (SELECT COUNT(*) FROM remitos WHERE remitos.estado_pago = 'Pagado');
  RAISE NOTICE 'Remitos Parciales: %', (SELECT COUNT(*) FROM remitos WHERE remitos.estado_pago = 'Pago Parcial');
  
END $$;

