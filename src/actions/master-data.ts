'use server';

import { prisma } from '@/lib/db';
import type { MasterDataInput, MasterDataRow } from '@/types/test-session';

/* ═══════════════════════════════════════════════════════
   Server Actions — MasterData table
   ═══════════════════════════════════════════════════════ */

/**
 * Creates a new MasterData row (test configuration limits).
 * Returns the created row on success, `null` on failure.
 */
export async function createMasterData(
  data: MasterDataInput,
): Promise<MasterDataRow | null> {
  try {
    const row = await prisma.masterData.create({ data });
    return row as MasterDataRow;
  } catch (error) {
    console.error('[createMasterData] Error:', error);
    return null;
  }
}

/**
 * Creates multiple MasterData rows in a single transaction.
 * Useful for bulk-inserting data from XLSX uploads.
 * Returns the count of created rows.
 */
export async function createManyMasterData(
  records: MasterDataInput[],
): Promise<{ count: number } | null> {
  try {
    const result = await prisma.masterData.createMany({ data: records });
    return { count: result.count };
  } catch (error) {
    console.error('[createManyMasterData] Error:', error);
    return null;
  }
}

/**
 * Fetches the latest MasterData row.
 * Returns `null` if no rows exist.
 */
export async function getMasterData(): Promise<MasterDataRow | null> {
  try {
    const row = await prisma.masterData.findFirst({
      orderBy: { id: 'desc' },
    });
    return row as MasterDataRow | null;
  } catch (error) {
    console.error('[getMasterData] Error:', error);
    return null;
  }
}

/**
 * Fetches all MasterData rows, ordered by ID ascending.
 */
export async function getAllMasterData(): Promise<MasterDataRow[]> {
  try {
    const rows = await prisma.masterData.findMany({
      orderBy: { id: 'asc' },
    });
    return rows as MasterDataRow[];
  } catch (error) {
    console.error('[getAllMasterData] Error:', error);
    return [];
  }
}
