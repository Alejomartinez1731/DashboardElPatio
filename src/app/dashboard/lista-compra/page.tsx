'use client';
import { generalLogger } from '@/lib/logger';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Trash2,
  Check,
  Copy,
  MessageCircle,
  Printer,
  ArrowLeft,
  X,
  CheckSquare,
} from 'lucide-react';
import { useListaCompra, ProductoListaCompra } from '@/store/useListaCompra';
import Link from 'next/link';
import { formatearMoneda } from '@/lib/formatters';

export default function ListaCompraPage() {
  const { productos, marcarComprado, limpiarLista } = useListaCompra();
  const [mensajeCopiado, setMensajeCopiado] = useState(false);

  const generarTextoLista = (): string => {
    if (productos.length === 0) return '';

    let texto = '🛒 LISTA DE COMPRA - El Patio & Grill\n';
    texto += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    productos.forEach((p, idx) => {
      texto += `${idx + 1}. ☐ ${p.producto.toUpperCase()}\n`;
      if (p.notas) texto += `   └─ ${p.notas}\n`;
      if (p.precio) texto += `   └─ ${formatearMoneda(p.precio)} (último precio)\n`;
    });

    texto += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    texto += `\nTotal: ${productos.length} productos`;

    return texto;
  };

  const generarEnlaceWhatsApp = (): string => {
    const texto = generarTextoLista();
    const encoded = encodeURIComponent(texto);
    return `https://wa.me/?text=${encoded}`;
  };

  const copiarAlPortapapeles = async () => {
    const texto = generarTextoLista();
    try {
      await navigator.clipboard.writeText(texto);
      setMensajeCopiado(true);
      setTimeout(() => setMensajeCopiado(false), 2000);
    } catch (err) {
      generalLogger.error('Error al copiar:', err);
    }
  };

  const imprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header con breadcrumb */}
      <div className="flex items-center gap-4 mb-2">
        <Link
          href="/dashboard/recordatorios"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Recordatorios
        </Link>
      </div>

      <DashboardHeader
        title="Lista de Compra"
        description="Productos seleccionados para hacer pedido"
        statusBadge={{
          text: `${productos.length} producto${productos.length !== 1 ? 's' : ''}`,
          color: productos.length > 0
            ? 'bg-purple-500/10 border border-purple-500/30'
            : 'bg-muted/10 border border-border/30'
        }}
      />

      {productos.length === 0 ? (
        <Card className="p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Lista vacía</h3>
          <p className="text-muted-foreground mb-6">
            No hay productos en tu lista de compra.
          </p>
          <Link href="/dashboard/recordatorios">
            <Button className="bg-purple-500 hover:bg-purple-600">
              <CheckSquare className="w-4 h-4 mr-2" />
              Ver Recordatorios
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* Acciones */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={copiarAlPortapapeles}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                {mensajeCopiado ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar texto
                  </>
                )}
              </Button>

              <Button
                onClick={() => window.open(generarEnlaceWhatsApp(), '_blank')}
                variant="outline"
                className="flex-1 sm:flex-none bg-green-500/10 hover:bg-green-500/20 border-green-500/50"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>

              <Button
                onClick={imprimir}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>

              <Button
                onClick={() => {
                  if (confirm('¿Limpiar toda la lista de compra?')) {
                    limpiarLista();
                  }
                }}
                variant="outline"
                className="flex-1 sm:flex-none text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </Card>

          {/* Lista de productos */}
          <div className="space-y-2">
            {productos.map((producto) => (
              <Card
                key={producto.producto}
                className="p-4 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white text-lg">
                        {producto.producto}
                      </h3>
                      <Badge className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                        ☐ Pendiente
                      </Badge>
                    </div>

                    {producto.notas && (
                      <p className="text-sm text-muted-foreground mb-1">
                        📝 {producto.notas}
                      </p>
                    )}

                    {producto.tienda && (
                      <p className="text-xs text-muted-foreground mb-1">
                        🏪 Última compra en: {producto.tienda}
                      </p>
                    )}

                    {producto.precio && (
                      <p className="text-xs text-muted-foreground">
                        💰 Precio anterior: {formatearMoneda(producto.precio)}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => marcarComprado(producto.producto)}
                    size="sm"
                    variant="ghost"
                    className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                    title="Marcar como comprado"
                  >
                    <CheckSquare className="w-5 h-5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Resumen */}
          <Card className="p-4 bg-purple-500/5 border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300">
                  <strong className="text-white">{productos.length}</strong> producto
                  {productos.length !== 1 ? 's' : ''} en la lista
                </p>
                {productos.some(p => p.precio) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Estimado total:{' '}
                    {formatearMoneda(
                      productos.reduce((sum, p) => sum + (p.precio || 0), 0)
                    )}
                  </p>
                )}
              </div>

              <Link href="/dashboard/recordatorios">
                <Button size="sm" variant="outline">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Añadir más
                </Button>
              </Link>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
