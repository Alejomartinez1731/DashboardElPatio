-- Crear tabla de presupuestos por categoría en Supabase
-- Ejecutar en el SQL Editor de Supabase

-- Tabla de presupuestos por categoría
CREATE TABLE IF NOT EXISTS presupuestos_categoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE SET NULL,
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('carnes', 'lacteos', 'verdura', 'panaderia', 'bebidas', 'limpieza', 'otros')),
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  periodo_mes INT NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio INT NOT NULL CHECK (periodo_anio >= 2020 AND periodo_anio <= 2100),
  activo BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurante_id, categoria, periodo_mes, periodo_anio)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_presupuestos_categoria_restaurante ON presupuestos_categoria(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_categoria_categoria ON presupuestos_categoria(categoria);
CREATE INDEX IF NOT EXISTS idx_presupuestos_categoria_periodo ON presupuestos_categoria(periodo_anio DESC, periodo_mes DESC);
CREATE INDEX IF NOT EXISTS idx_presupuestos_categoria_activo ON presupuestos_categoria(activo);
CREATE INDEX IF NOT EXISTS idx_presupuestos_categoria_composite ON presupuestos_categoria(restaurante_id, periodo_anio, periodo_mes, activo);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_presupuestos_categoria_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_presupuestos_categoria_updated_at
  BEFORE UPDATE ON presupuestos_categoria
  FOR EACH ROW
  EXECUTE FUNCTION update_presupuestos_categoria_updated_at();

-- Comentario de tabla
COMMENT ON TABLE presupuestos_categoria IS 'Presupuestos mensuales por categoría de producto';

-- Comentarios de columnas
COMMENT ON COLUMN presupuestos_categoria.categoria IS 'Categoría: carnes, lacteos, verdura, panaderia, bebidas, limpieza, otros';
COMMENT ON COLUMN presupuestos_categoria.monto IS 'Monto presupuestado en euros';
COMMENT ON COLUMN presupuestos_categoria.periodo_mes IS 'Mes del periodo (1-12)';
COMMENT ON COLUMN presupuestos_categoria.periodo_anio IS 'Año del periodo';
COMMENT ON COLUMN presupuestos_categoria.activo IS 'Si el presupuesto está activo';
COMMENT ON COLUMN presupuestos_categoria.notas IS 'Notas adicionales (opcional)';

-- Función para obtener el gasto actual por categoría en un periodo
CREATE OR REPLACE FUNCTION gasto_actual_por_categoria(
  p_restaurante_id UUID DEFAULT NULL,
  p_mes INT DEFAULT NULL,
  p_anio INT DEFAULT NULL
)
RETURNS TABLE (
  categoria VARCHAR,
  gasto_total DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.categoria,
    COALESCE(SUM(c.total), 0) as gasto_total
  FROM compras c
  WHERE
    (p_restaurante_id IS NULL OR c.restaurante_id = p_restaurante_id)
    AND (p_mes IS NULL OR EXTRACT(MONTH FROM c.fecha) = p_mes)
    AND (p_anio IS NULL OR EXTRACT(YEAR FROM c.fecha) = p_anio)
  GROUP BY c.categoria;
END;
$$ LANGUAGE plpgsql;

-- Vista para comparar presupuesto vs gasto actual
CREATE OR REPLACE VIEW vista_presupuesto_vs_gasto AS
SELECT
  pc.id,
  pc.restaurante_id,
  pc.categoria,
  pc.monto as presupuesto,
  COALESCE(gastos.gasto_total, 0) as gasto_actual,
  pc.monto - COALESCE(gastos.gasto_total, 0) as diferencia,
  CASE
    WHEN pc.monto > 0 THEN ROUND((COALESCE(gastos.gasto_total, 0) / pc.monto) * 100, 2)
    ELSE 0
  END as porcentaje_usado,
  pc.periodo_mes,
  pc.periodo_anio,
  pc.activo,
  pc.notas,
  pc.created_at,
  pc.updated_at
FROM presupuestos_categoria pc
LEFT JOIN LATERAL (
  SELECT
    SUM(c.total) as gasto_total
  FROM compras c
  WHERE
    (pc.restaurante_id IS NULL OR c.restaurante_id = pc.restaurante_id)
    AND c.categoria = pc.categoria
    AND EXTRACT(MONTH FROM c.fecha) = pc.periodo_mes
    AND EXTRACT(YEAR FROM c.fecha) = pc.periodo_anio
) gastos ON true
WHERE pc.activo = true;

-- Comentario de vista
COMMENT ON VIEW vista_presupuesto_vs_gasto IS 'Compara presupuesto por categoría vs gasto real del periodo';

-- Datos de ejemplo (opcional - comentado por defecto)
/*
INSERT INTO presupuestos_categoria (categoria, monto, periodo_mes, periodo_anio, notas)
VALUES
  ('carnes', 500.00, EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW()), 'Presupuesto inicial para carnes'),
  ('lacteos', 200.00, EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW()), NULL),
  ('verdura', 300.00, EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW()), NULL),
  ('panaderia', 150.00, EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW()), NULL),
  ('bebidas', 250.00, EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW()), NULL),
  ('limpieza', 100.00, EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW()), NULL),
  ('otros', 200.00, EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW()), NULL);
*/
