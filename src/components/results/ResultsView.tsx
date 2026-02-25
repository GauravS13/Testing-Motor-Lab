'use client';

import { AppShell } from '@/components/layout/app-shell';
import { useAllTestedData } from '@/hooks/useTestedData';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { ResultsSummary } from './ResultsSummary';
import { ResultsTable } from './ResultsTable';

export function ResultsView() {
  const { allTestedData, isLoading } = useAllTestedData();

  // Sort data by ID descending (newest first) by default
  const sortedData = [...allTestedData].sort((a, b) => b.id - a.id);

  return (
    <AppShell activeTab="Results">
      <div className="flex-1 bg-slate-50/50 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex flex-col gap-2">
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <Link href="/" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium text-slate-900">Results</span>
            </nav>
            
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Machine Test Results
              </h1>
            </div>
            <p className="text-slate-500 max-w-2xl">
              View and manage historical test records. All data is automatically synced from the testing sessions.
            </p>
          </div>

          {/* Summary Statistics */}
          <ResultsSummary data={sortedData} />

          {/* Main Data Table */}
          <ResultsTable data={sortedData} isLoading={isLoading} />
        </div>
      </div>
    </AppShell>
  );
}
