import { Router } from 'express';
import { uploadFile, deleteFile } from './uploads.controller';
import { uploadSingle } from './uploads.middleware';
import { authenticate } from '../auth/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', uploadSingle, uploadFile);
router.delete('/:fileId', deleteFile);

export { router as uploadsRouter };
