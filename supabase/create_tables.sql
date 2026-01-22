-- Script de creación de tablas para Supabase (PostgreSQL)
-- Ejecutar en SQL Editor de Supabase

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  direccion TEXT,
  email VARCHAR(255),
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de artículos/productos
CREATE TABLE IF NOT EXISTS articulos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio_base DECIMAL(10, 2) DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  medida VARCHAR(100),
  cabezal TEXT,
  costado TEXT,
  fondo VARCHAR(100),
  taco VARCHAR(100),
  esquinero VARCHAR(100),
  despeje VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Permitir nombres duplicados pero únicos por cliente (o universales)
  UNIQUE(nombre, cliente_id)
);

-- Tabla de remitos
CREATE TABLE IF NOT EXISTS remitos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  fecha DATE NOT NULL,
  numero VARCHAR(100),
  estado_pago VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
  monto_pagado DECIMAL(10, 2) DEFAULT 0,
  observaciones TEXT,
  foto_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Permitir mismo número de remito para diferentes clientes
  -- pero no duplicados del mismo número para el mismo cliente
  UNIQUE(cliente_id, numero)
);

-- Tabla de remito_articulos (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS remito_articulos (
  id SERIAL PRIMARY KEY,
  remito_id INTEGER NOT NULL REFERENCES remitos(id) ON DELETE CASCADE,
  articulo_id INTEGER REFERENCES articulos(id) ON DELETE SET NULL,
  articulo_nombre VARCHAR(255) NOT NULL,
  cantidad DECIMAL(10, 2) NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  precio_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id SERIAL PRIMARY KEY,
  remito_id INTEGER NOT NULL REFERENCES remitos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  monto DECIMAL(10, 2) NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_remitos_cliente ON remitos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_remitos_fecha ON remitos(fecha);
CREATE INDEX IF NOT EXISTS idx_pagos_remito ON pagos(remito_id);
CREATE INDEX IF NOT EXISTS idx_remito_articulos_remito ON remito_articulos(remito_id);
CREATE INDEX IF NOT EXISTS idx_remito_articulos_articulo ON remito_articulos(articulo_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articulos_updated_at BEFORE UPDATE ON articulos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_remitos_updated_at BEFORE UPDATE ON remitos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS) - Opcional pero recomendado
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE articulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE remitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE remito_articulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acceso público (para esta app)
-- En producción, deberías usar políticas más restrictivas
CREATE POLICY "Allow all operations on clientes" ON clientes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on articulos" ON articulos
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on remitos" ON remitos
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on remito_articulos" ON remito_articulos
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on pagos" ON pagos
    FOR ALL USING (true) WITH CHECK (true);

