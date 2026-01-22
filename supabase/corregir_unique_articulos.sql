-- Script para corregir la restricción UNIQUE en artículos
-- Permite que diferentes clientes tengan artículos con el mismo nombre
-- Ejecutar en SQL Editor de Supabase

-- Eliminar la restricción UNIQUE antigua del nombre
ALTER TABLE articulos DROP CONSTRAINT IF EXISTS articulos_nombre_key;

-- Agregar restricción UNIQUE compuesta (nombre, cliente_id)
-- Esto permite que el mismo nombre exista para diferentes clientes
-- NULL en cliente_id significa artículo universal
ALTER TABLE articulos 
ADD CONSTRAINT articulos_nombre_cliente_unique UNIQUE(nombre, cliente_id);

