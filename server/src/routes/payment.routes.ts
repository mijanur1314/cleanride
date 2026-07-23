import { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/payment.controller';
import { handleRazorpayWebhook } from '../controllers/webhook.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Webhook does not need JWT protection
router.post('/webhook', handleRazorpayWebhook);

// Protected routes
router.use(protect);
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

export default router;
