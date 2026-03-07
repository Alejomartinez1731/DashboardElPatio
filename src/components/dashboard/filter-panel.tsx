'use client';
import { componentLogger } from '@/lib/logger';

import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
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

const FilterPanelComponent = function FilterPanel({ filtros, onFiltrosChange, onReset, tiendasUnicas, compras }: FilterPanelProps) {
  const [expandido, setExpandido] = useState(true);
  const [busquedaLocal, setBusquedaLocal] = useState(filtros.busqueda); // Estado local para input inmediato
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const filtrosRef = useRef(filtros); // Ref para evitar re-renders
  const onFiltrosChangeRef = useRef(onFiltrosChange); // Ref para onFiltrosChange también
  const isTypingRef = useRef(false); // Para detectar si el usuario está escribiendo
  const renderCountRef = useRef(0); // Para diagnosticar re-renders

  // Sincronizar los refs cuando cambian las props (sin causar re-renders)
  useEffect(() => {
    filtrosRef.current = filtros;
    onFiltrosChangeRef.current = onFiltrosChange;
  }, [filtros, onFiltrosChange]);

  // Diagnosticar re-renders
  useEffect(() => {
    renderCountRef.current++;
    console.log('🔄 FilterPanel render #' + renderCountRef.current, {
      tiendasUnicasCount: tiendasUnicas.length,
      comprasCount: compras.length,
      busquedaLocal,
      filtrosBusqueda: filtros.busqueda,
    });
  });

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

  const handleTiendaToggle = useCallback((tienda: string) => {
    const nuevasTiendas = filtrosRef.current.tiendas.includes(tienda)
      ? filtrosRef.current.tiendas.filter(t => t !== tienda)
      : [...filtrosRef.current.tiendas, tienda];
    componentLogger.debug('Toggle tienda', { tienda, resultado: nuevasTiendas });
    onFiltrosChangeRef.current({ ...filtrosRef.current, tiendas: nuevasTiendas });
  }, []); // Sin dependencias - completamente estable

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

    const nuevosFiltros = { ...filtrosRef.current, rangoFecha: rango, fechaInicio: inicio, fechaFin: fin };
    componentLogger.debug('📅 Nuevos filtros:', nuevosFiltros);
    onFiltrosChangeRef.current(nuevosFiltros);
  };

  // Debounce para búsqueda de producto - sin dependencias que causen re-creación
  const handleBusquedaChange = useCallback((value: string) => {
    // Marcar que el usuario está escribiendo
    isTypingRef.current = true;

    // Actualizar estado local inmediatamente para feedback visual
    setBusquedaLocal(value);

    // Limpiar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Esperar 150ms antes de propagar el cambio al store
    debounceRef.current = setTimeout(() => {
      componentLogger.debug('🔍 Búsqueda debounce aplicada:', value);
      // Usar el ref para evitar dependencias cíclicas
      onFiltrosChangeRef.current({ ...filtrosRef.current, busqueda: value });
      // Indicar que ya no estamos escribiendo después de aplicar el cambio
      setTimeout(() => {
        isTypingRef.current = false;
      }, 50);
    }, 150); // 150ms = respuesta rápida sin sobrecargar la API
  }, []); // Sin dependencias - completamente estable

  // Sincronizar busquedaLocal cuando filtros.busqueda cambia externamente
  // Solo si el usuario NO está escribiendo (para evitar sobrescribir el input activo)
  useEffect(() => {
    if (!isTypingRef.current && busquedaLocal !== filtros.busqueda) {
      setBusquedaLocal(filtros.busqueda);
    }
  }, [filtros.busqueda]); // SOLO depende de filtros.busqueda, NO de busquedaLocal

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      isTypingRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const limpiarFiltros = () => {
    isTypingRef.current = false; // Resetear flag al limpiar
    setBusquedaLocal(''); // Limpiar también el estado local
    onFiltrosChangeRef.current({
      ...filtrosRef.current, // Mantener otros filtros que puedan existir
      fechaInicio: null,
      fechaFin: null,
      rangoFecha: 'todo',
      tiendas: [],
      busqueda: '',
      precioMin: null,
      precioMax: null,
    });
  };

  // Memoizar el cálculo de hayFiltrosActivos para evitar re-calculos
  const hayFiltrosActivos = useMemo(() =>
    filtros.rangoFecha !== 'todo' ||
    filtros.tiendas.length > 0 ||
    filtros.busqueda !== '' ||
    filtros.precioMin !== null ||
    filtros.precioMax !== null,
    [filtros.rangoFecha, filtros.tiendas.length, filtros.busqueda, filtros.precioMin, filtros.precioMax]
  );

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
                onClick={() => onFiltrosChangeRef.current({ ...filtrosRef.current, tiendas: [] })}
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
                value={busquedaLocal}
                onChange={(e) => handleBusquedaChange(e.target.value)}
                placeholder="Escribe para buscar..."
                data-testid="search-input"
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
              {busquedaLocal && (
                <button
                  onClick={() => {
                    isTypingRef.current = false;
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    setBusquedaLocal('');
                    onFiltrosChangeRef.current({ ...filtrosRef.current, busqueda: '' });
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
                  onChange={(e) => onFiltrosChangeRef.current({ ...filtrosRef.current, precioMin: e.target.value ? parseFloat(e.target.value) : null })}
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
                  onChange={(e) => onFiltrosChangeRef.current({ ...filtrosRef.current, precioMax: e.target.value ? parseFloat(e.target.value) : null })}
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
};

// Memoizar el componente para evitar re-renders innecesarios
export const FilterPanel = memo(FilterPanelComponent);
