-- Script para modificar la restricción UNIQUE del número de remito
-- Permite que el mismo número de remito pueda usarse con diferentes clientes
-- Ejecutar en SQL Editor de Supabase

-- Paso 1: Eliminar la restricción UNIQUE actual del número
ALTER TABLE remitos DROP CONSTRAINT IF EXISTS remitos_numero_key;

-- Paso 2: Crear nueva restricción UNIQUE compuesta (cliente_id + numero)
-- Esto permite que el mismo número exista para diferentes clientes
-- pero no permite duplicados del mismo número para el mismo cliente
CREATE UNIQUE INDEX IF NOT EXISTS idx_remitos_cliente_numero ON remitos(cliente_id, numero) 
WHERE numero IS NOT NULL AND numero != '';

-- Nota: La restricción solo aplica cuando numero NO es NULL y NO está vacío
-- Esto permite múltiples remitos sin número para el mismo cliente


