-- Script para agregar el campo "despeje" a la tabla de artículos
-- Ejecutar en SQL Editor de Supabase

-- Agregar columna despeje
ALTER TABLE articulos 
ADD COLUMN IF NOT EXISTS despeje VARCHAR(100);

-- Comentario para documentar el campo
COMMENT ON COLUMN articulos.despeje IS 'Despeje de la caja (ej: arriba 4,5CM)';


