import { z } from 'zod';

export const createUnitSchema = z
  .object({
    kind: z.enum(['mob', 'roaming', 'boss']),
    name: z.string().trim().min(1).max(120),
    level: z.string().trim().max(20).optional(),
    healthMax: z.number().int().min(1),
    minionCount: z.number().int().min(0).max(50).optional(),
    bossTrackMax: z.number().int().min(1).max(50).optional(),
  })
  .refine((data) => data.kind !== 'boss' || data.bossTrackMax !== undefined, {
    message: 'bossTrackMax is required for boss units',
    path: ['bossTrackMax'],
  });

export const patchUnitSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    healthMax: z.number().int().min(1).optional(),
    notes: z.string().max(2000).optional(),
    showNotes: z.boolean().optional(),
    bossTrackPos: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

export const woundSchema = z.object({
  amount: z.number().int().min(1),
  mode: z.enum(['wound', 'heal']),
});
