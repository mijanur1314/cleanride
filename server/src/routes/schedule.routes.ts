import { Router } from 'express';
import { getAvailableSlots, getMySchedule, updateMySchedule } from '../controllers/schedule.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

router.get('/available-slots', protect, getAvailableSlots);

router.get('/my-schedule', protect, restrictTo('PARTNER'), getMySchedule);
router.put('/my-schedule', protect, restrictTo('PARTNER'), updateMySchedule);

export default router;
