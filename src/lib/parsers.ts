/**
 * Funciones de parseo y procesamiento de datos
 * Archivo unificado para evitar duplicación de código
 */

import { generalLogger } from '@/lib/logger';
import { normalizarFecha } from './data-utils';

/**
 * Parsea fechas en formato DD/MM/YYYY o ISO
 * Alias de normalizarFecha para compatibilidad
 *
 * @param fecha - Fecha como string o Date
 * @returns Date object
 */
export function parsearFecha(fecha: string | Date): Date {
  return normalizarFecha(fecha);
}

/**
 * Excluye filas de resumen (TOTAL, IVA, SUBTOTAL, etc.)
 * Re-exportada desde data-utils para centralización
 *
 * @param descripcion - Descripción del producto
 * @returns true si la fila debe ser excluida
 */
export { excluirFilaResumen } from './data-utils';

/**
 * Excluye filas de resumen (versión standalone con logging)
 * Igual que excluirFilaResumen pero con console.log para debugging
 *
 * @param descripcion - Descripción del producto
 * @returns true si la fila debe ser excluida
 */
export function excluirFilaResumenConLog(descripcion: string): boolean {
  if (!descripcion) {
    generalLogger.debug('⚠️ excluirFilaResumen: descripción vacía');
    return true;
  }

  const descripcionLower = descripcion.toLowerCase().trim();

  // Excluir si está vacía después de trim
  if (descripcionLower === '') {
    generalLogger.debug('⚠️ excluirFilaResumen: descripción vacía después de trim');
    return true;
  }

  // Excluir palabras clave de resumen
  const exclusiones = [
    'suma total', 'total general', 'total', 'subtotal', 'sub-total',
    'iva', 'vat', 'tax', 'base imponible', 'base',
    'recargo', 'equivalencia',
    'devolución', 'devolucion', 'devoluc',
    '-', ''
  ];

  // Verificar coincidencia exacta (como palabra completa, no como subcadena)
  // Dividimos la descripcion en palabras y verificamos si alguna coincide exactamente
  const palabras = descripcionLower.split(/\s+/);
  const excluida = palabras.some(palabra =>
    exclusiones.some(exclusion => exclusion === palabra)
  );

  if (excluida) {
    generalLogger.debug(`🚫 Fila excluida: "${descripcion}" → coincide con palabra de exclusión`);
  }

  return excluida;
}

/**
 * Normaliza cabeceras de tabla cruda
 * Convierte cabeceras de Google Sheets a formato estándar
 *
 * @param cabeceras - Array de cabeceras crudas
 * @returns Array de cabeceras normalizadas
 */
export function normalizarCabeceras(cabeceras: string[]): string[] {
  return cabeceras.map((h: string) => {
    return h.toLowerCase()
      .trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar tildes
      .replace(/\s+/g, '_'); // Reemplazar espacios con guiones bajos
  });
}

/**
 * Convierte fila cruda a objeto tipado
 *
 * @param fila - Array de valores de la fila
 * @param cabeceras - Cabeceras normalizadas
 * @returns Objeto con clave-valor
 */
export function filaAObjeto(fila: unknown[], cabeceras: string[]): Record<string, string | number | undefined> {
  const obj: Record<string, string | number | undefined> = {};
  cabeceras.forEach((cab: string, idx: number) => {
    const valor = fila[idx];
    // Preserve the value type (string or number from spreadsheet cells)
    obj[cab] = (typeof valor === 'string' || typeof valor === 'number') ? valor : undefined;
  });
  return obj;
}
