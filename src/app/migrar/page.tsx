/**
 * Página de Migración de Sheets a Supabase
 * Permite ejecutar la migración de forma fácil y visual
 */

'use client';

import { useState } from 'react';
import { Database, ArrowRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

type Seccion = 'compras' | 'facturas' | 'proveedores' | 'precios' | 'recordatorios';

interface ResultadoMigracion {
  exitosos: number;
  errores: number;
  errores_detalle: string[];
}

interface MigracionResponse {
  success: boolean;
  message?: string;
  resultados?: Record<string, ResultadoMigracion>;
  error?: string;
}

export default function MigrarPage() {
  const [secciones, setSecciones] = useState<Seccion[]>(['compras', 'facturas', 'proveedores', 'precios', 'recordatorios']);
  const [migrando, setMigrando] = useState(false);
  const [resultados, setResultados] = useState<Record<string, ResultadoMigracion> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleSeccion = (seccion: Seccion) => {
    setSecciones(prev =>
      prev.includes(seccion)
        ? prev.filter(s => s !== seccion)
        : [...prev, seccion]
    );
  };

  const ejecutarMigracion = async () => {
    if (secciones.length === 0) {
      setError('Selecciona al menos una sección para migrar');
      return;
    }

    setMigrando(true);
    setError(null);
    setResultados(null);

    try {
      const response = await fetch('/api/migrar/sheets-a-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secciones,
          limpiar_previo: false,
        }),
      });

      const data: MigracionResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error durante la migración');
      }

      setResultados(data.resultados || {});
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setMigrando(false);
    }
  };

  const seccionesInfo: Record<Seccion, { nombre: string; icono: string; color: string }> = {
    compras: { nombre: 'Compras', icono: '🛒', color: 'bg-blue-500' },
    facturas: { nombre: 'Facturas', icono: '🧾', color: 'bg-green-500' },
    proveedores: { nombre: 'Proveedores', icono: '🏪', color: 'bg-purple-500' },
    precios: { nombre: 'Precios Históricos', icono: '🏷️', color: 'bg-orange-500' },
    recordatorios: { nombre: 'Recordatorios', icono: '🔔', color: 'bg-yellow-500' },
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Database className="w-8 h-8" />
          Migrar de Sheets a Supabase
        </h1>
        <p className="text-muted-foreground">
          Transfiere todos tus datos de Google Sheets a Supabase
        </p>
      </div>

      {/* Selector de secciones */}
      <Card>
        <CardHeader>
          <CardTitle>Selecciona qué deseas migrar</CardTitle>
          <CardDescription>
            Marca las secciones que quieres migrar desde Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Object.keys(seccionesInfo) as Seccion[]).map((seccion) => {
              const info = seccionesInfo[seccion];
              const seleccionada = secciones.includes(seccion);

              return (
                <button
                  key={seccion}
                  onClick={() => toggleSeccion(seccion)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    seleccionada
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.icono}</span>
                    <span className="font-medium">{info.nombre}</span>
                    {seleccionada && (
                      <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Select all */}
          <button
            onClick={() => {
              if (secciones.length === Object.keys(seccionesInfo).length) {
                setSecciones([]);
              } else {
                setSecciones(Object.keys(seccionesInfo) as Seccion[]);
              }
            }}
            className="mt-4 text-sm text-primary hover:underline"
          >
            {secciones.length === Object.keys(seccionesInfo).length
              ? 'Deseleccionar todas'
              : 'Seleccionar todas'}
          </button>
        </CardContent>
      </Card>

      {/* Botón de acción */}
      <div className="flex justify-center">
        <button
          onClick={ejecutarMigracion}
          disabled={migrando || secciones.length === 0}
          className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {migrando ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Migrando...
            </>
          ) : (
            <>
              <ArrowRight className="w-5 h-5" />
              Ejecutar Migración
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-red-500">
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error en la migración</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {resultados && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <CheckCircle className="w-5 h-5" />
              Migración Completada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(resultados).map(([seccion, resultado]) => {
              const info = seccionesInfo[seccion as Seccion];
              const hayErrores = resultado.errores > 0;

              return (
                <div key={seccion} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{info.icono}</span>
                      <span className="font-medium">{info.nombre}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600">
                        ✓ {resultado.exitosos} exitosos
                      </span>
                      {hayErrores && (
                        <span className="text-red-600">
                          ✗ {resultado.errores} errores
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detalle de errores */}
                  {hayErrores && resultado.errores_detalle.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-red-500 hover:underline">
                        Ver detalles de errores
                      </summary>
                      <ul className="mt-2 space-y-1 pl-4 list-disc">
                        {resultado.errores_detalle.slice(0, 10).map((err, idx) => (
                          <li key={idx} className="text-red-400">
                            {err}
                          </li>
                        ))}
                        {resultado.errores_detalle.length > 10 && (
                          <li className="text-muted-foreground">
                            ... y {resultado.errores_detalle.length - 10} errores más
                          </li>
                        )}
                      </ul>
                    </details>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>ℹ️ Cómo funciona:</strong>
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Lee los datos de Google Sheets vía n8n</li>
              <li>Transforma y valida cada registro</li>
              <li>Inserta en las tablas correspondientes de Supabase</li>
              <li>Los duplicados se omiten automáticamente</li>
            </ol>
            <p className="mt-3">
              <strong>⚠️ Nota:</strong> Esta migración no elimina los datos de Google Sheets.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
