import { Table, TrendingUp, PieChart, ShoppingBag, Bell } from 'lucide-react';
import { SheetName } from '@/types';
import Link from 'next/link';

type TabId = 'base_datos' | 'historico_precios' | 'producto_costoso' | 'gasto_tienda' | 'recordatorios';

export interface Tab {
  id: TabId;
  label: string;
  sheetName?: SheetName;  // Opcional para recordatorios que no usa sheet
  icon: any;
  description: string;
  href?: string;  // Para tabs que navegan a otra página
}

export const TABS: Tab[] = [
  { id: 'historico_precios', label: 'Histórico de Precios', sheetName: 'historico_precios' as SheetName, icon: TrendingUp, description: 'Evolución de precios por producto' },
  { id: 'producto_costoso', label: 'Producto más Costoso', sheetName: 'costosos' as SheetName, icon: ShoppingBag, description: 'Ranking de productos por precio' },
  { id: 'gasto_tienda', label: 'Gasto por Tienda', sheetName: 'gasto_tienda' as SheetName, icon: PieChart, description: 'Gastos acumulados por proveedor/tienda' },
  { id: 'recordatorios', label: 'Recordatorios', icon: Bell, description: 'Alertas de reposición de productos', href: '/dashboard/recordatorios' },
  { id: 'base_datos', label: 'Base de Datos', sheetName: 'base_datos' as SheetName, icon: Table, description: 'Tabla completa de historial de compras' },
];

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <div className="grid grid-cols-5 border-b border-border">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isExternal = !!tab.href;

        const buttonContent = (
          <>
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm text-center">{tab.label}</span>
            {isActive && !isExternal && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
          </>
        );

        // Para tabs externos (con href), usar Link de Next.js
        if (isExternal) {
          return (
            <Link
              key={tab.id}
              href={tab.href!}
              className={`flex items-center justify-center gap-2 px-4 py-4 transition-all duration-200 relative ${
                'text-muted-foreground hover:text-white hover:bg-muted/50'
              }`}
            >
              {buttonContent}
            </Link>
          );
        }

        // Para tabs internos, usar button normal
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center justify-center gap-2 px-4 py-4 transition-all duration-200 relative ${
              isActive ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-white hover:bg-muted/50'
            }`}
          >
            {buttonContent}
          </button>
        );
      })}
    </div>
  );
}
