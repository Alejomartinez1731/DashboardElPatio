/**
 * Sistema de Alertas de Gasto
 * Detecta condiciones de alerta basadas en presupuestos y precios
 * Incluye caché de 5 minutos para reducir invocaciones a APIs
 */

import { requireSupabase } from './supabase';

export interface Alert {
  id: string;
  tipo: 'presupuesto_mensual' | 'presupuesto_categoria' | 'precio_alta' | 'recordatorio_vencido';
  severidad: 'info' | 'warning' | 'danger' | 'success';
  titulo: string;
  mensaje: string;
  timestamp: Date;
  leida: boolean;
  metadata?: Record<string, any>;
}

export interface AlertCheckResult {
  alertas: Alert[];
  totalNuevas: number;
}

/**
 * Caché en memoria para resultados de alertas
 * TTL: 5 minutos (300,000 ms)
 */
interface CacheEntry {
  data: AlertCheckResult;
  timestamp: number;
}

const ALERTS_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const RECORDATORIOS_CACHE_TTL = 5 * 60 * 1000; // 5 minutos para recordatorios

/**
 * Verifica si una entrada de caché es válida
 */
function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * Obtiene resultado desde caché o null si expiró/no existe
 */
function getFromCache(presupuestoMensual: number): AlertCheckResult | null {
  const cacheKey = `alerts-${presupuestoMensual}`;
  const entry = ALERTS_CACHE.get(cacheKey);

  if (entry && isCacheValid(entry)) {
    return entry.data;
  }

  // Eliminar entrada expirada
  if (entry) {
    ALERTS_CACHE.delete(cacheKey);
  }

  return null;
}

/**
 * Guarda resultado en caché
 */
function saveToCache(presupuestoMensual: number, data: AlertCheckResult): void {
  const cacheKey = `alerts-${presupuestoMensual}`;
  ALERTS_CACHE.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Verifica si se excedió el porcentaje del presupuesto
 */
function verificarExcesoPresupuesto(gasto: number, presupuesto: number, umbral: number = 80): boolean {
  if (presupuesto === 0) return false;
  const porcentaje = (gasto / presupuesto) * 100;
  return porcentaje >= umbral;
}

/**
 * Calcula el porcentaje de presupuesto usado
 */
function calcularPorcentajeUsado(gasto: number, presupuesto: number): number {
  if (presupuesto === 0) return 0;
  return Math.round((gasto / presupuesto) * 100);
}

/**
 * Genera ID único para alerta
 */
function generarAlertId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Obtiene el gasto actual del mes
 */
async function obtenerGastoMesActual(anio: number, mes: number): Promise<number> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('compras')
    .select('total')
    .gte('fecha', `${anio}-${mes.toString().padStart(2, '0')}-01`)
    .lt('fecha', `${anio}-${(mes + 1).toString().padStart(2, '0')}-01`);

  if (error || !data) return 0;

  return data.reduce((sum, c) => sum + (c.total || 0), 0);
}

/**
 * Obtiene el gasto por categoría del mes
 */
async function obtenerGastoPorCategoria(anio: number, mes: number): Promise<Record<string, number>> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('vista_gasto_por_categoria')
    .select('*')
    .eq('anio', anio)
    .eq('mes', mes);

  if (error || !data) return {};

  const gastosPorCategoria: Record<string, number> = {};
  data.forEach((item: any) => {
    gastosPorCategoria[item.categoria] = item.gasto_total;
  });

  return gastosPorCategoria;
}

/**
 * Obtiene presupuestos configurados
 */
async function obtenerPresupuestos(anio: number, mes: number): Promise<{
  mensual: number;
  porCategoria: Record<string, number>;
}> {
  const supabase = requireSupabase();

  // Presupuesto mensual general
  const { data: presupuestoMensual } = await supabase
    .from('presupuestos')
    .select('monto')
    .eq('anio', anio)
    .eq('mes', mes)
    .single();

  const mensual = presupuestoMensual?.monto || 0;

  // Presupuestos por categoría
  const { data: presupuestosCategoria } = await supabase
    .from('presupuestos_categoria')
    .select('*')
    .eq('anio', anio)
    .eq('mes', mes);

  const porCategoria: Record<string, number> = {};
  (presupuestosCategoria || []).forEach((p: any) => {
    porCategoria[p.categoria] = p.monto;
  });

  return { mensual, porCategoria };
}

/**
 * Detecta aumentos de precio significativos
 */
async function detectarAumentosPrecio(): Promise<Alert[]> {
  const supabase = requireSupabase();
  const alertas: Alert[] = [];

  // Obtener productos que se compran ≥ 3 veces
  const { data: compras } = await supabase
    .from('compras')
    .select('descripcion, precio_unitario, fecha, tienda')
    .order('fecha', { ascending: false })
    .limit(500);

  if (!compras || compras.length < 3) return alertas;

  // Agrupar por producto
  const productos = new Map<string, { precios: number[]; fechas: Date[]; }>();

  compras.forEach((compra) => {
    const producto = compra.descripcion.toLowerCase().trim();
    if (!productos.has(producto)) {
      productos.set(producto, { precios: [], fechas: [] });
    }
    productos.get(producto)!.precios.push(compra.precio_unitario);
    productos.get(producto)!.fechas.push(new Date(compra.fecha));
  });

  // Detectar aumentos > 10%
  productos.forEach((data, producto) => {
    if (data.precios.length < 3) return;

    const precios = data.precios;
    const precioAnterior = precios[precios.length - 2];
    const precioActual = precios[0];

    if (!precioAnterior || !precioActual) return;

    const variacion = ((precioActual - precioAnterior) / precioAnterior) * 100;

    if (variacion > 10) {
      alertas.push({
        id: generarAlertId(),
        tipo: 'precio_alta',
        severidad: 'warning',
        titulo: 'Aumento de precio detectado',
        mensaje: `${producto} aumentó ${variacion.toFixed(1)}% (€${precioAnterior.toFixed(2)} → €${precioActual.toFixed(2)})`,
        timestamp: new Date(),
        leida: false,
        metadata: {
          producto,
          variacion,
          precioAnterior,
          precioActual,
        },
      });
    }
  });

  return alertas;
}

/**
 * Obtiene recordatorios vencidos con caché de 5 minutos
 */
const recordatoriosCache: { data: any[]; timestamp: number } | null = null;

async function obtenerRecordatoriosVencidos(): Promise<Alert[]> {
  const alertas: Alert[] = [];

  // Verificar caché de recordatorios
  const now = Date.now();
  if (recordatoriosCache && (now - recordatoriosCache.timestamp) < RECORDATORIOS_CACHE_TTL) {
    // Usar datos cacheados
    const recordatoriosVencidos = (recordatoriosCache.data || []).filter(
      (r: any) => r.estado === 'vencido'
    );

    recordatoriosVencidos.forEach((r: any) => {
      alertas.push({
        id: generarAlertId(),
        tipo: 'recordatorio_vencido',
        severidad: 'danger',
        titulo: 'Recordatorio vencido',
        mensaje: `${r.producto} necesita reposición (hace ${r.diasTranscurridos || 0} días)`,
        timestamp: new Date(),
        leida: false,
        metadata: {
          producto: r.producto,
          diasTranscurridos: r.diasTranscurridos,
        },
      });
    });

    return alertas;
  }

  // Caché expirado o no existe - hacer fetch
  try {
    const response = await fetch('/api/recordatorios?incluirAutomaticos=true');
    const result = await response.json();

    if (!result.success) return alertas;

    // Guardar en caché
    (recordatoriosCache as any) = {
      data: result.data || [],
      timestamp: now,
    };

    const recordatoriosVencidos = (result.data || []).filter(
      (r: any) => r.estado === 'vencido'
    );

    recordatoriosVencidos.forEach((r: any) => {
      alertas.push({
        id: generarAlertId(),
        tipo: 'recordatorio_vencido',
        severidad: 'danger',
        titulo: 'Recordatorio vencido',
        mensaje: `${r.producto} necesita reposición (hace ${r.diasTranscurridos || 0} días)`,
        timestamp: new Date(),
        leida: false,
        metadata: {
          producto: r.producto,
          diasTranscurridos: r.diasTranscurridos,
        },
      });
    });
  } catch (error) {
    console.error('Error obteniendo recordatorios vencidos:', error);
  }

  return alertas;
}

/**
 * Verifica todas las alertas con caché de 5 minutos
 */
export async function verificarAlertas(
  presupuestoMensual: number = 3000
): Promise<AlertCheckResult> {
  // Verificar caché primero
  const cached = getFromCache(presupuestoMensual);
  if (cached) {
    return cached;
  }

  const alertas: Alert[] = [];

  try {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth() + 1;

    // Agrupar todas las consultas de Supabase en un solo Promise.all para optimización
    const [gastoMes, gastosPorCategoria, presupuestos, alertasPrecio] = await Promise.all([
      obtenerGastoMesActual(anio, mes),
      obtenerGastoPorCategoria(anio, mes),
      obtenerPresupuestos(anio, mes),
      detectarAumentosPrecio(),
    ]);

    // 1. Verificar presupuesto mensual
    const porcentajeMes = calcularPorcentajeUsado(gastoMes, presupuestoMensual);

    if (verificarExcesoPresupuesto(gastoMes, presupuestoMensual, 80)) {
      alertas.push({
        id: generarAlertId(),
        tipo: 'presupuesto_mensual',
        severidad: porcentajeMes >= 100 ? 'danger' : 'warning',
        titulo: `Presupuesto mensual: ${porcentajeMes}%`,
        mensaje: `Has gastado €${gastoMes.toFixed(2)} de €${presupuestoMensual.toFixed(2)}`,
        timestamp: new Date(),
        leida: false,
        metadata: { gasto: gastoMes, presupuesto: presupuestoMensual, porcentaje: porcentajeMes },
      });
    }

    // 2. Verificar presupuestos por categoría
    Object.entries(presupuestos.porCategoria).forEach(([categoria, presupuestoCat]) => {
      const gastoCat = gastosPorCategoria[categoria] || 0;
      const porcentajeCat = calcularPorcentajeUsado(gastoCat, presupuestoCat);

      if (verificarExcesoPresupuesto(gastoCat, presupuestoCat, 80)) {
        alertas.push({
          id: generarAlertId(),
          tipo: 'presupuesto_categoria',
          severidad: porcentajeCat >= 100 ? 'danger' : 'warning',
          titulo: `Presupuesto ${categoria}: ${porcentajeCat}%`,
          mensaje: `Has gastado €${gastoCat.toFixed(2)} de €${presupuestoCat.toFixed(2)}`,
          timestamp: new Date(),
          leida: false,
          metadata: { categoria, gasto: gastoCat, presupuesto: presupuestoCat, porcentaje: porcentajeCat },
        });
      }
    });

    // 3. Añadir alertas de precio (ya obtenidas en Promise.all)
    alertas.push(...alertasPrecio);

    // 4. Recordatorios vencidos (usa su propia caché interna)
    const alertasRecordatorios = await obtenerRecordatoriosVencidos();
    alertas.push(...alertasRecordatorios);

    // Ordenar por severidad y fecha
    const severidadOrder = { danger: 0, warning: 1, info: 2, success: 3 };
    alertas.sort((a, b) => {
      const sevA = severidadOrder[a.severidad];
      const sevB = severidadOrder[b.severidad];
      if (sevA !== sevB) return sevA - sevB;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    const result = {
      alertas,
      totalNuevas: alertas.filter(a => !a.leida).length,
    };

    // Guardar en caché
    saveToCache(presupuestoMensual, result);

    return result;

  } catch (error) {
    console.error('Error verificando alertas:', error);
    return { alertas: [], totalNuevas: 0 };
  }
}

/**
 * Marca alerta como leída
 */
export function marcarAlertaLeida(alertaId: string): void {
  // En una implementación completa, esto se guardaría en localStorage o base de datos
  // Por ahora, las alertas son volátiles y se regeneran en cada verificación
}
