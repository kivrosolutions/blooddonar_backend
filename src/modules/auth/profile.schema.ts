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

export const updateProfileSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
    bloodGroup: bloodGroupEnum.optional(),
    city: z.string().min(2, 'City is required').optional(),
    area: z.string().min(2, 'Area is required').optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isAvailable: z.boolean().optional(),
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

export const uploadDocumentSchema = z.object({
  type: z.enum(['CNIC_FRONT', 'CNIC_BACK'], {
    required_error: 'Document type is required (CNIC_FRONT or CNIC_BACK)',
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
