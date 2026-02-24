import * as XLSX from 'xlsx';

interface HojaDatos {
  nombre: string;
  datos: string[][];
}

/**
 * Exporta datos a un archivo Excel real con múltiples hojas
 *
 * @param hojas - Array de objetos con nombre y datos de cada hoja
 * @param nombreArchivo - Nombre del archivo a generar
 */
export function exportToExcel(hojas: HojaDatos[], nombreArchivo: string = `dashboard_${new Date().toISOString().split('T')[0]}.xlsx`) {
  // Crear un nuevo libro de trabajo
  const wb = XLSX.utils.book_new();

  hojas.forEach(hoja => {
    if (!hoja.datos || hoja.datos.length === 0) return;

    // Crear worksheet desde los datos
    const ws = XLSX.utils.aoa_to_sheet(hoja.datos);

    // Configurar ancho de columnas automático
    const colWidths = hoja.datos[0].map((_, colIndex) => {
      // Calcular ancho máximo en esta columna
      const maxWidth = hoja.datos.reduce((max, row) => {
        const cellValue = row[colIndex] ? String(row[colIndex]) : '';
        return Math.max(max, cellValue.length);
      }, 0);

      // Ancho entre 10 y 50 caracteres
      return { wch: Math.min(Math.max(maxWidth + 2, 10), 50) };
    });

    ws['!cols'] = colWidths;

    // Aplicar formato a las cabeceras (primera fila)
    if (hoja.datos.length > 0) {
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;

        // Marcar celda como negrita
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "4472C4" } },
          alignment: { horizontal: "center" }
        };
      }
    }

    // Añadir autofilter a las cabeceras
    if (hoja.datos.length > 0) {
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
    }

    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, hoja.nombre);
  });

  // Generar y descargar el archivo
  XLSX.writeFile(wb, nombreArchivo);
}

/**
 * Formatea datos de tabla para exportación a Excel
 * Aplica formato de moneda a columnas numéricas
 */
export function formatearDatosParaExcel(datos: string[][], columnasMoneda: number[] = []): string[][] {
  return datos.map((fila, rowIndex) =>
    fila.map((celda, colIndex) => {
      // Si es una columna de moneda y no es la cabecera
      if (columnasMoneda.includes(colIndex) && rowIndex > 0) {
        // Convertir a número y formatear como moneda
        const valor = parseFloat(celda);
        if (!isNaN(valor)) {
          return valor.toFixed(2);
        }
      }
      return celda;
    })
  );
}

/**
 * Crea una hoja de datos para exportación
 */
export function crearHojaExcel(
  nombre: string,
  datos: string[][],
  columnasMoneda?: number[]
): HojaDatos {
  return {
    nombre,
    datos: columnasMoneda ? formatearDatosParaExcel(datos, columnasMoneda) : datos,
  };
}
