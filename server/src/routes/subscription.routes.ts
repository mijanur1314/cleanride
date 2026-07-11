import { Router } from 'express';
import { getPlans, createSubscriptionOrder, verifySubscription, getMySubscription } from '../controllers/subscription.controller';
import { protect } from '../middlewares/auth.middleware';
import { cacheRoute } from '../utils/redis';

const router = Router();

// Cached for 1 hour
router.get('/plans', cacheRoute(3600), getPlans);
router.post('/create-order', protect, createSubscriptionOrder);
router.post('/verify', protect, verifySubscription);
router.get('/my-subscription', protect, getMySubscription);

export default router;
