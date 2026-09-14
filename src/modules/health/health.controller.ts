import { Request, Response } from 'express';
import prisma from '../../config/database';

export const healthCheck = async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      success: true,
      message: 'Server was healthy',
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch {
    return res.status(503).json({
      success: false,
      message: 'Service unavailable',
      data: {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      },
    });
  }
};
