/**
 * Script para insertar datos de prueba en Supabase
 *
 * Uso:
 *   npx tsx scripts/seed-test-data.ts
 *
 * Este script inserta 100 compras de prueba distribuidas en 3 meses
 * para poder probar todas las páginas del dashboard.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno desde .env.local
config({ path: '.env.local' });

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('   Necesitas: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Datos de prueba
const TIENDAS = [
  { nombre: 'Mercadona', telefono: '900123456', direccion: 'Calle Principal 123' },
  { nombre: 'Carrefour', telefono: '911234567', direccion: 'Avenida Libertad 45' },
  { nombre: 'Lidl', telefono: '922345678', direccion: 'Plaza Mayor 78' },
  { nombre: 'Consum', telefono: '933456789', direccion: 'Carrer Major 12' },
  { nombre: 'BonArea', telefono: '944567890', direccion: 'Polígono Industrial Zona 3' },
];

const PRODUCTOS = [
  // Carnes
  { nombre: 'Pollo Entero', categoria: 'Carnes', precio_base: 5.50 },
  { nombre: 'Ternera Picada', categoria: 'Carnes', precio_base: 8.90 },
  { nombre: 'Chuletas de Cerdo', categoria: 'Carnes', precio_base: 12.50 },
  { nombre: 'Hamburguesas Beef', categoria: 'Carnes', precio_base: 6.20 },
  { nombre: 'Costilla Cerdo', categoria: 'Carnes', precio_base: 9.80 },

  // Verduras y Frutas
  { nombre: 'Tomates', categoria: 'Verduras y Frutas', precio_base: 2.50 },
  { nombre: 'Patatas', categoria: 'Verduras y Frutas', precio_base: 1.80 },
  { nombre: 'Cebollas', categoria: 'Verduras y Frutas', precio_base: 1.20 },
  { nombre: 'Lechuga', categoria: 'Verduras y Frutas', precio_base: 0.90 },
  { nombre: 'Manzanas', categoria: 'Verduras y Frutas', precio_base: 2.20 },
  { nombre: 'Naranjas', categoria: 'Verduras y Frutas', precio_base: 1.90 },
  { nombre: 'Zanahorias', categoria: 'Verduras y Frutas', precio_base: 1.40 },

  // Lácteos
  { nombre: 'Leche Entera 1L', categoria: 'Lácteos', precio_base: 1.20 },
  { nombre: 'Queso Manchego', categoria: 'Lácteos', precio_base: 12.50 },
  { nombre: 'Yogur Natural', categoria: 'Lácteos', precio_base: 0.80 },
  { nombre: 'Mantequilla', categoria: 'Lácteos', precio_base: 2.50 },
  { nombre: 'Nata para Cocinar', categoria: 'Lácteos', precio_base: 1.80 },

  // Panadería
  { nombre: 'Pan Barrido', categoria: 'Panadería', precio_base: 1.50 },
  { nombre: 'Croissants', categoria: 'Panadería', precio_base: 3.20 },
  { nombre: 'Galletas María', categoria: 'Panadería', precio_base: 1.90 },
  { nombre: 'Pan Integral', categoria: 'Panadería', precio_base: 2.10 },

  // Bebidas
  { nombre: 'Cerveza Lager', categoria: 'Bebidas', precio_base: 0.50 },
  { nombre: 'Agua Mineral 1.5L', categoria: 'Bebidas', precio_base: 0.70 },
  { nombre: 'Vino Tinto', categoria: 'Bebidas', precio_base: 8.50 },
  { nombre: 'Refresco Cola', categoria: 'Bebidas', precio_base: 1.30 },

  // Condimentos
  { nombre: 'Aceite Oliva Virgen', categoria: 'Condimentos', precio_base: 8.50 },
  { nombre: 'Vinagre de Vino', categoria: 'Condimentos', precio_base: 2.20 },
  { nombre: 'Sal Yodada', categoria: 'Condimentos', precio_base: 0.60 },
  { nombre: 'Azúcar Blanco', categoria: 'Condimentos', precio_base: 1.40 },

  // Granos y Pastas
  { nombre: 'Arroz Bomba', categoria: 'Granos y Pastas', precio_base: 3.50 },
  { nombre: 'Pasta Espagueti', categoria: 'Granos y Pastas', precio_base: 1.80 },
  { nombre: 'Lentejas', categoria: 'Granos y Pastas', precio_base: 2.90 },

  // Huevos
  { nombre: 'Huevos XL (12)', categoria: 'Huevos', precio_base: 3.50 },
  { nombre: 'Huevos L (6)', categoria: 'Huevos', precio_base: 1.80 },

  // Limpieza
  { nombre: 'Detergente Lavadora', categoria: 'Limpieza', precio_base: 5.50 },
  { nombre: 'Papel Cocina', categoria: 'Limpieza', precio_base: 2.90 },
  { nombre: 'Limpiador Multiuso', categoria: 'Limpieza', precio_base: 3.20 },
];

/**
 * Genera una fecha aleatoria dentro de un rango
 */
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Genera variación de precio (+/- 20%)
 */
function variatePrice(basePrice: number): number {
  const variation = (Math.random() - 0.5) * 0.4; // +/- 20%
  return Math.round((basePrice * (1 + variation)) * 100) / 100;
}

/**
 * Genera compras de prueba
 */
function generateCompras(count: number = 100): any[] {
  const compras: any[] = [];
  const startDate = new Date('2025-12-01');
  const endDate = new Date('2026-03-04');

  for (let i = 0; i < count; i++) {
    const tienda = TIENDAS[Math.floor(Math.random() * TIENDAS.length)];
    const producto = PRODUCTOS[Math.floor(Math.random() * PRODUCTOS.length)];
    const fecha = randomDate(startDate, endDate);
    const cantidad = Math.floor(Math.random() * 10) + 1; // 1-10 unidades
    const precioUnitario = variatePrice(producto.precio_base);
    const total = Math.round(precioUnitario * cantidad * 100) / 100;

    compras.push({
      fecha: fecha.toISOString().split('T')[0],
      tienda: tienda.nombre,
      descripcion: producto.nombre,
      precio_unitario: precioUnitario,
      cantidad: cantidad,
      total: total,
      telefono: tienda.telefono,
      direccion: tienda.direccion,
      restaurante_id: null, // Sin restaurante asignado por ahora
      proveedor_id: null,   // Sin proveedor asignado por ahora
    });
  }

  return compras.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

/**
 * Genera facturas de prueba
 */
function generateFacturas(count: number = 20): any[] {
  const facturas: any[] = [];
  const startDate = new Date('2025-12-01');
  const endDate = new Date('2026-03-04');

  for (let i = 0; i < count; i++) {
    const tienda = TIENDAS[Math.floor(Math.random() * TIENDAS.length)];
    const fecha = randomDate(startDate, endDate);
    const numProductos = Math.floor(Math.random() * 15) + 3; // 3-18 productos
    const total = Math.round((Math.random() * 100 + 20) * 100) / 100; // 20-120€

    facturas.push({
      fecha: fecha.toISOString().split('T')[0],
      tienda: tienda.nombre,
      total: total,
      num_productos: numProductos,
      imagen_url: null,
      nombre_archivo: `factura_${i + 1}.pdf`,
      restaurante_id: null,
    });
  }

  return facturas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Iniciando inserción de datos de prueba...\n');

  try {
    // 1. Limpiar datos anteriores
    console.log('🧹 Limpiando datos anteriores...');
    const { error: errorDelete } = await supabase
      .from('compras')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (errorDelete) {
      console.warn('   ⚠️  No se pudo limpiar (quizás no había datos):', errorDelete.message);
    } else {
      console.log('   ✅ Datos anteriores eliminados');
    }

    const { error: errorDeleteFacturas } = await supabase
      .from('facturas')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (errorDeleteFacturas) {
      console.warn('   ⚠️  No se pudo limpiar facturas:', errorDeleteFacturas.message);
    } else {
      console.log('   ✅ Facturas anteriores eliminadas');
    }

    // 2. Generar compras
    console.log('\n📊 Generando compras de prueba...');
    const compras = generateCompras(100);
    console.log(`   ✅ ${compras.length} compras generadas`);

    // 3. Insertar compras (en batches de 50)
    console.log('\n💾 Insertando compras en Supabase...');
    const BATCH_SIZE = 50;
    let insertedCompras = 0;

    for (let i = 0; i < compras.length; i += BATCH_SIZE) {
      const batch = compras.slice(i, i + BATCH_SIZE);

      const { data, error } = await supabase
        .from('compras')
        .insert(batch)
        .select();

      if (error) {
        console.error(`   ❌ Error insertando batch ${i}-${i + BATCH_SIZE}:`, error.message);
        console.error('   Detalles:', error);
        process.exit(1);
      }

      insertedCompras += data?.length || 0;
      console.log(`   ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${data?.length || 0} compras insertadas`);
    }

    console.log(`   📦 Total compras insertadas: ${insertedCompras}`);

    // 4. Generar e insertar facturas
    console.log('\n📄 Generando facturas de prueba...');
    const facturas = generateFacturas(20);
    console.log(`   ✅ ${facturas.length} facturas generadas`);

    console.log('\n💾 Insertando facturas en Supabase...');
    const { data: facturasData, error: errorFacturas } = await supabase
      .from('facturas')
      .insert(facturas)
      .select();

    if (errorFacturas) {
      console.error('   ❌ Error insertando facturas:', errorFacturas.message);
      process.exit(1);
    }

    console.log(`   ✅ ${facturasData?.length || 0} facturas insertadas`);

    // 5. Crear restaurante por defecto
    console.log('\n🏢 Creando restaurante por defecto...');
    const { data: restaurante, error: errorRestaurante } = await supabase
      .from('restaurantes')
      .upsert({
        nombre: 'El Patio & Grill',
        direccion: 'Calle del Restaurante 123',
        telefono: '955555555',
        activo: true,
      })
      .select()
      .single();

    if (errorRestaurante) {
      console.warn('   ⚠️  No se pudo crear restaurante:', errorRestaurante.message);
    } else {
      console.log(`   ✅ Restaurante creado: ${restaurante.nombre} (ID: ${restaurante.id})`);
    }

    // 6. Crear recordatorios de prueba
    console.log('\n🔔 Creando recordatorios de prueba...');
    const recordatorios = [
      { producto: 'Pollo Entero', dias: 3, notas: 'Comprar fresco en Mercadona', activo: true },
      { producto: 'Tomates', dias: 2, notas: 'Verificar calidad', activo: true },
      { producto: 'Leche Entera 1L', dias: 4, notas: 'Stock mínimo 10 unidades', activo: true },
      { producto: 'Huevos XL (12)', dias: 5, notas: '', activo: true },
    ];

    const { data: recordatoriosData, error: errorRecordatorios } = await supabase
      .from('recordatorios')
      .insert(recordatorios.map(r => ({
        ...r,
        restaurante_id: restaurante?.id || null,
      })))
      .select();

    if (errorRecordatorios) {
      console.warn('   ⚠️  No se pudieron crear recordatorios:', errorRecordatorios.message);
    } else {
      console.log(`   ✅ ${recordatoriosData?.length || 0} recordatorios creados`);
    }

    // 7. Crear presupuesto de prueba
    console.log('\n💰 Creando presupuesto de prueba...');
    const { data: presupuesto, error: errorPresupuesto } = await supabase
      .from('presupuestos')
      .upsert({
        restaurante_id: restaurante?.id || null,
        mes: 3, // Marzo
        anio: 2026,
        monto: 5000,
      })
      .select()
      .single();

    if (errorPresupuesto) {
      console.warn('   ⚠️  No se pudo crear presupuesto:', errorPresupuesto.message);
    } else {
      console.log(`   ✅ Presupuesto creado: ${formatearMoneda(presupuesto.monto)} para Marzo 2026`);
    }

    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE DATOS INSERTADOS');
    console.log('='.repeat(60));
    console.log(`   ✅ Compras:          ${insertedCompras}`);
    console.log(`   ✅ Facturas:         ${facturasData?.length || 0}`);
    console.log(`   ✅ Restaurantes:     1`);
    console.log(`   ✅ Recordatorios:    ${recordatoriosData?.length || 0}`);
    console.log(`   ✅ Presupuestos:     1`);
    console.log('='.repeat(60));
    console.log('\n✅ Datos de prueba insertados correctamente!');
    console.log('🔍 Ya puedes probar el dashboard en: http://localhost:3000');
    console.log('\n💡 Para ver los datos en Supabase:');
    console.log('   Table Editor → compras');
    console.log('   Table Editor → facturas');
    console.log('   Table Editor → restaurantes');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error durante la inserción:', error);
    process.exit(1);
  }
}

function formatearMoneda(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

main();
