/**
 * KPI de Scores de Proveedores
 * Muestra calificación (1-5) basada en precio + frecuencia + disponibilidad
 */

import { Star, Store } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatearMoneda } from '@/lib/formatters';

interface ProveedorScore {
  proveedor: string;
  score: number;
  score_precio: number;
  score_frecuencia: number;
  score_disponibilidad: number;
  total_compras: number;
  gasto_total: number;
}

interface ScoresProveedoresKPIProps {
  scores_proveedores: ProveedorScore[];
  mostrarTodos?: boolean;
  className?: string;
}

export function ScoresProveedoresKPI({
  scores_proveedores,
  mostrarTodos = false,
  className = '',
}: ScoresProveedoresKPIProps) {
  // Ordenar por score y tomar top 5
  const topProveedores = scores_proveedores.slice(0, 5);

  const getScoreColor = (score: number): string => {
    if (score >= 4.5) return 'text-green-500';
    if (score >= 3.5) return 'text-blue-500';
    if (score >= 2.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number): string => {
    if (score >= 4.5) return 'bg-green-100 dark:bg-green-950/30';
    if (score >= 3.5) return 'bg-blue-100 dark:bg-blue-950/30';
    if (score >= 2.5) return 'bg-yellow-100 dark:bg-yellow-950/30';
    return 'bg-red-100 dark:bg-red-950/30';
  };

  const renderStars = (score: number) => {
    const estrellas = Math.round(score);
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
              i < estrellas ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Store className="w-4 h-4" />
          Scores de Proveedores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topProveedores.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay datos de proveedores
          </p>
        ) : (
          <div className="space-y-3">
            {topProveedores.map((prov) => (
              <div key={prov.proveedor} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{prov.proveedor}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(prov.score)}
                      <span className={`text-sm font-bold ${getScoreColor(prov.score)}`}>
                        {prov.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg ${getScoreBg(prov.score)}`}>
                    <Star className={`w-4 h-4 ${getScoreColor(prov.score)} fill-current`} />
                  </div>
                </div>

                {/* Scores desglosados */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Precio:</span>
                    <span className="ml-1 font-medium">{prov.score_precio.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Freq:</span>
                    <span className="ml-1 font-medium">{prov.score_frecuencia.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Disp:</span>
                    <span className="ml-1 font-medium">{prov.score_disponibilidad.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                  <span>{prov.total_compras} compras</span>
                  <span>{formatearMoneda(prov.gasto_total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
