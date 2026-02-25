'use client';

import { cn } from '@/lib/utils';

interface DataCardProps {
  label: string;
  unit: string;
  value: string | number;
  className?: string;
}

export function DataCard({ label, unit, value, className }: DataCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-lg border border-gray-200 bg-white px-2.5 py-2.5 shadow-sm',
        className
      )}
    >
      <span className="mb-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center leading-tight">
        {label} <span className="text-slate-400 font-normal normal-case">({unit})</span>
      </span>
      <span className="text-2xl font-extrabold text-slate-900 tabular-nums tracking-tight">{value}</span>
    </div>
  );
}
