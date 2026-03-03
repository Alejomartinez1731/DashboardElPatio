import { AlertTriangle } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  description: string;
  statusBadge?: {
    text: string;
    color: string;
  };
  warning?: string | null;
}

export function DashboardHeader({ title, description, statusBadge, warning }: DashboardHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-[#94a3b8] bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {statusBadge && (
          <div className={`flex items-center gap-2 px-4 py-2 ${statusBadge.color} rounded-lg`}>
            <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">{statusBadge.text}</span>
          </div>
        )}
      </div>

      {/* Warning banner */}
      {warning && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-400">Datos de demostración</p>
            <p className="text-xs text-amber-400/80 mt-1">{warning}</p>
          </div>
        </div>
      )}
    </div>
  );
}
