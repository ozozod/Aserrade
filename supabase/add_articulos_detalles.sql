-- Script para agregar campos de detalles a la tabla articulos
-- Ejecutar en SQL Editor de Supabase

-- Agregar campos de medidas y detalles
ALTER TABLE articulos 
ADD COLUMN IF NOT EXISTS medida VARCHAR(100),
ADD COLUMN IF NOT EXISTS cabezal TEXT,
ADD COLUMN IF NOT EXISTS costado TEXT,
ADD COLUMN IF NOT EXISTS fondo TEXT,
ADD COLUMN IF NOT EXISTS taco TEXT,
ADD COLUMN IF NOT EXISTS esquinero TEXT,
ADD COLUMN IF NOT EXISTS precio_retirar DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS precio_entregado DECIMAL(10, 2) DEFAULT 0;

-- Comentarios para documentación
COMMENT ON COLUMN articulos.medida IS 'Dimensiones de la caja (ej: 20 X 28 X 48)';
COMMENT ON COLUMN articulos.cabezal IS 'Detalles del cabezal (ej: 8 X 28 más 2 suplementos de 3.7 X 28)';
COMMENT ON COLUMN articulos.costado IS 'Detalles del costado (ej: 3 tablas de 5.7 X 48)';
COMMENT ON COLUMN articulos.fondo IS 'Tipo de fondo (ej: CONVENCIONAL o 5 tablas de 5.8 X 50)';
COMMENT ON COLUMN articulos.taco IS 'Tipo de taco (ej: CONVENCIONAL)';
COMMENT ON COLUMN articulos.esquinero IS 'Detalles del esquinero (ej: A 17" / Holgura: TOP 1.5 CM)';
COMMENT ON COLUMN articulos.precio_retirar IS 'Precio para retirar en aserradero';
COMMENT ON COLUMN articulos.precio_entregado IS 'Precio entregado en San Juan';


