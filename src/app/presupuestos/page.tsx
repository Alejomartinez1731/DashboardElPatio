'use client';

import { useState, useEffect, useMemo, type ErrorInfo } from 'react';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, Plus, Edit2, Trash2, Save } from 'lucide-react';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generalLogger } from '@/lib/logger';
import { formatearMoneda } from '@/lib/formatters';
import { CATEGORIAS_INFO, type CategoriaProducto } from '@/types';
import { useToast } from '@/components/ui/toast';
import type { PresupuestoVsGosto, CrearPresupuestoInput } from '@/lib/schemas';

// Tipos
type EstadoAlerta = 'ok' | 'advertencia' | 'peligro' | 'excedido';

interface PresupuestoConEstado extends PresupuestoVsGosto {
  estado_alerta: EstadoAlerta;
}

interface ResumenPresupuestos {
  total_presupuesto: number;
  total_gastado: number;
  porcentaje_usado: number;
  diferencia: number;
  estado_alerta: EstadoAlerta;
}

interface ApiResponse {
  success: boolean;
  data?: PresupuestoConEstado[];
  resumen?: ResumenPresupuestos;
  error?: string;
  details?: unknown;
}

// Estado por defecto para el formulario de nuevo presupuesto
const formularioVacio: CrearPresupuestoInput = {
  categoria: 'carnes',
  monto: 0,
  periodo_mes: new Date().getMonth() + 1,
  periodo_anio: new Date().getFullYear(),
  notas: '',
};

export default function PresupuestosPage() {
  // Estados
  const [presupuestos, setPresupuestos] = useState<PresupuestoConEstado[]>([]);
  const [resumen, setResumen] = useState<ResumenPresupuestos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<CrearPresupuestoInput>(formularioVacio);

  // Toast
  const toast = useToast();

  // Cargar presupuestos
  const fetchPresupuestos = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        mes: String(formulario.periodo_mes),
        anio: String(formulario.periodo_anio),
      });

      const response = await fetch(`/api/presupuestos?${params}`);
      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al cargar presupuestos');
      }

      setPresupuestos(data.data || []);
      setResumen(data.resumen || null);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      toast.show({ message: error.message, type: 'error' });
      generalLogger.error('Error cargando presupuestos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar y cambiar periodo
  useEffect(() => {
    fetchPresupuestos();
  }, [formulario.periodo_mes, formulario.periodo_anio]);

  // Manejar errores
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    generalLogger.error('Error en página de presupuestos:', {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });
  };

  // Crear presupuesto
  const handleCrear = async () => {
    try {
      const response = await fetch('/api/presupuestos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al crear presupuesto');
      }

      toast.show({ message: 'Presupuesto creado correctamente', type: 'success' });
      setMostrarFormulario(false);
      setFormulario(formularioVacio);
      fetchPresupuestos();
    } catch (err) {
      const error = err as Error;
      toast.show({ message: error.message, type: 'error' });
      generalLogger.error('Error creando presupuesto:', error);
    }
  };

  // Actualizar presupuesto
  const handleActualizar = async (id: string) => {
    try {
      const response = await fetch('/api/presupuestos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...formulario }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al actualizar presupuesto');
      }

      toast.show({ message: 'Presupuesto actualizado correctamente', type: 'success' });
      setEditandoId(null);
      setFormulario(formularioVacio);
      fetchPresupuestos();
    } catch (err) {
      const error = err as Error;
      toast.show({ message: error.message, type: 'error' });
      generalLogger.error('Error actualizando presupuesto:', error);
    }
  };

  // Eliminar presupuesto
  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) return;

    try {
      const response = await fetch('/api/presupuestos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al eliminar presupuesto');
      }

      toast.show({ message: 'Presupuesto eliminado correctamente', type: 'success' });
      fetchPresupuestos();
    } catch (err) {
      const error = err as Error;
      toast.show({ message: error.message, type: 'error' });
      generalLogger.error('Error eliminando presupuesto:', error);
    }
  };

  // Obtener color de estado
  const getColorEstado = (estado: EstadoAlerta): string => {
    switch (estado) {
      case 'ok': return 'text-green-500 bg-green-50 dark:bg-green-950/30';
      case 'advertencia': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30';
      case 'peligro': return 'text-orange-500 bg-orange-50 dark:bg-orange-950/30';
      case 'excedido': return 'text-red-500 bg-red-50 dark:bg-red-950/30';
    }
  };

  // Obtener color de barra de progreso
  const getColorBarra = (porcentaje: number): string => {
    if (porcentaje >= 100) return 'bg-red-500';
    if (porcentaje >= 80) return 'bg-orange-500';
    if (porcentaje >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Renderizar tarjeta de resumen
  const renderResumen = () => {
    if (!resumen) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total presupuesto */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Presupuesto Total</p>
                <p className="text-2xl font-bold mt-1">{formatearMoneda(resumen.total_presupuesto)}</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-950/30 rounded-lg">
                <Wallet className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total gastado */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gastado</p>
                <p className="text-2xl font-bold mt-1">{formatearMoneda(resumen.total_gastado)}</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-950/30 rounded-lg">
                <TrendingDown className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Porcentaje usado */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">% Usado</p>
                <p className="text-2xl font-bold mt-1">{resumen.porcentaje_usado.toFixed(1)}%</p>
              </div>
              <div className={`p-2 rounded-lg ${getColorEstado(resumen.estado_alerta)}`}>
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diferencia */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponible</p>
                <p className="text-2xl font-bold mt-1">{formatearMoneda(Math.max(0, resumen.diferencia))}</p>
              </div>
              <div className={`p-2 rounded-lg ${resumen.diferencia >= 0 ? 'bg-green-100 dark:bg-green-950/30' : 'bg-red-100 dark:bg-red-950/30'}`}>
                {resumen.diferencia >= 0 ? (
                  <TrendingDown className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar tarjeta de presupuesto
  const renderTarjetaPresupuesto = (p: PresupuestoConEstado) => {
    const categoriaInfo = CATEGORIAS_INFO[p.categoria as CategoriaProducto];
    const porcentaje = Math.min(100, p.porcentaje_usado);

    return (
      <Card key={p.id} className="relative">
        {editandoId === p.id ? (
          // Modo edición
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Monto (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formulario.monto}
                onChange={(e) => setFormulario({ ...formulario, monto: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notas</label>
              <input
                type="text"
                value={formulario.notas || ''}
                onChange={(e) => setFormulario({ ...formulario, notas: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleActualizar(p.id)}>
                <Save className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setEditandoId(null); setFormulario(formularioVacio); }}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        ) : (
          // Modo vista
          <>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{categoriaInfo?.icono || '📦'}</div>
                  <div>
                    <CardTitle>{categoriaInfo?.nombre || p.categoria}</CardTitle>
                    <CardDescription>{formulario.periodo_mes}/{formulario.periodo_anio}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => {
                      setEditandoId(p.id);
                      setFormulario({
                        categoria: p.categoria as CategoriaProducto,
                        monto: p.presupuesto,
                        periodo_mes: p.periodo_mes,
                        periodo_anio: p.periodo_anio,
                        notas: p.notas || '',
                      });
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => handleEliminar(p.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Barra de progreso */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className={p.porcentaje_usado >= 80 ? 'text-red-500 font-semibold' : ''}>
                    {porcentaje.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getColorBarra(p.porcentaje_usado)} transition-all duration-500`}
                    style={{ width: `${Math.min(100, porcentaje)}%` }}
                  />
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Presupuesto</p>
                  <p className="font-semibold">{formatearMoneda(p.presupuesto)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gastado</p>
                  <p className="font-semibold">{formatearMoneda(p.gasto_actual)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Restante</p>
                  <p className={`font-semibold ${p.diferencia < 0 ? 'text-red-500' : ''}`}>
                    {formatearMoneda(Math.max(0, p.diferencia))}
                  </p>
                </div>
              </div>

              {/* Alerta */}
              {p.estado_alerta !== 'ok' && (
                <div className={`flex items-center gap-2 p-2 rounded-lg ${getColorEstado(p.estado_alerta)}`}>
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {p.estado_alerta === 'excedido' && 'Has excedido el presupuesto'}
                    {p.estado_alerta === 'peligro' && 'Estás cerca del límite (80%+)'}
                    {p.estado_alerta === 'advertencia' && 'Has usado más del 60%'}
                  </span>
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando presupuestos...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary onError={handleError} showDetails={process.env.NODE_ENV === 'development'}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted/50 rounded-lg">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Presupuestos por Categoría</h1>
              <p className="text-sm text-muted-foreground">Controla tus gastos por categoría de producto</p>
            </div>
          </div>

          {/* Selector de periodo */}
          <div className="flex items-center gap-2">
            <select
              value={formulario.periodo_mes}
              onChange={(e) => setFormulario({ ...formulario, periodo_mes: parseInt(e.target.value) })}
              className="px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('es', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={formulario.periodo_anio}
              onChange={(e) => setFormulario({ ...formulario, periodo_anio: parseInt(e.target.value) })}
              className="px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={i} value={new Date().getFullYear() - i}>
                  {new Date().getFullYear() - i}
                </option>
              ))}
            </select>
            <Button onClick={() => setMostrarFormulario(true)}>
              <Plus className="w-4 h-4" />
              Nuevo
            </Button>
          </div>
        </div>

        {/* Resumen */}
        {renderResumen()}

        {/* Formulario de nuevo presupuesto */}
        {mostrarFormulario && (
          <Card>
            <CardHeader>
              <CardTitle>Nuevo Presupuesto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Categoría</label>
                  <select
                    value={formulario.categoria}
                    onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value as CategoriaProducto })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {Object.entries(CATEGORIAS_INFO).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.icono} {info.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Monto (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formulario.monto}
                    onChange={(e) => setFormulario({ ...formulario, monto: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Mes</label>
                  <select
                    value={formulario.periodo_mes}
                    onChange={(e) => setFormulario({ ...formulario, periodo_mes: parseInt(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('es', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Año</label>
                  <select
                    value={formulario.periodo_anio}
                    onChange={(e) => setFormulario({ ...formulario, periodo_anio: parseInt(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <option key={i} value={new Date().getFullYear() - i}>
                        {new Date().getFullYear() - i}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Notas (opcional)</label>
                  <input
                    type="text"
                    value={formulario.notas || ''}
                    onChange={(e) => setFormulario({ ...formulario, notas: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleCrear} disabled={formulario.monto <= 0}>
                  <Save className="w-4 h-4" />
                  Guardar
                </Button>
                <Button variant="outline" onClick={() => { setMostrarFormulario(false); setFormulario(formularioVacio); }}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de presupuestos */}
        {error && (
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && presupuestos.length === 0 && !error && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No hay presupuestos configurados para {formulario.periodo_mes}/{formulario.periodo_anio}.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Haz clic en "Nuevo" para crear tu primer presupuesto.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presupuestos.map(renderTarjetaPresupuesto)}
        </div>
      </div>
    </ErrorBoundary>
  );
}
