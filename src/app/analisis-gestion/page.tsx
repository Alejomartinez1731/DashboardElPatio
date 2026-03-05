/**
 * Página de Análisis de Gestión
 * KPIs de gestión: Margen Ahorro, Velocidad Gasto, Scores Proveedores, Tasa Compras
 */

'use client';

import { useState, useEffect, type ErrorInfo } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { generalLogger } from '@/lib/logger';
import {
  MargenAhorroKPI,
  VelocidadGastoKPI,
  ScoresProveedoresKPI,
  TasaComprasKPI,
} from '@/components/dashboard/kpis-avanzados';
import type { KPIsAvanzados } from '@/lib/calculadoras-financieras';

export default function AnalisisGestionPage() {
  const [kpis, setKPIs] = useState<KPIsAvanzados | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/kpis-avanzados');
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Error al cargar KPIs de gestión');
        }

        setKPIs(data.data);
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        generalLogger.error('Error cargando KPIs de gestión:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    generalLogger.error('Error en Análisis de Gestión:', {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando análisis de gestión...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-500 rounded-xl p-4">
        <p className="text-red-500 text-sm">Error: {error}</p>
      </div>
    );
  }

  return (
    <ErrorBoundary onError={handleError} showDetails={process.env.NODE_ENV === 'development'}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted/50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Análisis de Gestión</h1>
              <p className="text-sm text-muted-foreground">Indicadores de rendimiento y control financiero</p>
            </div>
          </div>
        </div>

        {!kpis || (!kpis.margen_ahorro && !kpis.velocidad_gasto && kpis.scores_proveedores.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay suficientes datos para calcular los indicadores de gestión.</p>
            <p className="text-sm mt-1">Se necesitan al menos 30 días de datos de compras.</p>
          </div>
        ) : (
          <>
            {/* Primera fila: KPIs Financieros Principales */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Indicadores Financieros</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Margen de Ahorro */}
                {kpis.margen_ahorro && (
                  <MargenAhorroKPI
                    presupuesto={kpis.margen_ahorro.presupuesto}
                    gastado={kpis.margen_ahorro.gastado}
                    margen_eur={kpis.margen_ahorro.margen_eur}
                    margen_porcentaje={kpis.margen_ahorro.margen_porcentaje}
                    estado={kpis.margen_ahorro.estado}
                  />
                )}

                {/* Velocidad de Gasto */}
                {kpis.velocidad_gasto && (
                  <VelocidadGastoKPI
                    gasto_diario_promedio={kpis.velocidad_gasto.gasto_diario_promedio}
                    dias_restantes_mes={kpis.velocidad_gasto.dias_restantes_mes}
                    proyeccion_mensual={kpis.velocidad_gasto.proyeccion_mensual}
                    alerta_exceso={kpis.velocidad_gasto.alerta_exceso}
                  />
                )}
              </div>
            </div>

            {/* Segunda fila: Operaciones y Proveedores */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Operaciones y Proveedores</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tasa de Compras */}
                <TasaComprasKPI
                  compras_por_dia={kpis.tasa_compras.compras_por_dia}
                  compras_por_semana={kpis.tasa_compras.compras_por_semana}
                  compras_por_mes={kpis.tasa_compras.compras_por_mes}
                  tendencia={kpis.tasa_compras.tendencia}
                  variacion_semana_anterior={kpis.tasa_compras.variacion_semana_anterior}
                />

                {/* Scores de Proveedores */}
                {kpis.scores_proveedores.length > 0 && (
                  <ScoresProveedoresKPI
                    scores_proveedores={kpis.scores_proveedores}
                    mostrarTodos={mostrarTodos}
                  />
                )}
              </div>
            </div>

            {/* Toggle para ver más detalles */}
            {kpis.scores_proveedores.length > 5 && (
              <div className="text-center">
                <button
                  onClick={() => setMostrarTodos(!mostrarTodos)}
                  className="text-sm text-primary hover:underline"
                >
                  {mostrarTodos ? 'Mostrar menos proveedores' : `Ver todos los ${kpis.scores_proveedores.length} proveedores`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
