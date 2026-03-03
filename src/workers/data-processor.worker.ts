/**
 * Web Worker para procesamiento pesado de datos
 * Mueve cálculos intensivos fuera del hilo principal para evitar bloqueos
 */

// Tipos para los mensajes
interface WorkerMessage {
  type: 'filter' | 'sort' | 'calculate-kpis' | 'process-raw-data';
  id: string;
  data: any;
}

interface WorkerResponse {
  type: 'success' | 'error';
  id: string;
  result?: any;
  error?: string;
}

// Funciones de utilidad
const normalizarTexto = (texto: string): string => {
  return texto.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const parsearFecha = (fechaStr: string): Date | null => {
  if (!fechaStr) return null;
  const fecha = new Date(fechaStr);
  return isNaN(fecha.getTime()) ? null : fecha;
};

const formatearMoneda = (cantidad: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cantidad);
};

/**
 * Filtrar compras según criterios
 */
function filterCompras(data: {
  compras: any[];
  filtros: any;
}): any[] {
  const { compras, filtros } = data;

  return compras.filter((compra: any) => {
    // Filtro por búsqueda de producto
    if (filtros.busqueda) {
      const busquedaNormalizada = normalizarTexto(filtros.busqueda);
      const productoNormalizado = normalizarTexto(compra.producto || '');
      if (!productoNormalizado.includes(busquedaNormalizada)) {
        return false;
      }
    }

    // Filtro por tiendas
    if (filtros.tiendas && filtros.tiendas.length > 0) {
      const tiendaNormalizada = normalizarTexto(compra.tienda || '');
      const tiendasFiltradas = filtros.tiendas.map((t: string) => normalizarTexto(t));
      if (!tiendasFiltradas.some((t: string) => tiendaNormalizada.includes(t))) {
        return false;
      }
    }

    // Filtro por rango de fechas
    const fechaCompra = parsearFecha(compra.fecha);
    if (fechaCompra) {
      if (filtros.fechaInicio && fechaCompra < filtros.fechaInicio) {
        return false;
      }
      if (filtros.fechaFin && fechaCompra > filtros.fechaFin) {
        return false;
      }
    }

    // Filtro por rango de precios
    const precio = parseFloat(compra.precioUnitario || '0');
    if (!isNaN(precio)) {
      if (filtros.precioMin !== null && precio < filtros.precioMin) {
        return false;
      }
      if (filtros.precioMax !== null && precio > filtros.precioMax) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Ordenar compras
 */
function sortCompras(data: {
  compras: any[];
  sortField: string;
  sortOrder: 'asc' | 'desc';
}): any[] {
  const { compras, sortField, sortOrder } = data;
  const multiplier = sortOrder === 'asc' ? 1 : -1;

  return [...compras].sort((a: any, b: any) => {
    let valA: any, valB: any;

    switch (sortField) {
      case 'fecha':
        valA = parsearFecha(a.fecha)?.getTime() || 0;
        valB = parsearFecha(b.fecha)?.getTime() || 0;
        break;
      case 'tienda':
        valA = normalizarTexto(a.tienda || '');
        valB = normalizarTexto(b.tienda || '');
        break;
      case 'producto':
        valA = normalizarTexto(a.producto || '');
        valB = normalizarTexto(b.producto || '');
        break;
      case 'cantidad':
        valA = parseFloat(a.cantidad) || 0;
        valB = parseFloat(b.cantidad) || 0;
        break;
      case 'precio':
        valA = parseFloat(a.precioUnitario) || 0;
        valB = parseFloat(b.precioUnitario) || 0;
        break;
      case 'total':
        valA = parseFloat(a.total) || 0;
        valB = parseFloat(b.total) || 0;
        break;
      default:
        return 0;
    }

    if (valA < valB) return -1 * multiplier;
    if (valA > valB) return 1 * multiplier;
    return 0;
  });
}

/**
 * Calcular KPIs
 */
function calculateKPIs(data: {
  compras: any[];
}): any {
  const { compras } = data;

  if (!compras || compras.length === 0) {
    return {
      gastoTotal: 0,
      gastoQuincenal: 0,
      comprasMes: 0,
      variacion: 0,
    };
  }

  const hoy = new Date();
  const hace15Dias = new Date(hoy);
  hace15Dias.setDate(hoy.getDate() - 15);

  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const mesPasadoInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const mesPasadoFin = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59, 999);

  // Gasto total (todas las compras)
  const gastoTotal = compras.reduce((sum: number, c: any) => sum + (parseFloat(c.total) || 0), 0);

  // Gasto quincenal (últimos 15 días)
  const gastoQuincenal = compras
    .filter((c: any) => {
      const fecha = parsearFecha(c.fecha);
      return fecha && fecha >= hace15Dias && fecha <= hoy;
    })
    .reduce((sum: number, c: any) => sum + (parseFloat(c.total) || 0), 0);

  // Compras del mes
  const comprasMes = compras
    .filter((c: any) => {
      const fecha = parsearFecha(c.fecha);
      return fecha && fecha >= inicioMes && fecha <= hoy;
    })
    .reduce((sum: number, c: any) => sum + (parseFloat(c.total) || 0), 0);

  // Variación vs mes pasado
  const gastoMesPasado = compras
    .filter((c: any) => {
      const fecha = parsearFecha(c.fecha);
      return fecha && fecha >= mesPasadoInicio && fecha <= mesPasadoFin;
    })
    .reduce((sum: number, c: any) => sum + (parseFloat(c.total) || 0), 0);

  const variacion = gastoMesPasado > 0
    ? ((comprasMes - gastoMesPasado) / gastoMesPasado) * 100
    : 0;

  return {
    gastoTotal,
    gastoQuincenal,
    comprasMes,
    variacion,
  };
}

/**
 * Procesar datos crudos de Sheets
 */
function processRawData(data: {
  values: string[][];
  sheetName: string;
}): any[] {
  const { values, sheetName } = data;

  if (!values || values.length < 2) return [];

  const headers = values[0].map((h: string) => h.toLowerCase().trim());
  const idxProducto = headers.findIndex(h => h.includes('producto') || h === 'producto');
  const idxTienda = headers.findIndex(h => h.includes('tienda') || h === 'tienda');
  const idxFecha = headers.findIndex(h => h.includes('fecha') || h === 'fecha');
  const idxCantidad = headers.findIndex(h => h.includes('cantidad') || h === 'cant' || h === 'uds');
  const idxPrecio = headers.findIndex(h => h.includes('precio') || h === 'precio' || h === '€');
  const idxTotal = headers.findIndex(h => h.includes('total') || h === 'importe');

  if (idxProducto === -1) return [];

  const compras: any[] = [];

  for (let i = 1; i < values.length; i++) {
    const fila = values[i];
    if (!fila || fila.length < Math.max(idxProducto, idxTotal) + 1) continue;

    const producto = String(fila[idxProducto] || '').trim();
    if (!producto) continue;

    const cantidad = parseFloat(String(fila[idxCantidad] || '1')) || 1;
    const precioUnitario = parseFloat(String(fila[idxPrecio] || '0')) || 0;
    const total = idxTotal >= 0
      ? (parseFloat(String(fila[idxTotal] || '0')) || 0)
      : cantidad * precioUnitario;

    compras.push({
      producto,
      tienda: idxTienda >= 0 ? String(fila[idxTienda] || '').trim() : 'Desconocida',
      fecha: idxFecha >= 0 ? String(fila[idxFecha] || '').trim() : new Date().toISOString(),
      cantidad,
      precioUnitario,
      total,
    });
  }

  return compras;
}

// Escuchar mensajes
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, id, data } = event.data;

  try {
    let result: any;

    switch (type) {
      case 'filter':
        result = filterCompras(data);
        break;

      case 'sort':
        result = sortCompras(data);
        break;

      case 'calculate-kpis':
        result = calculateKPIs(data);
        break;

      case 'process-raw-data':
        result = processRawData(data);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    const response: WorkerResponse = {
      type: 'success',
      id,
      result,
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      id,
      error: error instanceof Error ? error.message : String(error),
    };

    self.postMessage(response);
  }
});

// Exportar para TypeScript
export {};
