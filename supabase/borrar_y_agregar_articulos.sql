-- Script para borrar todos los artículos y agregar nuevos con características
-- Ejecutar en SQL Editor de Supabase

-- Borrar todos los artículos existentes
DELETE FROM articulos;

-- Resetear la secuencia del ID
ALTER SEQUENCE articulos_id_seq RESTART WITH 1;

-- Insertar nuevos artículos con características completas

-- TOMATERA CABEZAL MACIZO
INSERT INTO articulos (nombre, descripcion, precio_base, activo, medida, cabezal, costado, fondo, taco, esquinero, created_at, updated_at)
VALUES (
  'TOMATERA CABEZAL MACIZO',
  'Caja para tomates con cabezal macizo',
  1750,
  true,
  '20 X 28 X 48',
  '8 X 28 más 2 suplementos de 3.7 X 28',
  '3 tablas de 5.7 X 48',
  'CONVENCIONAL',
  'CONVENCIONAL',
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- CAJA PARA ESPARRAGO
INSERT INTO articulos (nombre, descripcion, precio_base, activo, medida, cabezal, costado, fondo, taco, esquinero, created_at, updated_at)
VALUES (
  'CAJA PARA ESPARRAGO',
  'Caja especial para espárragos con agujeros y marcado de colores',
  0,
  true,
  '17 X 40 X 50',
  'Plywood 17 X 40 con agujero (marcado en 3 colores: NEGRO, AMARILLO, VERDE)',
  '1 tabla de 8 X 50 marcada en 1 color VERDE (MULTIPLE) y 1 tabla de 4.5 X 50',
  '5 tablas de 5.8 X 50; el resto es convencional',
  'CONVENCIONAL',
  'A 17" / Holgura: TOP 1.5 CM',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


