/**
 * KPIs Principales del Dashboard
 * Solo los 4 KPIs más importantes para la vista general
 */

'use client';

import { useState, useEffect } from 'react';
import { Wallet, Receipt, ShoppingCart, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatearMoneda } from '@/lib/formatters';
import type { KPIsAvanzados } from '@/lib/calculadoras-financieras';

interface KPIsPrincipalesProps {
  presupuesto?: number;
  anio?: number;
  mes?: number;
  gastoQuincenal?: number;
  facturasProcesadas?: number;
  recordatorios?: number;
  className?: string;
}

interface KPIData {
  valor: string | number;
  label: string;
  icono: React.ReactNode;
  color: string;
  trend?: string;
  loading?: boolean;
}

export function KPIsPrincipales({
  presupuesto = 3000,
  anio,
  mes,
  gastoQuincenal = 0,
  facturasProcesadas = 0,
  recordatorios = 0,
  className = '',
}: KPIsPrincipalesProps) {
  const [kpisAvanzados, setKPIsAvanzados] = useState<KPIsAvanzados | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const params = new URLSearchParams();
        if (presupuesto) params.append('presupuesto', String(presupuesto));
        if (anio) params.append('anio', String(anio));
        if (mes) params.append('mes', String(mes));

        const response = await fetch(`/api/kpis-avanzados?${params}`);
        const data = await response.json();

        if (data.success) {
          setKPIsAvanzados(data.data);
        }
      } catch (error) {
        console.error('Error cargando KPIs avanzados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, [presupuesto, anio, mes]);

  // KPI 1: Gasto Quincenal (existente)
  const kpi1: KPIData = {
    valor: formatearMoneda(gastoQuincenal),
    label: 'Gasto Quincenal',
    icono: <Wallet className="w-5 h-5" />,
    color: 'text-blue-500',
    loading: false,
  };

  // KPI 2: Margen de Ahorro (nuevo - importante)
  const kpi2: KPIData = {
    valor: kpisAvanzados?.margen_ahorro
      ? `${kpisAvanzados.margen_ahorro.margen_porcentaje.toFixed(1)}%`
      : loading ? '...' : '0%',
    label: 'Margen de Ahorro',
    icono: <Wallet className="w-5 h-5" />,
    color: kpisAvanzados?.margen_ahorro?.estado === 'positivo'
      ? 'text-green-500'
      : kpisAvanzados?.margen_ahorro?.estado === 'negativo'
        ? 'text-red-500'
        : 'text-yellow-500',
    trend: kpisAvanzados?.margen_ahorro
      ? `${kpisAvanzados.margen_ahorro.estado === 'positivo' ? '+' : ''}${formatearMoneda(kpisAvanzados.margen_ahorro.margen_eur)}`
      : undefined,
    loading,
  };

  // KPI 3: Velocidad de Gasto (nuevo - importante)
  const kpi3: KPIData = {
    valor: kpisAvanzados?.velocidad_gasto
      ? formatearMoneda(kpisAvanzados.velocidad_gasto.gasto_diario_promedio)
      : loading ? '...' : '0€',
    label: 'Gasto Diario Promedio',
    icono: <Zap className="w-5 h-5" />,
    color: kpisAvanzados?.velocidad_gasto?.alerta_exceso
      ? 'text-orange-500'
      : 'text-purple-500',
    trend: kpisAvanzados?.velocidad_gasto
      ? `/día • ${kpisAvanzados.velocidad_gasto.dias_restantes_mes} días restantes`
      : undefined,
    loading,
  };

  // KPI 4: Facturas Procesadas (existente)
  const kpi4: KPIData = {
    valor: facturasProcesadas,
    label: 'Facturas Procesadas',
    icono: <Receipt className="w-5 h-5" />,
    color: 'text-emerald-500',
    loading: false,
  };

  const kpis = [kpi1, kpi2, kpi3, kpi4];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {kpis.map((kpi, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
                {kpi.loading ? (
                  <div className="h-7 bg-muted animate-pulse rounded w-20" />
                ) : (
                  <>
                    <p className={`text-2xl font-bold ${kpi.color}`}>
                      {kpi.valor}
                    </p>
                    {kpi.trend && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {kpi.trend}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className={`p-2 rounded-lg bg-muted ${kpi.color}`}>
                {kpi.icono}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
