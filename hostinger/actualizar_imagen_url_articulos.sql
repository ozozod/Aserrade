-- Script para actualizar campo imagen_url en articulos para soportar múltiples imágenes (JSON)
-- Ejecutar en phpMyAdmin o cliente MySQL de Hostinger

-- Verificar si el campo existe, si no existe agregarlo
-- Si existe como VARCHAR, cambiarlo a MEDIUMTEXT para soportar JSON arrays grandes

-- Opción 1: Si el campo NO existe, agregarlo
ALTER TABLE articulos 
ADD COLUMN IF NOT EXISTS imagen_url MEDIUMTEXT NULL 
AFTER despeje;

-- Opción 2: Si el campo existe como VARCHAR, cambiarlo a MEDIUMTEXT
-- Descomentar la siguiente línea si el campo ya existe pero es VARCHAR:
-- ALTER TABLE articulos MODIFY COLUMN imagen_url MEDIUMTEXT NULL;

-- Nota: MEDIUMTEXT puede almacenar hasta 16MB, suficiente para múltiples imágenes en base64
-- El formato será: JSON array de strings base64, ej: ["data:image/jpeg;base64,...", "data:image/jpeg;base64,..."]


