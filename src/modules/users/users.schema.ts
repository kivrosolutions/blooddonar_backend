import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
});

export const userIdParam = z.object({
  id: z.string().uuid('Invalid user ID'),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
