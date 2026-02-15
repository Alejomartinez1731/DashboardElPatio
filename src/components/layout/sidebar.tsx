'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  Store,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navegacion = [
  { titulo: 'Panel General', href: '/dashboard', icono: LayoutDashboard },
  { titulo: 'Registro de Compras', href: '/registro', icono: FileText },
  { titulo: 'Análisis de Precios', href: '/precios', icono: TrendingUp },
  { titulo: 'Proveedores', href: '/proveedores', icono: Store },
  { titulo: 'Facturas', href: '/facturas', icono: Receipt },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0d1117] backdrop-blur-xl border-r border-[#1e293b] flex flex-col fixed h-screen left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-6 border-b border-[#1e293b] bg-gradient-to-b from-[#f59e0b]/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#f59e0b] to-[#fbbf24] rounded-xl flex items-center justify-center shadow-lg shadow-[#f59e0b]/20">
            <span className="text-lg">🍽️</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">El Patio & Grill</h1>
            <p className="text-xs text-[#f59e0b] uppercase tracking-wider font-semibold">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navegación - Principal */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-2">
          <div className="text-xs text-[#64748b] uppercase tracking-wide font-semibold mb-2 px-4">
            Principal
          </div>
          {navegacion.slice(0, 3).map((item) => {
            const Icono = item.icono;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-[#f59e0b]/15 text-[#f59e0b] font-semibold border-l-3 border-[#f59e0b]'
                    : 'text-[#94a3b8] hover:bg-[#1a2234] hover:text-white'
                )}
              >
                <Icono className="w-5 h-5" strokeWidth={2} />
                <span>{item.titulo}</span>
              </Link>
            );
          })}

          <div className="text-xs text-[#64748b] uppercase tracking-wide font-semibold mb-2 px-4 mt-6">
            Gestión
          </div>
          {navegacion.slice(3).map((item) => {
            const Icono = item.icono;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-[#f59e0b]/15 text-[#f59e0b] font-semibold border-l-3 border-[#f59e0b]'
                    : 'text-[#94a3b8] hover:bg-[#1a2234] hover:text-white'
                )}
              >
                <Icono className="w-5 h-5" strokeWidth={2} />
                <span>{item.titulo}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#1e293b] bg-gradient-to-t from-[#f59e0b]/5 to-transparent">
        <div className="flex items-center justify-between text-xs text-[#94a3b8] mb-2">
          <span>Google Sheets</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse"></span>
            Conectado
          </span>
        </div>
        <div className="text-xs text-[#64748b] font-mono">
          v1.0.0
        </div>
      </div>
    </aside>
  );
}
