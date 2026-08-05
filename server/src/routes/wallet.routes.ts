import express from 'express';
import { getWalletBalance, creditWallet, debitWallet } from '../controllers/wallet.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = express.Router();

// All wallet routes require authentication
router.use(protect);

router.get('/balance', getWalletBalance);
router.post('/debit', debitWallet);

// Only admin can manually credit wallets
router.post('/credit', restrictTo('ADMIN'), creditWallet);

export default router;
