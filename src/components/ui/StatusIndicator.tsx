'use client';

import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  label: string;
  active?: boolean;
  className?: string;
}

export function StatusIndicator({ label, active = true, className }: StatusIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs", className)}>
      <div
        className={cn(
          'h-3 w-3 shrink-0 rounded-full',
          active ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
        )}
      />
      <span className="font-bold uppercase tracking-wide text-slate-700 leading-tight">{label}</span>
    </div>
  );
}
