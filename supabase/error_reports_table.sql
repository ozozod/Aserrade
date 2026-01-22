-- Tabla para almacenar reportes de errores de la aplicación
CREATE TABLE IF NOT EXISTS error_reports (
  id BIGSERIAL PRIMARY KEY,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_type VARCHAR(255),
  component_name VARCHAR(255),
  user_agent TEXT,
  url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  app_version VARCHAR(50),
  additional_data JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by VARCHAR(255),
  notes TEXT
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_error_reports_timestamp ON error_reports(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_reports_resolved ON error_reports(resolved);
CREATE INDEX IF NOT EXISTS idx_error_reports_error_type ON error_reports(error_type);
CREATE INDEX IF NOT EXISTS idx_error_reports_component_name ON error_reports(component_name);

-- Comentarios en la tabla
COMMENT ON TABLE error_reports IS 'Almacena reportes automáticos de errores de la aplicación';
COMMENT ON COLUMN error_reports.error_message IS 'Mensaje del error';
COMMENT ON COLUMN error_reports.error_stack IS 'Stack trace completo del error';
COMMENT ON COLUMN error_reports.error_type IS 'Tipo de error (ej: TypeError, ReferenceError)';
COMMENT ON COLUMN error_reports.component_name IS 'Nombre del componente donde ocurrió el error';
COMMENT ON COLUMN error_reports.user_agent IS 'Información del navegador/usuario';
COMMENT ON COLUMN error_reports.url IS 'URL donde ocurrió el error';
COMMENT ON COLUMN error_reports.timestamp IS 'Fecha y hora del error';
COMMENT ON COLUMN error_reports.app_version IS 'Versión de la aplicación';
COMMENT ON COLUMN error_reports.additional_data IS 'Datos adicionales en formato JSON';
COMMENT ON COLUMN error_reports.resolved IS 'Indica si el error fue resuelto';
COMMENT ON COLUMN error_reports.resolved_at IS 'Fecha de resolución';
COMMENT ON COLUMN error_reports.resolved_by IS 'Quién resolvió el error';
COMMENT ON COLUMN error_reports.notes IS 'Notas adicionales sobre el error';

