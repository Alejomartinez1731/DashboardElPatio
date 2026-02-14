import { escaparCSV } from './formatters';

/**
 * Genera y descarga un archivo CSV con encoding UTF-8 BOM
 * Compatible con Excel en español (separador punto y coma)
 *
 * @param datos Array de objetos a exportar
 * @param nombreArchivo Nombre del archivo sin extensión
 */
export function generarCSV(datos: any[], nombreArchivo: string): void {
  if (!datos || datos.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  // Obtener cabeceras
  const cabeceras = Object.keys(datos[0]);

  // Crear contenido CSV
  const csvFilas = [
    // Cabeceras
    cabeceras.map(escaparCSV).join(';'),
    // Datos
    ...datos.map(fila =>
      cabeceras.map(cabecera => escaparCSV(fila[cabecera])).join(';')
    )
  ];

  const csvContenido = csvFilas.join('\n');

  // Agregar BOM UTF-8 para que Excel lo reconozca correctamente
  const BOM = '\uFEFF';
  const csvConBOM = BOM + csvContenido;

  // Crear blob y descargar
  if (typeof window !== 'undefined') {
    const blob = new Blob([csvConBOM], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', `${nombreArchivo}.csv`);
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}

/**
 * Genera CSV específico para registro de compras
 */
export function generarCSVRegistro(datos: any[], fechaHoy: string): void {
  const nombreArchivo = `elpatio_registro_${fechaHoy}`;
  generarCSV(datos, nombreArchivo);
}

/**
 * Prepara datos para exportación (selección y formateo de campos)
 */
export function prepararDatosParaExportar(datos: any[], campos: string[]): any[] {
  return datos.map(fila => {
    const exportFila: any = {};
    campos.forEach(campo => {
      if (campo in fila) {
        exportFila[campo] = fila[campo];
      }
    });
    return exportFila;
  });
}
