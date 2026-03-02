'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Trash2, Check, X, AlertTriangle, Clock, CheckCircle, HelpCircle } from 'lucide-react';
import { Recordatorio } from '@/types';
import { formatearFecha, formatearMoneda } from '@/lib/formatters';

interface RecordatoriosReposicionProps {
  className?: string;
}

export function RecordatoriosReposicion({ className }: RecordatoriosReposicionProps) {
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoInput, setProductoInput] = useState('');
  const [diasInput, setDiasInput] = useState('3');
  const [notasInput, setNotasInput] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const fetchRecordatorios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/recordatorios');
      const result = await response.json();

      if (result.success) {
        setRecordatorios(result.data);
      } else {
        setError(result.error || 'Error al cargar recordatorios');
      }
    } catch (err) {
      setError('Error de conexión al cargar recordatorios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecordatorios();
  }, [fetchRecordatorios]);

  const handleGuardar = async () => {
    setMensaje(null);

    // Validaciones
    const producto = productoInput.trim();
    if (!producto || producto.length < 2) {
      setMensaje({ tipo: 'error', texto: 'El producto debe tener al menos 2 caracteres' });
      return;
    }

    const dias = parseInt(diasInput);
    if (!dias || dias < 1 || dias > 90) {
      setMensaje({ tipo: 'error', texto: 'Los días deben estar entre 1 y 90' });
      return;
    }

    setGuardando(true);
    try {
      const response = await fetch('/api/recordatorios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto,
          dias,
          notas: notasInput.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMensaje({ tipo: 'exito', texto: 'Recordatorio creado correctamente' });
        setProductoInput('');
        setDiasInput('3');
        setNotasInput('');
        setMostrarFormulario(false);
        fetchRecordatorios();
      } else {
        setMensaje({ tipo: 'error', texto: result.error || 'Error al crear recordatorio' });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión' });
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (producto: string) => {
    if (!confirm(`¿Eliminar recordatorio de "${producto}"?`)) return;

    setMensaje(null);
    try {
      const response = await fetch('/api/recordatorios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto }),
      });

      const result = await response.json();

      if (result.success) {
        setMensaje({ tipo: 'exito', texto: 'Recordatorio eliminado' });
        fetchRecordatorios();
      } else {
        setMensaje({ tipo: 'error', texto: result.error || 'Error al eliminar' });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión' });
    }
  };

  const getEstiloRecordatorio = (estado: string) => {
    switch (estado) {
      case 'vencido':
        return {
          borde: 'border-l-4 border-l-red-500',
          fondo: 'bg-red-500/5',
          badge: 'bg-red-500/20 text-red-400 border-red-500/30',
          icono: AlertTriangle,
        };
      case 'proximo':
        return {
          borde: 'border-l-4 border-l-amber-500',
          fondo: 'bg-amber-500/5',
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          icono: Clock,
        };
      case 'ok':
        return {
          borde: 'border-l-4 border-l-green-500',
          fondo: 'bg-transparent',
          badge: 'bg-green-500/20 text-green-400 border-green-500/30',
          icono: CheckCircle,
        };
      default:
        return {
          borde: 'border-l-4 border-l-slate-500',
          fondo: 'bg-slate-500/5',
          badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
          icono: HelpCircle,
        };
    }
  };

  const getTextoEstado = (recordatorio: Recordatorio) => {
    switch (recordatorio.estado) {
      case 'vencido':
        return `Vencido hace ${recordatorio.diasTranscurridos} dias`;
      case 'proximo':
        return `Quedan ${recordatorio.diasConfigurados - (recordatorio.diasTranscurridos || 0)} dias`;
      case 'ok':
        return 'Al dia';
      default:
        return 'Sin datos';
    }
  };

  const vencidosCount = recordatorios.filter((r) => r.estado === 'vencido').length;

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-48 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="font-semibold">Error de carga</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center ${vencidosCount > 0 ? 'animate-pulse' : ''}`}>
            <Bell className={`w-6 h-6 ${vencidosCount > 0 ? 'text-red-400' : 'text-amber-400'}`} strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Recordatorios de Reposicion
            </p>
            {vencidosCount > 0 && (
              <p className="text-sm font-semibold text-red-400">
                {vencidosCount} producto{vencidosCount !== 1 ? 's' : ''} pendiente{vencidosCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          size="sm"
          variant="outline"
          className="border-primary/50 hover:bg-primary/20 hover:border-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Anadir
        </Button>
      </div>

      {/* Mensaje de exito/error */}
      {mensaje && (
        <div
          className={`mb-4 p-3 rounded-lg border ${
            mensaje.tipo === 'exito'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <p className="text-sm font-medium">{mensaje.texto}</p>
        </div>
      )}

      {/* Formulario de nuevo recordatorio */}
      {mostrarFormulario && (
        <Card className="p-4 mb-6 bg-card/50 border-border">
          <h3 className="text-lg font-semibold mb-4">Nuevo Recordatorio de Reposicion</h3>

          <div className="space-y-4">
            <div>
              <Label htmlFor="producto" className="flex items-center gap-2">
                <span>Producto</span>
              </Label>
              <Input
                id="producto"
                value={productoInput}
                onChange={(e) => setProductoInput(e.target.value)}
                placeholder="Escribe el nombre del producto"
                className="mt-1.5"
                disabled={guardando}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Escribe el nombre tal como aparece en las facturas
              </p>
            </div>

            <div>
              <Label htmlFor="dias" className="flex items-center gap-2">
                <span>Comprar cada</span>
              </Label>
              <Input
                id="dias"
                type="number"
                value={diasInput}
                onChange={(e) => setDiasInput(e.target.value)}
                className="mt-1.5 w-24"
                min="1"
                max="90"
                disabled={guardando}
              />
              <span className="text-sm text-muted-foreground ml-2">dias</span>
            </div>

            <div>
              <Label htmlFor="notas" className="flex items-center gap-2">
                <span>Notas (opcional)</span>
              </Label>
              <Input
                id="notas"
                value={notasInput}
                onChange={(e) => setNotasInput(e.target.value)}
                placeholder="Ej: Preferiblemente en BonArea"
                className="mt-1.5"
                disabled={guardando}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setMostrarFormulario(false);
                  setProductoInput('');
                  setDiasInput('3');
                  setNotasInput('');
                  setMensaje(null);
                }}
                variant="outline"
                disabled={guardando}
              >
                Cancelar
              </Button>
              <Button onClick={handleGuardar} disabled={guardando} className="bg-amber-500 hover:bg-amber-600">
                {guardando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Guardar Recordatorio
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de recordatorios */}
      {recordatorios.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No hay recordatorios configurados</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Configura productos que compras regularmente para recibir alertas cuando se pase la fecha de
            reposicion.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recordatorios.map((rec) => {
            const estilo = getEstiloRecordatorio(rec.estado);
            const Icono = estilo.icono;

            return (
              <Card
                key={rec.producto}
                className={`p-4 ${estilo.borde} ${estilo.fondo} border border-border/50 hover:border-border transition-all duration-200`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-white">{rec.producto}</h4>
                      <Badge className={`text-xs ${estilo.badge}`}>
                        <Icono className="w-3 h-3 mr-1" />
                        {getTextoEstado(rec)}
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Hace {rec.diasTranscurridos ?? '?'} dias (limite: {rec.diasConfigurados} dias)
                      </p>

                      {rec.ultimaCompra && rec.tiendaUltimaCompra && (
                        <p>
                          Ultima compra: {formatearFecha(new Date(rec.ultimaCompra))} en {rec.tiendaUltimaCompra}
                          {rec.precioUltimaCompra && ` a ${formatearMoneda(rec.precioUltimaCompra)}`}
                        </p>
                      )}

                      {rec.notas && (
                        <p className="text-xs italic mt-1">
                          Notas: {rec.notas}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleEliminar(rec.producto)}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                    title="Eliminar recordatorio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer con info */}
      <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <p className="text-xs text-amber-400/80">
          Configura productos que compras regularmente para recibir alertas cuando se pase la fecha de
          reposicion.
        </p>
      </div>
    </Card>
  );
}
