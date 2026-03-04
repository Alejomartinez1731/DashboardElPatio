'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useSettings } from '@/store/useSettings';
import { ThemeToggle } from '@/components/theme/theme-toggle';

export default function SettingsPage() {
  const settings = useSettings();
  const [hasChanges, setHasChanges] = useState(false);

  const handleReset = () => {
    if (confirm('¿Estás seguro de que quieres restablecer todas las configuraciones a los valores por defecto?')) {
      settings.resetSettings();
      setHasChanges(false);
    }
  };

  return (
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

      {/* Sección: Apariencia */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Apariencia</h2>
          <p className="text-sm text-muted-foreground">Personaliza el tema visual de la aplicación</p>
        </div>
        <div className="p-6 space-y-6">
          {/* Tema */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Tema</label>
              <p className="text-xs text-muted-foreground mt-1">
                Selecciona el tema que prefieras para la aplicación
              </p>
            </div>
            <ThemeToggle />
          </div>

          {/* Vista por defecto */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Vista por defecto</label>
              <p className="text-xs text-muted-foreground mt-1">
                Cómo se muestran los datos por defecto
              </p>
            </div>
            <select
              value={settings.defaultView}
              onChange={(e) => {
                settings.setDefaultView(e.target.value as 'tablas' | 'tarjetas');
                setHasChanges(true);
              }}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="tablas">Tablas</option>
              <option value="tarjetas">Tarjetas</option>
            </select>
          </div>

          {/* Items por página */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Filas por página</label>
              <p className="text-xs text-muted-foreground mt-1">
                Cantidad de filas a mostrar en las tablas
              </p>
            </div>
            <input
              type="number"
              min={10}
              max={100}
              step={5}
              value={settings.itemsPerPage}
              onChange={(e) => {
                const value = Math.min(100, Math.max(10, parseInt(e.target.value) || 25));
                settings.setItemsPerPage(value);
                setHasChanges(true);
              }}
              className="w-20 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </section>

      {/* Sección: Datos */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Datos</h2>
          <p className="text-sm text-muted-foreground">Configuración de fuentes de datos y recordatorios</p>
        </div>
        <div className="p-6 space-y-6">
          {/* Incluir recordatorios automáticos */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Recordatorios automáticos</label>
              <p className="text-xs text-muted-foreground mt-1">
                Incluir recordatorios calculados automáticamente en las alertas
              </p>
            </div>
            <button
              onClick={() => {
                settings.setIncludeRecordatorios(!settings.includeRecordatorios);
                setHasChanges(true);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.includeRecordatorios ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.includeRecordatorios ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

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
  );
}
