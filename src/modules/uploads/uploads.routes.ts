import { Router } from 'express';
import { uploadFile } from './uploads.controller';
import { upload } from './uploads.middleware';
import { authenticate } from '../auth/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', upload.single('file'), uploadFile);

export { router as uploadsRouter };
