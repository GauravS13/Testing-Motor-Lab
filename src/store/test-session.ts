import type { TestRecord, TestStep } from '@/types/test-session';
import { create } from 'zustand';

/* ═══════════════════════════════════════════════════════
   Test Session Store — drives the multi-step wizard.
   
   Upload XLSX → Review Table → Run Tests
   
   All three steps read/write from this single store,
   ensuring data flows seamlessly through the workflow.
   Now persisted to localStorage to survive reloads.
   ═══════════════════════════════════════════════════════ */

interface TestSessionState {
  // ── Workflow ──
  currentStep: TestStep;
  completedSteps: Set<TestStep>;
  submittedRecordIds: string[]; // Track submitted records by ID

  // ── Step 1: Upload ──
  fileName: string | null;
  fileSize: number | null;

  // ── Step 2 & 3: Parsed Data ──
  parsedRecords: TestRecord[];
  totalRows: number;
  skippedRows: number;
  parseError: string | null;

  // ── Step 3: Testing status ──
  testingStatus: 'idle' | 'running' | 'complete';
  selectedRecordForTest: TestRecord | null;

  // ── Actions ──
  setFile: (name: string, size: number) => void;
  setParsedData: (records: TestRecord[], totalRows: number, skippedRows: number) => void;
  setParseError: (error: string) => void;
  goToStep: (step: TestStep) => void;
  setSelectedRecordForTest: (record: TestRecord | null) => void;
  setTestingStatus: (status: 'idle' | 'running' | 'complete') => void;
  updateRecord: (id: string, updates: Partial<TestRecord>) => void;
  removeRecord: (id: string) => void;
  completeStep: (step: TestStep) => void;
  markRecordAsSubmitted: (id: string) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  currentStep: 'upload' as TestStep,
  completedSteps: new Set<TestStep>(),
  submittedRecordIds: [],
  fileName: null,
  fileSize: null,
  parsedRecords: [],
  totalRows: 0,
  skippedRows: 0,
  parseError: null,
  testingStatus: 'idle' as const,
  selectedRecordForTest: null,
};

export const useTestSessionStore = create<TestSessionState>()(
  (set, get) => ({
      ...INITIAL_STATE,

      setFile: (name, size) =>
        set({
          fileName: name,
          fileSize: size,
          parseError: null,
        }),

      setParsedData: (records, totalRows, skippedRows) =>
        set((state) => ({
            parsedRecords: records,
            totalRows,
            skippedRows,
            parseError: null,
            completedSteps: new Set([...state.completedSteps, 'upload']), // Don't lose existing steps
            currentStep: 'review',
        })),

      setParseError: (error) =>
        set({
          parseError: error,
          parsedRecords: [],
        }),

      goToStep: (step) => {
        const state = get();
        // Guard: can't skip ahead past completed steps
        // Allow review -> testing if review is done
        if (step === 'testing' && !state.completedSteps.has('review')) return;

        set({ currentStep: step });
      },

      setSelectedRecordForTest: (record) =>
        set({ selectedRecordForTest: record }),

      setTestingStatus: (status) =>
        set({ testingStatus: status }),

      updateRecord: (id, updates) =>
        set((state) => ({
          parsedRecords: state.parsedRecords.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      removeRecord: (id) =>
        set((state) => ({
          parsedRecords: state.parsedRecords.filter((r) => r.id !== id),
        })),

      completeStep: (step) =>
        set((state) => ({
          completedSteps: new Set([...state.completedSteps, step]),
        })),

      markRecordAsSubmitted: (id) =>
        set((state) => ({
          submittedRecordIds: [...state.submittedRecordIds, id],
        })),

      reset: () =>
        set({
          ...INITIAL_STATE,
          completedSteps: new Set<TestStep>(),
        }),
    })
);
