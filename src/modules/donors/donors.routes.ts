import { Router } from 'express';
import { getAllDonors, getDonorById, updateDonor, deleteDonor, searchDonors } from './donors.controller';
import { authenticate, authorize } from '../auth/auth.middleware';

const router = Router();

router.get('/search', searchDonors);
router.get('/', getAllDonors);
router.get('/:id', getDonorById);
router.put('/:id', authenticate, authorize('ADMIN'), updateDonor);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteDonor);

export { router as donorsRouter };
