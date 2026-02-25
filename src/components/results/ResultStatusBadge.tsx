import { cn } from '@/lib/utils';
import { CheckCircle, MinusCircle, XCircle } from 'lucide-react';

interface ResultStatusBadgeProps {
  result: boolean | null | undefined;
  className?: string; // Allow external styling
}

export function ResultStatusBadge({ result, className }: ResultStatusBadgeProps) {
  if (result === true) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100/80 text-green-700 border border-green-200/50", className)}>
        <CheckCircle className="w-3.5 h-3.5" />
        PASS
      </div>
    );
  }

  if (result === false) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100/80 text-red-700 border border-red-200/50", className)}>
        <XCircle className="w-3.5 h-3.5" />
        FAIL
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100/80 text-slate-500 border border-slate-200/50", className)}>
      <MinusCircle className="w-3.5 h-3.5" />
      PENDING
    </div>
  );
}
