import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponseHandler } from '../../utils/apiResponse';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema, refreshSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema';
import { ApiError } from '../../utils/ApiError';
import { AuthRequest } from '../../types/auth.types';
import { ZodError } from 'zod';
import prisma from '../../config/database';

const authService = new AuthService();

function formatZodErrors(error: ZodError) {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    throw ApiError.badRequest('Validation failed', formatZodErrors(result.error));
  }

  const data = await authService.register(result.data);
  return ApiResponseHandler.created(res, data, 'Donor registered successfully');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    throw ApiError.badRequest('Validation failed', formatZodErrors(result.error));
  }

  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip;

  const data = await authService.login(result.data, userAgent, ipAddress);
  return ApiResponseHandler.success(res, data, 'Login successful');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const result = refreshSchema.safeParse(req.body);
  if (!result.success) {
    throw ApiError.badRequest('Validation failed', formatZodErrors(result.error));
  }

  const data = await authService.refreshToken(result.data.refreshToken);
  return ApiResponseHandler.success(res, data, 'Token refreshed successfully');
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const donor = await prisma.donor.findUnique({
    where: { id: authReq.user.donorId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      cnicNumber: true,
      bloodGroup: true,
      city: true,
      area: true,
      latitude: true,
      longitude: true,
      isAvailable: true,
      isProfileCompleted: true,
      isEmailVerified: true,
      profileImage: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      documents: {
        select: {
          id: true,
          type: true,
          fileUrl: true,
          uploadedAt: true,
        },
      },
      bloodTestReports: {
        select: {
          id: true,
          reportUrl: true,
          bloodGroup: true,
          testedAt: true,
          expiresAt: true,
          status: true,
          uploadedAt: true,
        },
      },
    },
  });
  if (!donor) {
    throw ApiError.notFound('Donor not found');
  }
  return ApiResponseHandler.success(res, donor, 'Profile fetched successfully');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    throw ApiError.badRequest('Session ID is required');
  }

  await authService.logout(sessionId);
  return ApiResponseHandler.success(res, null, 'Logged out successfully');
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  await authService.logoutAll(authReq.user.donorId);
  return ApiResponseHandler.success(res, null, 'Logged out from all devices');
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const result = verifyEmailSchema.safeParse(req.body);
  if (!result.success) {
    throw ApiError.badRequest('Validation failed', formatZodErrors(result.error));
  }

  const data = await authService.verifyEmail(result.data);
  return ApiResponseHandler.success(res, data, 'Email verified successfully');
});

export const resendVerificationOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw ApiError.badRequest('Validation failed', [{ field: 'email', message: 'Email is required' }]);
  }

  const data = await authService.resendVerificationOtp(email);
  return ApiResponseHandler.success(res, data, 'Verification OTP sent successfully');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = forgotPasswordSchema.safeParse(req.body);
  if (!result.success) {
    throw ApiError.badRequest('Validation failed', formatZodErrors(result.error));
  }

  const data = await authService.forgotPassword(result.data);
  return ApiResponseHandler.success(res, data, 'If email exists, reset OTP has been sent');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = resetPasswordSchema.safeParse(req.body);
  if (!result.success) {
    throw ApiError.badRequest('Validation failed', formatZodErrors(result.error));
  }

  const data = await authService.resetPassword(result.data);
  return ApiResponseHandler.success(res, data, 'Password reset successfully');
});
