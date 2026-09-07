import { z } from 'zod';

export const createEncounterSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const patchEncounterSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    heroCount: z.number().int().min(1).max(6).optional(),
    darknessSide: z.enum(['A', 'B']).optional(),
    darknessPos: z.number().int().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });
