import { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/payment.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

export default router;
