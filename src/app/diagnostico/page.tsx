'use client';

import { useEffect, useState } from 'react';

export default function DiagnosticoPage() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar variables de entorno del lado del cliente
    setEnvVars({
      NEXT_PUBLIC_N8N_WEBHOOK_URL: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '❌ NO CONFIGURADA',
    });

    // Probar la API
    fetch('/api/sheets')
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('✅ API Response:', data);
        setApiStatus('success');
      })
      .catch(err => {
        console.error('❌ API Error:', err);
        setApiError(err.message);
        setApiStatus('error');
      });
  }, []);

  return (
    <div className="min-h-screen bg-muted p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Diagnóstico del Sistema</h1>

        {/* Variables de Entorno */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Variables de Entorno</h2>
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="mb-4">
              <div className="text-sm text-muted-foreground mb-1">{key}</div>
              <div className={`font-mono text-sm p-3 rounded ${value.includes('❌') ? 'bg-[#ef4444]/10 text-[#ef4444]' : 'bg-[#10b981]/10 text-[#10b981]'}`}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Estado de la API */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Estado de la API</h2>
          {apiStatus === 'loading' && (
            <div className="text-muted-foreground">Verificando...</div>
          )}
          {apiStatus === 'success' && (
            <div className="text-[#10b981]">✅ API funcionando correctamente</div>
          )}
          {apiStatus === 'error' && (
            <div>
              <div className="text-[#ef4444] mb-2">❌ Error de conexión</div>
              <div className="text-sm text-muted-foreground font-mono bg-[#1a2234] p-3 rounded">
                {apiError}
              </div>
            </div>
          )}
        </div>

        {/* Instrucciones */}
        <div className="bg-card border border-[#f59e0b]/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Cómo configurar en Vercel</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Ve a tu proyecto en Vercel</li>
            <li>Click en <strong className="text-white">Settings</strong> → <strong className="text-white">Environment Variables</strong></li>
            <li>Agrega la siguiente variable:</li>
          </ol>
          <div className="mt-4 p-4 bg-muted rounded font-mono text-sm">
            <div className="text-[#f59e0b]">Key:</div>
            <div className="text-white mb-3">NEXT_PUBLIC_N8N_WEBHOOK_URL</div>
            <div className="text-[#f59e0b]">Value:</div>
            <div className="text-white">https://n8n-alejomartinez-n8n.aejhww.easypanel.host/webhook/dashboard-data</div>
          </div>
          <ol start={4} className="list-decimal list-inside space-y-2 text-muted-foreground mt-4">
            <li>Selecciona todos los entornos: Production, Preview, Development</li>
            <li>Click en <strong className="text-white">Save</strong></li>
            <li>Redespliega la aplicación</li>
          </ol>
        </div>

        <div className="mt-6">
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-[#f59e0b] text-white rounded-lg hover:bg-[#f59e0b]/80 transition-colors"
          >
            Ir al Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
