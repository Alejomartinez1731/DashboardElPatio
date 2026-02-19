'use client';

import { useEffect, useState } from 'react';
import { Compra } from '@/types';
import { formatearMoneda, formatearFecha } from '@/lib/formatters';
import { normalizarTienda, COLORES_TIENDA } from '@/lib/data-utils';
import { Search, Filter, Calendar, Store, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useState as useReactState } from 'react';

type SortField = 'fecha' | 'tienda' | 'producto' | 'total';
type SortOrder = 'asc' | 'desc';

export default function RegistroPage() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTienda, setFiltroTienda] = useState<string>('todas');
  const [sortField, setSortField] = useReactState<SortField>('fecha');
  const [sortOrder, setSortOrder] = useReactState<SortOrder>('desc');
  const [pagina, setPagina] = useReactState(1);
  const ITEMS_POR_PAGINA = 25;

  useEffect(() => {
    async function fetchDatos() {
      try {
        setCargando(true);
        const response = await fetch('/api/sheets');
        if (!response.ok) throw new Error('Error al obtener datos');
        const result = await response.json();

        if (result.success && result.data.registro_diario?.values) {
          const values = result.data.registro_diario.values as any[][];
          if (values.length > 1) {
            const cabeceras = values[0].map((h: string) => h.toLowerCase().trim());
            const comprasProcesadas: Compra[] = [];

            for (let i = 1; i < values.length; i++) {
              const fila = values[i];
              const obj: any = {};
              cabeceras.forEach((cab: string, idx: number) => { obj[cab] = fila[idx]; });

              // Buscar precio unitario en diferentes posibles nombres de columna
              // La tabla de registro_diario usa 'totalunitario'
              const precioUnitarioRaw = obj.totalunitario || obj['total unitario'] || obj['precio unitario'] || obj['precio_unitario'] || obj['preciounitario'] || obj.precio || obj['precio unit.'] || '0';

              const compra: Compra = {
                id: `compra-${i}`,
                fecha: new Date(obj.fecha || ''),
                tienda: obj.tienda || '',
                producto: obj.descripcion || obj.producto || '',
                cantidad: parseFloat(obj.cantidad || '0') || 0,
                precioUnitario: parseFloat(precioUnitarioRaw) || 0,
                total: parseFloat(obj.total || '0') || 0,
              };

              if (compra.producto && !compra.producto.toLowerCase().includes('total')) {
                comprasProcesadas.push(compra);
              }
            }
            setCompras(comprasProcesadas);
          }
        }
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setCargando(false);
      }
    }
    fetchDatos();
  }, []);

  // Obtener tiendas únicas
  const tiendasUnicas = Array.from(new Set(compras.map(c => normalizarTienda(c.tienda))));

  // Filtrar y ordenar
  const comprasFiltradas = compras
    .filter(c => {
      const cumpleBusqueda = c.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
                            c.tienda.toLowerCase().includes(busqueda.toLowerCase());
      const cumpleTienda = filtroTienda === 'todas' || normalizarTienda(c.tienda) === filtroTienda;
      return cumpleBusqueda && cumpleTienda;
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'fecha': aVal = a.fecha; bVal = b.fecha; break;
        case 'tienda': aVal = normalizarTienda(a.tienda); bVal = normalizarTienda(b.tienda); break;
        case 'producto': aVal = a.producto; bVal = b.producto; break;
        case 'total': aVal = a.total; bVal = b.total; break;
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

  // Paginación
  const totalPaginas = Math.ceil(comprasFiltradas.length / ITEMS_POR_PAGINA);
  const comprasPaginadas = comprasFiltradas.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Cargando registro de compras...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1a2234] border border-[#ef4444]/30 rounded-lg p-6 text-center">
        <p className="text-[#ef4444] mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#f59e0b] text-white rounded-lg">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Registro de Compras</h1>
        <p className="text-muted-foreground">Historial completo de todas las compras realizadas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <p className="text-muted-foreground text-sm mb-1">Total Compras</p>
          <p className="text-2xl font-bold text-white">{compras.length}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-muted-foreground text-sm mb-1">Gasto Total</p>
          <p className="text-2xl font-bold text-[#10b981]">{formatearMoneda(compras.reduce((sum, c) => sum + c.total, 0))}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-muted-foreground text-sm mb-1">Tiendas</p>
          <p className="text-2xl font-bold text-[#f59e0b]">{tiendasUnicas.length}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-muted-foreground text-sm mb-1">Filtrando</p>
          <p className="text-2xl font-bold text-[#3b82f6]">{comprasFiltradas.length}</p>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4 bg-card border-border">
        <div className="flex flex-wrap gap-4">
          {/* Búsqueda */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por producto o tienda..."
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Filtro por tienda */}
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={filtroTienda}
              onChange={(e) => { setFiltroTienda(e.target.value); setPagina(1); }}
              className="pl-10 pr-8 py-2 bg-muted border border-border rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-primary"
            >
              <option value="todas">Todas las tiendas</option>
              {tiendasUnicas.map(tienda => (
                <option key={tienda} value={tienda}>{tienda}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card className="overflow-hidden bg-card border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => handleSort('fecha')} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-white transition-colors">
                    <Calendar className="w-4 h-4" />
                    Fecha
                    {sortField === 'fecha' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => handleSort('tienda')} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-white transition-colors">
                    <Store className="w-4 h-4" />
                    Tienda
                    {sortField === 'tienda' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => handleSort('producto')} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-white transition-colors">
                    Producto
                    {sortField === 'producto' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </button>
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-muted-foreground">Cant.</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-muted-foreground">Precio Unit.</th>
                <th className="px-4 py-3 text-right">
                  <button onClick={() => handleSort('total')} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-white transition-colors ml-auto">
                    Total
                    {sortField === 'total' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {comprasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No se encontraron compras con los filtros actuales
                  </td>
                </tr>
              ) : (
                comprasPaginadas.map((compra) => {
                  const tiendaNormalizada = normalizarTienda(compra.tienda);
                  const colorTienda = COLORES_TIENDA[tiendaNormalizada] || COLORES_TIENDA['Otros'];
                  return (
                    <tr key={compra.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatearFecha(compra.fecha)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorTienda }} />
                          <span className="text-sm text-white">{tiendaNormalizada}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white font-medium">{compra.producto}</td>
                      <td className="px-4 py-3 text-sm text-center text-muted-foreground">{compra.cantidad}</td>
                      <td className="px-4 py-3 text-sm text-center text-muted-foreground">{formatearMoneda(compra.precioUnitario)}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-white">{formatearMoneda(compra.total)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-muted border-t border-border">
            <p className="text-sm text-muted-foreground">
              Mostrando {(pagina - 1) * ITEMS_POR_PAGINA + 1} - {Math.min(pagina * ITEMS_POR_PAGINA, comprasFiltradas.length)} de {comprasFiltradas.length} compras
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-3 py-1 text-sm bg-card text-white rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-muted-foreground px-2">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="px-3 py-1 text-sm bg-card text-white rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
