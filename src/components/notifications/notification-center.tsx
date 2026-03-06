/**
 * Centro de Notificaciones - Muestra alertas en tiempo real
 */

'use client';

import { Bell, X, Check, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useState } from 'react';
import { Alert } from '@/lib/alerts';
import { formatearFecha } from '@/lib/formatters';

interface NotificationCenterProps {
  alertas: Alert[];
  totalNuevas: number;
  onMarcarTodasLeidas?: () => void;
  onCerrar?: () => void;
}

export function NotificationCenter({
  alertas,
  totalNuevas,
  onMarcarTodasLeidas,
  onCerrar,
}: NotificationCenterProps) {
  const [filtro, setFiltro] = useState<'todas' | 'no_leidas'>('todas');

  const alertasFiltradas = filtro === 'no_leidas'
    ? alertas.filter(a => !a.leida)
    : alertas;

  const getIcono = (severidad: Alert['severidad']) => {
    switch (severidad) {
      case 'danger':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Check className="w-5 h-5 text-green-500" />;
    }
  };

  const getColorBg = (severidad: Alert['severidad']) => {
    switch (severidad) {
      case 'danger':
        return 'bg-destructive/10 border-destructive/30';
      case 'warning':
        return 'bg-orange-500/10 border-orange-500/30';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30';
      default:
        return 'bg-green-500/10 border-green-500/30';
    }
  };

  if (alertas.length === 0) {
    return (
      <div className="w-96 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Notificaciones</h3>
          </div>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 text-center">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No hay alertas activas</p>
          <p className="text-sm text-muted-foreground mt-2">
            Todo está funcionando correctamente
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {totalNuevas > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center">
                {totalNuevas > 9 ? '9+' : totalNuevas}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-foreground">Notificaciones</h3>
        </div>
        <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filtro */}
      <div className="px-4 py-2 border-b border-border flex gap-2">
        <button
          onClick={() => setFiltro('todas')}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            filtro === 'todas'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/70'
          }`}
        >
          Todas ({alertas.length})
        </button>
        <button
          onClick={() => setFiltro('no_leidas')}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            filtro === 'no_leidas'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/70'
          }`}
        >
          No leídas ({totalNuevas})
        </button>
      </div>

      {/* Lista de alertas */}
      <div className="max-h-96 overflow-y-auto">
        {alertasFiltradas.map((alerta) => (
          <div
            key={alerta.id}
            className={`p-4 border-b border-border hover:bg-muted/50 transition-colors ${
              !alerta.leida ? 'bg-muted/30' : ''
            }`}
          >
            <div className="flex gap-3">
              <div className={`p-2 rounded-lg border ${getColorBg(alerta.severidad)}`}>
                {getIcono(alerta.severidad)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-foreground text-sm">{alerta.titulo}</p>
                  {!alerta.leida && (
                    <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{alerta.mensaje}</p>
                <p className="text-xs text-muted-foreground">
                  {formatearFecha(alerta.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-muted/30">
        <button
          onClick={() => {
            // Marcar todas como leídas usando el hook
            if (onMarcarTodasLeidas) {
              onMarcarTodasLeidas();
            }
          }}
          className="w-full px-3 py-2 text-sm text-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          disabled={totalNuevas === 0}
        >
          Marcar todas como leídas
        </button>
      </div>
    </div>
  );
}

/**
 * Botón trigger para abrir el centro de notificaciones
 */
interface NotificationTriggerProps {
  totalNuevas: number;
  onClick: () => void;
}

export function NotificationTrigger({ totalNuevas, onClick }: NotificationTriggerProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200"
    >
      <Bell className="w-5 h-5" />
      {totalNuevas > 0 && (
        <>
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            {totalNuevas > 9 ? '9+' : totalNuevas}
          </span>
        </>
      )}
    </button>
  );
}
