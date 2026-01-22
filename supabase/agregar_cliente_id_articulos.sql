-- Script para agregar campo cliente_id a la tabla articulos
-- Esto permite tener artículos universales (cliente_id = NULL) y artículos únicos por cliente

-- Agregar columna cliente_id a la tabla articulos
ALTER TABLE articulos 
ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE;

-- Crear índice para mejorar las consultas
CREATE INDEX IF NOT EXISTS idx_articulos_cliente ON articulos(cliente_id);

-- Comentario: 
-- - Si cliente_id es NULL, el artículo es UNIVERSAL (disponible para todos los clientes)
-- - Si cliente_id tiene un valor, el artículo es ÚNICO para ese cliente específico
