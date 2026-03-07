import { ChevronUp, ChevronDown } from 'lucide-react';
import { parsearFecha } from '@/lib/parsers';
import { formatearMoneda, formatearFecha } from '@/lib/formatters';

type SortField = 'fecha' | 'tienda' | 'producto' | 'cantidad' | 'precio' | 'total';

interface DataTableRowProps {
  row: (string | number)[];
  rowIdx: number;
  headers: string[];
  sortField?: SortField;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: SortField) => void;
  isSortable?: boolean;
}

export function DataTableRow({ row, rowIdx, headers, sortField, sortOrder, onSort, isSortable }: DataTableRowProps) {
  return (
    <tr className="hover:bg-muted/50 transition-colors">
      {row.map((cell: string | number, cellIdx: number) => {
        const cabecera = headers[cellIdx] || '';
        if (!cabecera || cabecera.trim() === '') return null;

        let cellValue = cell;
        if (Array.isArray(cell)) {
          cellValue = cell.join(' ').trim();
        }

        if ((cellValue === '' || cellValue === null || cellValue === undefined) && cellIdx < row.length - 1) {
          const hayDatosDespues = row.slice(cellIdx + 1).some(c => c !== '' && c !== null && c !== undefined);
          if (!hayDatosDespues && cellIdx > 3) {
            return null;
          }
        }

        const cellStr = String(cellValue).trim();

        // PRIMERO: Detectar si el valor YA está formateado
        const yaFormateadoComoMoneda = cellStr.includes('€') || cellStr.includes('EUR');
        const yaFormateadoComoFecha = cellStr.match(/^\d{2}\/\d{2}\/\d{4}$/);

        // Si ya está formateado, usarlo tal cual sin procesar más
        if (yaFormateadoComoMoneda || yaFormateadoComoFecha) {
          return (
            <td key={cellIdx} className="px-4 py-3 whitespace-nowrap text-left">
              <span className="text-white font-mono">{cellStr}</span>
            </td>
          );
        }

        // SI NO está formateado, procesar normalmente
        const numValue = parseFloat(cellStr);
        const isNumber = !isNaN(numValue) && cellStr !== '' && cellValue !== null;

        const cabeceraLower = String(cabecera).toLowerCase();
        const esPrecio = cabeceraLower.includes('precio') || cabeceraLower.includes('total') || cabeceraLower.includes('suma') || cabeceraLower.includes('costo');

        const esColumnaFecha = cabeceraLower.includes('fecha') || cabeceraLower.includes('compra') || cabeceraLower === 'fech' || cabeceraLower === 'date';

        const esFechaPorContenido = !isNumber && (
          cellStr.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/) ||
          (cellStr.match(/^\d{4}\-\d{2}-\d{2}$/) && !isNaN(Date.parse(cellStr)))
        );

        const esFecha = esColumnaFecha || esFechaPorContenido;

        let displayValue: string | number = cellValue;
        let className = 'text-muted-foreground';

        if (esFecha) {
          const fecha = parsearFecha(cellStr);
          displayValue = formatearFecha(fecha);
          className = 'text-white';
        } else if (isNumber) {
          if (esPrecio || cabeceraLower === 'cantidad') {
            displayValue = numValue.toFixed(2).replace('.00', '');
            className = 'text-white font-mono';
          } else {
            displayValue = numValue.toFixed(2).replace('.00', '');
          }
        }

        const alignClass = esPrecio ? 'text-right' : 'text-left';

        return (
          <td key={cellIdx} className={`px-4 py-3 whitespace-nowrap ${alignClass}`}>
            <span className={className}>
              {displayValue || '-'}
            </span>
          </td>
        );
      })}
    </tr>
  );
}

interface DataTableHeaderProps {
  headers: string[];
  sortField?: SortField;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: SortField) => void;
  isSortable?: boolean;
}

export function DataTableHeader({ headers, sortField, sortOrder, onSort, isSortable }: DataTableHeaderProps) {
  const sortableColumns = ['fecha', 'tienda', 'producto', 'cantidad', 'precio', 'total'];

  return (
    <thead className="bg-muted sticky top-0">
      <tr>
        {headers.map((header: string, idx: number) => {
          if (!header || header.trim() === '') return null;

          const isSortableColumn = isSortable && sortableColumns.includes(header.toLowerCase());

          return (
            <th
              key={idx}
              onClick={() => isSortableColumn && onSort?.(header.toLowerCase() as SortField)}
              className={`px-4 py-3 text-left font-semibold text-white whitespace-nowrap border-b-2 border-primary select-none ${
                isSortableColumn ? 'cursor-pointer hover:bg-primary/10' : ''
              }`}
            >
              <div className="flex items-center gap-1">
                {header}
                {isSortableColumn && sortField === header.toLowerCase() && (
                  sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
