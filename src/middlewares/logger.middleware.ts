import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

export const logger = morgan('dev');

export const requestTimestamp = (req: Request, _res: Response, next: NextFunction) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (req as any).timestamp = Date.now();
  next();
};
