'use client';

import { createTestedData } from '@/actions/tested-data';
import { PulseLine, RealTimeDataSkeleton, StatusBarSkeleton } from '@/components/skeletons/TestSessionSkeleton';
import { DataCard } from '@/components/ui/DataCard';
import { PassFailBadge } from '@/components/ui/PassFailBadge';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCommunicationStatus } from '@/hooks/useCommunicationStatus';
import { useLiveTestingData } from '@/hooks/useLiveTestingData';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { cn } from '@/lib/utils';
import { TestedDataInput } from '@/types/test-session';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    Check,
    CircleCheck,
    CircleX,
    Gauge,
    RefreshCw,
    Send
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════
   TestSessionInterface — Reusable Testing UI
   
   Can be used in:
   1. Wizard flow (with uploaded data)
   2. Standalone page (with DB master data)
   ═══════════════════════════════════════════════════════ */

// ── Types ─────────────────────────────────────────────

export interface TestSessionRecord {
  id: string | number;
  srNo: number | string | null;
  model: string | null;
  phase: string | number | null;
  minInsulationRes: string | number | null;
  maxInsulationRes: string | number | null;
  testTime: string | number | null;
  minVoltage: string | number | null;
  maxVoltage: string | number | null;
  minCurrent: string | number | null;
  maxCurrent: string | number | null;
  minPower: string | number | null;
  maxPower: string | number | null;
  minFrequency: string | number | null;
  maxFrequency: string | number | null;
  minRPM: string | number | null;
  maxRPM: string | number | null;
  direction: string | number | null;
}

interface TestSessionInterfaceProps {
  records: TestSessionRecord[];
  submittedRecordIds: (string | number)[];
  onMarkAsSubmitted: (id: string | number) => void;
  onComplete: () => void;
  onBack?: () => void;
  backLabel?: string;
  completeLabel?: string;
  footer?: React.ReactNode;
}

// ── Utilities for dynamic labels ──────────────────────

const ACRONYMS = new Set(['plc', 'rpm', 'vfd', 'ir']);

function camelToLabel(key: string): string {
  const words = key.replace(/([A-Z])/g, ' $1').trim().split(' ');
  return words
    .map((w) => {
      const lower = w.toLowerCase();
      if (ACRONYMS.has(lower)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

const UNIT_MAP: Record<string, string> = {
  insulationResistance: 'MΩ',
  voltage: 'Volt',
  currentAmp: 'Amp',
  power: 'Watt',
  frequency: 'Hz',
  rpm: '',
  direction: '',
};

interface TestLimitRow {
  parameter: string;
  minLimit: string | number | null;
  maxLimit: string | number | null;
  measuredValue: string;
  status: 'PASS' | 'FAIL';
}

// ── Helper for Direction Labels ──
const getDirectionLabel = (val: number | string | boolean | null | undefined) => {
  if (val === 1 || val === '1' || val === true || val === 'CW') return 'CW';
  if (val === 2 || val === '2' || val === 'ACW') return 'ACW';
  if (val === 0 || val === '0') return '—';
  return '—';
};

export function TestSessionInterface({
  records,
  submittedRecordIds,
  onMarkAsSubmitted,
  onComplete,
  onBack,
  backLabel = "Back",
  completeLabel = "Complete Test Session",
  footer
}: TestSessionInterfaceProps) {
  
  // State for currently selected record index (default to 0)
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeRecord = records[selectedIndex];

  // State for manual serial number inputs (mapped by record index)
  const [serialInputs, setSerialInputs] = useState<Record<number, string>>({});
  const [useQrCode, setUseQrCode] = useState(false);

  const handleSerialChange = (val: string) => {
    // 1. Update the current input immediately
    const newInputs = { ...serialInputs, [selectedIndex]: val };

    // 2. Try to extract a numeric suffix from the input
    const match = val.match(/^(.*?)(\d+)$/);
    
    if (match && match[1] !== undefined && match[2] !== undefined) {
      const prefix = match[1];
      const numberPart = match[2];
      const baseNumber = parseInt(numberPart, 10);
      const numberLength = numberPart.length;

      // 3. Iterate through all other records to auto-fill EMPTY fields
      records.forEach((_, idx) => {
        // Skip current index
        if (idx === selectedIndex) return;

        // Only fill if currently empty
        if (!newInputs[idx] || newInputs[idx].trim() === '') {
          const offset = idx - selectedIndex;
          const newNumber = baseNumber + offset;
          const newNumberStr = String(newNumber).padStart(numberLength, '0');
          newInputs[idx] = `${prefix}${newNumberStr}`;
        }
      });
    }

    setSerialInputs(newInputs);
  };

  const currentSerialInput = serialInputs[selectedIndex] || '';

  const {
    communicationStatus,
    isLoading: isStatusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useCommunicationStatus(3000);

  const {
    realTimeData,
    isLoading: isRTDLoading,
    isFetching: isRTDFetching,
    error: rtdError,
    refetch: refetchRTD,
  } = useRealTimeData(5000);

 const {
    liveTestingData, 
    isLoading: isLiveTestingDataLoading, 
    isFetching: isLiveTestingDataFetching, 
    error: liveTestingDataError, 
    refetch: refetchLiveTestingData
} = useLiveTestingData(5000);

  const showSkeleton = !realTimeData;
  const loadingResults = !realTimeData || !liveTestingData;
  const hasError = statusError || rtdError;

  // ── Dynamic status bar items ──
  const statusItems = communicationStatus
    ? Object.entries(communicationStatus).map(([key, value]) => ({
        label: camelToLabel(key),
        active: Boolean(value),
      }))
    : [];

  // ── Dynamic real-time data cards ──
  const realTimeCards = realTimeData
    ? Object.entries(realTimeData).map(([key, value]) => {
        let displayValue = value != null ? String(value) : '—';
        if (key === 'direction') {
            displayValue = getDirectionLabel(value);
        }
        return {
          label: camelToLabel(key),
          unit: UNIT_MAP[key] ?? '',
          value: displayValue,
        };
    })
    : [];

  // ── Validation Helpers ──
  const checkLimits = (val: number | null | undefined, min: number | string | null | undefined, max: number | string | null | undefined) => {
    if (val === null || val === undefined) return false;
    const minVal = min !== null && min !== undefined ? Number(min) : -Infinity;
    const maxVal = max !== null && max !== undefined ? Number(max) : Infinity;
    return val >= minVal && val <= maxVal;
  };

  // ── Derived Statuses ──
  const isIrPass = checkLimits(liveTestingData?.beforeNoLoadTest, activeRecord?.minInsulationRes, activeRecord?.maxInsulationRes);
  const isAfterIrPass = checkLimits(liveTestingData?.afterNoLoadTest, activeRecord?.minInsulationRes, activeRecord?.maxInsulationRes);
  
  const isVoltagePass = checkLimits(liveTestingData?.noLoadRatedVolt, activeRecord?.minVoltage, activeRecord?.maxVoltage);
  const isCurrentPass = checkLimits(liveTestingData?.noLoadCurrent, activeRecord?.minCurrent, activeRecord?.maxCurrent);
  const isPowerPass = checkLimits(liveTestingData?.noLoadPower, activeRecord?.minPower, activeRecord?.maxPower);
  const isFreqPass = checkLimits(liveTestingData?.noLoadFrequency, activeRecord?.minFrequency, activeRecord?.maxFrequency);
  const isRpmPass = checkLimits(liveTestingData?.noLoadRPM, activeRecord?.minRPM, activeRecord?.maxRPM);
  
  const measuredDirectionLabel = liveTestingData?.directionClockWise ? 'CW' : liveTestingData?.directionAntiClockWise ? 'ACW' : '—';
  const expectedDirectionLabel = getDirectionLabel(activeRecord?.direction);
  const isDirectionPass = measuredDirectionLabel !== '—' && measuredDirectionLabel === expectedDirectionLabel;

  const isNoLoadPass = isVoltagePass && isCurrentPass && isPowerPass && isFreqPass && isRpmPass && isDirectionPass;
  const overallPass = isIrPass && isAfterIrPass && isNoLoadPass;

  const irStatus = isIrPass ? 'PASS' : 'FAIL';
  const afterIrStatus = isAfterIrPass ? 'PASS' : 'FAIL';
  const voltageStatus = isVoltagePass ? 'PASS' : 'FAIL';
  const currentStatus = isCurrentPass ? 'PASS' : 'FAIL';
  const powerStatus = isPowerPass ? 'PASS' : 'FAIL';
  const freqStatus = isFreqPass ? 'PASS' : 'FAIL';
  const rpmStatus = isRpmPass ? 'PASS' : 'FAIL';
  const directionStatus = isDirectionPass ? 'PASS' : 'FAIL';
  
  const finalResultLabel = overallPass ? 'PASS' : 'FAIL';

  const handleSubmitCurrent = async () => {
    if (!liveTestingData || !activeRecord) return;
    
    const serial = serialInputs[selectedIndex];
    if (!serial || !serial.trim()) {
        toast.error(`Please enter Serial Number for ${activeRecord.model}`);
        return;
    }

    if (submittedRecordIds.includes(activeRecord.id)) {
        toast.info('This record has already been submitted.');
        return;
    }

    try {
        // Re-calculate statuses for THIS record at submit time
        const recIsIrPass = checkLimits(liveTestingData.beforeNoLoadTest, activeRecord.minInsulationRes, activeRecord.maxInsulationRes);
        const recIsAfterIrPass = checkLimits(liveTestingData.afterNoLoadTest, activeRecord.minInsulationRes, activeRecord.maxInsulationRes);
        
        const recIsVoltagePass = checkLimits(liveTestingData.noLoadRatedVolt, activeRecord.minVoltage, activeRecord.maxVoltage);
        const recIsCurrentPass = checkLimits(liveTestingData.noLoadCurrent, activeRecord.minCurrent, activeRecord.maxCurrent);
        const recIsPowerPass = checkLimits(liveTestingData.noLoadPower, activeRecord.minPower, activeRecord.maxPower);
        const recIsFreqPass = checkLimits(liveTestingData.noLoadFrequency, activeRecord.minFrequency, activeRecord.maxFrequency);
        const recIsRpmPass = checkLimits(liveTestingData.noLoadRPM, activeRecord.minRPM, activeRecord.maxRPM);
        
        const measuredDirLabel = liveTestingData.directionClockWise ? 'CW' : liveTestingData.directionAntiClockWise ? 'ACW' : '—';
        const expectedDirLabel = getDirectionLabel(activeRecord.direction);
        const recIsDirectionPass = measuredDirLabel !== '—' && measuredDirLabel === expectedDirLabel;

        const recIsNoLoadPass = recIsVoltagePass && recIsCurrentPass && recIsPowerPass && recIsFreqPass && recIsRpmPass && recIsDirectionPass;
        const recOverallPass = recIsIrPass && recIsAfterIrPass && recIsNoLoadPass;

        const payload: TestedDataInput = {
            srNo: Number(activeRecord.srNo) || 0,
            modelName: activeRecord.model || '',
            dateTime: new Date(),
            serialNo: serial || '',
            
            beforeInsulationRes: liveTestingData.beforeNoLoadTest,
            result: recIsIrPass,

            afterInsulationRes: liveTestingData.afterNoLoadTest,
            result2: recIsAfterIrPass, 
            
            voltage: liveTestingData.noLoadRatedVolt,
            currentAmp: liveTestingData.noLoadCurrent,
            power: liveTestingData.noLoadPower,
            frequency: liveTestingData.noLoadFrequency,
            
            result3: recIsNoLoadPass,

            finalResult: recOverallPass,
        };

        const result = await createTestedData(payload);
        
        if (result) {
            onMarkAsSubmitted(activeRecord.id);
            toast.success(`Result for ${activeRecord.model} saved!`);
            
            // Auto-advance
            const nextUnsubmittedIndex = records.findIndex((r, i) => i > selectedIndex && !submittedRecordIds.includes(r.id));
            if (nextUnsubmittedIndex !== -1) {
                setSelectedIndex(nextUnsubmittedIndex);
            }
        } else {
            toast.error('Failed to save record.');
        }

    } catch (error) {
        console.error(error);
        toast.error('An error occurred during submission.');
    }
  };

  const allSubmitted = records.length > 0 && records.every(r => submittedRecordIds.includes(r.id));

  // ── Rows ──
  const noLoadTestRows: TestLimitRow[] = activeRecord ? [
    { parameter: 'Min. Rated Voltage (Volt)', minLimit: activeRecord.minVoltage, maxLimit: activeRecord.maxVoltage, measuredValue: liveTestingData?.noLoadRatedVolt != null ? String(liveTestingData.noLoadRatedVolt) : '—', status: voltageStatus },
    { parameter: 'Min. Current (Amp)', minLimit: activeRecord.minCurrent, maxLimit: activeRecord.maxCurrent, measuredValue: liveTestingData?.noLoadCurrent != null ? String(liveTestingData.noLoadCurrent) : '—', status: currentStatus },
    { parameter: 'Min. Power (Watt)', minLimit: activeRecord.minPower, maxLimit: activeRecord.maxPower, measuredValue: liveTestingData?.noLoadPower != null ? String(liveTestingData.noLoadPower) : '—', status: powerStatus },
    { parameter: 'Min. Frequency (Hz)', minLimit: activeRecord.minFrequency, maxLimit: activeRecord.maxFrequency, measuredValue: liveTestingData?.noLoadFrequency != null ? String(liveTestingData.noLoadFrequency) : '—', status: freqStatus },
  ] : [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden animate-fade-in h-full">
      {/* ── Status Bar ── */}
      {isStatusLoading ? (
        <StatusBarSkeleton />
      ) : statusItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 border-b border-slate-200/80 bg-slate-50/80 px-4 py-1.5 sm:grid-cols-3 md:grid-cols-5 shrink-0">
          {statusItems.map((item) => (
            <StatusIndicator 
              key={item.label} 
              label={item.label} 
              active={item.active} 
              className="w-full justify-center"
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 border-b border-slate-200/80 bg-slate-50/80 px-4 py-1.5 text-sm text-slate-400 shrink-0">
          <AlertTriangle className="h-4 w-4" />
          No communication status data found
        </div>
      )}

      {/* ── Error Banner ── */}
      {hasError && (
        <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shrink-0">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <span className="flex-1">
            Could not fetch live data from database. Displaying default values.
          </span>
          <button
            onClick={() => { refetchStatus(); refetchRTD(); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {/* ── Model info selector ── */}
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-soft sm:grid-cols-2 md:grid-cols-4 items-end">
            <div className="flex flex-col gap-1.5 col-span-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Model</label>
                <Select 
                value={String(selectedIndex)} 
                onValueChange={(val: string) => setSelectedIndex(Number(val))}
              >
                <SelectTrigger className="w-full h-10 font-semibold text-slate-800 bg-slate-50 border-slate-200" suppressHydrationWarning>
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                  {records.map((record, idx) => {
                    const enteredSerial = serialInputs[idx];
                    const displaySerial = enteredSerial || record.srNo;
                    return (
                      <SelectItem key={`${record.id}-${idx}`} value={String(idx)}>
                        <div className="flex items-center gap-2">
                           {submittedRecordIds.includes(record.id) && <Check className="h-4 w-4 text-emerald-500" />}
                           <span>{record.model} {displaySerial ? `(Sr. No: ${displaySerial})` : ''}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Serial No. <span className="text-red-500">*</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useQrCode}
                    onChange={(e) => setUseQrCode(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-500">Use QR Code</span>
                </label>
              </div>
              <Input 
                value={currentSerialInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSerialChange(e.target.value)}
                placeholder={useQrCode ? "Scan QR Code..." : "Enter Serial No."}
                className="font-semibold text-slate-800 bg-slate-50 border-slate-200 w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phase</label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-800 w-full h-10 flex items-center">
                {activeRecord?.phase || '—'}
              </div>
            </div>
          </div>

          {/* ── Real Time Data ── */}
          {showSkeleton || (!realTimeData && !hasError) ? (
            <RealTimeDataSkeleton />
          ) : realTimeCards.length > 0 ? (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold tracking-tight text-slate-800">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 shadow-sm border border-indigo-100">
                  <Activity className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                Real Time Data
              </h2>
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
                {realTimeCards.map((d, i) => (
                  <DataCard key={i} label={d.label} unit={d.unit} value={d.value} />
                ))}
              </div>
            </section>
          ) : (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50">
                  <Activity className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                Real Time Data
              </h2>
              <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-sm text-slate-400">
                <AlertTriangle className="h-4 w-4" />
                No real-time data found
              </div>
            </section>
          )}

          {/* ── Detailed Test Data ── */}
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold tracking-tight text-slate-800">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 shadow-sm border border-indigo-100">
                <Gauge className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              Detailed Test Data
            </h2>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-3">
              {/* Insulation Resistance Test Limit */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft transition-shadow hover:shadow-elevated h-full flex flex-col">
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">
                    Insulation Resistance Test Limit
                  </h3>
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500 border border-slate-200">
                     Time: <span className="text-slate-800">{activeRecord?.testTime || '60'}s</span>
                  </div>
                </div>

                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr className="border-b-2 border-slate-100 text-left">
                      <th className="pb-3 pr-4 font-semibold text-slate-500 uppercase tracking-wider text-xs w-[30%]">Parameter</th>
                      <th className="pb-3 px-4 font-semibold text-center text-slate-500 uppercase tracking-wider text-xs w-[30%]">Min/Max Limits</th>
                      <th className="pb-3 px-4 font-semibold text-center text-slate-500 uppercase tracking-wider text-xs w-[25%]">Measured Value</th>
                      <th className="pb-3 pl-4 font-semibold text-center text-slate-500 uppercase tracking-wider text-xs w-[15%] px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 pr-4 font-medium text-slate-700">Before No Load Test <span className="text-slate-400 font-normal">(MΩ)</span></td>
                      <td className="py-2 px-4 text-center font-medium text-slate-500 tabular-nums whitespace-nowrap">
                        {activeRecord?.minInsulationRes || '0'} <span className="text-slate-300 mx-1">|</span> {activeRecord?.maxInsulationRes || '1000'}
                      </td>
                      <td className="py-2 px-4 text-center text-base font-bold text-slate-900 tabular-nums tracking-tight">
                         {!liveTestingData ? <div className="flex justify-center opacity-50"><PulseLine className="h-5 w-12" /></div> : (liveTestingData?.beforeNoLoadTest ?? '—')}
                      </td>
                      <td className="py-2 pl-4 text-center px-4">
                         {!liveTestingData ? <div className="flex justify-center opacity-50"><PulseLine className="h-6 w-16" /></div> : <PassFailBadge status={irStatus} />}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 pr-4 font-medium text-slate-700">After No Load Test <span className="text-slate-400 font-normal">(MΩ)</span></td>
                      <td className="py-2 px-4 text-center font-medium text-slate-500 tabular-nums whitespace-nowrap">
                        {activeRecord?.minInsulationRes || '0'} <span className="text-slate-300 mx-1">|</span> {activeRecord?.maxInsulationRes || '1000'}
                      </td>
                      <td className="py-2 px-4 text-center text-base font-bold text-slate-900 tabular-nums tracking-tight">
                         {!liveTestingData ? <div className="flex justify-center opacity-50"><PulseLine className="h-5 w-12" /></div> : (liveTestingData?.afterNoLoadTest ?? '—')}
                      </td>
                      <td className="py-2 pl-4 text-center px-4">
                         {!liveTestingData ? <div className="flex justify-center opacity-50"><PulseLine className="h-6 w-16" /></div> : <PassFailBadge status={afterIrStatus} />}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* No Load Test Limit */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft transition-shadow hover:shadow-elevated h-full flex flex-col">
                <h3 className="mb-3 border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wide text-slate-600">
                  No Load Test Limit
                </h3>

                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr className="border-b-2 border-slate-100 text-left">
                      <th className="pb-3 pr-4 font-semibold text-slate-500 uppercase tracking-wider text-xs w-[30%]">Parameter</th>
                      <th className="pb-3 px-4 font-semibold text-center text-slate-500 uppercase tracking-wider text-xs w-[30%]">Min/Max Limits</th>
                      <th className="pb-3 px-4 font-semibold text-center text-slate-500 uppercase tracking-wider text-xs w-[25%]">Measured Value</th>
                      <th className="pb-3 pl-4 font-semibold text-center text-slate-500 uppercase tracking-wider text-xs w-[15%] px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {noLoadTestRows.map((row) => (
                      <tr key={row.parameter} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-2 pr-4 font-medium text-slate-700">{row.parameter}</td>
                        <td className="py-2 px-4 text-center font-medium text-slate-500 tabular-nums whitespace-nowrap">
                          {row.minLimit ?? '—'} <span className="text-slate-300 mx-1">|</span> {row.maxLimit ?? '—'}
                        </td>
                        <td className="py-2 px-4 text-center text-base font-bold text-slate-900 tabular-nums tracking-tight">
                          {!liveTestingData ? <div className="flex justify-center opacity-50"><PulseLine className="h-5 w-12" /></div> : row.measuredValue}
                        </td>
                        <td className="py-2 pl-4 text-center px-4">
                          {!liveTestingData ? <div className="flex justify-center opacity-50"><PulseLine className="h-6 w-16" /></div> : <PassFailBadge status={row.status} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* RPM & Direction */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft transition-shadow hover:shadow-elevated h-full flex flex-col">
                <h3 className="mb-3 border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wide text-slate-600">
                  RPM & Direction Test Limit
                </h3>

                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr className="border-b-2 border-slate-100 text-left">
                      <th className="pb-3 pr-4 font-semibold text-slate-500 uppercase tracking-wider text-xs w-[20%]">Parameter</th>
                      <th className="pb-3 px-4 font-semibold text-center text-slate-500 uppercase tracking-wider text-xs w-[40%]">Min/Max<br />Limits</th>
                      <th className="pb-3 px-4 font-semibold text-center text-slate-500 uppercase tracking-wider text-xs w-[25%]">Measured Value</th>
                      <th className="pb-3 pl-4 font-semibold text-center text-slate-500 uppercase tracking-wider text-xs w-[15%] px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 pr-4 font-medium text-slate-700">RPM</td>
                      <td className="py-2 px-4 text-center font-medium text-slate-500 tabular-nums whitespace-nowrap">
                        {activeRecord?.minRPM || '—'} <span className="text-slate-300 mx-1">|</span> {activeRecord?.maxRPM || '—'}
                      </td>
                      <td className="py-2 px-4 text-center text-base font-bold text-slate-900 tabular-nums tracking-tight">
                        {!liveTestingData ? <div className="flex justify-center opacity-50"><PulseLine className="h-5 w-12" /></div> : (liveTestingData?.noLoadRPM || '—')}
                      </td>
                      <td className="py-2 pl-4 text-center px-4">
                        {!liveTestingData ? <div className="flex justify-center opacity-50"><PulseLine className="h-6 w-16" /></div> : <PassFailBadge status={rpmStatus} />}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 pr-4 font-medium text-slate-700">Direction</td>
                      <td className="py-2 px-4 text-center font-medium text-slate-500 tabular-nums">
                        {getDirectionLabel(activeRecord?.direction)}
                      </td>
                      <td className="py-2 px-4 text-center text-base font-bold text-slate-900 tabular-nums tracking-tight">
                        {!liveTestingData ? <div className="flex justify-center opacity-50"><PulseLine className="h-5 w-12" /></div> : measuredDirectionLabel}
                      </td>
                      <td className="py-2 pl-4 text-center px-4">
                        {!liveTestingData ? <div className="flex justify-center opacity-50"><PulseLine className="h-6 w-16" /></div> : <PassFailBadge status={directionStatus} />}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>

        {/* ── Right Sidebar: Submit (40%) + Final Result (60%) ── */}
        <aside className="flex flex-row md:flex-col w-full md:w-28 border-t md:border-t-0 md:border-l border-slate-200 shrink-0 md:h-auto">
          {/* Submit Section */}
          <div className="flex items-center justify-center border-r md:border-r-0 md:border-b border-slate-200 bg-white p-3 md:p-0 md:flex-[0_0_40%] w-1/2 md:w-full">
            {loadingResults ? (
              <div className="h-10 w-20 animate-pulse rounded-lg bg-slate-200/50" />
            ) : allSubmitted ? (
              <button
                onClick={onComplete}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow-md active:scale-95 cursor-pointer animate-pulse w-full md:w-auto justify-center"
              >
                <Check className="h-4 w-4" />
                <span className="md:hidden truncate">{completeLabel}</span>
                <span className="hidden md:inline">{completeLabel}</span>
              </button>
            ) : (
              <button
                onClick={handleSubmitCurrent}
                disabled={!liveTestingData || !realTimeData || (activeRecord && submittedRecordIds.includes(activeRecord.id))}
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-md hover:shadow-emerald-500/25 active:shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
              >
                <Send className="h-4 w-4 shrink-0" />
                <span className="truncate">{activeRecord && submittedRecordIds.includes(activeRecord.id) ? 'Submitted' : 'Submit'}</span>
              </button>
            )}
          </div>

          {/* Final Result Section */}
          <div
            className={cn(
              'flex flex-row md:flex-col items-center justify-center gap-2 md:gap-2 transition-colors md:flex-[0_0_60%] w-1/2 md:w-full',
              finalResultLabel === 'FAIL'
                ? 'bg-gradient-to-b from-red-50 to-red-50/50'
                : 'bg-gradient-to-b from-emerald-50 to-emerald-50/50'
            )}
          >
            {loadingResults ? (
              <div className="flex flex-col items-center gap-3 animate-pulse">
                <div className="h-3 w-16 rounded bg-slate-200/50" />
                <div className="h-12 w-12 rounded-full bg-slate-200/50" />
                <div className="h-6 w-12 rounded bg-slate-200/50" />
              </div>
            ) : (
              <>
                <h3 className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-slate-500">Final Result</h3>
                <div className={cn(
                  'rounded-xl p-1 md:p-2',
                  finalResultLabel === 'FAIL' ? 'bg-red-100/50' : 'bg-emerald-100/50'
                )}>
                  {finalResultLabel === 'FAIL' ? (
                    <CircleX className="h-8 w-8 md:h-12 md:w-12 text-red-500" strokeWidth={1.5} />
                  ) : (
                    <CircleCheck className="h-8 w-8 md:h-12 md:w-12 text-emerald-500" strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="md:hidden text-[10px] font-bold uppercase tracking-widest text-slate-500">Final Result</span>
                  <span
                    className={cn(
                      'text-lg md:text-xl font-extrabold tracking-tight',
                      finalResultLabel === 'FAIL' ? 'text-red-600' : 'text-emerald-600'
                    )}
                  >
                    {finalResultLabel}
                  </span>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* ── Bottom Navigation Bar ── */}
      {(onBack || footer) && (
        <div className="shrink-0 bg-slate-50 flex flex-col pt-2 md:pt-3">
          {onBack && (
            <div className="flex items-center px-4 md:px-6 pb-2">
                <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm cursor-pointer shadow-sm"
                >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
                </button>
            </div>
          )}
          {footer && (
            <div className="w-full px-2 md:px-3 pb-2 md:pb-3">
              {footer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
