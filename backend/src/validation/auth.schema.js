import { z } from 'zod';

export const credentialsSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(8).max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});
