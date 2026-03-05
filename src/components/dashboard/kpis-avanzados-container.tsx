/**
 * Contenedor de KPIs Avanzados
 * Carga los datos de la API y renderiza todos los KPIs avanzados
 */

'use client';

import { useState, useEffect, type ErrorInfo } from 'react';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { generalLogger } from '@/lib/logger';
import {
  MargenAhorroKPI,
  VelocidadGastoKPI,
  InflacionKPI,
  ScoresProveedoresKPI,
  TasaComprasKPI,
} from './kpis-avanzados';
import type { KPIsAvanzados } from '@/lib/calculadoras-financieras';

interface KPIsAvanzadosContainerProps {
  presupuesto?: number;
  anio?: number;
  mes?: number;
  className?: string;
}

export function KPIsAvanzadosContainer({
  presupuesto,
  anio,
  mes,
  className = '',
}: KPIsAvanzadosContainerProps) {
  const [kpis, setKPIs] = useState<KPIsAvanzados | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (presupuesto) params.append('presupuesto', String(presupuesto));
        if (anio) params.append('anio', String(anio));
        if (mes) params.append('mes', String(mes));

        const response = await fetch(`/api/kpis-avanzados?${params}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Error al cargar KPIs avanzados');
        }

        setKPIs(data.data);
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        generalLogger.error('Error cargando KPIs avanzados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, [presupuesto, anio, mes]);

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    generalLogger.error('Error en KPIs Avanzados:', {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-40 bg-muted rounded-xl" />
          ))}
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

  if (!kpis) {
    return null;
  }

  return (
    <ErrorBoundary onError={handleError} showDetails={process.env.NODE_ENV === 'development'}>
      <div className={className}>
        {/* Header con toggle */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">KPIs Avanzados</h2>
            <p className="text-sm text-muted-foreground">Indicadores financieros detallados</p>
          </div>
          <button
            onClick={() => setMostrarTodos(!mostrarTodos)}
            className="text-sm text-primary hover:underline"
          >
            {mostrarTodos ? 'Mostrar menos' : 'Mostrar todos'}
          </button>
        </div>

        {/* Primera fila: KPIs principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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

          {/* Tasa de Compras */}
          <TasaComprasKPI
            compras_por_dia={kpis.tasa_compras.compras_por_dia}
            compras_por_semana={kpis.tasa_compras.compras_por_semana}
            compras_por_mes={kpis.tasa_compras.compras_por_mes}
            tendencia={kpis.tasa_compras.tendencia}
            variacion_semana_anterior={kpis.tasa_compras.variacion_semana_anterior}
          />
        </div>

        {/* Segunda fila: Inflación y Scores de Proveedores */}
        {(mostrarTodos || kpis.inflacion?.productos_con_aumento! > 0 || kpis.scores_proveedores.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Índice de Inflación */}
            {kpis.inflacion && (
              <InflacionKPI
                variacion_promedio={kpis.inflacion.variacion_promedio}
                productos_con_aumento={kpis.inflacion.productos_con_aumento}
                productos_analizados={kpis.inflacion.productos_analizados}
                productos_top_inflacion={kpis.inflacion.productos_top_inflacion}
              />
            )}

            {/* Scores de Proveedores */}
            {kpis.scores_proveedores.length > 0 && (
              <ScoresProveedoresKPI
                scores_proveedores={kpis.scores_proveedores}
                mostrarTodos={mostrarTodos}
              />
            )}
          </div>
        )}

        {/* Mensaje si no hay datos */}
        {!kpis.margen_ahorro && !kpis.velocidad_gasto && !kpis.inflacion && kpis.scores_proveedores.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay suficientes datos para calcular los KPIs avanzados.</p>
            <p className="text-sm mt-1">Se necesitan al menos 30 días de datos de compras.</p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
