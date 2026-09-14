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

  const result = await uploadsService.uploadToImageKit(
    req.file.buffer,
    req.file.originalname,
    '/uploads',
    req.file.mimetype,
  );

  return ApiResponseHandler.created(res, result, 'File uploaded successfully');
});

export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  const fileId = req.params.fileId as string;

  if (!fileId) {
    throw ApiError.badRequest('File ID is required');
  }

  await uploadsService.deleteFile(fileId);
  return ApiResponseHandler.success(res, null, 'File deleted successfully');
});
