
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// The strict headers expected by the application
const CORRECT_HEADERS = [
  'Sr. No.', 'Model', 'Phase', 
  'Min. IR (MΩ)', 'Max. IR (MΩ)', 'Test Time (s)',
  'Min. Voltage (V)', 'Max. Voltage (V)', 
  'Min. Current (A)', 'Max. Current (A)',
  'Min. Power (W)', 'Max. Power (W)',
  'Min. Freq (Hz)', 'Max. Freq (Hz)',
  'Min. RPM', 'Max. RPM', 'Direction'
];

// Mapping from common variations to the correct header
const HEADER_MAPPING: Record<string, string> = {
  'min. voltage (volt)': 'Min. Voltage (V)',
  'max. voltage (volt)': 'Max. Voltage (V)',
  'min. current (amp.)': 'Min. Current (A)',
  'max. current (amp.)': 'Max. Current (A)',
  'min. power (watt)': 'Min. Power (W)',
  'max. power (watt)': 'Max. Power (W)',
  'min. frequency (hz)': 'Min. Freq (Hz)',
  'max. frequency (hz)': 'Max. Freq (Hz)',
  'direction': 'Direction',
  'min. rpm': 'Min. RPM',
  'max. rpm': 'Max. RPM',
  'sr. no.': 'Sr. No.',
  'model': 'Model',
  'phase': 'Phase'
};

const INPUT_FILE = 'Untitled spreadsheet (1).xlsx';
const OUTPUT_FILE = 'Fixed_Master_Data.xlsx';

async function fixExcel() {
  const filePath = path.resolve(process.cwd(), INPUT_FILE);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Reading ${INPUT_FILE}...`);
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    console.error('No sheets found in workbook.');
    process.exit(1);
  }
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    console.error(`Sheet "${sheetName}" not found.`);
    process.exit(1);
  }
  
  // Convert to JSON array of arrays (header: 1 means array of arrays)
  const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  // 1. Find Header Row
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(data.length, 20); i++) {
    const rawRow = data[i];
    if (!rawRow) continue;
    const row = rawRow.map(c => String(c).toLowerCase().trim());
    // Check for a few key keywords
    if (row.some(c => c.includes('voltage') || c.includes('current'))) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    console.error('Could not find a recognizable header row.');
    process.exit(1);
  }

  console.log(`Found header row at index ${headerRowIndex}`);
  const headerRow = data[headerRowIndex];
  if (!headerRow) {
    console.error('Header row found but is undefined.');
    process.exit(1);
  }
  
  // 2. Map Headers
  // We'll create a new data structure for the corrected sheet
  // If "Sr. No." is missing, we'll need to reconstruct the columns entirely to match CORRECT_HEADERS order
  
  // Check if we have Sr No
  const hasSrNo = headerRow.some((h: any) => String(h).toLowerCase().includes('sr'));
  
  // Create a map of "Correct Header" -> "Source Column Index"
  const colIndexMap: Record<string, number> = {};
  
  headerRow.forEach((h: any, idx: number) => {
    const rawVal = String(h).toLowerCase().trim();
    // Start by checking exact known mappings
    if (HEADER_MAPPING[rawVal]) {
      colIndexMap[HEADER_MAPPING[rawVal]] = idx;
    } 
    // Heuristic matching
    else if (rawVal.includes('volt') && rawVal.includes('min')) colIndexMap['Min. Voltage (V)'] = idx;
    else if (rawVal.includes('volt') && rawVal.includes('max')) colIndexMap['Max. Voltage (V)'] = idx;
    else if (rawVal.includes('curr') && rawVal.includes('min')) colIndexMap['Min. Current (A)'] = idx;
    else if (rawVal.includes('curr') && rawVal.includes('max')) colIndexMap['Max. Current (A)'] = idx;
    else if (rawVal.includes('power') && rawVal.includes('min')) colIndexMap['Min. Power (W)'] = idx;
    else if (rawVal.includes('power') && rawVal.includes('max')) colIndexMap['Max. Power (W)'] = idx;
    else if (rawVal.includes('freq') && rawVal.includes('min')) colIndexMap['Min. Freq (Hz)'] = idx;
    else if (rawVal.includes('freq') && rawVal.includes('max')) colIndexMap['Max. Freq (Hz)'] = idx;
  });

  console.log('Mapped Columns:', Object.keys(colIndexMap));

  // 3. Build New Data Set
  const newData: any[][] = [];
  
  // Row 0: Title (Optional, mimicking template)
  newData.push(['MASTER DATA']);
  // Row 1: Groups (Optional)
  newData.push(['', '', '', '', '', '', 'No Load Test', 'No Load Test', 'No Load Test']);
  // Row 2: Correct Headers
  newData.push(CORRECT_HEADERS);
  // Spacer Rows (Optional, but let's keep it clean, maybe just one spacer or none if strict parser allows. 
  // Strict parser just looks for headers, doesn't care about row index anymore, so we don't *need* spacers, 
  // but let's add one empty row for visual separation if we were making a template)
  
  // Data Rows
  let srNoCounter = 1;
  // Start reading data from the row AFTER the found header
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const sourceRow = data[i];
    // Skip empty rows
    if (!sourceRow || sourceRow.length === 0 || sourceRow.every((c: any) => !c)) continue;
    
    const newRow: any[] = [];
    
    CORRECT_HEADERS.forEach(header => {
      if (header === 'Sr. No.') {
        // Use existing if mapped, else auto-gen
        if (colIndexMap['Sr. No.'] !== undefined) {
             const val = sourceRow[colIndexMap['Sr. No.']];
             newRow.push(val || srNoCounter++);
        } else {
             newRow.push(srNoCounter++);
        }
      } else {
        const sourceIdx = colIndexMap[header];
        if (sourceIdx !== undefined) {
          newRow.push(sourceRow[sourceIdx]);
        } else {
          // Fill missing columns with empty string or default
          newRow.push(''); 
        }
      }
    });
    
    newData.push(newRow);
  }

  // 4. Write File
  const newWs = XLSX.utils.aoa_to_sheet(newData);
  const newWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(newWb, newWs, 'Master Data');
  
  XLSX.writeFile(newWb, OUTPUT_FILE);
  console.log(`✅ Fixed file saved as: ${path.resolve(process.cwd(), OUTPUT_FILE)}`);
}

fixExcel().catch(console.error);
