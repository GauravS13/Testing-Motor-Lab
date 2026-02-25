'use server';

import { prisma } from '@/lib/db';

/* ═══════════════════════════════════════════════════════
   Server Action — CommunicationStatus table
   ═══════════════════════════════════════════════════════ */

export interface CommunicationStatusData {
  megger: boolean;
  routineTestSetup: boolean;
  plcCommunication: boolean;
  powerAnalyzer: boolean;
  emergency: boolean;
}

/**
 * Fetches the latest communication status row.
 * Returns `null` if no rows exist.
 */
export async function getCommunicationStatus(): Promise<CommunicationStatusData | null> {
  try {
    const row = await prisma.communicationStatus.findFirst({
      orderBy: { id: 'desc' },
    });

    if (!row) return null;

    return {
      megger: row.megger ?? false,
      routineTestSetup: row.routineTestSetup ?? false,
      plcCommunication: row.plcCommunication ?? false,
      powerAnalyzer: row.powerAnalyzer ?? false,
      emergency: row.emergency ?? false,
    };
  } catch (error) {
    console.error('[getCommunicationStatus] Error:', error);
    return null;
  }
}
