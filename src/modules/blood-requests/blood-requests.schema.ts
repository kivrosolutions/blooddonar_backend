import { z } from 'zod';

const bloodGroupEnum = z.enum([
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE',
]);

export const createBloodRequestSchema = z.object({
  requesterName: z.string().min(2, 'Name is required'),
  requesterPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  requesterEmail: z.string().email('Invalid email address'),
  patientName: z.string().max(200).optional(),
  hospitalName: z.string().max(200).optional(),
  bloodGroup: bloodGroupEnum,
  city: z.string().min(2, 'City is required'),
  area: z.string().min(2, 'Area is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  unitsRequired: z.number().int().min(1).max(10).default(1),
  requiredByDate: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const updateBloodRequestSchema = z.object({
  requesterName: z.string().min(2).optional(),
  requesterPhone: z.string().min(10).optional(),
  patientName: z.string().max(200).optional(),
  hospitalName: z.string().max(200).optional(),
  unitsRequired: z.number().int().min(1).max(10).optional(),
  requiredByDate: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const bloodRequestIdParam = z.object({
  id: z.string().uuid('Invalid request ID'),
});

export type CreateBloodRequestInput = z.infer<typeof createBloodRequestSchema>;
export type UpdateBloodRequestInput = z.infer<typeof updateBloodRequestSchema>;
