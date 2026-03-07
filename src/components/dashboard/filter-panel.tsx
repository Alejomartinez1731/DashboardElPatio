'use client';
import { componentLogger } from '@/lib/logger';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { X, Calendar, Store, Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Compra } from '@/types';

interface Filtros {
  fechaInicio: Date | null;
  fechaFin: Date | null;
  rangoFecha: 'todo' | 'hoy' | 'semana' | 'mes' | 'mesPasado' | 'anio';
  tiendas: string[];
  busqueda: string;
  precioMin: number | null;
  precioMax: number | null;
}

interface FilterPanelProps {
  filtros: Filtros;
  onFiltrosChange: (filtros: Filtros) => void;
  onReset: () => void;
  tiendasUnicas: string[];
  compras: Compra[];
}

export function FilterPanel({ filtros, onFiltrosChange, onReset, tiendasUnicas, compras }: FilterPanelProps) {
  const [expandido, setExpandido] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Memoizar cálculo de precios para evitar recalcular en cada render
  const { precioMinGlobal, precioMaxGlobal } = useMemo(() => {
    const precios = compras.flatMap(c => {
      const precio = typeof c.precioUnitario === 'number' ? c.precioUnitario : parseFloat(c.precioUnitario || '0');
      return isNaN(precio) ? [] : precio;
    }).filter(p => p > 0);

    return {
      precioMinGlobal: precios.length > 0 ? Math.min(...precios) : 0,
      precioMaxGlobal: precios.length > 0 ? Math.max(...precios) : 100,
    };
  }, [compras]);

  const handleRangoFechaChange = (rango: typeof filtros.rangoFecha) => {
    componentLogger.debug('📅 Cambiando rango de fecha:', rango);
    const ahora = new Date();
    let inicio = null;
    let fin = null;

    switch (rango) {
      case 'hoy':
        inicio = new Date(ahora.setHours(0, 0, 0, 0));
        fin = new Date(ahora.setHours(23, 59, 59, 999));
        break;
      case 'semana':
        inicio = new Date(ahora);
        inicio.setDate(ahora.getDate() - 7);
        fin = new Date();
        break;
      case 'mes':
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        fin = new Date();
        break;
      case 'mesPasado':
        inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
        fin = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'anio':
        inicio = new Date(ahora.getFullYear(), 0, 1);
        fin = new Date();
        break;
    }

    const nuevosFiltros = { ...filtros, rangoFecha: rango, fechaInicio: inicio, fechaFin: fin };
    componentLogger.debug('📅 Nuevos filtros:', nuevosFiltros);
    onFiltrosChange(nuevosFiltros);
  };

  const handleTiendaToggle = useCallback((tienda: string) => {
    const nuevasTiendas = filtros.tiendas.includes(tienda)
      ? filtros.tiendas.filter(t => t !== tienda)
      : [...filtros.tiendas, tienda];
    componentLogger.debug('Toggle tienda', { tienda, resultado: nuevasTiendas });
    onFiltrosChange({ ...filtros, tiendas: nuevasTiendas });
  }, [filtros.tiendas, filtros, onFiltrosChange]);

  // Debounce para búsqueda de producto
  const handleBusquedaChange = useCallback((value: string) => {
    // Limpiar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Actualizar inmediatamente el input visualmente (sin filtrar)
    onFiltrosChange({ ...filtros, busqueda: value });

    // Esperar 300ms antes de aplicar el filtro real
    debounceRef.current = setTimeout(() => {
      componentLogger.debug('🔍 Búsqueda debounce aplicada:', value);
    }, 300);
  }, [filtros, onFiltrosChange]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const limpiarFiltros = () => {
    onFiltrosChange({
      fechaInicio: null,
      fechaFin: null,
      rangoFecha: 'todo',
      tiendas: [],
      busqueda: '',
      precioMin: null,
      precioMax: null,
    });
  };

  const hayFiltrosActivos =
    filtros.rangoFecha !== 'todo' ||
    filtros.tiendas.length > 0 ||
    filtros.busqueda !== '' ||
    filtros.precioMin !== null ||
    filtros.precioMax !== null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-white">Filtros</h3>
        </div>
        <div className="flex items-center gap-2">
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="text-xs px-3 py-1.5 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 rounded-lg transition-all"
            >
              Limpiar
            </button>
          )}
          <button
            onClick={() => setExpandido(!expandido)}
            className="p-1 hover:bg-muted/50 rounded-lg transition-colors"
          >
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandido ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {expandido && (
        <div className="p-4 space-y-4">
          {/* Rango de Fecha */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              Rango de Fecha
            </label>
            <div className="grid grid-cols-3 gap-2" data-testid="date-filter">
              {[
                { value: 'todo', label: 'Todo' },
                { value: 'hoy', label: 'Hoy' },
                { value: 'semana', label: 'Esta semana' },
                { value: 'mes', label: 'Este mes' },
                { value: 'mesPasado', label: 'Mes pasado' },
                { value: 'anio', label: 'Este año' },
              ].map((opcion) => (
                <button
                  key={opcion.value}
                  onClick={() => handleRangoFechaChange(opcion.value as any)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                    filtros.rangoFecha === opcion.value
                      ? 'bg-primary border-primary text-white font-semibold'
                      : 'bg-muted border-border text-muted-foreground hover:border-primary/50 hover:text-white'
                  }`}
                >
                  {opcion.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por Tienda */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Store className="w-4 h-4" />
              Filtrar por Tienda
            </label>
            <div className="flex flex-wrap gap-2">
              {tiendasUnicas.map((tienda) => (
                <button
                  key={tienda}
                  onClick={() => handleTiendaToggle(tienda)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    filtros.tiendas.includes(tienda)
                      ? 'bg-primary border-primary text-white font-semibold'
                      : 'bg-muted border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {tienda}
                </button>
              ))}
            </div>
            {filtros.tiendas.length > 0 && (
              <button
                onClick={() => onFiltrosChange({ ...filtros, tiendas: [] })}
                className="text-xs text-muted-foreground underline hover:text-primary"
              >
                Deseleccionar todas
              </button>
            )}
          </div>

          {/* Búsqueda */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Search className="w-4 h-4" />
              Buscar Producto
            </label>
            <div className="relative">
              <input
                type="text"
                value={filtros.busqueda}
                onChange={(e) => handleBusquedaChange(e.target.value)}
                placeholder="Escribe para buscar..."
                data-testid="search-input"
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
              {filtros.busqueda && (
                <button
                  onClick={() => {
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    onFiltrosChange({ ...filtros, busqueda: '' });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Rango de Precios */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <SlidersHorizontal className="w-4 h-4" />
              Rango de Precios
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">Mín:</span>
                <input
                  type="number"
                  value={filtros.precioMin ?? ''}
                  onChange={(e) => onFiltrosChange({ ...filtros, precioMin: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder={precioMinGlobal.toFixed(2)}
                  className="flex-1 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
                <span className="text-xs text-muted-foreground">€</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">Máx:</span>
                <input
                  type="number"
                  value={filtros.precioMax ?? ''}
                  onChange={(e) => onFiltrosChange({ ...filtros, precioMax: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder={precioMaxGlobal.toFixed(2)}
                  className="flex-1 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
                <span className="text-xs text-muted-foreground">€</span>
              </div>
            </div>
          </div>

          {/* Botón Reset */}
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="w-full px-4 py-2 bg-[#ef4444] hover:bg-[#ef4444]/80 text-white rounded-lg font-medium transition-all"
            >
              Resetear Todos los Filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
