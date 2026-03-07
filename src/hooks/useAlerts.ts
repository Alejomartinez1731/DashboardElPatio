/**
 * Hook para verificar alertas periódicas
 * Usa polling cada 5 minutos por defecto (optimizado)
 * Pausa el polling cuando el tab no está visible
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { verificarAlertas, Alert } from '@/lib/alerts';

const LEIDAS_STORAGE_KEY = 'alertas-leidas';

interface UseAlertsOptions {
  intervalo?: number; // Segundos entre verificaciones (default: 300 = 5 minutos)
  presupuestoMensual?: number;
  enabled?: boolean;
}

interface UseAlertsResult {
  alertas: Alert[];
  alertasNoLeidas: Alert[];
  totalNuevas: number;
  cargando: boolean;
  error: string | null;
  verificarAhora: () => Promise<void>;
  marcarTodasLeidas: () => void;
}

/**
 * Obtiene IDs de alertas leídas desde localStorage
 */
function getAlertasLeidas(): Set<string> {
  if (typeof window === 'undefined') return new Set();

  try {
    const stored = localStorage.getItem(LEIDAS_STORAGE_KEY);
    if (!stored) return new Set();

    const data = JSON.parse(stored);
    const leidas = data.leidas || [];

    // Filtrar: solo mantener alertas leídas en las últimas 24 horas
    const hace24Horas = Date.now() - (24 * 60 * 60 * 1000);
    const filtradas = leidas.filter((id: string) => {
      const timestamp = parseInt(id.split('-')[1]);
      return timestamp > hace24Horas;
    });

    // Guardar lista filtrada
    if (filtradas.length !== leidas.length) {
      localStorage.setItem(LEIDAS_STORAGE_KEY, JSON.stringify({ leidas: filtradas }));
    }

    return new Set(filtradas);
  } catch {
    return new Set();
  }
}

/**
 * Guarda IDs de alertas leídas en localStorage
 */
function saveAlertasLeidas(leidas: Set<string>): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LEIDAS_STORAGE_KEY, JSON.stringify({
      leidas: Array.from(leidas),
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('No se pudo guardar alertas leídas:', e);
  }
}

/**
 * Marca una alerta como leída
 */
function marcarAlertaLeida(alertaId: string): void {
  const leidas = getAlertasLeidas();
  leidas.add(alertaId);
  saveAlertasLeidas(leidas);
}

/**
 * Marca todas las alertas actuales como leídas
 */
function marcarTodasComoLeidas(alertas: Alert[]): void {
  const leidas = getAlertasLeidas();
  alertas.forEach(a => leidas.add(a.id));
  saveAlertasLeidas(leidas);
}

/**
 * Filtra alertas, marcando las ya leídas
 */
function filtrarAlertasNuevas(alertas: Alert[]): Alert[] {
  const leidas = getAlertasLeidas();

  return alertas.map(alerta => ({
    ...alerta,
    leida: leidas.has(alerta.id),
  }));
}

/**
 * Hook personalizado para polling de alertas
 */
export function useAlerts(options: UseAlertsOptions = {}): UseAlertsResult {
  const {
    intervalo = 300, // 5 minutos por defecto (optimizado desde 30s)
    presupuestoMensual = 3000,
    enabled = true,
  } = options;

  const [alertas, setAlertas] = useState<Alert[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVerifyingRef = useRef(false);
  const visibilityHandlerRef = useRef<(() => void) | null>(null);

  /**
   * Verifica alertas inmediatamente
   */
  const verificarAhora = useCallback(async () => {
    // Prevenir múltiples verificaciones simultáneas
    if (isVerifyingRef.current) {
      return;
    }

    isVerifyingRef.current = true;

    try {
      setCargando(true);
      setError(null);

      const resultado = await verificarAlertas(presupuestoMensual);

      // Filtrar alertas ya leídas
      const alertasFiltradas = filtrarAlertasNuevas(resultado.alertas);

      setAlertas(alertasFiltradas);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al verificar alertas';
      setError(errorMsg);
      console.error('Error en useAlerts:', err);
    } finally {
      setCargando(false);
      isVerifyingRef.current = false;
    }
  }, [presupuestoMensual]);

  /**
   * Marca todas las alertas actuales como leídas
   */
  const marcarTodasLeidas = useCallback(() => {
    marcarTodasComoLeidas(alertas);
    // Actualizar estado local
    setAlertas(prev => prev.map(a => ({ ...a, leida: true })));
  }, [alertas]);

  /**
   * Configurar polling con optimización de visibility API
   */
  useEffect(() => {
    if (!enabled) {
      // Limpiar intervalo si está deshabilitado
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (visibilityHandlerRef.current) {
        document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
        visibilityHandlerRef.current = null;
      }
      return;
    }

    // Verificar inmediatamente al montar
    verificarAhora();

    // Configurar intervalo de polling (5 minutos por defecto)
    intervalRef.current = setInterval(() => {
      // Solo verificar si el tab está visible
      if (document.visibilityState === 'visible') {
        verificarAhora();
      }
    }, intervalo * 1000);

    // Manejar cambios de visibilidad del tab
    visibilityHandlerRef.current = () => {
      if (document.visibilityState === 'visible') {
        // El usuario volvió al tab: verificar inmediatamente
        verificarAhora();
      }
      // Si el tab se oculta, no hacemos nada - el intervalo seguirá corriendo
      // pero no hará peticiones gracias al check de visibilityState arriba
    };

    document.addEventListener('visibilitychange', visibilityHandlerRef.current);

    // Cleanup: remover intervalo y event listener
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (visibilityHandlerRef.current) {
        document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
        visibilityHandlerRef.current = null;
      }
    };
  }, [enabled, intervalo, verificarAhora]);

  // Filtrar alertas no leidas
  const alertasNoLeidas = alertas.filter(a => !a.leida);
  const totalNuevas = alertasNoLeidas.length;

  return {
    alertas,
    alertasNoLeidas,
    totalNuevas,
    cargando,
    error,
    verificarAhora,
    marcarTodasLeidas,
  };
}
