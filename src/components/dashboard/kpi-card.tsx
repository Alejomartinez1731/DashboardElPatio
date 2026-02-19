import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatearMoneda, formatearNumero, formatearVariacion } from '@/lib/formatters';
import { colorVariacion } from '@/lib/formatters';

interface KPICardProps {
  titulo: string;
  valor: number;
  tipo?: 'moneda' | 'numero';
  variacion?: number;
  icono?: React.ReactNode;
}

export function KPICard({ titulo, valor, tipo = 'moneda', variacion, icono }: KPICardProps) {
  const valorFormateado = tipo === 'moneda' ? formatearMoneda(valor) : formatearNumero(valor);

  const esPositivo = variacion && variacion > 0;
  const esNegativo = variacion && variacion < 0;
  const esNeutro = variacion === 0 || variacion === undefined;

  const Icono = variacion === undefined ? Minus : esPositivo ? TrendingUp : TrendingDown;

  return (
    <Card className="p-6 bg-card border-border hover:bg-muted/50 transition-colors duration-200 relative overflow-hidden">
      {/* Círculo decorativo */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-[#f59e0b]/5 rounded-bl-full"></div>

      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{titulo}</p>
            <p className="text-2xl font-bold text-white font-mono">{valorFormateado}</p>
          </div>

          {icono && (
            <div className="text-[#f59e0b]">
              {icono}
            </div>
          )}
        </div>

        {variacion !== undefined && (
          <div className="flex items-center gap-1 text-sm" style={{ color: colorVariacion(variacion) }}>
            <Icono className="w-4 h-4" strokeWidth={2} />
            <span className="font-medium">{formatearVariacion(Math.abs(variacion))}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
