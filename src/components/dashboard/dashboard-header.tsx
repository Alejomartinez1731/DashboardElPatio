interface DashboardHeaderProps {
  title: string;
  description: string;
  statusBadge?: {
    text: string;
    color: string;
  };
}

export function DashboardHeader({ title, description, statusBadge }: DashboardHeaderProps) {
  return (
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
  );
}
