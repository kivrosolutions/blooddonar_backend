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
  completeProfile,
} from './profile.controller';
import { authenticate } from './auth.middleware';
import { uploadRegistration } from '../uploads/uploads.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);
router.get('/profile', authenticate, getProfile);

router.post('/profile', authenticate, uploadRegistration, completeProfile);
router.put('/profile', authenticate, uploadRegistration, updateProfile);

export { router as authRouter };
