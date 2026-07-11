import { Router } from 'express';
import { signup, login, getMe } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);

router.use(protect);
router.get('/me', getMe);

export default router;
