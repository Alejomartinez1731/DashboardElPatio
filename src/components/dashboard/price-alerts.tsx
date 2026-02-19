'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Compra, AlertaPrecio } from '@/types';
import { formatearMoneda, formatearFecha, formatearPorcentaje } from '@/lib/formatters';
import { detectarAlertasPrecio } from '@/lib/data-utils';
import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface PriceAlertsProps {
  compras: Compra[];
  limite?: number;
  titulo?: string;
}

export function PriceAlerts({ compras, limite = 5, titulo = 'Alertas de Precio' }: PriceAlertsProps) {
  const alertas = useMemo(() => {
    return detectarAlertasPrecio(compras, 5); // Umbral del 5%
  }, [compras]);

  const alertasVisibles = alertas.slice(0, limite);

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
        <h3 className="text-lg font-semibold text-white">{titulo}</h3>
      </div>

      {alertasVisibles.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <span className="text-4xl mb-2">✅</span>
          <p className="text-sm">Sin alertas de precio hoy</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertasVisibles.map((alerta) => (
            <Card
              key={alerta.id}
              className="p-4 bg-[#1a2234] border border-border hover:border-[#f59e0b]/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-white text-sm mb-1">{alerta.producto}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{alerta.tienda}</span>
                    <span>•</span>
                    <span>{formatearFecha(alerta.fecha)}</span>
                  </div>
                </div>

                <Badge
                  variant="destructive"
                  className="bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444]/30"
                >
                  +{formatearPorcentaje(alerta.variacionPorcentaje)}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-sm">
                  <span className="text-muted-foreground line-through mr-2">
                    {formatearMoneda(alerta.precioAnterior)}
                  </span>
                  <span className="text-white font-semibold font-mono">
                    {formatearMoneda(alerta.precioActual)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {alertas.length > limite && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Mostrando {limite} de {alertas.length} alertas
        </p>
      )}
    </Card>
  );
}
