'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './error-fallback';
import { generalLogger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary para capturar errores en componentes hijos
 *
 * Características:
 * - Captura errores en renderizado, ciclo de vida y constructores
 * - Registra errores con el logger centralizado
 * - Muestra UI amigable al usuario
 * - Permite recuperación con botón de reintentar
 *
 * NO captura:
 * - Event handlers (usar try/catch en el handler)
 * - Código asíncrono (usar try/catch en async functions)
 * - Errores en Server Components
 * - Errores lanzados deliberadamente
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Actualizar estado para mostrar fallback UI en el próximo render
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log del error con detalles completos
    generalLogger.error('Error capturado por Error Boundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Llamar callback personalizado si se proporciona
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // En producción, podríamos enviar a servicio de tracking
    // Por ejemplo: Sentry, Vercel Logs, etc.
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Ejemplo: enviar a analytics o error tracking service
      // trackError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });

    // Recargar la página para limpiar estado
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { error } = this.state;

      // Si se proporciona fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // De lo contrario, usar el ErrorFallback estándar
      return (
        <ErrorFallback
          error={error || new Error('Error desconocido')}
          resetError={this.handleReset}
          showDetails={this.props.showDetails || process.env.NODE_ENV === 'development'}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Hook simplificado para crear Error Boundaries funcionales
 * Útil para casos donde prefieres hooks sobre class components
 *
 * Ejemplo:
 * ```tsx
 * function MyComponent() {
 *   const { error, reset } = useErrorHandler();
 *
 *   if (error) {
 *     return <ErrorFallback error={error} resetError={reset} />;
 *   }
 *
 *   return <Children />;
 * }
 * ```
 */
export function useErrorHandler() {
  return {
    // Este es un placeholder - React 19 tiene useErrorHandler() nativo
    // Por ahora recomendamos usar la clase ErrorBoundary
    reset: () => window.location.reload(),
  };
}
