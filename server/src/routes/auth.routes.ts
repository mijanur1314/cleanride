import { Router } from 'express';
import { signup, login, getMe, logout } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);

router.use(protect);
router.get('/me', getMe);
router.post('/logout', logout);

export default router;
