import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponseHandler } from '../../utils/apiResponse';
import { BloodRequestsService } from './blood-requests.service';
import { ApiError } from '../../utils/ApiError';
import { AuthRequest } from '../../types/auth.types';

const bloodRequestsService = new BloodRequestsService();

export const createBloodRequest = asyncHandler(async (req: Request, res: Response) => {
  const donorId = req.params.donorId as string;

  if (!donorId) {
    throw ApiError.badRequest('Donor ID is required');
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(donorId)) {
    throw ApiError.badRequest('Invalid donor ID format');
  }

  const authReq = req as AuthRequest;
  const request = await bloodRequestsService.create(donorId, authReq.user.donorId);
  return ApiResponseHandler.created(res, request, 'Blood request sent successfully');
});
