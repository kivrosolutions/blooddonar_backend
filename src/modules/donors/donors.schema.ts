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

export const updateDonorSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
    bloodGroup: bloodGroupEnum.optional(),
    city: z.string().min(2, 'City is required').optional(),
    area: z.string().min(2, 'Area is required').optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isAvailable: z.boolean().optional(),
    profileImage: z.string().url().optional(),
    currentPassword: z.string().min(6).optional(),
    newPassword: z.string().min(6).optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && !data.currentPassword) return false;
      if (data.currentPassword && !data.newPassword) return false;
      return true;
    },
    { message: 'Both currentPassword and newPassword are required together' },
  );

export const donorIdParam = z.object({
  id: z.string().uuid('Invalid donor ID'),
});

export const donorsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  city: z.string().optional(),
  bloodGroup: bloodGroupEnum.optional(),
  isAvailable: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'fullName', 'bloodGroup']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  radius: z.coerce.number().min(0.1).max(500).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export type UpdateDonorInput = z.infer<typeof updateDonorSchema>;
export type DonorsQueryInput = z.infer<typeof donorsQuerySchema>;
