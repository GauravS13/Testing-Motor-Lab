'use client';

import { cn } from '@/lib/utils';

interface PassFailBadgeProps {
  status: 'PASS' | 'FAIL';
  className?: string;
}

export function PassFailBadge({ status, className }: PassFailBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wide',
        status === 'PASS'
          ? 'bg-green-600 text-white'
          : 'bg-red-600 text-white',
        className
      )}
    >
      {status}
    </span>
  );
}
