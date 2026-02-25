import { TestedDataRow } from '@/types/test-session';

export interface ResultColumnDef {
  key: keyof TestedDataRow;
  label: string;
  className?: string; // Tailwind classes for width/alignment
  format?: (value: any, row: TestedDataRow) => React.ReactNode;
  sortable?: boolean;
}

export const RESULTS_COLUMNS: ResultColumnDef[] = [
  { 
    key: 'srNo', 
    label: 'Sr No', 
    className: 'text-center w-16 font-medium text-slate-900',
    sortable: true 
  },
  { 
    key: 'modelName', 
    label: 'Model', 
    className: 'text-left text-slate-700 font-medium',
    sortable: true 
  },
  { 
    key: 'serialNo', 
    label: 'Serial No', 
    className: 'text-left font-mono text-xs text-slate-600',
    sortable: true 
  },
  { 
    key: 'dateTime', 
    label: 'Date & Time', 
    className: 'text-left text-slate-600 whitespace-nowrap',
    sortable: true,
    format: (value) => value ? new Date(value).toLocaleString() : '-'
  },
  { 
    key: 'beforeInsulationRes', 
    label: 'Before IR (MΩ)', 
    className: 'text-center text-slate-700',
    sortable: true 
  },
  { 
    key: 'result', 
    label: 'Before IR Result', 
    className: 'text-center',
    sortable: true 
    // Format handled in component via switch/conditional or generic formatter if lifted
  },
  { 
    key: 'voltage', 
    label: 'Voltage (V)', 
    className: 'text-right font-mono text-slate-600',
    sortable: true 
  },
  { 
    key: 'currentAmp', 
    label: 'Current (A)', 
    className: 'text-right font-mono text-slate-600',
    sortable: true 
  },
  { 
    key: 'power', 
    label: 'Power (W)', 
    className: 'text-right font-mono text-slate-600',
    sortable: true 
  },
  { 
    key: 'frequency', 
    label: 'Freq (Hz)', 
    className: 'text-right font-mono text-slate-600',
    sortable: true 
  },
  { 
    key: 'result3', 
    label: 'No Load Result', 
    className: 'text-center',
    sortable: true 
  },
  { 
    key: 'afterInsulationRes', 
    label: 'After IR (MΩ)', 
    className: 'text-center text-slate-700',
    sortable: true 
  },
  { 
    key: 'result2', 
    label: 'After IR Result', 
    className: 'text-center',
    sortable: true 
  },
  { 
    key: 'finalResult', 
    label: 'Final Result', 
    className: 'text-center',
    sortable: true 
  },
];
