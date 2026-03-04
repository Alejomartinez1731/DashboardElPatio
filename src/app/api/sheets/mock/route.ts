import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// MOCK DATA - Solo para desarrollo cuando n8n no está disponible
const mockData = {
  base_de_datos: {
    values: [
      ['FECHA', 'TIENDA', 'DESCRIPCION', 'CANTIDAD', 'PRECIO UNITARIO', 'TOTAL', 'TELEFONO', 'DIRECCION'],
      // Datos variados de prueba
      ['01/03/2026', 'Carrefour', 'Tomates', 5, 2.50, 12.50, '933456789', 'Av. Principal 123'],
      ['01/03/2026', 'Lidl', 'Leche Entera', 10, 1.20, 12.00, '933456789', 'Calle Mayor 45'],
      ['01/03/2026', 'Mercadona', 'Pan Barrido', 3, 1.50, 4.50, '933456789', 'Plaza Central 1'],
      ['01/03/2026', 'Consum', 'Huevos XL', 12, 0.30, 3.60, '933456789', 'Carrer Major 78'],
      ['01/03/2026', 'Carrefour', 'Aceite Oliva', 2, 8.00, 16.00, '933456789', 'Av. Principal 123'],
      ['28/02/2026', 'Lidl', 'Yogur Natural', 8, 0.80, 6.40, '933456789', 'Calle Mayor 45'],
      ['28/02/2026', 'Mercadona', 'Manzanas', 6, 2.00, 12.00, '933456789', 'Plaza Central 1'],
      ['28/02/2026', 'Consum', 'Pollo', 2, 5.50, 11.00, '933456789', 'Carrer Major 78'],
      ['27/02/2026', 'Carrefour', 'Pasta', 4, 1.80, 7.20, '933456789', 'Av. Principal 123'],
      ['27/02/2026', 'Lidl', 'Queso', 3, 3.50, 10.50, '933456789', 'Calle Mayor 45'],
      ['27/02/2026', 'Mercadona', 'Naranjas', 10, 0.40, 4.00, '933456789', 'Plaza Central 1'],
      ['26/02/2026', 'Consum', 'Arroz', 2, 3.00, 6.00, '933456789', 'Carrer Major 78'],
      ['26/02/2026', 'Carrefour', 'Lechuga', 5, 0.90, 4.50, '933456789', 'Av. Principal 123'],
      ['26/02/2026', 'Lidl', 'Patatas', 10, 1.20, 12.00, '933456789', 'Calle Mayor 45'],
      ['25/02/2026', 'Mercadona', 'Tomate Frito', 3, 2.00, 6.00, '933456789', 'Plaza Central 1'],
      ['25/02/2026', 'Consum', 'Cerveza', 12, 0.50, 6.00, '933456789', 'Carrer Major 78'],
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
      ['FECHA', 'TIENDA', 'DESCRIPCION', 'CANTIDAD', 'TOTALUNITARIO', 'TOTAL'],
      ['01/03/2026', 'Carrefour', 'Tomates', 5, 2.50, 12.50],
      ['01/03/2026', 'Lidl', 'Leche Entera', 10, 1.20, 12.00],
      ['01/03/2026', 'Mercadona', 'Pan Barrido', 3, 1.50, 4.50],
      ['28/02/2026', 'Carrefour', 'Aceite Oliva', 2, 8.00, 16.00],
      ['28/02/2026', 'Lidl', 'Yogur Natural', 8, 0.80, 6.40],
      ['27/02/2026', 'Mercadona', 'Manzanas', 6, 2.00, 12.00],
      ['27/02/2026', 'Consum', 'Pollo', 2, 5.50, 11.00],
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
