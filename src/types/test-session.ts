/* ═══════════════════════════════════════════════════════
   Types for the multi-step test workflow
   Upload XLSX → Review Data Table → Run Testing
   ═══════════════════════════════════════════════════════ */

/** The three steps of the test workflow wizard */
export type TestStep = 'upload' | 'review' | 'testing';

/**
 * A single row from the uploaded XLSX master data.
 * Maps to columns: Sr. No., Model, Phase, Insulation Resistance,
 * Test Time, Voltage, Current, Power, Frequency, RPM, Direction.
 */
export interface TestRecord {
  id: string;
  srNo: number;
  model: string;
  phase: string;
  minInsulationRes: string;
  maxInsulationRes: string;
  testTime: string;
  minVoltage: string;
  maxVoltage: string;
  minCurrent: string;
  maxCurrent: string;
  minPower: string;
  maxPower: string;
  minFrequency: string;
  maxFrequency: string;
  minRPM: string;
  maxRPM: string;
  direction: string;
}

/** Column definition for rendering dynamic tables */
export interface ColumnDef {
  key: keyof TestRecord;
  label: string;
  group?: 'megger' | 'noload';
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

/**
 * Master column definitions — single source of truth for the table layout.
 * Grouped into "Megger Test" and "No Load Test" sections.
 */
export const COLUMN_DEFINITIONS: ColumnDef[] = [
  { key: 'srNo', label: 'Sr. No.', sortable: true, align: 'center' },
  { key: 'model', label: 'Model', sortable: true },
  { key: 'phase', label: 'Phase', group: 'megger', align: 'center' },
  { key: 'minInsulationRes', label: 'Min. IR (MΩ)', group: 'megger', align: 'center', sortable: true },
  { key: 'maxInsulationRes', label: 'Max. IR (MΩ)', group: 'megger', align: 'center', sortable: true },
  { key: 'testTime', label: 'Test Time (s)', group: 'megger', align: 'center' },
  { key: 'minVoltage', label: 'Min. Voltage (V)', group: 'noload', align: 'center', sortable: true },
  { key: 'maxVoltage', label: 'Max. Voltage (V)', group: 'noload', align: 'center', sortable: true },
  { key: 'minCurrent', label: 'Min. Current (A)', group: 'noload', align: 'center', sortable: true },
  { key: 'maxCurrent', label: 'Max. Current (A)', group: 'noload', align: 'center', sortable: true },
  { key: 'minPower', label: 'Min. Power (W)', group: 'noload', align: 'center', sortable: true },
  { key: 'maxPower', label: 'Max. Power (W)', group: 'noload', align: 'center', sortable: true },
  { key: 'minFrequency', label: 'Min. Freq (Hz)', group: 'noload', align: 'center', sortable: true },
  { key: 'maxFrequency', label: 'Max. Freq (Hz)', group: 'noload', align: 'center', sortable: true },
  { key: 'minRPM', label: 'Min. RPM', group: 'noload', align: 'center', sortable: true },
  { key: 'maxRPM', label: 'Max. RPM', group: 'noload', align: 'center', sortable: true },
  { key: 'direction', label: 'Direction', group: 'noload', align: 'center' },
];

/* ═══════════════════════════════════════════════════════
   Database row types — mirror the Prisma models
   ═══════════════════════════════════════════════════════ */

/** A row from the MasterData table (test configuration limits) */
export interface MasterDataRow {
  id: number;
  srNo: number | null;
  dateTime: Date | null;
  model: string | null;
  phase: number | null;
  minInsulationRes: number | null;
  maxInsulationRes: number | null;
  testTime: number | null;
  minVoltage: number | null;
  maxVoltage: number | null;
  minCurrent: number | null;
  maxCurrent: number | null;
  minPower: number | null;
  maxPower: number | null;
  minFrequency: number | null;
  maxFrequency: number | null;
  minRPM: number | null;
  maxRPM: number | null;
  direction: number | null;
}

/** Input payload for creating a MasterData row (ID is auto-generated) */
export type MasterDataInput = Omit<MasterDataRow, 'id'>;

/** A row from the TestedData table (completed test results) */
export interface TestedDataRow {
  id: number;
  srNo: number | null;
  modelName: string | null;
  dateTime: Date | null;
  serialNo: string | null;
  beforeInsulationRes: number | null;
  result: boolean | null;
  voltage: number | null;
  currentAmp: number | null;
  power: number | null;
  frequency: number | null;
  result2: boolean | null;
  afterInsulationRes: number | null;
  result3: boolean | null;
  finalResult: boolean | null;
}

/** Input payload for creating a TestedData row (ID is auto-generated) */
export type TestedDataInput = Omit<TestedDataRow, 'id'>;

/** A row from the LiveTestingData table (live test readings) */
export interface LiveTestingDataRow {
  id: number;
  dateTime: Date | null;
  beforeNoLoadTest: number | null;
  afterNoLoadTest: number | null;
  noLoadRatedVolt: number | null;
  noLoadCurrent: number | null;
  noLoadPower: number | null;
  noLoadFrequency: number | null;
  noLoadRPM: number | null;
  directionClockWise: boolean | null;
  directionAntiClockWise: boolean;
}
