'use client';

import { useState, useEffect } from 'react';

export default function DiagnosticoAPIPage() {
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/sheets');
        const data = await response.json();

        setApiData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <h1 className="text-2xl font-bold text-white mb-4">Diagnóstico API</h1>
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <h1 className="text-2xl font-bold text-white mb-4">Diagnóstico API</h1>
        <div className="bg-destructive/20 border border-destructive rounded-lg p-4">
          <p className="text-destructive font-bold">Error:</p>
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Diagnóstico API</h1>

      <div className="space-y-6">
        {/* Resumen */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Resumen</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Success</p>
              <p className="text-lg font-mono">{apiData?.success ? '✅' : '❌'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Source</p>
              <p className="text-lg font-mono">{apiData?._source || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Is Mock</p>
              <p className="text-lg font-mono">{apiData?._isMock ? '⚠️ YES' : '✅ NO'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Warning</p>
              <p className="text-xs text-amber-500">{apiData?._warning || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Data Keys */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Data Keys Disponibles</h2>
          <div className="space-y-2">
            {apiData?.data ? (
              Object.keys(apiData.data).map((key) => (
                <div key={key} className="bg-muted rounded-lg p-3">
                  <p className="text-sm font-mono text-white mb-2">{key}</p>
                  <p className="text-xs text-muted-foreground">
                    Filas: {apiData.data[key]?.values?.length || 0}
                  </p>
                  {apiData.data[key]?.values && apiData.data[key].values.length > 0 && (
                    <pre className="text-xs bg-background p-2 rounded mt-2 overflow-x-auto">
                      {JSON.stringify(apiData.data[key].values[0], null, 2)}
                    </pre>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No hay data keys</p>
            )}
          </div>
        </div>

        {/* JSON Completo */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Respuesta Completa (JSON)</h2>
          <pre className="text-xs bg-background p-4 rounded-lg overflow-x-auto max-h-96">
            {JSON.stringify(apiData, null, 2)}
          </pre>
        </div>

        {/* Botón para recargar */}
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Recargar Página
        </button>
      </div>
    </div>
  );
}
