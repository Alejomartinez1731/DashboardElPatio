import type { Compra, AlertaPrecio, SheetCompraRaw, ProductoCostoso, GastoPorTiendaRaw, PrecioProductoRaw, Proveedor, Factura } from '@/types';

// Colores asignados por tienda según los requisitos
export const COLORES_TIENDA: Record<string, string> = {
  'Mercadona': '#10b981',
  'BonArea': '#3b82f6',
  'Lidl': '#f59e0b',
  'Carrefour': '#ef4444',
  'Aldi': '#8b5cf6',
  'Consum': '#ec4899',
  'Otros': '#64748b',
};

/**
 * Normaliza nombres de tienda inconsistentes
 * Convierte variaciones como "MERCADONA, S.A.", "Mercadona", "mercadona" → "Mercadona"
 */
export function normalizarTienda(tienda: string): string {
  if (!tienda) return 'Otros';

  const nombre = tienda.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Quitar acentos
    .trim();

  // Mapeo explícito según requisitos
  if (nombre.includes('mercadona')) return 'Mercadona';
  if (nombre.includes('bonarea') || nombre.includes('bon area') || nombre.includes('bonificación')) return 'BonArea';
  if (nombre.includes('lidl')) return 'Lidl';
  if (nombre.includes('carrefour')) return 'Carrefour';
  if (nombre.includes('aldi')) return 'Aldi';
  if (nombre.includes('consum')) return 'Consum';
  if (nombre.includes('eroski')) return 'Eroski';
  if (nombre.includes('dia') && !nombre.includes('media')) return 'Dia';
  if (nombre.includes('condis')) return 'Condis';
  if (nombre.includes('caprabo')) return 'Caprabo';

  // Si no coincide con ninguna conocida, capitalizar y quitar sufijos corporativos
  const limpio = (tienda || '').replace(/,?\s*(S\.?A\.?|S\.?L\.?)$/i, '').trim();

  // Verificar si ya está en el mapa de colores
  if (COLORES_TIENDA[limpio]) {
    return limpio;
  }

  return limpio || 'Otros';
}

/**
 * Normaliza fechas en formato DD/MM/YYYY
 */
export function normalizarFecha(fecha: string | Date): Date {
  if (fecha instanceof Date) {
    return isNaN(fecha.getTime()) ? new Date() : fecha;
  }

  if (!fecha || typeof fecha !== 'string') {
    return new Date();
  }

  // Manejar formato DD/MM/YYYY
  if (fecha.includes('/')) {
    const partes = fecha.split('/');
    if (partes.length === 3) {
      const [dia, mes, anio] = partes.map(p => parseInt(p.trim(), 10));
      if (!isNaN(dia) && !isNaN(mes) && !isNaN(anio)) {
        return new Date(anio, mes - 1, dia);
      }
    }
  }

  // Manejar formatos ISO u otros
  const parsed = new Date(fecha);
  if (isNaN(parsed.getTime())) {
    console.warn(`Fecha inválida: ${fecha}`);
    return new Date();
  }

  return parsed;
}

/**
 * Busca productos por coincidencia parcial (case-insensitive, sin acentos)
 */
export function buscarProducto(query: string, descripcion: string): boolean {
  if (!query) return true;
  if (!descripcion) return false;

  const normalize = (s: string) => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  return normalize(descripcion).includes(normalize(query));
}

/**
 * Excluye filas de resumen (TOTAL, IVA, etc.)
 */
export function excluirFilaResumen(descripcion: string): boolean {
  if (!descripcion) return true;

  const exclusiones = [
    'suma total', 'total general',
    'total', 'subtotal', 'sub-total',
    'iva', 'vat', 'tax',
    'base imponible', 'base',
    'recargo', 'equivalencia',
    'devolución', 'devolucion', 'devoluc',
    '-', '',
  ];

  const descLower = descripcion.toLowerCase().trim();

  return exclusiones.some(exclusion => descLower.includes(exclusion) || descLower === exclusion);
}

/**
 * Procesa filas crudas de Google Sheets a objetos Compra
 */
export function procesarFilaCompra(fila: SheetCompraRaw, index: number): Compra | null {
  const descripcion = fila.descripcion?.toString() || '';

  // Excluir filas de resumen
  if (excluirFilaResumen(descripcion)) {
    return null;
  }

  return {
    id: `compra-${index}-${Date.now()}`,
    fecha: normalizarFecha(fila.fecha),
    tienda: normalizarTienda(fila.tienda || ''),
    producto: descripcion,
    cantidad: parseFloat(fila.cantidad?.toString() || '0') || 0,
    precioUnitario: parseFloat(fila.precioUnitario?.toString() || '0') || 0,
    total: parseFloat(fila.total?.toString() || '0') || 0,
    telefono: fila.telefono,
    direccion: fila.direccion,
  };
}

/**
 * Detecta alertas de precio (aumentos > umbral%)
 */
export function detectarAlertasPrecio(compras: Compra[], umbral: number = 5): AlertaPrecio[] {
  // Agrupar compras por producto y tienda
  const historial: Record<string, Compra[]> = {};

  compras.forEach(compra => {
    const key = `${compra.producto}-${compra.tienda}`;
    if (!historial[key]) {
      historial[key] = [];
    }
    historial[key].push(compra);
  });

  const alertas: AlertaPrecio[] = [];

  Object.entries(historial).forEach(([key, historialCompras]) => {
    // Ordenar por fecha descendente
    historialCompras.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    if (historialCompras.length >= 2) {
      const precioActual = historialCompras[0].precioUnitario;
      const precioAnterior = historialCompras[1].precioUnitario;

      const variacion = ((precioActual - precioAnterior) / precioAnterior) * 100;

      if (variacion > umbral) {
        alertas.push({
          id: `alerta-${key}-${Date.now()}`,
          producto: historialCompras[0].producto,
          tienda: historialCompras[0].tienda,
          precioActual,
          precioAnterior,
          variacionPorcentaje: variacion,
          fecha: historialCompras[0].fecha,
        });
      }
    }
  });

  // Ordenar alertas por mayor porcentaje de subida
  return alertas.sort((a, b) => b.variacionPorcentaje - a.variacionPorcentaje);
}

/**
 * Filtra compras por criterios múltiples
 */
export function filtrarCompras(
  compras: Compra[],
  filtros: {
    fechaInicio?: Date;
    fechaFin?: Date;
    tienda?: string;
    busqueda?: string;
  }
): Compra[] {
  return compras.filter(compra => {
    // Filtro de rango de fechas
    if (filtros.fechaInicio) {
      const fechaInicio = new Date(filtros.fechaInicio);
      fechaInicio.setHours(0, 0, 0, 0);
      if (compra.fecha < fechaInicio) return false;
    }

    if (filtros.fechaFin) {
      const fechaFin = new Date(filtros.fechaFin);
      fechaFin.setHours(23, 59, 59, 999);
      if (compra.fecha > fechaFin) return false;
    }

    // Filtro de tienda
    if (filtros.tienda && compra.tienda !== filtros.tienda) {
      return false;
    }

    // Filtro de búsqueda
    if (filtros.busqueda && !buscarProducto(filtros.busqueda, compra.producto)) {
      return false;
    }

    return true;
  });
}

/**
 * Procesa productos costosos desde datos crudos
 */
export function procesarProductoCostoso(fila: PrecioProductoRaw, index: number): ProductoCostoso {
  return {
    descripcion: fila.descripcion || '',
    precioMaximo: parseFloat(fila.sumaPrecioUnitario?.toString() || '0') || 0,
    posicion: index + 1,
  };
}

/**
 * Procesa datos de gasto por tienda
 */
export function procesarGastoPorTienda(fila: GastoPorTiendaRaw): { tienda: string; monto: number } {
  return {
    tienda: normalizarTienda(fila.tienda || ''),
    monto: parseFloat(fila.sumaTotal?.toString() || '0') || 0,
  };
}

/**
 * Agrupa compras por factura (fecha + tienda)
 */
export function agruparPorFactura(compras: Compra[]): Factura[] {
  const grupos: Record<string, Compra[]> = {};

  compras.forEach(compra => {
    const fechaStr = compra.fecha.toISOString().split('T')[0];
    const key = `${fechaStr}-${compra.tienda}`;
    if (!grupos[key]) {
      grupos[key] = [];
    }
    grupos[key].push(compra);
  });

  return Object.entries(grupos).map(([key, items]) => {
    const primera = items[0];
    const total = items.reduce((sum, item) => sum + item.total, 0);

    return {
      id: `factura-${key}`,
      fecha: primera.fecha,
      tienda: primera.tienda,
      total,
      numProductos: items.length,
      items,
    };
  }).sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
}

/**
 * Genera información de proveedor desde compras
 */
export function generarInfoProveedor(tienda: string, compras: Compra[]): Proveedor {
  const comprasTienda = compras.filter(c => c.tienda === tienda);

  return {
    id: `proveedor-${tienda}`,
    tienda,
    telefono: comprasTienda.find(c => c.telefono)?.telefono,
    direccion: comprasTienda.find(c => c.direccion)?.direccion,
    totalGastado: comprasTienda.reduce((sum, c) => sum + c.total, 0),
    numCompras: comprasTienda.length,
    ultimaCompra: comprasTienda.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())[0]?.fecha || new Date(),
  };
}

/**
 * Obtiene productos únicos ordenados alfabéticamente
 */
export function obtenerProductosUnicos(compras: Compra[]): string[] {
  const productos = new Set<string>();
  compras.forEach(compra => {
    if (compra.producto && !excluirFilaResumen(compra.producto)) {
      productos.add(compra.producto);
    }
  });

  return Array.from(productos).sort();
}

/**
 * Obtiene tiendas únicas
 */
export function obtenerTiendasUnicas(compras: Compra[]): string[] {
  const tiendas = new Set<string>();
  compras.forEach(compra => {
    tiendas.add(compra.tienda);
  });

  return Array.from(tiendas).sort();
}

/**
 * Calcula KPIs desde compras
 * @param compras - Lista de compras procesadas
 * @param historicoPreciosValues - Datos crudos de historico_precios (array de arrays)
 * @param registroDiarioValues - Datos crudos de registro_diario (array de arrays)
 */
export function calcularKPIs(
  compras: Compra[],
  historicoPreciosValues: string[][] = [],
  registroDiarioValues: string[][] = []
): {
  gastoQuincenal: number;
  facturasProcesadas: number;
  alertasDePrecio: number;
} {
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);

  const hace15Dias = new Date(hoy);
  hace15Dias.setDate(hace15Dias.getDate() - 15);
  hace15Dias.setHours(0, 0, 0, 0);

  console.log('📅 Fecha actual (hoy):', hoy.toISOString());
  console.log('📅 Fecha hace 15 días:', hace15Dias.toISOString());

  // Gasto quincenal desde historico_precios (últimos 15 días)
  let gastoQuincenal = 0;

  if (historicoPreciosValues.length > 1) {
    const cabeceras = historicoPreciosValues[0].map((h: string) => h.toLowerCase().trim());
    const idxFecha = cabeceras.indexOf('fecha');
    const idxTotal = cabeceras.indexOf('total');

    if (idxFecha !== -1 && idxTotal !== -1) {
      for (let i = 1; i < historicoPreciosValues.length; i++) {
        const fila = historicoPreciosValues[i];
        const fechaStr = fila[idxFecha];
        const totalStr = fila[idxTotal];

        if (fechaStr && totalStr) {
          const fechaCompra = normalizarFecha(fechaStr);
          if (fechaCompra >= hace15Dias && fechaCompra <= hoy) {
            gastoQuincenal += parseFloat(totalStr) || 0;
          }
        }
      }
    }
  }

  // Facturas procesadas desde registro_diario (más actualizado)
  const facturasProcesadas = new Set<string>();

  if (registroDiarioValues.length > 1) {
    const cabeceras = registroDiarioValues[0].map((h: string) => h.toLowerCase().trim());
    const idxFecha = cabeceras.indexOf('fecha');
    const idxTienda = cabeceras.indexOf('tienda');

    if (idxFecha !== -1 && idxTienda !== -1) {
      for (let i = 1; i < registroDiarioValues.length; i++) {
        const fila = registroDiarioValues[i];
        const fechaStr = fila[idxFecha];
        const tiendaStr = fila[idxTienda];

        if (fechaStr && tiendaStr) {
          const fechaCompra = normalizarFecha(fechaStr);
          // Contar todas las facturas de registro_diario (sin filtro de fecha)
          const key = `${fechaCompra.toDateString()}-${tiendaStr}`;
          facturasProcesadas.add(key);
        }
      }
    }
  }

  console.log('🧾 Facturas desde registro_diario:', facturasProcesadas.size);
  console.log('🧾 Facturas únicas:', Array.from(facturasProcesadas));

  // Alertas de precio
  const alertas = detectarAlertasPrecio(compras);

  return {
    gastoQuincenal,
    facturasProcesadas: facturasProcesadas.size,
    alertasDePrecio: alertas.length,
  };
}
