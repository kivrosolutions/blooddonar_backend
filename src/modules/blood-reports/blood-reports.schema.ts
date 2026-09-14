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

export const uploadReportSchema = z.object({
  bloodGroup: bloodGroupEnum.optional(),
  labName: z.string().max(200).optional(),
  hemoglobinLevel: z.number().min(0).max(30).optional(),
  testedAt: z.string().optional(),
});

export const updateReportSchema = z.object({
  bloodGroup: bloodGroupEnum.optional(),
  labName: z.string().max(200).optional(),
  hemoglobinLevel: z.number().min(0).max(30).optional(),
  testedAt: z.string().optional(),
});

export const reportIdParam = z.object({
  id: z.string().uuid('Invalid report ID'),
});

export type UploadReportInput = z.infer<typeof uploadReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
