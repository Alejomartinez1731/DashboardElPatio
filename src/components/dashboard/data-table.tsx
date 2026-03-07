import { Table } from 'lucide-react';
import { DataTableHeader, DataTableRow } from './data-table-row';
import type { Compra } from '@/types';

type SortField = 'fecha' | 'tienda' | 'producto' | 'cantidad' | 'precio' | 'total';

interface DataTableProps {
  activeTab: string;
  datosTabla: string[][];
  numRows: number;
  numFilasBaseDatos?: number;
  comprasParaTabla?: Compra[];
  compras?: Compra[];
  sortField?: SortField;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: SortField) => void;
}

export function DataTable({
  activeTab,
  datosTabla,
  numRows,
  numFilasBaseDatos,
  comprasParaTabla,
  compras,
  sortField,
  sortOrder,
  onSort,
}: DataTableProps) {
  const isEmpty = (numRows === 0 && activeTab !== 'base_datos' && activeTab !== 'producto_costoso' && activeTab !== 'gasto_tienda') ||
    (activeTab === 'base_datos' && (numFilasBaseDatos ?? 0) === 0) ||
    ((activeTab === 'producto_costoso' || activeTab === 'gasto_tienda') && datosTabla.length <= 1); // length <= 1 significa solo cabeceras

  if (isEmpty) {
    return (
      <div className="text-center py-16">
        <Table className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No hay datos en esta tabla</p>
      </div>
    );
  }

  const isSortable = activeTab === 'base_datos'; // Solo base_datos es ordenable

  return (
    <div className="overflow-x-auto rounded-lg border border-border" data-testid="data-table">
      <table className="w-full text-sm">
        <DataTableHeader
          headers={datosTabla[0] || []}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
          isSortable={isSortable}
        />
        <tbody className="divide-y divide-[#1e293b]">
          {datosTabla.slice(1).map((row: string[], rowIdx: number) => (
            <DataTableRow
              key={rowIdx}
              row={row}
              rowIdx={rowIdx}
              headers={datosTabla[0] || []}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={onSort}
              isSortable={isSortable}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface DataTableWrapperProps {
  children: React.ReactNode;
  activeTab: string;
  activeTabLabel?: string;
  activeTabDescription?: string;
  activeTabIcon?: React.ReactNode;
  comprasParaTablaLength?: number;
  comprasLength?: number;
}

export function DataTableWrapper({
  children,
  activeTab,
  activeTabLabel,
  activeTabDescription,
  activeTabIcon,
  comprasParaTablaLength,
  comprasLength,
}: DataTableWrapperProps) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          {activeTabIcon}
          <p className="text-sm">{activeTabDescription}</p>
          {activeTab === 'base_datos' && comprasParaTablaLength !== undefined && comprasLength !== undefined && (
            <>
              <span className="ml-2 text-xs bg-card px-2 py-1 rounded-full">
                {comprasParaTablaLength} {comprasParaTablaLength === 1 ? 'fila' : 'filas'}
              </span>
              {comprasParaTablaLength !== comprasLength && (
                <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                  de {comprasLength} totales
                </span>
              )}
            </>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
