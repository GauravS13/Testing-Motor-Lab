'use server';

import type { TestedDataRow } from '@/types/test-session';
import fs from 'fs/promises';
import path from 'path';
import * as XLSX from 'xlsx';
import { getReportData } from './tested-data';

const BASE_EXPORT_DIR = 'D:/Reports';

const MONTH_NAMES = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

function formatDateTime(date: Date | string | null): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  let hours = d.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const mins = String(d.getMinutes()).padStart(2, "0");
  const secs = String(d.getSeconds()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${mins}:${secs} ${ampm}`;
}

function formatResult(val: boolean | null): string {
  if (val === true) return "PASS";
  if (val === false) return "FAIL";
  return "-";
}

function toExcelRow(row: TestedDataRow) {
  return {
    "Sr No": row.srNo ?? "-",
    "Model": row.modelName ?? "-",
    "Serial No": row.serialNo ?? "-",
    "Date & Time": formatDateTime(row.dateTime),
    "Before IR (MΩ)": row.beforeInsulationRes ?? "-",
    "Before IR Result": formatResult(row.result),
    "Voltage (V)": row.voltage ?? "-",
    "Current (A)": row.currentAmp ?? "-",
    "Power (W)": row.power ?? "-",
    "Freq (Hz)": row.frequency ?? "-",
    "No Load Result": formatResult(row.result3),
    "After IR (MΩ)": row.afterInsulationRes ?? "-",
    "After IR Result": formatResult(row.result2),
    "Final Result": formatResult(row.finalResult),
  };
}

function groupByDate(rows: TestedDataRow[]): Map<string, TestedDataRow[]> {
  const map = new Map<string, TestedDataRow[]>();
  for (const row of rows) {
    const d = row.dateTime ? new Date(row.dateTime) : null;
    const key = d
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      : "unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return map;
}

function groupByModel(rows: TestedDataRow[]): Map<string, TestedDataRow[]> {
  const map = new Map<string, TestedDataRow[]>();
  for (const row of rows) {
    const key = row.modelName || "Unknown Model";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return map;
}

async function writeExcelFile(dir: string, filename: string, newRows: TestedDataRow[]) {
  const filePath = path.join(dir, filename);
  let existingData: Record<string, any>[] = [];

  try {
    const buffer = await fs.readFile(filePath);
    const existingWb = XLSX.read(buffer, { type: "buffer" });
    const sheetName = existingWb.SheetNames[0];
    if (sheetName) {
      const ws = existingWb.Sheets[sheetName];
      if (ws) {
        existingData = XLSX.utils.sheet_to_json(ws);
      }
    }
  } catch (error) {
    // File doesn't exist yet, we start fresh.
  }

  const newDataFormatted = newRows.map(toExcelRow);
  const combinedData = [...existingData, ...newDataFormatted];

  const ws = XLSX.utils.json_to_sheet(combinedData);

  const headers = Object.keys(combinedData[0] || {});
  ws["!cols"] = headers.map((h) => {
    const maxLen = Math.max(
      h.length,
      ...combinedData.map((r) => String((r as Record<string, unknown>)[h] ?? "").length)
    );
    return { wch: maxLen + 2 };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Test Results");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

  await fs.writeFile(filePath, buf);
}

async function exportModelWise(data: TestedDataRow[], modelName: string): Promise<number> {
  let fileCount = 0;
  const modelDir = path.join(BASE_EXPORT_DIR, modelName);
  await fs.mkdir(modelDir, { recursive: true });

  const byDate = groupByDate(data);
  for (const [dateKey, rows] of byDate) {
    const d = new Date(dateKey);
    const yearDir = path.join(modelDir, String(d.getFullYear()));
    const monthDir = path.join(yearDir, MONTH_NAMES[d.getMonth()] ?? "Unknown Month");
    await fs.mkdir(monthDir, { recursive: true });

    await writeExcelFile(monthDir, `${dateKey}.xlsx`, rows);
    fileCount++;
  }
  return fileCount;
}

async function exportGeneral(data: TestedDataRow[]): Promise<number> {
  let fileCount = 0;
  const byDate = groupByDate(data);

  for (const [dateKey, dateRows] of byDate) {
    const d = new Date(dateKey);
    const yearDir = path.join(BASE_EXPORT_DIR, String(d.getFullYear()));
    const monthDir = path.join(yearDir, MONTH_NAMES[d.getMonth()] ?? "Unknown Month");
    const dateDir = path.join(monthDir, dateKey);
    await fs.mkdir(dateDir, { recursive: true });

    const byModel = groupByModel(dateRows);
    for (const [model, modelRows] of byModel) {
      await writeExcelFile(dateDir, `${model}.xlsx`, modelRows);
      fileCount++;
    }
  }
  return fileCount;
}

export async function generateExportFiles(dateFrom: string, dateTo: string, model?: string) {
  try {
    const data = await getReportData(dateFrom, dateTo, model);
    if (!data || data.length === 0) {
      return { success: false, message: 'No test records found for the selected filters.', fileCount: 0, recordCount: 0 };
    }

    await fs.mkdir(BASE_EXPORT_DIR, { recursive: true });

    let fileCount = 0;
    if (model) {
      fileCount = await exportModelWise(data, model);
    } else {
      fileCount = await exportGeneral(data);
    }

    return { success: true, fileCount, recordCount: data.length };
  } catch (err: any) {
    console.error('Export error:', err);
    return { success: false, message: 'Failed to write reports to D:/Reports: ' + err.message, fileCount: 0, recordCount: 0 };
  }
}
