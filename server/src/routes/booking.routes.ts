import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getPartnerBookings,
  getAllBookings,
  updateBookingStatus,
  assignPartner,
  updateImages,
} from '../controllers/booking.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', createBooking);
router.get('/my-bookings', getMyBookings);

router.get('/partner-bookings', restrictTo('PARTNER'), getPartnerBookings);
router.patch('/:id/status', restrictTo('ADMIN', 'PARTNER'), updateBookingStatus);

router.get('/', restrictTo('ADMIN'), getAllBookings);
router.patch('/:id/assign', restrictTo('ADMIN'), assignPartner);
router.patch('/:id/images', restrictTo('PARTNER'), updateImages);

export default router;
