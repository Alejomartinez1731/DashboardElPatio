'use client';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { RecordatoriosReposicion } from '@/components/dashboard/recordatorios-reposicion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RecordatoriosPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header con breadcrumb */}
      <div className="flex items-center gap-4 mb-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Panel General
        </Link>
      </div>

      <DashboardHeader
        title="Recordatorios de Reposicion"
        description="Gestiona las alertas de productos que necesitan recompra"
        statusBadge={{
          text: 'Calculo automatico',
          color: 'bg-purple-500/10 border border-purple-500/30'
        }}
      />

      {/* Componente completo de recordatorios */}
      <RecordatoriosReposicion />
    </div>
  );
}
