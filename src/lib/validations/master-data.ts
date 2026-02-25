import { z } from 'zod';

export const MasterDataSchema = z.object({
  srNo: z.number().nullable().optional(),
  model: z.string().min(1, 'Model is required'),
  phase: z.number().nullable().optional(),
  minInsulationRes: z.number().optional(),
  maxInsulationRes: z.number().optional(),
  testTime: z.number().optional(),
  minVoltage: z.number().optional(),
  maxVoltage: z.number().optional(),
  minCurrent: z.number().optional(),
  maxCurrent: z.number().optional(),
  minPower: z.number().optional(),
  maxPower: z.number().optional(),
  minFrequency: z.number().optional(),
  maxFrequency: z.number().optional(),
  minRPM: z.number().optional(),
  maxRPM: z.number().optional(),
  direction: z.number().optional(),
});

export type MasterDataSchemaType = z.infer<typeof MasterDataSchema>;
