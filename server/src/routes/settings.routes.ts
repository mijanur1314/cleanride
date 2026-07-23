import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { getSettings, updateSettings } from '../controllers/settings.controller';

const router = Router();

router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/', getSettings);
router.patch('/', updateSettings);

export default router;
