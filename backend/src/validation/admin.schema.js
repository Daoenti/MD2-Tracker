import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(8).max(200),
  isAdmin: z.boolean().optional(),
});

export const patchUserSchema = z
  .object({
    isAdmin: z.boolean().optional(),
    password: z.string().min(8).max(200).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });
