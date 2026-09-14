import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponseHandler } from '../../utils/apiResponse';
import { UploadsService } from './uploads.service';
import { ApiError } from '../../utils/ApiError';

const uploadsService = new UploadsService();

export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('No file uploaded');
  }

  const fileInfo = uploadsService.getFileInfo(req.file);
  return ApiResponseHandler.created(res, fileInfo, 'File uploaded successfully');
});
