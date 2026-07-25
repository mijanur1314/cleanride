import express from 'express';
import { handleRazorpayWebhook } from '../controllers/webhook.controller';

const router = express.Router();

router.post('/razorpay', handleRazorpayWebhook);

export default router;
