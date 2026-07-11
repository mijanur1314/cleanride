import express from 'express';
import { getBookingMessages } from '../controllers/chat.controller';
import { protect } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/:bookingId', getBookingMessages);

export default router;
