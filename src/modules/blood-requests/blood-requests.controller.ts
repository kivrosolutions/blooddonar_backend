import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponseHandler } from '../../utils/apiResponse';
import { BloodRequestsService } from './blood-requests.service';
import { ApiError } from '../../utils/ApiError';
import { createBloodRequestSchema } from './blood-requests.schema';

const bloodRequestsService = new BloodRequestsService();

export const createBloodRequest = asyncHandler(async (req: Request, res: Response) => {
  const donorId = req.params.donorId as string;

  if (!donorId) {
    throw ApiError.badRequest('Donor ID is required');
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(donorId)) {
    throw ApiError.badRequest('Invalid donor ID format');
  }

  const bodyResult = createBloodRequestSchema.safeParse(req.body);
  if (!bodyResult.success) {
    throw ApiError.badRequest(bodyResult.error.errors[0].message);
  }

  const { phone, note } = bodyResult.data;
  const request = await bloodRequestsService.create(donorId, phone, note);
  return ApiResponseHandler.created(res, request, 'Blood request sent successfully');
});
