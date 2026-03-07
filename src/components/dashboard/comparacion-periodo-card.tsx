'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, ShoppingCart, Euro } from 'lucide-react';

interface ComparacionPeriodo {
  periodo: string;
  gasto_total: number;
  total_compras: number;
  total_facturas: number;
}

interface Variacion {
  valor: number;
  porcentaje: number;
}

interface ComparacionData {
  periodo_actual: ComparacionPeriodo;
  periodo_anterior: ComparacionPeriodo;
  variacion: {
    gasto: Variacion;
    compras: Variacion;
  };
}

interface ComparacionResponse {
  success: boolean;
  data?: ComparacionData;
  error?: string;
}

export function ComparacionPeriodoCard() {
  const [data, setData] = useState<ComparacionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarComparacion() {
      try {
        setLoading(true);
        const response = await fetch('/api/comparacion-periodo');
        const result: ComparacionResponse = await response.json();

        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || 'Error al cargar comparación');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    cargarComparacion();
  }, []);

  const getVariacionIcon = (valor: number) => {
    if (valor > 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (valor < 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getVariacionColor = (valor: number) => {
    if (valor > 0) return 'text-red-500';
    if (valor < 0) return 'text-green-500';
    return 'text-gray-400';
  };

  const getVariacionBg = (valor: number) => {
    if (valor > 0) return 'bg-red-50 dark:bg-red-950';
    if (valor < 0) return 'bg-green-50 dark:bg-green-950';
    return 'bg-gray-50 dark:bg-gray-950';
  };

  const formatVariacion = (valor: number, porcentaje: number) => {
    const signo = valor > 0 ? '+' : valor < 0 ? '' : '±';
    return `${signo}${valor.toFixed(2)}€ (${signo}${porcentaje.toFixed(1)}%)`;
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-destructive text-sm">{error || 'Error al cargar datos'}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Comparación de Período</h3>
        </div>
        <div className="text-sm text-muted-foreground">
          vs {data.periodo_anterior.periodo}
        </div>
      </div>

      {/* Métricas */}
      <div className="space-y-4">
        {/* Gasto Total */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Euro className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gasto Total</p>
              <p className="text-2xl font-bold text-foreground">
                {data.periodo_actual.gasto_total.toFixed(2)}€
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getVariacionBg(data.variacion.gasto.valor)}`}>
            {getVariacionIcon(data.variacion.gasto.valor)}
            <span className={`text-sm font-semibold ${getVariacionColor(data.variacion.gasto.valor)}`}>
              {formatVariacion(data.variacion.gasto.valor, data.variacion.gasto.porcentaje)}
            </span>
          </div>
        </div>

        {/* Número de Compras */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Número de Compras</p>
              <p className="text-2xl font-bold text-foreground">
                {data.periodo_actual.total_compras}
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getVariacionBg(data.variacion.compras.valor)}`}>
            {getVariacionIcon(data.variacion.compras.valor)}
            <span className={`text-sm font-semibold ${getVariacionColor(data.variacion.compras.valor)}`}>
              {data.variacion.compras.valor > 0 ? '+' : ''}{data.variacion.compras.valor} compras
              <span className="ml-1">({data.variacion.compras.porcentaje > 0 ? '+' : ''}{data.variacion.compras.porcentaje.toFixed(1)}%)</span>
            </span>
          </div>
        </div>

        {/* Periodo Anterior */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{data.periodo_anterior.periodo}</span>
            <span className="font-medium">
              {data.periodo_anterior.gasto_total.toFixed(2)}€ · {data.periodo_anterior.total_compras} compras
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
