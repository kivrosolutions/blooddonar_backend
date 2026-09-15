import { Router } from 'express';
import { getAllDonors, getDonorById, updateDonor, deleteDonor, searchDonors } from './donors.controller';
import { authenticate, authorize } from '../auth/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/search', searchDonors);
router.get('/', getAllDonors);
router.get('/:id', getDonorById);
router.put('/:id', authorize('ADMIN'), updateDonor);
router.delete('/:id', authorize('ADMIN'), deleteDonor);

export { router as donorsRouter };
