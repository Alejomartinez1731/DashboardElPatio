import { Skeleton } from '@/components/ui/skeleton';

export function KPIsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

export function BudgetSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted px-4 py-3">
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Rows */}
      <div className="divide-y divide-border">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="px-4 py-3 flex gap-4">
            <Skeleton className="h-4 w-20 flex-shrink-0" />
            <Skeleton className="h-4 w-32 flex-shrink-0" />
            <Skeleton className="h-4 w-40 flex-1" />
            <Skeleton className="h-4 w-16 flex-shrink-0" />
            <Skeleton className="h-4 w-16 flex-shrink-0" />
            <Skeleton className="h-4 w-16 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div className="flex items-center gap-3">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-10 w-32 rounded-lg" />
      ))}
    </div>
  );
}
