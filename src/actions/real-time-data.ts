'use server';

import { prisma } from '@/lib/db';
import { unstable_noStore as noStore } from 'next/cache';

/* ═══════════════════════════════════════════════════════
   Server Action — RealTimeData table
   ═══════════════════════════════════════════════════════ */

export interface RealTimeDataRow {
  insulationResistance: number | null;
  voltage: number | null;
  currentAmp: number | null;
  power: number | null;
  frequency: number | null;
  rpm: number | null;
  direction: number | null;
}

/**
 * Fetches the latest real-time data row.
 * Returns `null` if no rows exist.
 */
export async function getRealTimeData(): Promise<RealTimeDataRow | null> {
  noStore();
  try {
    const row = await prisma.realTimeData.findFirst({
      orderBy: { id: 'desc' },
    });

    if (!row) return null;

    return {
      insulationResistance: row.insulationResistance,
      voltage: row.voltage,
      currentAmp: row.currentAmp,
      power: row.power,
      frequency: row.frequency,
      rpm: row.rpm,
      direction: row.direction,
    };
  } catch (error) {
    console.error('[getRealTimeData] Error:', error);
    return null;
  }
}
