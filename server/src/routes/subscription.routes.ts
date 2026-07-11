import { Router } from 'express';
import { getPlans, subscribe, getMySubscription } from '../controllers/subscription.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/plans', getPlans);
router.post('/subscribe', protect, subscribe);
router.get('/my-subscription', protect, getMySubscription);

export default router;
