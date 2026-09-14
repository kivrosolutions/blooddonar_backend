import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponseHandler } from '../../utils/apiResponse';
import { ProfileService } from './profile.service';
import { updateProfileSchema, uploadDocumentSchema } from './profile.schema';
import { ApiError } from '../../utils/ApiError';
import { AuthRequest } from '../../types/auth.types';

const profileService = new ProfileService();

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const donorId = authReq.user.donorId;

  const bodyResult = updateProfileSchema.safeParse(req.body);
  if (!bodyResult.success) {
    throw ApiError.badRequest(bodyResult.error.errors[0].message);
  }

  const donor = await profileService.updateProfile(donorId, bodyResult.data);
  return ApiResponseHandler.success(res, donor, 'Profile updated successfully');
});

export const updateProfileImage = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const donorId = authReq.user.donorId;

  if (!req.file) {
    throw ApiError.badRequest('No image file uploaded');
  }

  const result = await profileService.updateProfileImage(donorId, req.file);
  return ApiResponseHandler.success(res, result, 'Profile image updated successfully');
});

export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const donorId = authReq.user.donorId;

  if (!req.file) {
    throw ApiError.badRequest('No document file uploaded');
  }

  const bodyResult = uploadDocumentSchema.safeParse(req.body);
  if (!bodyResult.success) {
    throw ApiError.badRequest(bodyResult.error.errors[0].message);
  }

  const result = await profileService.uploadDocument(donorId, bodyResult.data, req.file);
  return ApiResponseHandler.created(res, result, 'Document uploaded successfully');
});

export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const donorId = authReq.user.donorId;

  const documents = await profileService.getDocuments(donorId);
  return ApiResponseHandler.success(res, documents, 'Documents fetched successfully');
});
