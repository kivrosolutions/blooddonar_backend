import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponseHandler } from '../../utils/apiResponse';
import { ProfileService } from './profile.service';
import { completeProfileSchema, updateProfileSchema } from './profile.schema';
import { ApiError } from '../../utils/ApiError';
import { AuthRequest } from '../../types/auth.types';
import { ZodError } from 'zod';

const profileService = new ProfileService();

function formatZodErrors(error: ZodError) {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

export const completeProfile = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const donorId = authReq.user.donorId;

  const bodyResult = completeProfileSchema.safeParse(req.body);
  if (!bodyResult.success) {
    throw ApiError.badRequest('Validation failed', formatZodErrors(bodyResult.error));
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  if (!files?.cnicFront?.[0] || !files?.cnicBack?.[0] || !files?.bloodReport?.[0]) {
    throw ApiError.badRequest('Validation failed', [
      ...(!files?.cnicFront?.[0] ? [{ field: 'cnicFront', message: 'CNIC front image is required' }] : []),
      ...(!files?.cnicBack?.[0] ? [{ field: 'cnicBack', message: 'CNIC back image is required' }] : []),
      ...(!files?.bloodReport?.[0] ? [{ field: 'bloodReport', message: 'Blood report is required' }] : []),
    ]);
  }

  const result = await profileService.completeProfile(donorId, bodyResult.data, files);
  return ApiResponseHandler.success(res, result, 'Profile completed successfully');
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const donorId = authReq.user.donorId;

  const bodyResult = updateProfileSchema.safeParse(req.body);
  if (!bodyResult.success) {
    throw ApiError.badRequest('Validation failed', formatZodErrors(bodyResult.error));
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  const donor = await profileService.updateProfile(donorId, bodyResult.data, files);
  return ApiResponseHandler.success(res, donor, 'Profile updated successfully');
});
