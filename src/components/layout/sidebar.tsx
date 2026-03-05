'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  Store,
  Receipt,
  Bell,
  Settings,
  Bug,
  Database,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navegacion = [
  { titulo: 'Panel General', href: '/dashboard', icono: LayoutDashboard },
  { titulo: 'Registro de Compras', href: '/registro', icono: FileText },
  { titulo: 'Análisis de Precios', href: '/precios', icono: TrendingUp },
  { titulo: 'Proveedores', href: '/proveedores', icono: Store },
  { titulo: 'Recordatorios', href: '/dashboard/recordatorios', icono: Bell },
  { titulo: 'Facturas', href: '/facturas', icono: Receipt },
  { titulo: 'Análisis de Gestión', href: '/analisis-gestion', icono: BarChart3 },
  { titulo: 'Diagnóstico API', href: '/diagnostico-api', icono: Bug },
  { titulo: 'Configuración', href: '/settings', icono: Settings },
  { titulo: 'Migrar a Supabase', href: '/migrar', icono: Database },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-muted backdrop-blur-xl border-r border-border flex flex-col fixed h-screen left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-6 border-b border-border bg-gradient-to-b from-[#f59e0b]/5 to-transparent">
        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#f59e0b]/10 overflow-hidden p-2 relative">
            <Image
              src="/el-patio-vila-seca-restaurante.jpg"
              alt="El Patio & Grill Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">El Patio & Grill</h1>
            <p className="text-sm text-[#f59e0b] uppercase tracking-wider font-semibold">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navegación - Principal */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2 px-4">
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
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-white'
                )}
              >
                <Icono className="w-5 h-5" strokeWidth={2} />
                <span>{item.titulo}</span>
              </Link>
            );
          })}

          <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2 px-4 mt-6">
            Gestión
          </div>
          {navegacion.slice(3, 8).map((item) => {
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
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-white'
                )}
              >
                <Icono className="w-5 h-5" strokeWidth={2} />
                <span>{item.titulo}</span>
              </Link>
            );
          })}

          <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2 px-4 mt-6">
            Sistema
          </div>
          {navegacion.slice(8).map((item) => {
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
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-white'
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
      <div className="p-4 border-t border-border bg-gradient-to-t from-[#f59e0b]/5 to-transparent">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Google Sheets</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse"></span>
            Conectado
          </span>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          v1.0.0
        </div>
      </div>
    </aside>
  );
}
