/**
 * Utilidades de búsqueda avanzada
 * Búsqueda global con fuzzy matching
 */

import { Compra } from '@/types';

/**
 * Resultado de búsqueda con información de contexto
 */
export interface SearchResult {
  type: 'compra' | 'tienda' | 'producto';
  id: string;
  titulo: string;
  descripcion?: string;
  metadata?: {
    tienda?: string;
    fecha?: Date;
    precio?: number;
    categoria?: string;
  };
  score: number;
}

/**
 * Búsqueda simple con includes (case-insensitive)
 */
export function searchSimple(term: string, data: Compra[]): SearchResult[] {
  if (!term || term.trim().length === 0) {
    return [];
  }

  const searchTerm = term.toLowerCase().trim();
  const results: SearchResult[] = [];

  for (const compra of data) {
    const producto = compra.producto.toLowerCase();
    const tienda = compra.tienda.toLowerCase();

    // Búsqueda en producto
    if (producto.includes(searchTerm)) {
      results.push({
        type: 'compra',
        id: compra.id,
        titulo: compra.producto,
        descripcion: `en ${compra.tienda}`,
        metadata: {
          tienda: compra.tienda,
          fecha: compra.fecha,
          precio: compra.total,
        },
        score: producto === searchTerm ? 1 : 0.7,
      });
    }

    // Búsqueda en tienda
    if (tienda.includes(searchTerm)) {
      results.push({
        type: 'tienda',
        id: `tienda-${compra.tienda}`,
        titulo: compra.tienda,
        descripcion: 'Tienda/Proveedor',
        metadata: {
          categoria: 'Tienda',
        },
        score: tienda === searchTerm ? 1 : 0.7,
      });
    }
  }

  // Ordenar por score y limitar resultados
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

/**
 * Búsqueda avanzada con múltiples filtros
 */
export function searchAdvanced(
  term: string,
  data: Compra[],
  options?: {
    tiendas?: string[];
    fechaInicio?: Date;
    fechaFin?: Date;
    precioMin?: number;
    precioMax?: number;
    categoria?: string;
  }
): SearchResult[] {
  if (!term || term.trim().length === 0) {
    return [];
  }

  const searchTerm = term.toLowerCase().trim();
  const results: SearchResult[] = [];

  for (const compra of data) {
    // Filtrar por opciones
    if (options?.tiendas && options.tiendas.length > 0) {
      if (!options.tiendas.includes(compra.tienda)) {
        continue;
      }
    }

    if (options?.fechaInicio && compra.fecha < options.fechaInicio) {
      continue;
    }

    if (options?.fechaFin && compra.fecha > options.fechaFin) {
      continue;
    }

    if (options?.precioMin && compra.precioUnitario < options.precioMin) {
      continue;
    }

    if (options?.precioMax && compra.precioUnitario > options.precioMax) {
      continue;
    }

    // Búsqueda en producto
    const producto = compra.producto.toLowerCase();
    if (producto.includes(searchTerm)) {
      results.push({
        type: 'compra',
        id: compra.id,
        titulo: compra.producto,
        descripcion: `en ${compra.tienda} - $${compra.precioUnitario.toFixed(2)}/u`,
        metadata: {
          tienda: compra.tienda,
          fecha: compra.fecha,
          precio: compra.total,
        },
        score: producto === searchTerm ? 1 : 0.7,
      });
    }

    // Búsqueda en tienda
    const tienda = compra.tienda.toLowerCase();
    if (tienda.includes(searchTerm)) {
      results.push({
        type: 'tienda',
        id: `tienda-${compra.tienda}`,
        titulo: compra.tienda,
        descripcion: `Gastado: $${compra.total.toFixed(2)}`,
        metadata: {
          categoria: 'Tienda',
        },
        score: tienda === searchTerm ? 1 : 0.7,
      });
    }
  }

  // Ordenar por score y limitar resultados
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

/**
 * Obtiene tiendas únicas ordenadas
 */
export function getUniqueTiendas(compras: Compra[]): string[] {
  const tiendas = new Set<string>();
  for (const compra of compras) {
    tiendas.add(compra.tienda);
  }
  return Array.from(tiendas).sort();
}

/**
 * Obtiene productos únicos ordenados
 */
export function getUniqueProductos(compras: Compra[]): string[] {
  const productos = new Set<string>();
  for (const compra of compras) {
    productos.add(compra.producto);
  }
  return Array.from(productos).sort();
}
