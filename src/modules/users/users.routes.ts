import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from './users.controller';
import { authenticate, authorize } from '../auth/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN'), getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

export { router as usersRouter };
