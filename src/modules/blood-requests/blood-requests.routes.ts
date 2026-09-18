import { Router } from 'express';
import { createBloodRequest } from './blood-requests.controller';

const router = Router();

router.post('/:donorId', createBloodRequest);

export { router as bloodRequestsRouter };
