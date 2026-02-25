'use server';

import { prisma } from '@/lib/db';
import type { LiveTestingDataRow } from '@/types/test-session';
import { unstable_noStore as noStore } from 'next/cache';

/* ═══════════════════════════════════════════════════════
   Server Actions — LiveTestingData table
   ═══════════════════════════════════════════════════════ */

/**
 * Fetches the latest LiveTestingData row.
 * Returns `null` if no rows exist.
 */
export async function getLiveTestingData(): Promise<LiveTestingDataRow | null> {
  noStore();
  try {
    console.log('[getLiveTestingData] Starting fetch...');
    
    // Debug: Check count
    const count = await prisma.liveTestingData.count();
    console.log('[getLiveTestingData] Total rows:', count);

    const row = await prisma.liveTestingData.findFirst({
      orderBy: { id: 'desc' },
    });
    
    console.log('[getLiveTestingData] Row found:', row);
    return row as LiveTestingDataRow | null;
  } catch (error) {
    console.error('[getLiveTestingData] Error:', error);
    return null;
  }
}

/**
 * Fetches all LiveTestingData rows, ordered by ID ascending.
 */
export async function getAllLiveTestingData(): Promise<LiveTestingDataRow[]> {
  try {
    const rows = await prisma.liveTestingData.findMany({
      orderBy: { id: 'asc' },
    });
    return rows as LiveTestingDataRow[];
  } catch (error) {
    console.error('[getAllLiveTestingData] Error:', error);
    return [];
  }
}
