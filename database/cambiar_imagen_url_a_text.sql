-- Cambiar el campo imagen_url de VARCHAR a TEXT para soportar múltiples imágenes en formato JSON
-- Esto permite almacenar arrays de URLs de imágenes

ALTER TABLE articulos 
MODIFY COLUMN imagen_url TEXT;

