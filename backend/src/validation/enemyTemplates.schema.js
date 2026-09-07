import { z } from 'zod';

export const createTemplateSchema = z
  .object({
    kind: z.enum(['mob', 'roaming', 'boss']),
    name: z.string().trim().min(1).max(120),
    level: z.string().trim().max(20).optional(),
    healthMax: z.number().int().min(1),
    minionCount: z.number().int().min(0).max(50).optional(),
    bossTrackMax: z.number().int().min(1).max(50).optional(),
  })
  .refine((data) => data.kind !== 'boss' || data.bossTrackMax !== undefined, {
    message: 'bossTrackMax is required for boss templates',
    path: ['bossTrackMax'],
  });

// kind isn't patchable — matches units, which also treat kind as fixed at creation.
export const patchTemplateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    level: z.string().trim().max(20).optional(),
    healthMax: z.number().int().min(1).optional(),
    minionCount: z.number().int().min(0).max(50).optional(),
    bossTrackMax: z.number().int().min(1).max(50).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });
