/**
 * Calculadoras Financieras Avanzadas
 * Funciones para calcular KPIs financieros del dashboard
 */

import { formatearMoneda } from '@/lib/formatters';

// ============================================================================
// TIPOS
// ============================================================================

export interface Compra {
  fecha: Date;
  total: number;
  descripcion: string;
  tienda: string;
  precio_unitario: number;
}

export interface ProveedorStats {
  proveedor: string;
  total_gastado: number;
  num_compras: number;
  precio_promedio: number;
  ultima_compra: Date;
  disponibilidad: number; // % de días con compras en los últimos 90 días
}

interface ProductoPrecioHistorico {
  producto: string;
  precio: number;
  fecha: Date;
}

export interface KPIsAvanzados {
  // Margen de ahorro
  margen_ahorro: {
    presupuesto: number;
    gastado: number;
    margen_eur: number;
    margen_porcentaje: number;
    estado: 'positivo' | 'negativo' | 'neutral';
  } | null;

  // Velocidad de gasto
  velocidad_gasto: {
    gasto_diario_promedio: number;
    dias_restantes_mes: number;
    proyeccion_mensual: number;
    alerta_exceso: boolean;
  } | null;

  // Índice de inflación
  inflacion: {
    variacion_promedio: number;
    productos_con_aumento: number;
    productos_analizados: number;
    productos_top_inflacion: Array<{
      producto: string;
      variacion_porcentaje: number;
      precio_actual: number;
      precio_anterior: number;
    }>;
  } | null;

  // Score de proveedor
  scores_proveedores: Array<{
    proveedor: string;
    score: number; // 1-5
    score_precio: number;
    score_frecuencia: number;
    score_disponibilidad: number;
    total_compras: number;
    gasto_total: number;
  }>;

  // Tasa de compras
  tasa_compras: {
    compras_por_dia: number;
    compras_por_semana: number;
    compras_por_mes: number;
    tendencia: 'alcista' | 'bajista' | 'estable';
    variacion_semana_anterior: number;
  };
}

interface PeriodInfo {
  anio: number;
  mes: number;
  dias_en_mes: number;
  dia_actual: number;
  dias_restantes: number;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtiene información del periodo actual
 */
function getPeriodInfo(anio: number, mes: number): PeriodInfo {
  const ahora = new Date();
  const diaActual = ahora.getDate();
  const diasEnMes = new Date(anio, mes, 0).getDate();
  const diasRestantes = diasEnMes - diaActual;

  return {
    anio,
    mes,
    dias_en_mes: diasEnMes,
    dia_actual: diaActual,
    dias_restantes: Math.max(0, diasRestantes),
  };
}

/**
 * Calcula el promedio de un array de números
 */
function promedio(numeros: number[]): number {
  if (numeros.length === 0) return 0;
  return numeros.reduce((sum, n) => sum + n, 0) / numeros.length;
}

/**
 * Calcula la desviación estándar
 */
function desviacionEstandar(numeros: number[]): number {
  if (numeros.length < 2) return 0;
  const media = promedio(numeros);
  const variance = numeros.reduce((sum, n) => sum + Math.pow(n - media, 2), 0) / (numeros.length - 1);
  return Math.sqrt(variance);
}

// ============================================================================
// MARGEN DE AHORRO
// ============================================================================

/**
 * Calcula el margen de ahorro (Presupuesto - Gasto) / Presupuesto × 100
 */
export function calcularMargenAhorro(
  gastado: number,
  presupuesto: number
): KPIsAvanzados['margen_ahorro'] {
  if (!presupuesto || presupuesto <= 0) return null;

  const margenEur = presupuesto - gastado;
  const margenPorcentaje = (margenEur / presupuesto) * 100;

  let estado: 'positivo' | 'negativo' | 'neutral' = 'neutral';
  if (margenPorcentaje > 10) estado = 'positivo';
  else if (margenPorcentaje < -10) estado = 'negativo';

  return {
    presupuesto,
    gastado,
    margen_eur: Math.round(margenEur * 100) / 100,
    margen_porcentaje: Math.round(margenPorcentaje * 10) / 10,
    estado,
  };
}

// ============================================================================
// VELOCIDAD DE GASTO
// ============================================================================

/**
 * Calcula la velocidad de gasto: Gasto diario promedio × días restantes del mes
 */
export function calcularVelocidadGasto(
  compras: Compra[],
  anio: number,
  mes: number
): KPIsAvanzados['velocidad_gasto'] {
  if (!compras || compras.length === 0) return null;

  const periodInfo = getPeriodInfo(anio, mes);
  const ahora = new Date();

  // Filtrar compras del mes actual hasta hoy
  const comprasDelMes = compras.filter((c) => {
    const fechaCompra = new Date(c.fecha);
    return (
      fechaCompra.getMonth() + 1 === mes &&
      fechaCompra.getFullYear() === anio &&
      fechaCompra <= ahora
    );
  });

  if (comprasDelMes.length === 0) return null;

  const totalGastado = comprasDelMes.reduce((sum, c) => sum + c.total, 0);
  const gastoDiarioPromedio = totalGastado / periodInfo.dia_actual;
  const proyeccionMensual = gastoDiarioPromedio * periodInfo.dias_en_mes;

  // Calcular alerta de exceso (usando presupuesto si existe)
  const alertaExceso = proyeccionMensual > totalGastado * 1.2;

  return {
    gasto_diario_promedio: Math.round(gastoDiarioPromedio * 100) / 100,
    dias_restantes_mes: periodInfo.dias_restantes,
    proyeccion_mensual: Math.round(proyeccionMensual * 100) / 100,
    alerta_exceso: alertaExceso,
  };
}

// ============================================================================
// ÍNDICE DE INFLACIÓN
// ============================================================================

/**
 * Calcula el índice de inflación de productos recurrentes
 */
export function calcularIndiceInflacion(
  compras: Compra[],
  umbralAumento: number = 5
): KPIsAvanzados['inflacion'] {
  if (!compras || compras.length < 2) return null;

  // Agrupar compras por producto (case insensitive)
  const productosMap = new Map<string, ProductoPrecioHistorico[]>();

  compras.forEach((compra) => {
    const nombre = compra.descripcion.toLowerCase().trim();
    if (!productosMap.has(nombre)) {
      productosMap.set(nombre, []);
    }
    productosMap.get(nombre)!.push({
      producto: compra.descripcion,
      precio: compra.precio_unitario,
      fecha: new Date(compra.fecha),
    });
  });

  // Calcular variación para productos comprados ≥ 3 veces
  const variaciones: Array<{
    producto: string;
    variacion_porcentaje: number;
    precio_actual: number;
    precio_anterior: number;
  }> = [];

  productosMap.forEach((historial, nombre) => {
    if (historial.length < 3) return;

    // Ordenar por fecha
    historial.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

    // Calcular variación promedio entre compras consecutivas
    const variacionesProducto: number[] = [];
    for (let i = 1; i < historial.length; i++) {
      const precioAnterior = historial[i - 1].precio;
      const precioActual = historial[i].precio;

      if (precioAnterior > 0) {
        const variacion = ((precioActual - precioAnterior) / precioAnterior) * 100;
        variacionesProducto.push(variacion);
      }
    }

    if (variacionesProducto.length > 0) {
      const variacionPromedio = promedio(variacionesProducto);

      if (variacionPromedio !== 0) {
        variaciones.push({
          producto: historial[0].producto,
          variacion_porcentaje: Math.round(variacionPromedio * 10) / 10,
          precio_actual: historial[historial.length - 1].precio,
          precio_anterior: historial[0].precio,
        });
      }
    }
  });

  if (variaciones.length === 0) {
    return {
      variacion_promedio: 0,
      productos_con_aumento: 0,
      productos_analizados: 0,
      productos_top_inflacion: [],
    };
  }

  // Filtrar productos con aumento significativo
  const productosConAumento = variaciones.filter((v) => v.variacion_porcentaje > umbralAumento);
  const variacionPromedioGlobal = promedio(variaciones.map((v) => v.variacion_porcentaje));

  // Ordenar por variación descendente y tomar top 10
  const topInflacion = productosConAumento
    .sort((a, b) => b.variacion_porcentaje - a.variacion_porcentaje)
    .slice(0, 10);

  return {
    variacion_promedio: Math.round(variacionPromedioGlobal * 10) / 10,
    productos_con_aumento: productosConAumento.length,
    productos_analizados: variaciones.length,
    productos_top_inflacion: topInflacion,
  };
}

// ============================================================================
// SCORE DE PROVEEDOR
// ============================================================================

/**
 * Calcula el score de proveedor (1-5) basado en precio, frecuencia y disponibilidad
 */
export function calcularScoreProveedor(stats: ProveedorStats[]): KPIsAvanzados['scores_proveedores'] {
  if (!stats || stats.length === 0) return [];

  // Calcular máximos para normalización
  const maxGasto = Math.max(...stats.map((s) => s.total_gastado));
  const maxCompras = Math.max(...stats.map((s) => s.num_compras));

  return stats.map((stat) => {
    // Score de precio (menor precio promedio = mejor score)
    // Invertimos: menor precio -> mayor score
    const scorePrecio =
      maxGasto > 0 ? 5 - (stat.precio_promedio / (maxGasto / maxCompras)) * 2 : 3;
    const scorePrecioNormalizado = Math.max(1, Math.min(5, scorePrecio));

    // Score de frecuencia (más compras = mejor score)
    const scoreFrecuencia =
      maxCompras > 0 ? 1 + (stat.num_compras / maxCompras) * 4 : 3;
    const scoreFrecuenciaNormalizado = Math.max(1, Math.min(5, scoreFrecuencia));

    // Score de disponibilidad (ya viene en %)
    const scoreDisponibilidad = 1 + (stat.disponibilidad / 100) * 4;

    // Score ponderado (40% precio, 35% frecuencia, 25% disponibilidad)
    const scorePonderado =
      scorePrecioNormalizado * 0.4 +
      scoreFrecuenciaNormalizado * 0.35 +
      scoreDisponibilidad * 0.25;

    return {
      proveedor: stat.proveedor,
      score: Math.round(scorePonderado * 10) / 10,
      score_precio: Math.round(scorePrecioNormalizado * 10) / 10,
      score_frecuencia: Math.round(scoreFrecuenciaNormalizado * 10) / 10,
      score_disponibilidad: Math.round(scoreDisponibilidad * 10) / 10,
      total_compras: stat.num_compras,
      gasto_total: stat.total_gastado,
    };
  })
  .sort((a, b) => b.score - a.score); // Ordenar por score descendente
}

// ============================================================================
// TASA DE COMPRAS
// ============================================================================

/**
 * Calcula la tasa de compras por día/semana/mes
 */
export function calcularTasaCompras(
  compras: Compra[],
  anio: number,
  mes: number
): KPIsAvanzados['tasa_compras'] {
  if (!compras || compras.length === 0) {
    return {
      compras_por_dia: 0,
      compras_por_semana: 0,
      compras_por_mes: 0,
      tendencia: 'estable',
      variacion_semana_anterior: 0,
    };
  }

  const periodInfo = getPeriodInfo(anio, mes);
  const ahora = new Date();

  // Filtrar compras del mes
  const comprasDelMes = compras.filter((c) => {
    const fechaCompra = new Date(c.fecha);
    return (
      fechaCompra.getMonth() + 1 === mes &&
      fechaCompra.getFullYear() === anio
    );
  });

  // Compras por día
  const comprasPorDia = comprasDelMes.length / periodInfo.dia_actual;
  const comprasPorSemana = comprasPorDia * 7;
  const comprasPorMes = comprasDelMes.length;

  // Calcular tendencia comparando con semana anterior
  const unaSemanaAtras = new Date(ahora);
  unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7);

  const dosSemanasAtras = new Date(ahora);
  dosSemanasAtras.setDate(dosSemanasAtras.getDate() - 14);

  const comprasSemanaActual = comprasDelMes.filter(
    (c) => new Date(c.fecha) >= unaSemanaAtras
  ).length;

  const comprasSemanaAnterior = comprasDelMes.filter(
    (c) => {
      const fecha = new Date(c.fecha);
      return fecha >= dosSemanasAtras && fecha < unaSemanaAtras;
    }
  ).length;

  let tendencia: 'alcista' | 'bajista' | 'estable' = 'estable';
  let variacion = 0;

  if (comprasSemanaAnterior > 0) {
    variacion = ((comprasSemanaActual - comprasSemanaAnterior) / comprasSemanaAnterior) * 100;

    if (variacion > 10) tendencia = 'alcista';
    else if (variacion < -10) tendencia = 'bajista';
  }

  return {
    compras_por_dia: Math.round(comprasPorDia * 100) / 100,
    compras_por_semana: Math.round(comprasPorSemana * 100) / 100,
    compras_por_mes: comprasPorMes,
    tendencia,
    variacion_semana_anterior: Math.round(variacion * 10) / 10,
  };
}

// ============================================================================
// CÁLCULO COMPLETO DE KPIS
// ============================================================================

/**
 * Calcula todos los KPIs avanzados en una sola llamada
 */
export async function calcularKPIsAvanzados(
  compras: Compra[],
  presupuesto?: number,
  anio?: number,
  mes?: number,
  statsProveedores?: ProveedorStats[]
): Promise<KPIsAvanzados> {
  const ahora = new Date();
  const anioCalculo = anio ?? ahora.getFullYear();
  const mesCalculo = mes ?? ahora.getMonth() + 1;

  // Calcular gasto total del mes
  const comprasDelMes = compras.filter((c) => {
    const fechaCompra = new Date(c.fecha);
    return (
      fechaCompra.getMonth() + 1 === mesCalculo &&
      fechaCompra.getFullYear() === anioCalculo
    );
  });
  const gastado = comprasDelMes.reduce((sum, c) => sum + c.total, 0);

  return {
    margen_ahorro: calcularMargenAhorro(gastado, presupuesto || 0),
    velocidad_gasto: calcularVelocidadGasto(compras, anioCalculo, mesCalculo),
    inflacion: calcularIndiceInflacion(compras),
    scores_proveedores: statsProveedores ? calcularScoreProveedor(statsProveedores) : [],
    tasa_compras: calcularTasaCompras(compras, anioCalculo, mesCalculo),
  };
}
