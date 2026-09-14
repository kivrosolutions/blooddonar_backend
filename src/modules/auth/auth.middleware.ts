import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../../utils/token';
import { ApiError } from '../../utils/ApiError';
import prisma from '../../config/database';
import { AuthRequest } from '../../types/auth.types';

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const payload: TokenPayload = verifyAccessToken(token);

    const donor = await prisma.donor.findUnique({
      where: { id: payload.donorId },
      select: { id: true, email: true, role: true, isActive: true, isBanned: true },
    });

    if (!donor) {
      throw ApiError.unauthorized('Donor not found');
    }

    if (!donor.isActive) {
      throw ApiError.forbidden('Account has been deactivated');
    }

    if (donor.isBanned) {
      throw ApiError.forbidden('Account has been banned');
    }

    (req as AuthRequest).user = {
      donorId: donor.id,
      email: donor.email,
      role: donor.role,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized('Invalid token'));
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return next(ApiError.unauthorized());
    }

    if (!roles.includes(authReq.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    next();
  };
};
