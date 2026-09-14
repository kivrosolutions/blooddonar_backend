import { Router } from 'express';
import {
  createBloodRequest,
  getAllBloodRequests,
  getBloodRequestById,
  updateBloodRequest,
  cancelBloodRequest,
  searchBloodRequests,
} from './blood-requests.controller';

const router = Router();

router.post('/', createBloodRequest);
router.get('/search', searchBloodRequests);
router.get('/', getAllBloodRequests);
router.get('/:id', getBloodRequestById);
router.put('/:id', updateBloodRequest);
router.delete('/:id', cancelBloodRequest);

export { router as bloodRequestsRouter };
