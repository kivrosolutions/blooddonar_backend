import { Request } from 'express';

export interface AuthRequest extends Request {
  user: {
    donorId: string;
    email: string;
    role: string;
  };
}
