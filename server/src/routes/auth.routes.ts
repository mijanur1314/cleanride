import { Router } from 'express';
import { signup, login, getMe, logout, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

router.use(protect);
router.get('/me', getMe);
router.post('/logout', logout);

export default router;
