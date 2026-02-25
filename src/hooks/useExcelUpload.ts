import { MasterDataSchema } from '@/lib/validations/master-data';
import { parseXlsxFile } from '@/services/xlsx-parser';
import { MasterDataInput } from '@/types/test-session';
import { useCallback, useState } from 'react';

export type RowStatus = 'idle' | 'pending' | 'success' | 'error';

export interface ParsedRow {
  index: number;
  data: Partial<MasterDataInput>;
  isValid: boolean;
  errors: Record<string, string>;
  status: RowStatus;
  message?: string | undefined;
}

export function useExcelUpload() {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const parseFile = useCallback(async (file: File) => {
    console.log('useExcelUpload: Starting parse using service for file:', file.name);
    setIsParsing(true);
    
    try {
        const result = await parseXlsxFile(file);
        
        if (!result.success) {
            console.error(result.error);
            // We could set a global error state here if needed
            return; 
        }

        const { records } = result.data;
        const rows: ParsedRow[] = records.map((record, index) => {
            // Transform TestRecord (strings) -> MasterDataInput (numbers)
            // Now keys match exactly, we just need to coerce types.
            
            const numericData: Partial<MasterDataInput> = {
                srNo: record.srNo, 
                model: record.model,
                // Handle Phase: schema requires it, but input type allows null. 
                // We use null to satisfy MasterDataInput type. Validation will fail if required.
                // Handle Phase: map "Single" -> 1, "Three" -> 3
                phase: (() => {
                    const p = record.phase;
                    if (p === undefined || p === null || p === '') return null;
                    if (!isNaN(Number(p))) return Number(p);
                    
                    const s = String(p).trim().toLowerCase();
                    if (s.includes('single')) return 1;
                    if (s.includes('three')) return 3;
                    
                    return null; 
                })(),
                
                minInsulationRes: record.minInsulationRes ? Number(record.minInsulationRes) : null,
                maxInsulationRes: record.maxInsulationRes ? Number(record.maxInsulationRes) : null,
                testTime: record.testTime ? Number(record.testTime) : null,
                minVoltage: record.minVoltage ? Number(record.minVoltage) : null,
                maxVoltage: record.maxVoltage ? Number(record.maxVoltage) : null,
                minCurrent: record.minCurrent ? Number(record.minCurrent) : null,
                maxCurrent: record.maxCurrent ? Number(record.maxCurrent) : null,
                minPower: record.minPower ? Number(record.minPower) : null,
                maxPower: record.maxPower ? Number(record.maxPower) : null,
                minFrequency: record.minFrequency ? Number(record.minFrequency) : null,
                maxFrequency: record.maxFrequency ? Number(record.maxFrequency) : null,
                minRPM: record.minRPM ? Number(record.minRPM) : null,
                maxRPM: record.maxRPM ? Number(record.maxRPM) : null,
                direction: (() => {
                    const d = record.direction;
                    if (d === undefined || d === null || d === '') return null;
                    // Already a number or number-like string?
                    if (!isNaN(Number(d))) return Number(d);
                    
                    // Normalize string
                    const s = String(d).trim().toLowerCase();
                    if (['cw', 'clockwise', 'forward', 'fwd'].includes(s)) return 1;
                    if (['ccw', 'acw', 'anticlockwise', 'anti-clockwise', 'reverse', 'rev'].includes(s)) return 2;
                    
                    return null; // Fallback for unknown strings
                })(),
            };

            // Remove NaN values (replace with null)
            Object.keys(numericData).forEach(key => {
                 const k = key as keyof MasterDataInput;
                 if (typeof numericData[k] === 'number' && isNaN(numericData[k] as number)) {
                     // @ts-ignore - we know k is a valid key and null is valid for all except maybe model/srNo
                     numericData[k] = null;
                 }
            });

            // Validation
            const validation = MasterDataSchema.safeParse(numericData);
            let errors: Record<string, string> = {};
            
            if (!validation.success) {
                validation.error.issues.forEach((issue) => {
                    const path = issue.path[0] as string;
                    errors[path] = issue.message;
                });
            }

            return {
                index,
                data: numericData,
                isValid: validation.success,
                errors,
                status: 'idle',
            };
        });

        setParsedRows(rows);

    } catch (error) {
        console.error("Error parsing excel", error);
    } finally {
        setIsParsing(false);
    }
  }, []);

  const updateRowStatus = useCallback((index: number, status: RowStatus, message?: string) => {
    setParsedRows((prev) =>
      prev.map((row) => (row.index === index ? { ...row, status, message } : row))
    );
  }, []);
  
  const reset = useCallback(() => {
      setParsedRows([]);
  }, []);

  const removeRow = useCallback((index: number) => {
      setParsedRows(prev => prev.filter(r => r.index !== index));
  }, []);

  const updateRowData = useCallback((index: number, newData: Partial<MasterDataInput>) => {
       setParsedRows((prev) => prev.map((row) => {
           if (row.index !== index) return row;
           
           // Re-validate
           const mergedData = { ...row.data, ...newData };
           const result = MasterDataSchema.safeParse(mergedData);
           let errors: Record<string, string> = {};

           if (!result.success) {
             result.error.issues.forEach((issue) => {
               const path = issue.path[0] as string;
               errors[path] = issue.message;
             });
           }
           
           return {
               ...row,
               data: mergedData,
               isValid: result.success,
               errors
           };
       }));
  }, []);

  const sync = useCallback(async (rowsToSync: ParsedRow[]) => {
    // Filter for valid and not-already-success rows
    const pendingRows = rowsToSync.filter(r => r.isValid && r.status !== 'success');
    
    if (pendingRows.length === 0) return;

    // Update status to pending
    setParsedRows(prev => prev.map(r => {
        if (pendingRows.some(pr => pr.index === r.index)) {
            return { ...r, status: 'pending', message: undefined };
        }
        return r;
    }));

    // Dynamic import to avoid server-side issues if any, though this is a hook
    const { syncMasterDataBatch } = await import('@/actions/sync-master-data');
    const pLimit = (await import('p-limit')).default;
    const limit = pLimit(5); // Concurrency limit

    // Chunk size - say 20 per request
    const chunkSize = 20;
    const chunks = [];
    for (let i = 0; i < pendingRows.length; i += chunkSize) {
        chunks.push(pendingRows.slice(i, i + chunkSize));
    }

    const promises = chunks.map(chunk => limit(async () => {
        const batch = chunk.map(r => ({ index: r.index, data: r.data as MasterDataInput }));
        return await syncMasterDataBatch(batch);
    }));

    try {
        const results = await Promise.all(promises);
        
        // Flatten results
        const flatResults = results.flat();

        setParsedRows(prev => prev.map(r => {
            const result = flatResults.find(res => res.index === r.index);
            if (result) {
                return {
                    ...r,
                    status: result.success ? 'success' : 'error',
                    message: result.message
                };
            }
            return r;
        }));

    } catch (error) {
        console.error("Batch sync failed", error);
        // Mark all attempted as error if the network call itself crashed
        setParsedRows(prev => prev.map(r => {
             if (pendingRows.some(pr => pr.index === r.index)) {
                 return { ...r, status: 'error', message: 'Network or Sync Error' };
             }
             return r;
        }));
    }
  }, []);

  const retry = useCallback((index: number) => {
      setParsedRows(prev => {
           return prev.map(r => r.index === index ? { ...r, status: 'idle', message: undefined } : r);
      });
  }, []);

  return {
    parsedRows,
    isParsing,
    parseFile,
    updateRowStatus,
    reset,
    removeRow,
    updateRowData,
    sync, 
    retry
  };
}
