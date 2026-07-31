import { Router } from 'express';
import { getActiveCoupons, validateCoupon, getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '../controllers/coupon.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/active', getActiveCoupons);
router.post('/validate', validateCoupon);

// Admin routes
router.use(protect);
router.use(restrictTo('ADMIN'));

router.route('/')
  .get(getAllCoupons)
  .post(createCoupon);

router.route('/:id')
  .patch(updateCoupon)
  .delete(deleteCoupon);

export default router;
