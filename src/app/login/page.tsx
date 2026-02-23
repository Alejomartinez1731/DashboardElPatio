'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogIn, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Login exitoso, redirigir al dashboard
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Contraseña incorrecta');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-[#f59e0b]/5 via-background to-[#f59e0b]/5 pointer-events-none" />

      <Card className="w-full max-w-md p-8 border-border/50 bg-card/50 backdrop-blur-xl relative z-10">
        {/* Logo y branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#f59e0b] to-[#fbbf24] rounded-2xl flex items-center justify-center shadow-lg shadow-[#f59e0b]/20 mb-4">
            <span className="text-3xl">🍽️</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">El Patio & Grill</h1>
          <p className="text-sm text-muted-foreground">Dashboard de Compras y Gastos</p>
        </div>

        {/* Formulario de login */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
              Contraseña de acceso
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 focus:border-transparent transition-all"
                placeholder="Ingresa tu contraseña"
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#f59e0b]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Ingresar al Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            Área restringida • Solo personal autorizado
          </p>
        </div>
      </Card>

      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#f59e0b]" />
    </div>
  );
}
