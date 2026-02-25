'use server';

import { prisma } from '@/lib/db';
import { MasterDataInput } from '@/types/test-session'; // Assuming MasterDataSchema is exported or we reuse Zod
// If MasterDataSchema isn't exported from types, we use the one from validations
import { MasterDataSchema as MasterDataZodSchema } from '@/lib/validations/master-data';

export type SyncResult = {
  index: number; // We need to pass back the index to map it to the UI row
  success: boolean;
  message?: string;
  data?: any;
};

export async function syncMasterDataBatch(batch: { index: number; data: MasterDataInput }[]): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  // We use Promise.allSettled to ensure that one failure doesn't stop the whole batch
  // and we can report back status for each individual row.
  await Promise.allSettled(
    batch.map(async ({ index, data }) => {
      try {
        // Double-check validation on server side
        const validation = MasterDataZodSchema.safeParse(data);
        if (!validation.success) {
            results.push({
                index,
                success: false,
                message: "Validation failed: " + validation.error.issues.map(i => i.message).join(', ')
            });
            return;
        }

        // Create the record
        // We use prisma.masterData.create. 
        // Note: modify this if you need upsert logic (e.g. based on SrNo or Model)
        const savedRecord = await prisma.masterData.create({
          data: {
            srNo: data.srNo,
            model: data.model,
            phase: data.phase,
            minInsulationRes: data.minInsulationRes,
            maxInsulationRes: data.maxInsulationRes,
            testTime: data.testTime,
            minVoltage: data.minVoltage,
            maxVoltage: data.maxVoltage,
            minCurrent: data.minCurrent,
            maxCurrent: data.maxCurrent,
            minPower: data.minPower,
            maxPower: data.maxPower,
            minFrequency: data.minFrequency,
            maxFrequency: data.maxFrequency,
            minRPM: data.minRPM,
            maxRPM: data.maxRPM,
            direction: data.direction,
            dateTime: new Date(), // Always set current time on creation?
          },
        });

        results.push({
          index,
          success: true,
          data: savedRecord,
        });

      } catch (error: any) {
        console.error(`Error syncing row ${index}:`, error);
        results.push({
          index,
          success: false,
          message: error.message || 'Database error',
        });
      }
    })
  );

  return results;
}
