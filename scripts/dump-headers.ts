import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const INPUT_FILE = 'Untitled spreadsheet (1).xlsx';
const filePath = path.resolve(process.cwd(), INPUT_FILE);

console.log(`Reading: ${filePath}`);
const buffer = fs.readFileSync(filePath);
const workbook = XLSX.read(buffer, { type: 'buffer' });

console.log(`Sheets: ${workbook.SheetNames.join(', ')}`);

for (const sheetName of workbook.SheetNames) {
  console.log(`\n════════════════════════════════`);
  console.log(`Sheet: "${sheetName}"`);
  console.log(`════════════════════════════════`);
  const ws = workbook.Sheets[sheetName]!;
  
  // Check for merges
  if (ws['!merges'] && ws['!merges'].length > 0) {
    console.log(`\nMerged cells: ${ws['!merges'].length}`);
    for (const m of ws['!merges']) {
      console.log(`  ${XLSX.utils.encode_range(m)}`);
    }
  }
  
  const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  // Print first 10 rows with column indices
  const rowsToPrint = Math.min(data.length, 10);
  for (let r = 0; r < rowsToPrint; r++) {
    const row = data[r];
    if (!row) continue;
    console.log(`\nRow ${r} (${row.length} cols):`);
    for (let c = 0; c < row.length; c++) {
      const val = row[c];
      if (val !== '' && val !== null && val !== undefined) {
        console.log(`  [${c}] = "${val}" (type: ${typeof val})`);
      }
    }
  }
}
