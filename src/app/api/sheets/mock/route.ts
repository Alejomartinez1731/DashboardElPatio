import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// MOCK DATA - Solo para desarrollo cuando n8n no está disponible
const mockData = {
  base_de_datos: {
    values: [
      ['FECHA', 'TIENDA', 'DESCRIPCION', 'CANTIDAD', 'PRECIO UNITARIO', 'TOTAL', 'TELEFONO', 'DIRECCION'],
      ['15/02/2026', 'Carrefour', 'Tomates', 5, 2.50, 12.50, '933456789', 'Av. Principal 123'],
      ['15/02/2026', 'Lidl', 'Leche', 10, 1.20, 12.00, '933456789', 'Calle Mayor 45'],
      ['14/02/2026', 'Mercadona', 'Pan', 3, 1.50, 4.50, '933456789', 'Plaza Central 1'],
      ['14/02/2026', 'Consum', 'Huevos', 12, 0.30, 3.60, '933456789', 'Carrer Major 78'],
      ['13/02/2026', 'Carrefour', 'Aceite', 2, 8.00, 16.00, '933456789', 'Av. Principal 123'],
    ]
  },
  historico_precios: {
    values: [
      ['PRODUCTO', 'FECHA', 'TIENDA', 'PRECIO', 'PRECIO_ANTERIOR', 'VARIACION'],
      ['Tomates', '15/02/2026', 'Carrefour', 2.50, 2.30, '+8.7%'],
      ['Leche', '15/02/2026', 'Lidl', 1.20, 1.25, '-4.0%'],
      ['Pan', '14/02/2026', 'Mercadona', 1.50, 1.45, '+3.4%'],
    ]
  },
  costosos: {
    values: [
      ['PRODUCTO', 'PRECIO_PROMEDIO', 'TIENDA', 'ULTIMA_COMPRA'],
      ['Aceite', 8.00, 'Carrefour', '13/02/2026'],
      ['Carne', 15.50, 'Consum', '12/02/2026'],
      ['Pescado', 12.00, 'Mercadona', '11/02/2026'],
    ]
  },
  gasto_tienda: {
    values: [
      ['TIENDA', 'GASTO_TOTAL', 'NUM_COMPRAS', 'GASTO_PROMEDIO'],
      ['Carrefour', 156.50, 12, 13.04],
      ['Mercadona', 134.20, 15, 8.95],
      ['Lidl', 89.30, 8, 11.16],
      ['Consum', 67.80, 6, 11.30],
    ]
  },
  registro_diario: {
    values: [
      ['FECHA', 'GASTO_TOTAL', 'NUM_FACTURAS', 'TIENDA_MAYOR'],
      ['15/02/2026', 24.50, 2, 'Carrefour'],
      ['14/02/2026', 8.10, 2, 'Mercadona'],
      ['13/02/2026', 16.00, 1, 'Carrefour'],
    ]
  }
};

export async function GET(request: Request) {
  return NextResponse.json({
    success: true,
    data: mockData,
    timestamp: new Date().toISOString(),
    _mock: true,
  });
}
