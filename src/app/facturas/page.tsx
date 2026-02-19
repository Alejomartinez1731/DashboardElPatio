'use client';

import { useEffect, useState } from 'react';
import { Compra } from '@/types';
import { formatearMoneda, formatearFecha } from '@/lib/formatters';
import { normalizarTienda, COLORES_TIENDA, agruparPorFactura } from '@/lib/data-utils';
import { Receipt, Calendar, Store, ShoppingCart, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useState as useReactState } from 'react';

function parsearFecha(fecha: string | Date): Date {
  if (fecha instanceof Date) return isNaN(fecha.getTime()) ? new Date() : fecha;
  if (!fecha || typeof fecha !== 'string') return new Date();

  if (fecha.includes('/')) {
    const partes = fecha.split('/');
    if (partes.length === 3) {
      const [dia, mes, anio] = partes.map(p => parseInt(p.trim(), 10));
      if (!isNaN(dia) && !isNaN(mes) && !isNaN(anio)) {
        return new Date(anio, mes - 1, dia);
      }
    }
  }

  const parsed = new Date(fecha);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

interface FacturaConDetalle {
  id: string;
  fecha: Date;
  tienda: string;
  tiendaNormalizada: string;
  color: string;
  total: number;
  numProductos: number;
  items: Compra[];
}

export default function FacturasPage() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [cargando, setCargando] = useState(true);
  const [facturaExpandida, setFacturaExpandida] = useReactState<string | null>(null);

  useEffect(() => {
    async function fetchDatos() {
      try {
        const response = await fetch('/api/sheets');
        const result = await response.json();
        if (result.success && result.data.base_de_datos?.values) {
          const values = result.data.base_de_datos.values as any[][];
          if (values.length > 1) {
            const cabeceras = values[0].map((h: string) => h.toLowerCase().trim());
            const comprasProcesadas: Compra[] = [];

            for (let i = 1; i < values.length; i++) {
              const fila = values[i];
              const obj: any = {};
              cabeceras.forEach((cab: string, idx: number) => { obj[cab] = fila[idx]; });

              const compra: Compra = {
                id: `compra-${i}`,
                fecha: parsearFecha(obj.fecha || ''),
                tienda: obj.tienda || '',
                producto: obj.descripcion || '',
                cantidad: parseFloat(obj.cantidad || '0') || 0,
                precioUnitario: parseFloat(obj['precio_unitario'] || obj['precio unitario'] || '0') || 0,
                total: parseFloat(obj.total || '0') || 0,
              };

              if (compra.producto && !compra.producto.toLowerCase().includes('total')) {
                comprasProcesadas.push(compra);
              }
            }
            setCompras(comprasProcesadas);
          }
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setCargando(false);
      }
    }
    fetchDatos();
  }, []);

  // Agrupar compras por factura
  const facturas: FacturaConDetalle[] = agruparPorFactura(compras).map(factura => {
    const tiendaNormalizada = normalizarTienda(factura.tienda);
    return {
      ...factura,
      tiendaNormalizada,
      color: COLORES_TIENDA[tiendaNormalizada] || COLORES_TIENDA['Otros'],
    } as FacturaConDetalle;
  }).sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  // Estadísticas
  const stats = {
    totalFacturas: facturas.length,
    gastoTotal: facturas.reduce((sum, f) => sum + f.total, 0),
    gastoPromedio: facturas.length > 0 ? facturas.reduce((sum, f) => sum + f.total, 0) / facturas.length : 0,
    tiendaMasFrecuente: (() => {
      const conteo: Record<string, number> = {};
      facturas.forEach(f => {
        const tienda = normalizarTienda(f.tienda);
        conteo[tienda] = (conteo[tienda] || 0) + 1;
      });
      return Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    })(),
  };

  // Agrupar facturas por mes
  const facturasPorMes = facturas.reduce((acc, factura) => {
    const mes = factura.fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
    if (!acc[mes]) {
      acc[mes] = [];
    }
    acc[mes].push(factura);
    return acc;
  }, {} as Record<string, FacturaConDetalle[]>);

  const toggleFactura = (id: string) => {
    setFacturaExpandida(facturaExpandida === id ? null : id);
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Historial de Facturas</h1>
        <p className="text-muted-foreground">Todas las facturas agrupadas por fecha y tienda</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f59e0b]/10 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-[#f59e0b]" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Total Facturas</p>
              <p className="text-xl font-bold text-white">{stats.totalFacturas}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#10b981]/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#10b981]" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Gasto Total</p>
              <p className="text-xl font-bold text-[#10b981]">{formatearMoneda(stats.gastoTotal)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-[#3b82f6]" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Promedio</p>
              <p className="text-xl font-bold text-[#3b82f6]">{formatearMoneda(stats.gastoPromedio)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8b5cf6]/10 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-[#8b5cf6]" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Tienda Principal</p>
              <p className="text-sm font-bold text-[#8b5cf6] truncate">{stats.tiendaMasFrecuente}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Facturas agrupadas por mes */}
      {Object.entries(facturasPorMes)
        .sort((a, b) => {
          const mesA = new Date(a[1][0].fecha);
          const mesB = new Date(b[1][0].fecha);
          return mesB.getTime() - mesA.getTime();
        })
        .map(([mes, facturasMes]) => (
          <div key={mes} className="space-y-4">
            {/* Mes header */}
            <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
              <Calendar className="w-5 h-5 text-[#f59e0b]" />
              <h2 className="text-lg font-bold text-white capitalize">{mes}</h2>
              <span className="text-sm text-muted-foreground">({facturasMes.length} facturas)</span>
              <span className="ml-auto text-sm font-semibold text-[#10b981]">
                {formatearMoneda(facturasMes.reduce((sum, f) => sum + f.total, 0))}
              </span>
            </div>

            {/* Lista de facturas del mes */}
            <div className="space-y-3">
              {facturasMes.map((factura) => {
                const expandida = facturaExpandida === factura.id;
                return (
                  <Card
                    key={factura.id}
                    className={`overflow-hidden bg-card border-border hover:border-primary/30 transition-all ${
                      expandida ? 'border-[#f59e0b]' : ''
                    }`}
                  >
                    {/* Header de factura (siempre visible) */}
                    <div
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleFactura(factura.id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Icono de tienda con color */}
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: factura.color + '20' }}>
                          <Store className="w-5 h-5" style={{ color: factura.color }} />
                        </div>

                        {/* Info principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{factura.tiendaNormalizada}</h3>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{formatearFecha(factura.fecha)}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground">{factura.numProductos} productos</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">ID: {factura.id}</span>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#10b981]">{formatearMoneda(factura.total)}</p>
                        </div>

                        {/* Toggle icon */}
                        <div className="ml-4">
                          {expandida ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detalle de productos (expansible) */}
                    {expandida && (
                      <div className="border-t border-border bg-muted/30">
                        <div className="p-4">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3">
                            Productos de esta factura
                          </p>
                          <div className="space-y-2">
                            {factura.items.map((item, idx) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 bg-muted rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white font-medium truncate">{item.producto}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.cantidad} × {formatearMoneda(item.precioUnitario)}
                                  </p>
                                </div>
                                <div className="ml-4 text-right">
                                  <p className="text-sm font-semibold text-white">{formatearMoneda(item.total)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

      {/* No hay facturas */}
      {facturas.length === 0 && (
        <Card className="p-12 bg-card border-border text-center">
          <Receipt className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg mb-2">No hay facturas registradas</p>
          <p className="text-muted-foreground text-sm">Las facturas aparecerán aquí una vez que realices compras</p>
        </Card>
      )}
    </div>
  );
}
