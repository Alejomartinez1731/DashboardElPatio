// Tipos de datos para el Dashboard "El Patio & Grill"

// Datos de Google Sheets
export interface SheetRow {
  [key: string]: string | number;
}

// Datos retornados por Google Sheets API
export interface SheetData {
  range: string;
  values: string[][];
}

// Tipos de hojas disponibles
export type SheetName = 'historico' | 'historico_precios' | 'costosos' | 'gasto_tienda' | 'precio_producto';

// Datos de una compra normalizada
export interface Compra {
  id: string;
  fecha: Date;
  tienda: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  telefono?: string;
  direccion?: string;
}

// Datos de Google Sheets sin procesar (histórico de precios)
export interface SheetCompraRaw {
  fecha: string;
  tienda: string;
  descripcion: string;
  precioUnitario: string | number;
  cantidad: string | number;
  total: string | number;
  telefono?: string;
  direccion?: string;
}

// Alerta de precio (producto que subió más del umbral)
export interface AlertaPrecio {
  id: string;
  producto: string;
  tienda: string;
  precioActual: number;
  precioAnterior: number;
  variacionPorcentaje: number;
  fecha: Date;
}

// KPIs del Dashboard
export interface KPIData {
  gastoDelDia: number;
  gastoDelMes: number;
  facturasProcesadas: number;
  alertasDePrecio: number;
  variacionDia?: number;  // Variación vs día anterior
  variacionMes?: number;  // Variación vs mes anterior
}

// Datos para gráfico de gasto semanal
export interface GastoSemanal {
  dia: string;  // "Lun", "Mar", etc.
  monto: number;
  fecha?: Date;
}

// Datos para gráfico de distribución por tienda
export interface DistribucionTienda {
  tienda: string;
  porcentaje: number;
  monto: number;
  color?: string;  // Color asignado a la tienda
}

// Producto más costoso
export interface ProductoCostoso {
  descripcion: string;
  precioMaximo: number;
  posicion?: number;
}

// Datos de hoja "Gasto Por Tienda"
export interface GastoPorTiendaRaw {
  tienda: string;
  sumaTotal: string | number;
}

// Datos de hoja "Precio x Producto"
export interface PrecioProductoRaw {
  descripcion: string;
  sumaPrecioUnitario: string | number;
}

// Información de proveedor/tienda
export interface Proveedor {
  id: string;
  tienda: string;
  telefono?: string;
  direccion?: string;
  totalGastado: number;
  numCompras: number;
  ultimaCompra: Date;
}

// Factura agrupada (fecha + tienda)
export interface Factura {
  id: string;
  fecha: Date;
  tienda: string;
  total: number;
  numProductos: number;
  items: Compra[];
}

// Configuración de colores por tienda
export interface ColoresTienda {
  [key: string]: string;
}

// Filtros para búsquedas
export interface FiltrosCompra {
  fechaInicio?: Date;
  fechaFin?: Date;
  tienda?: string;
  busqueda?: string;
  rangoPredefinido?: 'hoy' | 'semana' | 'mes' | 'trimestre' | 'todo';
}
