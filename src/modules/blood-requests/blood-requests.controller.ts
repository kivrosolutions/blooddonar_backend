import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponseHandler } from '../../utils/apiResponse';
import { BloodRequestsService } from './blood-requests.service';
import {
  createBloodRequestSchema,
  updateBloodRequestSchema,
  bloodRequestIdParam,
} from './blood-requests.schema';
import { ApiError } from '../../utils/ApiError';

const bloodRequestsService = new BloodRequestsService();

export const createBloodRequest = asyncHandler(async (req: Request, res: Response) => {
  const bodyResult = createBloodRequestSchema.safeParse(req.body);
  if (!bodyResult.success) {
    throw ApiError.badRequest(bodyResult.error.errors[0].message);
  }

  const request = await bloodRequestsService.create(bodyResult.data);
  return ApiResponseHandler.created(res, request, 'Blood request created successfully');
});

export const getAllBloodRequests = asyncHandler(async (_req: Request, res: Response) => {
  const requests = await bloodRequestsService.getAll();
  return ApiResponseHandler.success(res, requests, 'Blood requests fetched successfully');
});

export const getBloodRequestById = asyncHandler(async (req: Request, res: Response) => {
  const paramResult = bloodRequestIdParam.safeParse(req.params);
  if (!paramResult.success) {
    throw ApiError.badRequest(paramResult.error.errors[0].message);
  }

  const request = await bloodRequestsService.getById(paramResult.data.id);
  return ApiResponseHandler.success(res, request, 'Blood request fetched successfully');
});

export const updateBloodRequest = asyncHandler(async (req: Request, res: Response) => {
  const paramResult = bloodRequestIdParam.safeParse(req.params);
  if (!paramResult.success) {
    throw ApiError.badRequest(paramResult.error.errors[0].message);
  }

  const bodyResult = updateBloodRequestSchema.safeParse(req.body);
  if (!bodyResult.success) {
    throw ApiError.badRequest(bodyResult.error.errors[0].message);
  }

  const { requesterEmail } = req.body;
  if (!requesterEmail) {
    throw ApiError.badRequest('requesterEmail is required for authorization');
  }

  const request = await bloodRequestsService.update(
    paramResult.data.id,
    bodyResult.data,
    requesterEmail,
  );

  return ApiResponseHandler.success(res, request, 'Blood request updated successfully');
});

export const cancelBloodRequest = asyncHandler(async (req: Request, res: Response) => {
  const paramResult = bloodRequestIdParam.safeParse(req.params);
  if (!paramResult.success) {
    throw ApiError.badRequest(paramResult.error.errors[0].message);
  }

  const { requesterEmail } = req.body;
  if (!requesterEmail) {
    throw ApiError.badRequest('requesterEmail is required for authorization');
  }

  await bloodRequestsService.cancel(paramResult.data.id, requesterEmail);
  return ApiResponseHandler.success(res, null, 'Blood request cancelled successfully');
});

export const searchBloodRequests = asyncHandler(async (req: Request, res: Response) => {
  const { city, bloodGroup } = req.query;

  if (!city || !bloodGroup) {
    throw ApiError.badRequest('City and blood group are required');
  }

  const requests = await bloodRequestsService.search(city as string, bloodGroup as string);
  return ApiResponseHandler.success(res, requests, 'Blood requests found successfully');
});
