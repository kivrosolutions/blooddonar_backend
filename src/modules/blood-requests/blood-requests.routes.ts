import { Router } from 'express';
import { createBloodRequest } from './blood-requests.controller';
import { authenticate } from '../auth/auth.middleware';

const router = Router();

router.post('/:donorId', authenticate, createBloodRequest);

export { router as bloodRequestsRouter };
