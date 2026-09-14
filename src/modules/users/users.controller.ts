import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponseHandler } from '../../utils/apiResponse';
import { UsersService } from './users.service';
import { updateUserSchema, userIdParam } from './users.schema';
import { ApiError } from '../../utils/ApiError';

const usersService = new UsersService();

export const getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await usersService.getAll();
  return ApiResponseHandler.success(res, users, 'Users fetched successfully');
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const result = userIdParam.safeParse(req.params);
  if (!result.success) {
    throw ApiError.badRequest(result.error.errors[0].message);
  }

  const user = await usersService.getById(result.data.id);
  return ApiResponseHandler.success(res, user, 'User fetched successfully');
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const paramResult = userIdParam.safeParse(req.params);
  if (!paramResult.success) {
    throw ApiError.badRequest(paramResult.error.errors[0].message);
  }

  const bodyResult = updateUserSchema.safeParse(req.body);
  if (!bodyResult.success) {
    throw ApiError.badRequest(bodyResult.error.errors[0].message);
  }

  const user = await usersService.update(paramResult.data.id, bodyResult.data);
  return ApiResponseHandler.success(res, user, 'User updated successfully');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const result = userIdParam.safeParse(req.params);
  if (!result.success) {
    throw ApiError.badRequest(result.error.errors[0].message);
  }

  await usersService.delete(result.data.id);
  return ApiResponseHandler.noContent(res);
});
