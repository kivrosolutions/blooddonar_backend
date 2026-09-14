import { Router } from 'express';
import { uploadReport, getMyReports, updateReport, deleteReport } from './blood-reports.controller';
import { authenticate } from '../auth/auth.middleware';
import { uploadSingleDocument } from '../uploads/uploads.middleware';

const router = Router();

router.use(authenticate);

router.post('/', uploadSingleDocument, uploadReport);
router.get('/mine', getMyReports);
router.put('/:id', uploadSingleDocument, updateReport);
router.delete('/:id', deleteReport);

export { router as bloodReportsRouter };
