import { z } from 'zod';

export const createBloodRequestSchema = z.object({
  phone: z
    .string({ required_error: 'Phone number is required' })
    .min(10, 'Phone number must be at least 10 digits'),
  note: z.string().optional(),
});

export type CreateBloodRequestInput = z.infer<typeof createBloodRequestSchema>;
