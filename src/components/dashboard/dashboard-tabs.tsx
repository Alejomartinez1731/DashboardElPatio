import { Table, TrendingUp, PieChart, ShoppingBag } from 'lucide-react';
import { SheetName } from '@/types';

type TabId = 'base_datos' | 'historico_precios' | 'producto_costoso' | 'gasto_tienda';

export interface Tab {
  id: TabId;
  label: string;
  sheetName: SheetName;
  icon: any;
  description: string;
}

export const TABS: Tab[] = [
  { id: 'historico_precios', label: 'Histórico de Precios', sheetName: 'historico_precios' as SheetName, icon: TrendingUp, description: 'Evolución de precios por producto' },
  { id: 'producto_costoso', label: 'Producto más Costoso', sheetName: 'costosos' as SheetName, icon: ShoppingBag, description: 'Ranking de productos por precio' },
  { id: 'gasto_tienda', label: 'Gasto por Tienda', sheetName: 'gasto_tienda' as SheetName, icon: PieChart, description: 'Gastos acumulados por proveedor/tienda' },
  { id: 'base_datos', label: 'Base de Datos', sheetName: 'base_datos' as SheetName, icon: Table, description: 'Tabla completa de historial de compras' },
];

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <div className="grid grid-cols-4 border-b border-border">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center justify-center gap-2 px-4 py-4 transition-all duration-200 relative ${
              isActive ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-white hover:bg-muted/50'
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm text-center">{tab.label}</span>
            {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
          </button>
        );
      })}
    </div>
  );
}
