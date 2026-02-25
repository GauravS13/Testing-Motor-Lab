'use client';

import { TestedDataRow } from '@/types/test-session';
import { Loader2 } from 'lucide-react';

interface TestSessionSummaryProps {
  data: TestedDataRow[];
  loading: boolean;
}

export function TestSessionSummary({ data, loading }: TestSessionSummaryProps) {
  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const total = data.length;
  const passed = data.filter((row) => row.finalResult === true).length;
  const failed = data.filter((row) => row.finalResult === false).length;

  // Failure breakdowns
  // Before IR (result)
  const failBeforeIR = data.filter((row) => row.result === false).length;
  // No Load (result3)
  const failNoLoad = data.filter((row) => row.result3 === false).length;
  // After IR (result2)
  const failAfterIR = data.filter((row) => row.result2 === false).length;

  // Calculate percentages
  const passPercent = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';
  const failPercent = total > 0 ? ((failed / total) * 100).toFixed(2) : '0.00';
  
  const failBeforeIRPercent = total > 0 ? ((failBeforeIR / total) * 100).toFixed(2) : '0.00';
  const failNoLoadPercent = total > 0 ? ((failNoLoad / total) * 100).toFixed(2) : '0.00';
  const failAfterIRPercent = total > 0 ? ((failAfterIR / total) * 100).toFixed(2) : '0.00';

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-center font-bold text-slate-700 border-r border-slate-200" colSpan={4}>
                 Total Production Qty: <span className="ml-2 text-base text-slate-900">{total}</span>
              </th>
              <th className="px-4 py-3 text-center font-bold text-slate-700 border-r border-slate-200" colSpan={4}>
                BEFORE NO LOAD I.R. TEST
              </th>
              <th className="px-4 py-3 text-center font-bold text-slate-700 border-r border-slate-200" colSpan={4}>
                NO LOAD
              </th>
              <th className="px-4 py-3 text-center font-bold text-slate-700" colSpan={4}>
                AFTER NO LOAD I.R. TEST
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="divide-x divide-slate-200 border-b border-slate-200">
              {/* Overall Pass */}
              <td className="px-2 py-2 font-semibold text-slate-600 bg-emerald-50/50">Pass Qty</td>
              <td className="px-2 py-2 text-center font-bold text-emerald-700 bg-emerald-50/50">{passed}</td>
              <td className="px-2 py-2 font-semibold text-slate-600 bg-emerald-50/50">Pass %</td>
              <td className="px-2 py-2 text-center font-bold text-emerald-700 bg-emerald-50/50 border-r border-slate-200">{passPercent}%</td>

              {/* Fail Beofre IR */}
              <td className="px-2 py-2 font-medium text-slate-600">Fail Qty</td>
              <td className="px-2 py-2 text-center font-medium text-slate-900">{failBeforeIR}</td>
              <td className="px-2 py-2 font-medium text-slate-600">Fail %</td>
              <td className="px-2 py-2 text-center font-medium text-slate-900 border-r border-slate-200">{failBeforeIRPercent}%</td>

               {/* Fail No Load */}
               <td className="px-2 py-2 font-medium text-slate-600">Fail Qty</td>
              <td className="px-2 py-2 text-center font-medium text-slate-900">{failNoLoad}</td>
              <td className="px-2 py-2 font-medium text-slate-600">Fail %</td>
              <td className="px-2 py-2 text-center font-medium text-slate-900 border-r border-slate-200">{failNoLoadPercent}%</td>

               {/* Fail After IR */}
               <td className="px-2 py-2 font-medium text-slate-600">Fail Qty</td>
              <td className="px-2 py-2 text-center font-medium text-slate-900">{failAfterIR}</td>
              <td className="px-2 py-2 font-medium text-slate-600">Fail %</td>
              <td className="px-2 py-2 text-center font-medium text-slate-900">{failAfterIRPercent}%</td>
            </tr>
            <tr className="divide-x divide-slate-200">
               {/* Overall Fail */}
               <td className="px-2 py-2 font-semibold text-slate-600 bg-red-50/50">Fail Qty</td>
              <td className="px-2 py-2 text-center font-bold text-red-700 bg-red-50/50">{failed}</td>
              <td className="px-2 py-2 font-semibold text-slate-600 bg-red-50/50">Fail %</td>
              <td className="px-2 py-2 text-center font-bold text-red-700 bg-red-50/50 border-r border-slate-200">{failPercent}%</td>

              {/* Spacers for alignment since we removed date/time row content */}
              <td className="bg-slate-50" colSpan={12}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
