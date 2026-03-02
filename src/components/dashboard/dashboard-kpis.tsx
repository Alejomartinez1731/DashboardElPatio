import { KPICardEnhanced } from '@/components/dashboard/kpi-card-enhanced';
import { KPIData } from '@/types';

interface DashboardKPIsProps {
  kpiData: KPIData | null;
}

export function DashboardKPIs({ kpiData }: DashboardKPIsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <KPICardEnhanced
        titulo="Gasto Quincenal"
        valor={kpiData?.gastoQuincenal || 0}
        icono="euro"
        tipo="moneda"
      />
      <KPICardEnhanced
        titulo="Facturas Procesadas"
        valor={kpiData?.facturasProcesadas || 0}
        icono="shopping"
        tipo="numero"
      />
      <KPICardEnhanced
        titulo="Alertas de Precio"
        valor={kpiData?.alertasDePrecio || 0}
        icono="trending-up"
        tipo="numero"
      />
    </div>
  );
}
