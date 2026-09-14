import { Router } from 'express';
import {
  updateProfile,
  updateProfileImage,
  uploadDocument,
  getDocuments,
} from './profile.controller';
import { authenticate } from './auth.middleware';
import { uploadSingle, uploadSingleDocument } from '../uploads/uploads.middleware';

const router = Router();

router.use(authenticate);

router.put('/', updateProfile);
router.post('/image', uploadSingle, updateProfileImage);
router.post('/documents', uploadSingleDocument, uploadDocument);
router.get('/documents', getDocuments);

export { router as profileRouter };
