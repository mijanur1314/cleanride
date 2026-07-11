import { Router } from 'express';
import { getActiveCoupons, validateCoupon } from '../controllers/coupon.controller';

const router = Router();

router.get('/active', getActiveCoupons);
router.post('/validate', validateCoupon);

export default router;
