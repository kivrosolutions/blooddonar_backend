import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponseHandler } from '../../utils/apiResponse';
import { BloodReportsService } from './blood-reports.service';
import { uploadReportSchema, updateReportSchema, reportIdParam } from './blood-reports.schema';
import { ApiError } from '../../utils/ApiError';
import { AuthRequest } from '../../types/auth.types';

const bloodReportsService = new BloodReportsService();

export const uploadReport = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const donorId = authReq.user.donorId;

  if (!req.file) {
    throw ApiError.badRequest('No report file uploaded');
  }

  const bodyResult = uploadReportSchema.safeParse(req.body);
  if (!bodyResult.success) {
    throw ApiError.badRequest(bodyResult.error.errors[0].message);
  }

  const report = await bloodReportsService.upload(donorId, bodyResult.data, req.file);
  return ApiResponseHandler.created(res, report, 'Report uploaded successfully');
});

export const getMyReports = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const donorId = authReq.user.donorId;

  const reports = await bloodReportsService.getMyReports(donorId);
  return ApiResponseHandler.success(res, reports, 'Reports fetched successfully');
});

export const updateReport = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const donorId = authReq.user.donorId;

  const paramResult = reportIdParam.safeParse(req.params);
  if (!paramResult.success) {
    throw ApiError.badRequest(paramResult.error.errors[0].message);
  }

  const bodyResult = updateReportSchema.safeParse(req.body);
  if (!bodyResult.success) {
    throw ApiError.badRequest(bodyResult.error.errors[0].message);
  }

  const report = await bloodReportsService.update(
    donorId,
    paramResult.data.id,
    bodyResult.data,
    req.file,
  );

  return ApiResponseHandler.success(res, report, 'Report updated successfully');
});

export const deleteReport = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const donorId = authReq.user.donorId;

  const paramResult = reportIdParam.safeParse(req.params);
  if (!paramResult.success) {
    throw ApiError.badRequest(paramResult.error.errors[0].message);
  }

  await bloodReportsService.delete(donorId, paramResult.data.id);
  return ApiResponseHandler.noContent(res);
});
