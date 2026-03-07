import { NextRequest, NextResponse } from 'next/server';
import { requireSupabase } from '@/lib/supabase';

export interface ProductoInflacion {
  producto: string;
  categoria: string;
  compras: {
    fecha: string;
    precio: number;
    tienda: string;
  }[];
  precioPrimera: number;
  precioUltima: number;
  variacionPorcentaje: number;
  variacionAbsoluta: number;
  tendencia: 'alcista' | 'bajista' | 'estable';
  comprasTotales: number;
}

interface InflacionResponse {
  success: boolean;
  data?: {
    productos: ProductoInflacion[];
    resumen: {
      totalAnalizados: number;
      conAumento: number;
      aumentoPromedio: number;
      productoMayorAumento: string;
      mayorAumentoPorcentaje: number;
    };
  };
  error?: string;
}

/**
 * GET /api/inflacion
 * Obtiene análisis de inflación de productos comprados ≥ 3 veces
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = requireSupabase();
    const { searchParams } = new URL(request.url);

    // Parámetros de filtrado
    const umbralVariacion = parseFloat(searchParams.get('umbral') || '5'); // 5% por defecto
    const minCompras = parseInt(searchParams.get('minCompras') || '3');

    // Obtener todas las compras con precio_unitario > 0
    const { data: compras, error } = await supabase
      .from('compras')
      .select('descripcion, precio_unitario, fecha, tienda')
      .gt('precio_unitario', 0)
      .order('fecha', { ascending: false });

    if (error) {
      return NextResponse.json<InflacionResponse>({
        success: false,
        error: error.message,
      }, { status: 400 });
    }

    if (!compras || compras.length === 0) {
      return NextResponse.json<InflacionResponse>({
        success: true,
        data: {
          productos: [],
          resumen: {
            totalAnalizados: 0,
            conAumento: 0,
            aumentoPromedio: 0,
            productoMayorAumento: '',
            mayorAumentoPorcentaje: 0,
          },
        },
      });
    }

    // Agrupar compras por producto (normalizando nombres)
    const productosMap = new Map<string, typeof compras>();

    compras.forEach((compra) => {
      const productoNormalizado = compra.descripcion.toLowerCase().trim();

      if (!productosMap.has(productoNormalizado)) {
        productosMap.set(productoNormalizado, []);
      }

      productosMap.get(productoNormalizado)!.push(compra);
    });

    // Analizar cada producto
    const productosInflacion: ProductoInflacion[] = [];
    let conAumentoCount = 0;
    let sumaAumentos = 0;
    let mayorAumentoPorcentaje = 0;
    let productoMayorAumento = '';

    productosMap.forEach((comprasProducto, nombreProducto) => {
      // Solo analizar productos con mínimo de compras
      if (comprasProducto.length < minCompras) {
        return;
      }

      // Ordenar compras por fecha ascendente para calcular tendencia
      const comprasOrdenadas = [...comprasProducto].sort((a, b) =>
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );

      const precioPrimera = comprasOrdenadas[0].precio_unitario;
      const precioUltima = comprasOrdenadas[comprasOrdenadas.length - 1].precio_unitario;
      const variacionAbsoluta = precioUltima - precioPrimera;
      const variacionPorcentaje = precioPrimera > 0
        ? ((variacionAbsoluta / precioPrimera) * 100)
        : 0;

      // Determinar tendencia
      let tendencia: 'alcista' | 'bajista' | 'estable' = 'estable';
      if (variacionPorcentaje > 2) {
        tendencia = 'alcista';
      } else if (variacionPorcentaje < -2) {
        tendencia = 'bajista';
      }

      // Solo incluir si supera el umbral de variación
      if (Math.abs(variacionPorcentaje) >= umbralVariacion) {
        const producto: ProductoInflacion = {
          producto: nombreProducto,
          categoria: 'Sin categoría',
          compras: comprasOrdenadas.map((c) => ({
            fecha: c.fecha,
            precio: c.precio_unitario,
            tienda: c.tienda || 'N/A',
          })),
          precioPrimera,
          precioUltima,
          variacionPorcentaje: Math.round(variacionPorcentaje * 100) / 100,
          variacionAbsoluta: Math.round(variacionAbsoluta * 100) / 100,
          tendencia,
          comprasTotales: comprasProducto.length,
        };

        productosInflacion.push(producto);

        // Actualizar estadísticas
        if (variacionPorcentaje > 0) {
          conAumentoCount++;
          sumaAumentos += variacionPorcentaje;

          if (variacionPorcentaje > mayorAumentoPorcentaje) {
            mayorAumentoPorcentaje = variacionPorcentaje;
            productoMayorAumento = nombreProducto;
          }
        }
      }
    });

    // Ordenar por variación porcentual descendente
    productosInflacion.sort((a, b) => b.variacionPorcentaje - a.variacionPorcentaje);

    const resumen = {
      totalAnalizados: productosInflacion.length,
      conAumento: conAumentoCount,
      aumentoPromedio: conAumentoCount > 0
        ? Math.round((sumaAumentos / conAumentoCount) * 100) / 100
        : 0,
      productoMayorAumento,
      mayorAumentoPorcentaje: Math.round(mayorAumentoPorcentaje * 100) / 100,
    };

    return NextResponse.json<InflacionResponse>({
      success: true,
      data: {
        productos: productosInflacion,
        resumen,
      },
    });

  } catch (error) {
    console.error('Error en /api/inflacion:', error);
    return NextResponse.json<InflacionResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
}
