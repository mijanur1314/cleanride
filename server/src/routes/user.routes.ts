import { Router } from 'express';
import { getUsers, getUserById, updateProfile, deleteUser } from '../controllers/user.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', restrictTo('ADMIN'), getUsers);

router.patch('/updateMe', updateProfile);

router
  .route('/:id')
  .get(getUserById)
  .delete(restrictTo('ADMIN'), deleteUser);

export default router;
