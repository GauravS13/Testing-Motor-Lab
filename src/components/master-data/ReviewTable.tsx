import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ParsedRow } from '@/hooks/useExcelUpload';
import { cn } from '@/lib/utils'; // Assuming generic utility exists
import { AlertCircle, CheckCircle, Pencil, RefreshCcw, Trash2 } from 'lucide-react';

interface ReviewTableProps {
  rows: ParsedRow[];
  onRetry: (index: number) => void;
   onDelete: (index: number) => void;
  onEditClick: (row: ParsedRow) => void; 
}

import { COLUMN_DEFINITIONS } from '@/types/test-session';

export function ReviewTable({ rows, onRetry, onDelete, onEditClick }: ReviewTableProps) {
  if (rows.length === 0) return null;

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] sticky left-0 bg-background z-10">Status</TableHead>
            {COLUMN_DEFINITIONS.map((col) => (
                <TableHead key={col.key} className={cn(
                    "whitespace-nowrap",
                    col.align === 'center' && "text-center",
                    col.align === 'right' && "text-right"
                )}>
                    {col.label}
                </TableHead>
            ))}
            <TableHead className="w-[100px] sticky right-0 bg-background z-10 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.index} className={cn(
                !row.isValid && "bg-red-50 hover:bg-red-100",
                row.status === 'success' && "bg-green-50 hover:bg-green-100"
            )}>
              <TableCell className="sticky left-0 bg-inherit z-10">
                <StatusIcon status={row.status} isValid={row.isValid} errorMsg={Object.values(row.errors).join(', ')} />
              </TableCell>
              
              {COLUMN_DEFINITIONS.map((col) => {
                  // Helper to safely access data
                  // @ts-ignore - we know key matches similar properties in both types
                  const val = row.data[col.key];
                  
                  let displayVal: React.ReactNode = val;

                  if (val instanceof Date) {
                      displayVal = val.toLocaleDateString();
                  }

                  if (col.key === 'direction') {
                      if (val === 1) displayVal = 'CW';
                      else if (val === 2) displayVal = 'ACW';
                  } else if (col.key === 'phase') {
                      if (val === 1) displayVal = 'Single';
                      else if (val === 3) displayVal = 'Three';
                  }

                  return (
                    <TableCell key={col.key} className={cn(
                        col.align === 'center' && "text-center",
                        col.align === 'right' && "text-right"
                    )}>
                        {displayVal !== null && displayVal !== undefined && displayVal !== '' ? displayVal : '—'}
                    </TableCell>
                  );
              })}

              <TableCell className="sticky right-0 bg-inherit z-10">
                <div className="flex items-center justify-center gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-indigo-600" onClick={() => onEditClick(row)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                   {row.status === 'error' && (
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => onRetry(row.index)}>
                           <RefreshCcw className="h-4 w-4" />
                       </Button>
                   )}
                   <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => onDelete(row.index)}>
                       <Trash2 className="h-4 w-4" />
                   </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusIcon({ status, isValid, errorMsg }: { status: string, isValid: boolean, errorMsg?: string }) {
    if (status === 'success') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === 'pending') return <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />; // Simple spinner
    
    if (!isValid || status === 'error') {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{errorMsg || "Validation Error"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    
    return <div className="h-4 w-4 rounded-full bg-gray-200" />; // Idle dot
}
