import { Router } from 'express';
import { getAvailableSlots } from '../controllers/schedule.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/available-slots', protect, getAvailableSlots);

export default router;
