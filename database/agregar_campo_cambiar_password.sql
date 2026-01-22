-- Agregar campo debe_cambiar_contraseña a la tabla usuarios
-- Este campo indica si el usuario debe cambiar su contraseña en el próximo login

ALTER TABLE usuarios 
ADD COLUMN debe_cambiar_contraseña BOOLEAN DEFAULT FALSE;

-- Actualizar usuarios existentes para que NO deban cambiar contraseña
UPDATE usuarios SET debe_cambiar_contraseña = FALSE;

