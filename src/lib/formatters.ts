/**
 * Formatea número como moneda en euros (formato español)
 */
export function formatearMoneda(euros: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros);
}

/**
 * Formatea fecha en formato DD/MM/YYYY (estándar español)
 */
export function formatearFecha(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Formatea fecha y hora
 */
export function formatearFechaHora(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formatea número con separador de miles
 */
export function formatearNumero(numero: number): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numero);
}

/**
 * Formatea porcentaje
 */
export function formatearPorcentaje(valor: number, decimales: number = 2): string {
  return `${valor.toFixed(decimales)}%`;
}

/**
 * Obtiene el nombre del día de la semana abreviado
 */
export function obtenerDiaSemana(date: Date): string {
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return dias[date.getDay()];
}

/**
 * Obtiene el nombre del mes
 */
export function obtenerNombreMes(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(date);
}

/**
 * Formatea variación con signo (+ o -)
 */
export function formatearVariacion(porcentaje: number): string {
  const signo = porcentaje > 0 ? '+' : '';
  return `${signo}${formatearPorcentaje(porcentaje)}`;
}

/**
 * Determina el color para una variación (verde si baja, rojo si sube)
 */
export function colorVariacion(porcentaje: number): string {
  if (porcentaje > 0) return '#ef4444'; // rojo - subida
  if (porcentaje < 0) return '#10b981'; // verde - bajada
  return '#64748b'; // gris - sin cambio
}

/**
 * Formatea para exportación a CSV (escaped correctamente)
 */
export function escaparCSV(valor: any): string {
  const str = String(valor ?? '');
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
