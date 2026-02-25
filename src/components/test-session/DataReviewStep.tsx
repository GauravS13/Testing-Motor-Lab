'use client';

import { ReviewTable } from '@/components/master-data/ReviewTable';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParsedRow } from '@/hooks/useExcelUpload';
import { useTestSessionStore } from '@/store/test-session';
import { MasterDataInput } from '@/types/test-session';
import { ArrowRight, RotateCcw, UploadCloud } from 'lucide-react';
import { useState } from 'react';

interface DataReviewStepProps {
    rows: ParsedRow[];
    onRetry: (index: number) => void;
    onDelete: (index: number) => void;
    onSync: () => Promise<void>;
    onUpdateRecord: (index: number, data: Partial<MasterDataInput>) => void;
    onDiscard: () => void;
    onNext: () => void;
}

export function DataReviewStep({ rows, onRetry, onDelete, onSync, onUpdateRecord, onDiscard, onNext }: DataReviewStepProps) {
  const { reset: resetStore } = useTestSessionStore();
  
  // Edit State
  const [editingRow, setEditingRow] = useState<ParsedRow | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<MasterDataInput>>({});

  // Calculate stats
  const validRows = rows.filter(r => r.isValid).length;
  const errorRows = rows.filter(r => !r.isValid || r.status === 'error').length;
  const successRows = rows.filter(r => r.status === 'success').length;
  const pendingRows = rows.filter(r => r.isValid && r.status !== 'success').length;

  const handleEditClick = (row: ParsedRow) => {
      setEditingRow(row);
      setEditFormData({ ...row.data });
  };

  const handleSaveEdit = () => {
      if (editingRow) {
          onUpdateRecord(editingRow.index, editFormData);
          setEditingRow(null);
          setEditFormData({});
      }
  };

  const handleDiscard = () => {
      onDiscard(); // Clear hook state
      resetStore(); // Clear store state and go to upload
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden animate-fade-in">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
              <UploadCloud className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Review Metadata
              </h2>
              <p className="text-xs text-slate-500">
                {rows.length} total · {validRows} valid · {errorRows} invalid · {successRows} synced
              </p>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            {/* Show Proceed button if we have synced rows */}
            {successRows > 0 && (
                <button
                  onClick={onNext}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
                >
                  Proceed to Testing
                  <ArrowRight className="h-4 w-4" />
                </button>
            )}

            <button
              onClick={onSync}
              disabled={pendingRows === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:inline-flex"
            >
              Sync {pendingRows} Record(s)
            </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto custom-scrollbar p-4">
          <ReviewTable 
            rows={rows} 
            onRetry={onRetry} 
            onDelete={onDelete} 
            onEditClick={handleEditClick}
          />
      </div>

      {/* ── Bottom Navigation Bar ── */}
      <div className="shrink-0 flex items-center justify-between border-t border-slate-200/80 bg-white px-4 py-3 sm:px-6">
        <button
          onClick={handleDiscard}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Discard & Re-upload
        </button>
      </div>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editingRow} onOpenChange={(open) => !open && setEditingRow(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Edit Record</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar px-1">
                {editingRow && Object.keys(editFormData).map((key) => {
                    const typedKey = key as keyof MasterDataInput;
                    // Skip read-only fields if any (e.g. maybe we don't edit srNo if it's primary key, but for now allow all)
                    return (
                        <div key={key} className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor={key} className="text-right text-xs text-slate-500 uppercase tracking-wide">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </Label>
                            <Input
                                id={key}
                                value={editFormData[typedKey] as string | number || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    // Naive type casting, better to check schema type
                                    const isNumber = ['min','max','srNo','testTime','direction','phase'].some(k => key.toLowerCase().includes(k));
                                    
                                    setEditFormData(prev => ({
                                        ...prev,
                                        [key]: isNumber ? (val === '' ? undefined : Number(val)) : val
                                    }));
                                }}
                                className="col-span-3 h-9"
                            />
                        </div>
                    );
                })}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setEditingRow(null)}>Cancel</Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
