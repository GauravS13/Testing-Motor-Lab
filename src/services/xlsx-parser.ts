import type { TestRecord } from '@/types/test-session';
import * as XLSX from 'xlsx';

/* ═══════════════════════════════════════════════════════
   Alias-based column matching.

   Each TestRecord field maps to a list of acceptable
   header names (case-insensitive). The parser finds the
   best-matching header row, validates that ALL fields are
   present, and reports any missing ones by their canonical
   (first) alias name.
   ═══════════════════════════════════════════════════════ */

interface FieldDef {
  key: keyof TestRecord;
  /** First entry is the "canonical" name shown in errors */
  aliases: string[];
}

const FIELD_DEFS: FieldDef[] = [
  { key: 'srNo',                    aliases: ['Sr. No.', 'Sr No', 'Sr.No.', 'Sr. No', 'Serial No', 'S.No.', 'SrNo'] },
  { key: 'model',                   aliases: ['Model', 'Model Name'] },
  { key: 'phase',                   aliases: ['Phase'] },
  { key: 'minInsulationRes', aliases: ['Min. IR (MΩ)', 'Min IR (MΩ)', 'Min. IR', 'Min IR', 'Min. Insulation Resistance', 'Min Insulation Resistance', 'Min. Insulation resistance (MΩ)', 'Min. Inuslation resistance (MΩ)', 'Min. Insulation Resistance (MΩ)', 'Min. Inuslation Resistance (MΩ)'] },
  { key: 'maxInsulationRes', aliases: ['Max. IR (MΩ)', 'Max IR (MΩ)', 'Max. IR', 'Max IR', 'Max. Insulation Resistance', 'Max Insulation Resistance', 'Max. Insulation resistance (MΩ)', 'Max. Inuslation resistance (MΩ)', 'Max. Insulation Resistance (MΩ)', 'Max. Inuslation Resistance (MΩ)'] },
  { key: 'testTime',                aliases: ['Test Time (s)', 'Test Time', 'Test Time (sec)', 'Test Time(s)', 'Test Time (Second)', 'Test Time (Seconds)'] },
  { key: 'minVoltage',              aliases: ['Min. Voltage (V)', 'Min. Voltage (Volt)', 'Min Voltage (V)', 'Min Voltage (Volt)', 'Min. Voltage', 'Min Voltage'] },
  { key: 'maxVoltage',              aliases: ['Max. Voltage (V)', 'Max. Voltage (Volt)', 'Max Voltage (V)', 'Max Voltage (Volt)', 'Max. Voltage', 'Max Voltage'] },
  { key: 'minCurrent',              aliases: ['Min. Current (A)', 'Min. Current (amp.)', 'Min Current (A)', 'Min Current (amp.)', 'Min. Current', 'Min Current'] },
  { key: 'maxCurrent',              aliases: ['Max. Current (A)', 'Max. Current (amp.)', 'Max Current (A)', 'Max Current (amp.)', 'Max. Current', 'Max Current'] },
  { key: 'minPower',                aliases: ['Min. Power (W)', 'Min. Power (Watt)', 'Min Power (W)', 'Min Power (Watt)', 'Min. Power', 'Min Power'] },
  { key: 'maxPower',                aliases: ['Max. Power (W)', 'Max. Power (Watt)', 'Max Power (W)', 'Max Power (Watt)', 'Max. Power', 'Max Power'] },
  { key: 'minFrequency',            aliases: ['Min. Freq (Hz)', 'Min. Frequency (Hz)', 'Min Freq (Hz)', 'Min Frequency (Hz)', 'Min. Frequency', 'Min. Freq', 'Min Frequency', 'Min. Frequency (Hz)'] },
  { key: 'maxFrequency',            aliases: ['Max. Freq (Hz)', 'Max. Frequency (Hz)', 'Max Freq (Hz)', 'Max Frequency (Hz)', 'Max. Frequency', 'Max. Freq', 'Max Frequency', 'Max. Frequency (Hz)'] },
  { key: 'minRPM',                  aliases: ['Min. RPM', 'Min RPM'] },
  { key: 'maxRPM',                  aliases: ['Max. RPM', 'Max RPM'] },
  { key: 'direction',               aliases: ['Direction'] },
];

/**
 * Normalize a string for comparison: collapse all whitespace
 * (including newlines) into single spaces, trim, lowercase.
 */
function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Build a normalized lookup: normalized alias → FieldDef */
const ALIAS_LOOKUP = new Map<string, FieldDef>();
for (const fd of FIELD_DEFS) {
  for (const alias of fd.aliases) {
    ALIAS_LOOKUP.set(normalize(alias), fd);
  }
}

export interface ParseResult {
  records: TestRecord[];
  totalRows: number;
  skippedRows: number;
}

export interface ParseError {
  message: string;
  details?: string;
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

/**
 * For a given row, count how many of our field aliases it matches.
 */
function countAliasMatches(row: unknown[]): number {
  const matched = new Set<string>();
  for (const cell of row) {
    const val = normalize(cellToString(cell));
    const fd = ALIAS_LOOKUP.get(val);
    if (fd) matched.add(fd.key);
  }
  return matched.size;
}

/**
 * Parse an XLSX/XLS file from a browser File object.
 * Returns either a successful ParseResult or a ParseError.
 */
export async function parseXlsxFile(
  file: File
): Promise<{ success: true; data: ParseResult } | { success: false; error: ParseError }> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    if (workbook.SheetNames.length === 0) {
      return {
        success: false,
        error: { message: 'The uploaded file contains no sheets.' },
      };
    }

    const sheetName = workbook.SheetNames[0]!;
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      return {
        success: false,
        error: { message: 'Could not read the first sheet from the file.' },
      };
    }

    const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
    });

    if (rawData.length === 0) {
      return {
        success: false,
        error: { message: 'The spreadsheet appears to be empty.' },
      };
    }

    // ── 1. Locate Header Row ──────────────────────────────
    let headerRowIndex = -1;
    let maxMatchCount = 0;
    const maxSearchRows = Math.min(rawData.length, 20);

    for (let i = 0; i < maxSearchRows; i++) {
      const row = rawData[i] as unknown[];
      const matches = countAliasMatches(row);
      if (matches > maxMatchCount) {
        maxMatchCount = matches;
        headerRowIndex = i;
      }
    }

    if (headerRowIndex === -1 || maxMatchCount < 3) {
      return {
        success: false,
        error: {
          message: 'Could not identify a valid header row.',
          details:
            'Please ensure your Excel file contains the standard column headers (e.g., "Sr. No.", "Model", "Min. Voltage (V)").',
        },
      };
    }

    // ── 2. Validate & Map Headers ─────────────────────────
    const headerRow = (rawData[headerRowIndex] as unknown[]).map(cellToString);

    // For each field, find which column index it lives in
    const fieldToCol: Record<string, number> = {};
    const missingFields: string[] = [];

    for (const fd of FIELD_DEFS) {
      let foundIdx = -1;
      for (let ci = 0; ci < headerRow.length; ci++) {
        const headerNorm = normalize(headerRow[ci]!);
        if (fd.aliases.some(a => normalize(a) === headerNorm)) {
          foundIdx = ci;
          break;
        }
      }
      if (foundIdx === -1) {
        // Report canonical name
        missingFields.push(fd.aliases[0]!);
      } else {
        fieldToCol[fd.key] = foundIdx;
      }
    }

    if (missingFields.length > 0) {
      const missingList = missingFields.map(h => `• ${h}`).join('\n');
      return {
        success: false,
        error: {
          message: 'Validation Failed: Missing or incorrect column headers.',
          details: `The following columns were not found in the identified header row (Row ${headerRowIndex + 1}):\n\n${missingList}\n\nPlease ensure the headers match exactly.`,
        },
      };
    }

    // ── 3. Extract Data ───────────────────────────────────
    const records: TestRecord[] = [];
    let skippedRows = 0;
    const dataStartRow = headerRowIndex + 1;

    for (let i = dataStartRow; i < rawData.length; i++) {
      const row = rawData[i] as unknown[];
      if (!row || row.length === 0) {
        skippedRows++;
        continue;
      }

      const getVal = (key: keyof TestRecord) => {
        const ci = fieldToCol[key];
        if (ci === undefined) return '';
        return cellToString(row[ci]);
      };

      const srNoRaw = getVal('srNo');
      if (!srNoRaw) {
        skippedRows++;
        continue;
      }

      const srNo = parseInt(srNoRaw, 10);
      if (isNaN(srNo)) {
        skippedRows++;
        continue;
      }

      records.push({
        id: `record-${srNo}-${i}`,
        srNo,
        model: getVal('model'),
        phase: getVal('phase'),
        minInsulationRes: getVal('minInsulationRes'),
        maxInsulationRes: getVal('maxInsulationRes'),
        testTime: getVal('testTime'),
        minVoltage: getVal('minVoltage'),
        maxVoltage: getVal('maxVoltage'),
        minCurrent: getVal('minCurrent'),
        maxCurrent: getVal('maxCurrent'),
        minPower: getVal('minPower'),
        maxPower: getVal('maxPower'),
        minFrequency: getVal('minFrequency'),
        maxFrequency: getVal('maxFrequency'),
        minRPM: getVal('minRPM'),
        maxRPM: getVal('maxRPM'),
        direction: getVal('direction'),
      });
    }

    if (records.length === 0) {
      return {
        success: false,
        error: {
          message: 'No valid data rows found.',
          details: 'Rows must have a valid "Sr. No." value.',
        },
      };
    }

    return {
      success: true,
      data: {
        records,
        totalRows: rawData.length - dataStartRow,
        skippedRows,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: {
        message: 'Failed to parse the uploaded file.',
        details: err instanceof Error ? err.message : 'Unknown error occurred.',
      },
    };
  }
}

