-- Migración para aumentar la precisión del campo monto en pagos
-- Esto permite valores hasta 999.999.999.999,99 (12 dígitos, 2 decimales)
-- Ejecutar en SQL Editor de Supabase

-- Cambiar la precisión del campo monto en pagos
ALTER TABLE pagos 
ALTER COLUMN monto TYPE DECIMAL(15, 2);

-- También aumentar la precisión en remitos para monto_pagado
ALTER TABLE remitos 
ALTER COLUMN monto_pagado TYPE DECIMAL(15, 2);

-- Aumentar la precisión en remito_articulos para los campos de precio
ALTER TABLE remito_articulos 
ALTER COLUMN precio_unitario TYPE DECIMAL(15, 2),
ALTER COLUMN precio_total TYPE DECIMAL(15, 2);

-- Aumentar la precisión en articulos para precio_base
ALTER TABLE articulos 
ALTER COLUMN precio_base TYPE DECIMAL(15, 2);

-- Verificar los cambios
SELECT 
    table_name, 
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale
FROM information_schema.columns 
WHERE table_name IN ('pagos', 'remitos', 'remito_articulos', 'articulos')
  AND column_name IN ('monto', 'monto_pagado', 'precio_unitario', 'precio_total', 'precio_base')
ORDER BY table_name, column_name;

