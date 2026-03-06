'use client';

import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useSettings } from '@/store/useSettings';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { generalLogger } from '@/lib/logger';
import type { ErrorInfo } from 'react';

export default function SettingsPage() {
  const settings = useSettings();
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingsError = (error: Error, errorInfo: ErrorInfo) => {
    generalLogger.error('Error en Configuración:', {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de que quieres restablecer todas las configuraciones a los valores por defecto?')) {
      settings.resetSettings();
      setHasChanges(false);
    }
  };

  return (
    <ErrorBoundary
      onError={handleSettingsError}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-muted/50 rounded-lg">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-sm text-muted-foreground">Personaliza tu experiencia en el dashboard</p>
        </div>
      </div>

      {/* Sección: Notificaciones */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Notificaciones</h2>
          <p className="text-sm text-muted-foreground">Configuración de alertas y actualizaciones</p>
        </div>
        <div className="p-6 space-y-6">
          {/* Habilitar notificaciones */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Notificaciones</label>
              <p className="text-xs text-muted-foreground mt-1">
                Mostrar alertas y notificaciones en el dashboard
              </p>
            </div>
            <button
              onClick={() => {
                settings.setEnableNotifications(!settings.enableNotifications);
                setHasChanges(true);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enableNotifications ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enableNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Auto refresh */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Actualización automática</label>
              <p className="text-xs text-muted-foreground mt-1">
                Actualizar datos automáticamente cada cierto tiempo
              </p>
            </div>
            <button
              onClick={() => {
                settings.setAutoRefresh(!settings.autoRefresh);
                setHasChanges(true);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoRefresh ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Intervalo de actualización */}
          {settings.autoRefresh && (
            <div className="flex items-center justify-between pl-4">
              <div>
                <label className="text-sm font-medium text-foreground">Intervalo de actualización</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Frecuencia de actualización en segundos
                </p>
              </div>
              <select
                value={settings.autoRefreshInterval}
                onChange={(e) => {
                  settings.setAutoRefreshInterval(parseInt(e.target.value));
                  setHasChanges(true);
                }}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value={60}>1 minuto</option>
                <option value={300}>5 minutos</option>
                <option value={600}>10 minutos</option>
                <option value={1800}>30 minutos</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Botones de acción */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          Restablecer valores por defecto
        </button>

        {hasChanges && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            Cambios no guardados
          </div>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}
