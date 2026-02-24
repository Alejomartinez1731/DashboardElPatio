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
export type SheetName = 'base_datos' | 'historico' | 'historico_precios' | 'costosos' | 'gasto_tienda' | 'precio_producto' | 'registro_diario';

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
  gastoQuincenal: number;
  facturasProcesadas: number;
  alertasDePrecio: number;
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

// Tipos de categorías de productos
export type CategoriaProducto = 'carnes' | 'lacteos' | 'verdura' | 'panaderia' | 'bebidas' | 'limpieza' | 'otros';

export interface CategoriaInfo {
  nombre: string;
  color: string;
  icono: string;
}

export const CATEGORIAS_INFO: Record<CategoriaProducto, CategoriaInfo> = {
  carnes: { nombre: 'Carnes', color: '#ef4444', icono: '🥩' },
  lacteos: { nombre: 'Lácteos', color: '#3b82f6', icono: '🥛' },
  verdura: { nombre: 'Verduras y Frutas', color: '#22c55e', icono: '🥬' },
  panaderia: { nombre: 'Panadería', color: '#f59e0b', icono: '🍞' },
  bebidas: { nombre: 'Bebidas', color: '#8b5cf6', icono: '🥤' },
  limpieza: { nombre: 'Limpieza', color: '#06b6d4', icono: '🧹' },
  otros: { nombre: 'Otros', color: '#64748b', icono: '📦' },
};
