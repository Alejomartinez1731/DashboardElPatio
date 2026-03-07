'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Euro, Package, Filter, Calendar } from 'lucide-react';
import { ErrorBoundary } from '@/components/error/error-boundary';

interface CompraProducto {
  fecha: string;
  precio: number;
  tienda: string;
}

interface ProductoInflacion {
  producto: string;
  categoria: string;
  compras: CompraProducto[];
  precioPrimera: number;
  precioUltima: number;
  variacionPorcentaje: number;
  variacionAbsoluta: number;
  tendencia: 'alcista' | 'bajista' | 'estable';
  comprasTotales: number;
}

interface Resumen {
  totalAnalizados: number;
  conAumento: number;
  aumentoPromedio: number;
  productoMayorAumento: string;
  mayorAumentoPorcentaje: number;
}

interface InflacionData {
  productos: ProductoInflacion[];
  resumen: Resumen;
}

export default function InflacionPage() {
  const [data, setData] = useState<InflacionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>('todos'); // todos, alcista, bajista, estable
  const [umbral, setUmbral] = useState<number>(5);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/inflacion?umbral=${umbral}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al cargar datos');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [umbral]);

  const productosFiltrados = data?.productos.filter((p) => {
    if (filtro === 'todos') return true;
    return p.tendencia === filtro;
  }) || [];

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'alcista':
        return <TrendingUp className="w-5 h-5 text-red-500" />;
      case 'bajista':
        return <TrendingDown className="w-5 h-5 text-green-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTendenciaColor = (tendencia: string) => {
    switch (tendencia) {
      case 'alcista':
        return 'text-red-500 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
      case 'bajista':
        return 'text-green-500 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800';
    }
  };

  const getTendenciaLabel = (tendencia: string) => {
    switch (tendencia) {
      case 'alcista':
        return 'Precio alza';
      case 'bajista':
        return 'Precio baja';
      default:
        return 'Precio estable';
    }
  };

  const formatDate = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleInflacionError = (error: Error, errorInfo: any) => {
    console.error('Error en página de inflación:', error, errorInfo);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary onError={handleInflacionError}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted/50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Análisis de Inflación</h1>
            <p className="text-sm text-muted-foreground">
              Tendencias de precios en productos recurrentes
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
            <p className="text-destructive text-sm">{error}</p>
            <button
              onClick={cargarDatos}
              className="mt-2 text-sm text-destructive underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {!error && data && (
          <>
            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Package className="w-4 h-4" />
                  <span className="text-sm">Productos analizados</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {data.resumen.totalAnalizados}
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Con aumento</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {data.resumen.conAumento}
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Euro className="w-4 h-4" />
                  <span className="text-sm">Aumento promedio</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {data.resumen.aumentoPromedio.toFixed(1)}%
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Mayor aumento</span>
                </div>
                <p className="text-lg font-bold text-foreground truncate" title={data.resumen.productoMayorAumento}>
                  {data.resumen.productoMayorAumento || '-'}
                </p>
                <p className="text-sm text-red-500">
                  +{data.resumen.mayorAumentoPorcentaje.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filtrar por tendencia:</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setFiltro('todos')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      filtro === 'todos'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Todos ({data.productos.length})
                  </button>
                  <button
                    onClick={() => setFiltro('alcista')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      filtro === 'alcista'
                        ? 'bg-red-500 text-white'
                        : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900'
                    }`}
                  >
                    Alza ({data.productos.filter(p => p.tendencia === 'alcista').length})
                  </button>
                  <button
                    onClick={() => setFiltro('bajista')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      filtro === 'bajista'
                        ? 'bg-green-500 text-white'
                        : 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900'
                    }`}
                  >
                    Baja ({data.productos.filter(p => p.tendencia === 'bajista').length})
                  </button>
                  <button
                    onClick={() => setFiltro('estable')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      filtro === 'estable'
                        ? 'bg-gray-500 text-white'
                        : 'bg-gray-50 text-gray-600 dark:bg-gray-950 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900'
                    }`}
                  >
                    Estable ({data.productos.filter(p => p.tendencia === 'estable').length})
                  </button>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <label htmlFor="umbral" className="text-sm text-muted-foreground">
                    Umbral: ≥ {umbral}%
                  </label>
                  <input
                    id="umbral"
                    type="range"
                    min="1"
                    max="20"
                    value={umbral}
                    onChange={(e) => setUmbral(parseInt(e.target.value))}
                    className="w-24"
                  />
                </div>
              </div>
            </div>

            {/* Lista de productos */}
            {productosFiltrados.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No se encontraron productos con los filtros actuales.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {productosFiltrados.map((producto, index) => (
                  <div
                    key={`${producto.producto}-${index}`}
                    className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground capitalize">
                            {producto.producto}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full border ${getTendenciaColor(
                              producto.tendencia
                            )}`}
                          >
                            {getTendenciaLabel(producto.tendencia)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {producto.categoria} · {producto.comprasTotales} compras
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          {getTendenciaIcon(producto.tendencia)}
                          <span
                            className={`text-lg font-bold ${
                              producto.variacionPorcentaje > 0
                                ? 'text-red-500'
                                : producto.variacionPorcentaje < 0
                                ? 'text-green-500'
                                : 'text-gray-500'
                            }`}
                          >
                            {producto.variacionPorcentaje > 0 ? '+' : ''}
                            {producto.variacionPorcentaje.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Euro className="w-3 h-3" />
                          <span>
                            {producto.precioPrimera.toFixed(2)} → {producto.precioUltima.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Historial de precios */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <Calendar className="w-3 h-3" />
                        <span>Historial de precios</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {producto.compras.slice(0, 5).map((compra, i) => (
                          <div
                            key={i}
                            className="px-2 py-1 bg-muted rounded text-xs"
                          >
                            <span className="font-medium">{compra.precio.toFixed(2)}€</span>
                            <span className="text-muted-foreground ml-1">
                              {formatDate(compra.fecha)}
                            </span>
                          </div>
                        ))}
                        {producto.compras.length > 5 && (
                          <div className="px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
                            +{producto.compras.length - 5} más
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
