'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Bell, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Recordatorio } from '@/types';
import Link from 'next/link';

interface RecordatoriosSummaryProps {
  className?: string;
}

export function RecordatoriosSummary({ className }: RecordatoriosSummaryProps) {
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecordatorios = async () => {
      try {
        const response = await fetch('/api/recordatorios');
        const result = await response.json();

        if (result.success) {
          // Solo mostrar los que necesitan atención (vencidos + próximos)
          const importantes = result.data.filter((r: Recordatorio) =>
            r.estado === 'vencido' || r.estado === 'proximo'
          );
          setRecordatorios(importantes.slice(0, 5)); // Máximo 5
        }
      } catch (err) {
        console.error('Error cargando resumen recordatorios:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordatorios();
  }, []);

  const vencidosCount = recordatorios.filter((r) => r.estado === 'vencido').length;
  const proximosCount = recordatorios.filter((r) => r.estado === 'proximo').length;

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Link href="/dashboard/recordatorios" className="block group">
      <Card className={`p-6 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
              vencidosCount > 0
                ? 'bg-red-500/20 border-red-500/50 animate-pulse shadow-lg shadow-red-500/20'
                : proximosCount > 0
                  ? 'bg-amber-500/20 border-amber-500/30'
                  : 'bg-green-500/20 border-green-500/30'
            }`}>
              <Bell className={`w-6 h-6 ${
                vencidosCount > 0 ? 'text-red-400' : proximosCount > 0 ? 'text-amber-400' : 'text-green-400'
              }`} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recordatorios de Reposicion
              </p>
              <p className="text-lg font-bold text-white flex items-center gap-2">
                {vencidosCount > 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    {vencidosCount} producto{vencidosCount !== 1 ? 's' : ''} vencido{vencidosCount !== 1 ? 's' : ''}
                  </>
                ) : proximosCount > 0 ? (
                  <>
                    {proximosCount} producto{proximosCount !== 1 ? 's' : ''} próxim{proximosCount !== 1 ? 'os' : 'o'}
                  </>
                ) : (
                  <>Todos al día</>
                )}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>

        {/* Lista de productos importantes */}
        {recordatorios.length > 0 ? (
          <div className="space-y-2">
            {recordatorios.map((rec) => (
              <div
                key={rec.producto}
                className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-muted/30 border border-border/50"
              >
                <span className="text-white/90 font-medium">{rec.producto}</span>
                <Badge
                  variant="outline"
                  className={
                    rec.estado === 'vencido'
                      ? 'border-red-500/50 text-red-400 bg-red-500/10'
                      : 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                  }
                >
                  {rec.estado === 'vencido'
                    ? `Vencido (${rec.diasTranscurridos}d)`
                    : `Quedan ${rec.diasConfigurados - (rec.diasTranscurridos || 0)}d`}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-sm text-muted-foreground">No hay alertas pendientes</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <p className="text-xs text-primary/80 flex items-center gap-1">
            <span>Ver todos los recordatorios</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>
      </Card>
    </Link>
  );
}
