'use client';

import { RESULTS_COLUMNS } from '@/lib/results-columns';
import { TestedDataRow } from '@/types/test-session';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ResultStatusBadge } from './ResultStatusBadge';

interface ResultsTableProps {
  data: TestedDataRow[];
  isLoading?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  key: keyof TestedDataRow | null;
  direction: SortDirection;
}

export function ResultsTable({ data, isLoading }: ResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'desc' });

  // 1. Sorting Logic
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === bValue) return 0;
      
      // Handle nulls
      if (aValue === null) return 1; 
      if (bValue === null) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  // 2. Pagination Logic
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Handlers
  const handleSort = (key: keyof TestedDataRow) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading test results...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-12 text-center border rounded-xl bg-slate-50/50">
        <p className="text-slate-500">No test results found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
       {/* Table Component */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-slate-600 font-medium whitespace-nowrap">
              <tr>
                {RESULTS_COLUMNS.map((col) => (
                  <th 
                    key={col.key as string}
                    className={`px-4 py-3 cursor-pointer select-none hover:bg-slate-100 transition-colors ${col.className?.includes('text-right') ? 'text-right' : col.className?.includes('text-center') ? 'text-center' : 'text-left'}`}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className={`flex items-center gap-1 ${col.className?.includes('text-right') ? 'justify-end' : col.className?.includes('text-center') ? 'justify-center' : 'justify-start'}`}>
                      {col.label}
                      {col.sortable && sortConfig.key === col.key && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                ))}

              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  {RESULTS_COLUMNS.map((col) => (
                    <td key={`${row.id}-${col.key as string}`} className={`px-4 py-3 ${col.className || ''}`}>
                      {/* Special rendering for Badge columns */}
                      {['result', 'result2', 'result3', 'finalResult'].includes(col.key as string) ? (
                         <ResultStatusBadge result={row[col.key] as boolean | null} />
                      ) : (
                         col.format ? col.format(row[col.key], row) : (row[col.key] as React.ReactNode ?? '-')
                      )}
                    </td>
                  ))}

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
           <span>Rows per page:</span>
           <select 
             value={pageSize} 
             onChange={(e) => {
               setPageSize(Number(e.target.value));
               setCurrentPage(1); // Reset to page 1
             }}
             className="border rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
           >
             {[5, 10, 15, 20, 50].map(size => (
               <option key={size} value={size}>{size}</option>
             ))}
           </select>
           <span className="ml-2">
             Showing {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
           </span>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => handlePageChange(1)} 
            disabled={currentPage === 1}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="px-2 font-medium">
             Page {currentPage} of {Math.max(1, totalPages)}
          </span>

          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
           <button 
            onClick={() => handlePageChange(totalPages)} 
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
