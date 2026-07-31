import { Router } from 'express';
import { getPlans, createSubscription, verifySubscription, getMySubscription, getAllPlans, createPlan, updatePlan, deletePlan } from '../controllers/subscription.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { cacheRoute } from '../utils/redis';

const router = Router();

// Public / User routes
router.get('/plans', cacheRoute(3600), getPlans);
router.post('/create-subscription', protect, createSubscription);
router.post('/verify', protect, verifySubscription);
router.get('/my-subscription', protect, getMySubscription);

// Admin routes
router.use(protect, restrictTo('ADMIN'));

router.route('/')
  .get(getAllPlans)
  .post(createPlan);

router.route('/:id')
  .patch(updatePlan)
  .delete(deletePlan);

export default router;
