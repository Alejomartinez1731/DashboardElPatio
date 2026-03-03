'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Trash2, Check, X, AlertTriangle, Clock, CheckCircle, HelpCircle, Zap, Settings, ShoppingCart, Link as LinkIcon } from 'lucide-react';
import { Recordatorio } from '@/types';
import { formatearFecha, formatearMoneda } from '@/lib/formatters';
import { useListaCompra } from '@/store/useListaCompra';
import Link from 'next/link';

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

  // Store de lista de compra - suscribirse a cambios
  const { toggleProducto, productos } = useListaCompra();

  // Debug: log estado cada vez que cambia
  console.log('🔄 Render Recordatorios - Productos en lista:', productos.length);

  // Funciones locales que dependen de productos
  const estaEnLista = (productoNombre: string) => {
    const resultado = productos.some(p => p.producto === productoNombre);
    console.log(`   ¿"${productoNombre}" en lista?`, resultado);
    return resultado;
  };

  const contador = () => productos.length;

  const fetchRecordatorios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/recordatorios');
      const result = await response.json();

      if (result.success) {
        // Filtrar: SOLO mostrar vencidos, próximos o sin datos
        // NO mostrar los que están "ok" (verde/al día)
        const importantes = result.data.filter((r: Recordatorio) =>
          r.estado === 'vencido' || r.estado === 'proximo' || r.estado === 'sin_datos'
        );
        setRecordatorios(importantes);
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

  const getEstiloRecordatorio = (estado: string, tipo: 'manual' | 'automatico') => {
    // Base: colores según estado
    const baseEstilo = (() => {
      switch (estado) {
        case 'vencido':
          return {
            bordeColor: 'red',
            badge: 'bg-red-500 text-white font-bold border-red-500 shadow-lg shadow-red-500/20',
            icono: AlertTriangle,
            iconoColor: 'text-red-400',
          };
        case 'proximo':
          return {
            bordeColor: 'amber',
            badge: 'bg-amber-500 text-white font-semibold border-amber-500 shadow-md shadow-amber-500/20',
            icono: Clock,
            iconoColor: 'text-amber-400',
          };
        case 'ok':
          return {
            bordeColor: 'green',
            badge: 'bg-green-500/20 text-green-300 border-green-500/30',
            icono: CheckCircle,
            iconoColor: 'text-green-400',
          };
        default:
          return {
            bordeColor: 'slate',
            badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
            icono: HelpCircle,
            iconoColor: 'text-slate-400',
          };
      }
    })();

    // Si es manual, usa colores azules/púrpuras con borde doble
    if (tipo === 'manual') {
      return {
        borde: 'border-l-4 border-l-blue-500 border border-blue-500/30 shadow-lg shadow-blue-500/10',
        fondo: 'bg-gradient-to-r from-blue-500/15 to-purple-500/5',
        badge: 'bg-blue-500 text-white font-semibold border-blue-500 shadow-md shadow-blue-500/20',
        icono: Settings,
        iconoColor: 'text-blue-400',
        esManual: true,
      };
    }

    // Si es automático, usa colores del estado
    return {
      borde: `border-l-4 border-l-${baseEstilo.bordeColor}-500`,
      fondo: `bg-gradient-to-r from-${baseEstilo.bordeColor}-500/15 to-${baseEstilo.bordeColor}-500/5`,
      badge: baseEstilo.badge,
      icono: baseEstilo.icono,
      iconoColor: baseEstilo.iconoColor,
      esManual: false,
    };
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
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
            vencidosCount > 0
              ? 'bg-red-500/20 border-red-500/50 animate-pulse shadow-lg shadow-red-500/20'
              : 'bg-amber-500/20 border-amber-500/30'
          }`}>
            <Bell className={`w-7 h-7 ${vencidosCount > 0 ? 'text-red-400' : 'text-amber-400'}`} strokeWidth={2.5} />
            {vencidosCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {vencidosCount}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Recordatorios de Reposicion
            </p>
            {vencidosCount > 0 ? (
              <p className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                {vencidosCount} producto{vencidosCount !== 1 ? 's' : ''} pendiente{vencidosCount !== 1 ? 's' : ''}
              </p>
            ) : (
              <p className="text-sm text-amber-400/80 font-medium">
                Todos al dia
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/dashboard/lista-compra">
            <Button
              size="sm"
              variant="outline"
              className="border-purple-500/50 hover:bg-purple-500/20 hover:border-purple-500 relative"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Lista de Compra
              {contador() > 0 && (
                <Badge className="ml-1 px-1.5 py-0 text-xs bg-purple-500 text-white border-0">
                  {contador()}
                </Badge>
              )}
            </Button>
          </Link>

          <Button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            size="sm"
            variant="outline"
            className="border-primary/50 hover:bg-primary/20 hover:border-primary"
          >
            <Settings className="w-4 h-4 mr-2" />
            Manual
          </Button>
        </div>
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
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Nuevo Recordatorio Manual
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configura un recordatorio manual para overridear el cálculo automático.
          </p>

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
                className="mt-1.5 !bg-zinc-800/80 !border-zinc-600 !focus:border-primary !focus:ring-2 !focus:ring-primary/30 text-white placeholder:text-zinc-400"
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
                className="mt-1.5 w-24 !bg-zinc-800/80 !border-zinc-600 !focus:border-primary !focus:ring-2 !focus:ring-primary/30 text-white"
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
                className="mt-1.5 !bg-zinc-800/80 !border-zinc-600 !focus:border-primary !focus:ring-2 !focus:ring-primary/30 text-white placeholder:text-zinc-400"
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
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-green-400 font-semibold mb-2">¡Todo al día!</p>
          <p className="text-muted-foreground mb-4">No hay productos que necesiten atención</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Solo se muestran productos vencidos o próximos a su fecha de reposición.
            Los productos en verde (al día) están ocultos para reducir el ruido visual.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recordatorios.map((rec, idx) => {
            const estilo = getEstiloRecordatorio(rec.estado, rec.tipo);
            const Icono = estilo.icono;

            console.log(`🎨 Renderizando checkbox #${idx} para:`, rec.producto);

            return (
              <Card
                key={rec.producto}
                className={`p-3 ${estilo.borde} ${estilo.fondo} border border-border/50 hover:border-border transition-all duration-200`}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox para añadir a lista de compra */}
                  {(() => {
                    console.log(`✅ Creando elemento checkbox para: ${rec.producto}`);
                    return (
                      <div className="relative" style={{ zIndex: 10 }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🛒 Click en checkbox:', rec.producto);
                            console.log('   Estado actual:', estaEnLista(rec.producto) ? 'EN LISTA' : 'NO EN LISTA');
                            console.log('   Productos en lista:', productos.length);

                            const productoData = {
                              producto: rec.producto,
                              notas: rec.notas || '',
                              ultimaCompra: rec.ultimaCompra || undefined,
                              tienda: rec.tiendaUltimaCompra || undefined,
                              precio: rec.precioUltimaCompra || undefined,
                              agregadoEn: new Date().toISOString(),
                            };

                            console.log('   Datos a enviar:', productoData);
                            toggleProducto(productoData);
                            console.log('   ✅ Toggle ejecutado');
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🖱️ MouseDown en checkbox:', rec.producto);
                          }}
                          onMouseEnter={() => console.log('📍 Mouse ENTER checkbox:', rec.producto)}
                          className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all cursor-pointer select-none ${
                            estaEnLista(rec.producto)
                              ? 'bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/30'
                              : 'border-border hover:border-purple-500/50 hover:bg-purple-500/10 active:scale-95'
                          }`}
                          title={estaEnLista(rec.producto) ? 'Quitar de la lista' : 'Añadir a la lista'}
                          style={{ touchAction: 'manipulation' }}
                        >
                          {estaEnLista(rec.producto) && <Check className="w-4 h-4" strokeWidth={3} />}
                        </button>
                      </div>
                    );
                  })()}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-white text-sm truncate">{rec.producto}</h4>
                      <Badge className={`text-xs px-2 py-0.5 ${estilo.badge}`}>
                        <Icono className={`w-3 h-3 mr-1 ${estilo.iconoColor}`} />
                        {getTextoEstado(rec)}
                      </Badge>
                      {estilo.esManual && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5 border-blue-400/50 text-blue-300 bg-blue-400/10">
                          Manual
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>
                        Hace <span className="text-white font-medium">{rec.diasTranscurridos ?? '?'}</span> días
                        <span className="text-muted-foreground/70">(límite: {rec.diasConfigurados})</span>
                      </span>

                      {rec.ultimaCompra && rec.tiendaUltimaCompra && (
                        <span>• Última: {rec.tiendaUltimaCompra}</span>
                      )}

                      {rec.notas && (
                        <span className="text-primary/80 truncate max-w-[200px]" title={rec.notas}>
                          • {rec.notas}
                        </span>
                      )}
                    </div>
                  </div>

                  {rec.tipo === 'manual' && (
                    <Button
                      onClick={() => handleEliminar(rec.producto)}
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                      title="Eliminar recordatorio manual"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer con info */}
      <div className="mt-4 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
        <p className="text-xs text-purple-400/80">
          <strong className="text-purple-300">Modo hbrido:</strong> El sistema calcula automaticamente la frecuencia de cada producto.
          Configura recordatorios manuales para overridear el calculo automatico.
        </p>
      </div>
    </Card>
  );
}
