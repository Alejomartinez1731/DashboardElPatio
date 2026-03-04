'use client';

import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generalLogger } from '@/lib/logger';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  showDetails?: boolean;
}

export function ErrorFallback({ error, resetError, showDetails = false }: ErrorFallbackProps) {
  const router = useRouter();

  const handleReset = () => {
    generalLogger.info('Usuario solicitó reintentar después de error');
    resetError();
  };

  const handleGoHome = () => {
    generalLogger.info('Usuario navegó al inicio después de error');
    router.push('/dashboard');
  };

  const handleReportBug = () => {
    const subject = `Error Report - ${new Date().toISOString()}`;
    const body = `
Error: ${error.name}
Message: ${error.message}

Stack Trace:
${error.stack}

URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
    `.trim();

    // Abrir cliente de correo con reporte prellenado
    window.location.href = `mailto:support@elpatio.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    generalLogger.info('Usuario reportó bug via email', { error: error.message });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-lg w-full bg-card border border-destructive/30 rounded-xl shadow-2xl overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-destructive/20 to-destructive/5 px-6 py-4 border-b border-destructive/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/20 rounded-lg">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Algo salió mal</h1>
              <p className="text-sm text-muted-foreground">
                Ha ocurrido un error inesperado
              </p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          {/* Mensaje de error principal */}
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <p className="text-sm text-foreground">
              {error.message || 'Se ha producido un error al cargar esta página.'}
            </p>
          </div>

          {/* Detalles técnicos (opcional) */}
          {showDetails && error.stack && (
            <details className="bg-muted/30 border border-border rounded-lg overflow-hidden">
              <summary className="px-4 py-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
                Ver detalles técnicos
              </summary>
              <div className="px-4 pb-3">
                <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap font-mono bg-background/50 p-3 rounded border border-border mt-2">
                  {error.stack}
                </pre>
              </div>
            </details>
          )}

          {/* Instrucciones */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Qué puedes hacer:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Intenta recargar la página</li>
              <li>Vuelve al panel principal</li>
              <li>Si el problema persiste, repórtalo</li>
            </ul>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleReset}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>

            <button
              onClick={handleGoHome}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-muted hover:bg-muted/70 text-foreground border border-border rounded-lg transition-colors font-medium"
            >
              <Home className="w-4 h-4" />
              Ir al Inicio
            </button>

            <button
              onClick={handleReportBug}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 rounded-lg transition-colors font-medium"
            >
              <Bug className="w-4 h-4" />
              Reportar
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-muted/30 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Error ID: <span className="font-mono">{Date.now().toString(36)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
