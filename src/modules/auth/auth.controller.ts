import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponseHandler } from '../../utils/apiResponse';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema';
import { ApiError } from '../../utils/ApiError';
import { AuthRequest } from '../../types/auth.types';

const authService = new AuthService();

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    throw ApiError.badRequest(result.error.errors[0].message);
  }

  const data = await authService.register(result.data);
  return ApiResponseHandler.created(res, data, 'User registered successfully');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    throw ApiError.badRequest(result.error.errors[0].message);
  }

  const data = await authService.login(result.data);
  return ApiResponseHandler.success(res, data, 'Login successful');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const result = refreshSchema.safeParse(req.body);
  if (!result.success) {
    throw ApiError.badRequest(result.error.errors[0].message);
  }

  const data = await authService.refreshToken(result.data.refreshToken);
  return ApiResponseHandler.success(res, data, 'Token refreshed successfully');
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  return ApiResponseHandler.success(res, authReq.user, 'Profile fetched successfully');
});
