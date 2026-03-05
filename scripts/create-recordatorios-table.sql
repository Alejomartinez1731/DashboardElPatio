-- Crear tabla de recordatorios en Supabase
-- Ejecutar en el SQL Editor de Supabase

-- Tabla de recordatorios
CREATE TABLE IF NOT EXISTS recordatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto TEXT NOT NULL,
  dias INTEGER NOT NULL CHECK (dias > 0 AND dias <= 90),
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_recordatorios_producto ON recordatorios(producto);
CREATE INDEX IF NOT EXISTS idx_recordatorios_activo ON recordatorios(activo);
CREATE INDEX IF NOT EXISTS idx_recordatorios_restaurante ON recordatorios(restaurante_id);

-- Restricción única: no puede haber dos recordatorios activos para el mismo producto
CREATE UNIQUE INDEX IF NOT EXISTS idx_recordatorios_producto_activo
  ON recordatorios(lower(producto))
  WHERE activo = true;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recordatorios_updated_at
  BEFORE UPDATE ON recordatorios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentario de tabla
COMMENT ON TABLE recordatorios IS 'Recordatorios de reposición de productos (manuales)';

-- Comentarios de columnas
COMMENT ON COLUMN recordatorios.producto IS 'Nombre del producto (case-insensitive)';
COMMENT ON COLUMN recordatorios.dias IS 'Días máximos entre compras';
COMMENT ON COLUMN recordatorios.notas IS 'Notas adicionales (opcional)';
COMMENT ON COLUMN recordatorios.activo IS 'Si el recordatorio está activo';
