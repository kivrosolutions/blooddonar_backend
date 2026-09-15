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
], { required_error: 'Blood group is required' });

export const completeProfileSchema = z.object({
  latitude: z.coerce.number({ required_error: 'Latitude is required' }),
  longitude: z.coerce.number({ required_error: 'Longitude is required' }),
  isAvailable: z.coerce.boolean().optional().default(true),
});

export const updateProfileSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
    cnicNumber: z.string().min(13, 'CNIC must be 13 digits').optional(),
    bloodGroup: bloodGroupEnum.optional(),
    city: z.string().min(2, 'City is required').optional(),
    area: z.string().min(2, 'Area is required').optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    isAvailable: z.coerce.boolean().optional(),
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

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
