import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  getProfile,
  logout,
  logoutAll,
  verifyEmail,
  resendVerificationOtp,
  forgotPassword,
  resetPassword,
} from './auth.controller';
import {
  updateProfile,
  updateProfileImage,
  uploadDocument,
  getDocuments,
} from './profile.controller';
import { authenticate } from './auth.middleware';
import { uploadRegistration, uploadSingle, uploadSingleDocument } from '../uploads/uploads.middleware';

const router = Router();

router.post('/register', uploadRegistration, register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);
router.get('/profile', authenticate, getProfile);

router.put('/profile', authenticate, updateProfile);
router.post('/profile/image', authenticate, uploadSingle, updateProfileImage);
router.post('/profile/documents', authenticate, uploadSingleDocument, uploadDocument);
router.get('/profile/documents', authenticate, getDocuments);

export { router as authRouter };
