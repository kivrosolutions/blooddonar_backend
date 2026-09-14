import { Router } from 'express';
import { register, login, refreshToken, getProfile } from './auth.controller';
import { authenticate } from './auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/profile', authenticate, getProfile);

export { router as authRouter };
