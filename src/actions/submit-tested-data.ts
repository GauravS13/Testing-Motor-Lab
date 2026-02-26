'use server';

import { prisma } from '@/lib/db';

/* ═══════════════════════════════════════════════════════
   Server Actions — SubmitTestedData table
   ═══════════════════════════════════════════════════════ */

/**
 * Fetches the current value of the IsSubmited flag.
 * Returns `1` when external system triggers auto-submit, `0` otherwise.
 */
export async function getSubmitTestedData(): Promise<number> {
  try {
    const row = await prisma.submitTestedData.findFirst();
    return row?.isSubmited ?? 0;
  } catch (error) {
    console.error('[getSubmitTestedData] Error:', error);
    return 0;
  }
}
