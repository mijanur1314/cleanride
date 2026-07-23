import { Router } from 'express';
import { getUsers, getUserById, updateProfile, updateKyc, deleteUser, banUser } from '../controllers/user.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', restrictTo('ADMIN'), getUsers);

router.patch('/updateMe', updateProfile);
router.patch('/kyc', updateKyc);

router
  .route('/:id')
  .get(getUserById)
  .delete(restrictTo('ADMIN'), deleteUser);

router.patch('/:id/ban', restrictTo('ADMIN'), banUser);

export default router;
