'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TrendingUp, AlertTriangle, Wallet, Edit2, Check, Calendar } from 'lucide-react';
import { formatearMoneda, formatearNumero, formatearFecha } from '@/lib/formatters';
import { Compra } from '@/types';

interface BudgetProgressProps {
  compras: Compra[];
  presupuestoInicial?: number;
}

const LOCAL_STORAGE_KEY = 'elpatio-presupuesto-mensual';
const PRESUPUESTO_DEFECTO = 3000;

export function BudgetProgress({ compras, presupuestoInicial }: BudgetProgressProps) {
  // Obtener presupuesto del localStorage o usar el valor por defecto
  const [presupuesto, setPresupuesto] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const guardado = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (guardado) {
        return parseFloat(guardado);
      }
    }
    return presupuestoInicial || PRESUPUESTO_DEFECTO;
  });

  const [editando, setEditando] = useState(false);
  const [nuevoPresupuesto, setNuevoPresupuesto] = useState(presupuesto.toString());

  // Calcular gasto del mes actual
  const { gastoActual, porcentajeUsado, proyeccionFinMes, diasRestantes, gastoPromedioDiario } = useMemo(() => {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    // Filtrar compras del mes actual
    const comprasMesActual = compras.filter(c => {
      return c.fecha.getMonth() === mesActual && c.fecha.getFullYear() === anioActual;
    });

    const gasto = comprasMesActual.reduce((sum, c) => sum + c.total, 0);

    // Calcular días del mes actual
    const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
    const diaActual = hoy.getDate();
    const diasRestantesCalc = diasEnMes - diaActual;

    // Calcular gasto promedio diario
    const gastoPromedio = diaActual > 0 ? gasto / diaActual : 0;

    // Proyección de fin de mes
    const proyeccion = gasto + (gastoPromedio * diasRestantesCalc);

    return {
      gastoActual: gasto,
      porcentajeUsado: presupuesto > 0 ? (gasto / presupuesto) * 100 : 0,
      proyeccionFinMes: proyeccion,
      diasRestantes: diasRestantesCalc,
      gastoPromedioDiario: gastoPromedio,
    };
  }, [compras, presupuesto]);

  // Determinar color según porcentaje
  const getColorEstado = () => {
    if (porcentajeUsado >= 95) return { bg: 'bg-red-500/20', bar: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/30' };
    if (porcentajeUsado >= 80) return { bg: 'bg-yellow-500/20', bar: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/30' };
    return { bg: 'bg-green-500/20', bar: 'bg-green-500', text: 'text-green-400', border: 'border-green-500/30' };
  };

  const colores = getColorEstado();
  const estaSobrePasado = porcentajeUsado > 90;
  const proyeccionSuperaPresupuesto = proyeccionFinMes > presupuesto;

  // Guardar presupuesto en localStorage cuando cambie
  const handleGuardarPresupuesto = () => {
    const valor = parseFloat(nuevoPresupuesto);
    if (!isNaN(valor) && valor > 0) {
      setPresupuesto(valor);
      localStorage.setItem(LOCAL_STORAGE_KEY, valor.toString());
      setEditando(false);
    }
  };

  const handleCancelarEdicion = () => {
    setNuevoPresupuesto(presupuesto.toString());
    setEditando(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGuardarPresupuesto();
    } else if (e.key === 'Escape') {
      handleCancelarEdicion();
    }
  };

  return (
    <Card className={`p-6 bg-gradient-to-br from-background to-card border-border transition-all duration-300 ${
      estaSobrePasado ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'hover:border-primary/50'
    }`}>
      {/* Header con título y presupuesto editable */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${colores.bg} flex items-center justify-center`}>
            <Wallet className={`w-6 h-6 ${colores.text}`} strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Presupuesto Mensual
            </p>
            {editando ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={nuevoPresupuesto}
                  onChange={(e) => setNuevoPresupuesto(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="w-32 h-8 text-lg font-bold bg-background"
                  autoFocus
                  min="0"
                  step="100"
                />
                <button
                  onClick={handleGuardarPresupuesto}
                  className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                  title="Guardar"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelarEdicion}
                  className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  title="Cancelar"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-white font-mono">
                  {formatearMoneda(presupuesto)}
                </p>
                <button
                  onClick={() => {
                    setEditando(true);
                    setNuevoPresupuesto(presupuesto.toString());
                  }}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-white"
                  title="Editar presupuesto"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Alerta de sobre paso */}
        {estaSobrePasado && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg animate-pulse">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">
              ¡Atención! Has usado el {porcentajeUsado.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Gastado: <span className="text-white font-semibold">{formatearMoneda(gastoActual)}</span></span>
          <span className={colores.text + ' font-bold'}>{porcentajeUsado.toFixed(1)}%</span>
        </div>

        <div className="h-4 bg-muted rounded-full overflow-hidden border border-border">
          <div
            className={`h-full ${colores.bar} rounded-full transition-all duration-500 ease-out relative`}
            style={{ width: `${Math.min(porcentajeUsado, 100)}%` }}
          >
            {/* Patrón de rayas para visualizar mejor el progreso */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz4KPC9zdmc+')] opacity-30"></div>
          </div>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>€0</span>
          <span>{formatearMoneda(presupuesto)}</span>
        </div>
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-3 gap-4">
        {/* Gasto promedio diario */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Promedio diario</p>
          <p className="text-lg font-bold text-white font-mono">{formatearMoneda(gastoPromedioDiario)}</p>
        </div>

        {/* Días restantes */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Días restantes
          </p>
          <p className="text-lg font-bold text-white font-mono">{diasRestantes}</p>
        </div>

        {/* Proyección fin de mes */}
        <div className={`space-y-1 ${proyeccionSuperaPresupuesto ? 'text-red-400' : ''}`}>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Proyección
          </p>
          <p className={`text-lg font-bold font-mono ${proyeccionSuperaPresupuesto ? 'text-red-400' : 'text-white'}`}>
            {formatearMoneda(proyeccionFinMes)}
          </p>
        </div>
      </div>

      {/* Alerta de proyección */}
      {proyeccionSuperaPresupuesto && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-400">
            ⚠️ Si continúas a este ritmo, superarás el presupuesto en{' '}
            <span className="font-bold">{formatearMoneda(proyeccionFinMes - presupuesto)}</span>
          </p>
        </div>
      )}

      {/* Estado actual */}
      <div className={`mt-4 p-3 rounded-lg border ${colores.bg} ${colores.border}`}>
        <p className={`text-xs ${colores.text} font-medium`}>
          {porcentajeUsado < 80 && '✨ Vas bien por debajo del presupuesto'}
          {porcentajeUsado >= 80 && porcentajeUsado < 95 && '⚡ Estás llegando al límite del presupuesto'}
          {porcentajeUsado >= 95 && '🚨 Has alcanzado o superado el presupuesto mensual'}
        </p>
      </div>
    </Card>
  );
}
