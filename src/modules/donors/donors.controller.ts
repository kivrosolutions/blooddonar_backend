import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponseHandler } from '../../utils/apiResponse';
import { DonorsService } from './donors.service';
import { updateDonorSchema, donorIdParam, donorsQuerySchema } from './donors.schema';
import { ApiError } from '../../utils/ApiError';
import { AuthRequest } from '../../types/auth.types';

const donorsService = new DonorsService();

export const getAllDonors = asyncHandler(async (req: Request, res: Response) => {
  const query = donorsQuerySchema.parse(req.query);
  const authReq = req as AuthRequest;
  const donorId = authReq.user?.donorId;
  const result = await donorsService.getAll(query, donorId, query.lat, query.lng);
  return ApiResponseHandler.success(res, result.donors, 'Donors fetched successfully', 200, result.pagination);
});

export const getDonorById = asyncHandler(async (req: Request, res: Response) => {
  const result = donorIdParam.safeParse(req.params);
  if (!result.success) {
    throw ApiError.badRequest(result.error.errors[0].message);
  }

  const donor = await donorsService.getById(result.data.id);
  return ApiResponseHandler.success(res, donor, 'Donor fetched successfully');
});

export const updateDonor = asyncHandler(async (req: Request, res: Response) => {
  const paramResult = donorIdParam.safeParse(req.params);
  if (!paramResult.success) {
    throw ApiError.badRequest(paramResult.error.errors[0].message);
  }

  const bodyResult = updateDonorSchema.safeParse(req.body);
  if (!bodyResult.success) {
    throw ApiError.badRequest(bodyResult.error.errors[0].message);
  }

  const authReq = req as AuthRequest;
  if (authReq.user.role !== 'ADMIN' && authReq.user.donorId !== paramResult.data.id) {
    throw ApiError.forbidden('You can only update your own profile');
  }

  const donor = await donorsService.update(paramResult.data.id, bodyResult.data);
  return ApiResponseHandler.success(res, donor, 'Donor updated successfully');
});

export const deleteDonor = asyncHandler(async (req: Request, res: Response) => {
  const result = donorIdParam.safeParse(req.params);
  if (!result.success) {
    throw ApiError.badRequest(result.error.errors[0].message);
  }

  await donorsService.softDelete(result.data.id);
  return ApiResponseHandler.noContent(res);
});

export const searchDonors = asyncHandler(async (req: Request, res: Response) => {
  const { city, bloodGroup } = req.query;

  if (!city || !bloodGroup) {
    throw ApiError.badRequest('City and blood group are required');
  }

  const donors = await donorsService.getByCityAndBloodGroup(
    city as string,
    bloodGroup as string,
  );
  return ApiResponseHandler.success(res, donors, 'Donors found successfully');
});
