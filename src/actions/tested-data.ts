'use server';

import { prisma } from '@/lib/db';
import type { TestedDataInput, TestedDataRow } from '@/types/test-session';

/* ═══════════════════════════════════════════════════════
   Server Actions — TestedData table
   ═══════════════════════════════════════════════════════ */

/**
 * Creates a new TestedData row (completed test result).
 * Returns the created row on success, `null` on failure.
 */
export async function createTestedData(
  data: TestedDataInput,
): Promise<TestedDataRow | null> {
  try {
    const row = await prisma.testedData.create({ data });
    return row as TestedDataRow;
  } catch (error) {
    console.error('[createTestedData] Error:', error);
    return null;
  }
}

/**
 * Creates multiple TestedData rows in a single transaction.
 * Useful for bulk-inserting historical test results.
 * Returns the count of created rows.
 */
export async function createManyTestedData(
  records: TestedDataInput[],
): Promise<{ count: number } | null> {
  try {
    const result = await prisma.testedData.createMany({ data: records });
    return { count: result.count };
  } catch (error) {
    console.error('[createManyTestedData] Error:', error);
    return null;
  }
}

/**
 * Fetches the latest TestedData row.
 * Returns `null` if no rows exist.
 */
export async function getTestedData(): Promise<TestedDataRow | null> {
  try {
    const row = await prisma.testedData.findFirst({
      orderBy: { id: 'desc' },
    });
    return row as TestedDataRow | null;
  } catch (error) {
    console.error('[getTestedData] Error:', error);
    return null;
  }
}

/**
 * Fetches all TestedData rows, ordered by ID ascending.
 */
export async function getAllTestedData(): Promise<TestedDataRow[]> {
  try {
    const rows = await prisma.testedData.findMany({
      orderBy: { id: 'asc' },
    });
    return rows as TestedDataRow[];
  } catch (error) {
    console.error('[getAllTestedData] Error:', error);
    return [];
  }
}

/**
 * Fetches statistics for today's tests.
 */
/**
 * Fetches distinct model names from TestedData.
 * Used to populate the model dropdown on the Reports page.
 */
export async function getDistinctModelNames(): Promise<string[]> {
  try {
    const rows = await prisma.testedData.findMany({
      where: { modelName: { not: null } },
      select: { modelName: true },
      distinct: ['modelName'],
      orderBy: { modelName: 'asc' },
    });
    return rows
      .map((r) => r.modelName)
      .filter((name): name is string => name !== null);
  } catch (error) {
    console.error('[getDistinctModelNames] Error:', error);
    return [];
  }
}

export async function getDailyStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where = {
      dateTime: {
        gte: today,
        lt: tomorrow,
      },
    };

    const total = await prisma.testedData.count({ where });
    const passed = await prisma.testedData.count({ where: { ...where, finalResult: true } });
    const failed = await prisma.testedData.count({ where: { ...where, finalResult: false } });

    // Failure breakdowns
    const failBeforeIR = await prisma.testedData.count({ where: { ...where, result: false } }); // Before IR
    const failNoLoad = await prisma.testedData.count({ where: { ...where, result3: false } }); // No Load
    const failAfterIR = await prisma.testedData.count({ where: { ...where, result2: false } }); // After IR

    return {
      total,
      passed,
      failed,
      failBeforeIR,
      failNoLoad,
      failAfterIR,
      date: today.toISOString(),
    };
  } catch (error) {
    console.error('[getDailyStats] Error:', error);
    return {
      total: 0,
      passed: 0,
      failed: 0,
      failBeforeIR: 0,
      failNoLoad: 0,
      failAfterIR: 0,
      date: new Date().toISOString(),
    };
  }
}

/**
 * Fetches the latest serial number for a given model.
 * Orders by dateTime (most recent first) to pick the latest tested entry.
 * Used to auto-populate the serial number in the stepper Testing page.
 */
export async function getLatestSerialNoByModel(modelName: string): Promise<string | null> {
  try {
    const row = await prisma.testedData.findFirst({
      where: { modelName },
      orderBy: [{ dateTime: 'desc' }, { id: 'desc' }],
      select: { serialNo: true },
    });
    return row?.serialNo ?? null;
  } catch (error) {
    console.error('[getLatestSerialNoByModel] Error:', error);
    return null;
  }
}

/**
 * Fetches TestedData rows filtered by optional model and date range.
 * Used by the Report Generation page to export data as Excel.
 */
export async function getReportData(
  dateFrom: string,
  dateTo: string,
  model?: string,
): Promise<TestedDataRow[]> {
  try {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);

    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);

    const rows = await prisma.testedData.findMany({
      where: {
        dateTime: { gte: from, lte: to },
        ...(model ? { modelName: model } : {}),
      },
      orderBy: { dateTime: 'asc' },
    });
    return rows as TestedDataRow[];
  } catch (error) {
    console.error('[getReportData] Error:', error);
    return [];
  }
}
