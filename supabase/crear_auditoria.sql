-- Script para crear sistema de auditoría de cambios
-- Ejecutar en SQL Editor de Supabase

-- Tabla de auditoría
CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  tabla VARCHAR(100) NOT NULL,
  registro_id INTEGER NOT NULL,
  accion VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  usuario VARCHAR(255), -- Nombre del usuario que hizo el cambio (opcional)
  datos_anteriores JSONB, -- Datos antes del cambio (para UPDATE y DELETE)
  datos_nuevos JSONB, -- Datos después del cambio (para INSERT y UPDATE)
  cambios JSONB, -- Solo los campos que cambiaron (para UPDATE)
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_auditoria_tabla ON auditoria(tabla);
CREATE INDEX IF NOT EXISTS idx_auditoria_registro_id ON auditoria(registro_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_accion ON auditoria(accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria(created_at);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabla_registro ON auditoria(tabla, registro_id);

-- Función para registrar auditoría
CREATE OR REPLACE FUNCTION registrar_auditoria(
  p_tabla VARCHAR,
  p_registro_id INTEGER,
  p_accion VARCHAR,
  p_usuario VARCHAR DEFAULT NULL,
  p_datos_anteriores JSONB DEFAULT NULL,
  p_datos_nuevos JSONB DEFAULT NULL,
  p_cambios JSONB DEFAULT NULL,
  p_observaciones TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO auditoria (
    tabla,
    registro_id,
    accion,
    usuario,
    datos_anteriores,
    datos_nuevos,
    cambios,
    observaciones
  ) VALUES (
    p_tabla,
    p_registro_id,
    p_accion,
    p_usuario,
    p_datos_anteriores,
    p_datos_nuevos,
    p_cambios,
    p_observaciones
  );
END;
$$ LANGUAGE plpgsql;

-- Función helper para calcular diferencias entre dos objetos JSON
CREATE OR REPLACE FUNCTION calcular_cambios(
  datos_viejos JSONB,
  datos_nuevos JSONB
)
RETURNS JSONB AS $$
DECLARE
  cambios JSONB := '{}'::JSONB;
  key TEXT;
  valor_viejo JSONB;
  valor_nuevo JSONB;
BEGIN
  -- Iterar sobre las claves de los datos nuevos
  FOR key IN SELECT jsonb_object_keys(datos_nuevos)
  LOOP
    valor_viejo := datos_viejos->key;
    valor_nuevo := datos_nuevos->key;
    
    -- Si el valor cambió, agregarlo a cambios
    IF valor_viejo IS DISTINCT FROM valor_nuevo THEN
      cambios := cambios || jsonb_build_object(
        key,
        jsonb_build_object(
          'anterior', valor_viejo,
          'nuevo', valor_nuevo
        )
      );
    END IF;
  END LOOP;
  
  -- También verificar claves que existían antes pero no ahora
  FOR key IN SELECT jsonb_object_keys(datos_viejos)
  LOOP
    IF NOT (datos_nuevos ? key) THEN
      cambios := cambios || jsonb_build_object(
        key,
        jsonb_build_object(
          'anterior', datos_viejos->key,
          'nuevo', NULL
        )
      );
    END IF;
  END LOOP;
  
  RETURN cambios;
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS en auditoría
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso a auditoría
CREATE POLICY "Allow all operations on auditoria" ON auditoria
    FOR ALL USING (true) WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE auditoria IS 'Registro de todos los cambios realizados en la aplicación';
COMMENT ON COLUMN auditoria.tabla IS 'Nombre de la tabla afectada';
COMMENT ON COLUMN auditoria.registro_id IS 'ID del registro afectado';
COMMENT ON COLUMN auditoria.accion IS 'Tipo de acción: INSERT, UPDATE, DELETE';
COMMENT ON COLUMN auditoria.datos_anteriores IS 'Datos completos antes del cambio (JSON)';
COMMENT ON COLUMN auditoria.datos_nuevos IS 'Datos completos después del cambio (JSON)';
COMMENT ON COLUMN auditoria.cambios IS 'Solo los campos que cambiaron (JSON)';

