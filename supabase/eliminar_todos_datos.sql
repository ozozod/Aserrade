-- Script para eliminar todos los datos de prueba
-- Ejecutar en Supabase SQL Editor

-- Eliminar en orden inverso de dependencias
DELETE FROM pagos;
DELETE FROM remito_articulos;
DELETE FROM remitos;
DELETE FROM articulos;
DELETE FROM clientes;

-- Verificar que se eliminaron todos los datos
SELECT 
  (SELECT COUNT(*) FROM clientes) as total_clientes,
  (SELECT COUNT(*) FROM articulos) as total_articulos,
  (SELECT COUNT(*) FROM remitos) as total_remitos,
  (SELECT COUNT(*) FROM remito_articulos) as total_remito_articulos,
  (SELECT COUNT(*) FROM pagos) as total_pagos;

