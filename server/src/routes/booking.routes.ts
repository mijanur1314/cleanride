import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getPartnerBookings,
  getAllBookings,
  getSurgeStatus,
  updateBookingStatus,
  assignPartner,
  updateImages,
  cancelMyBooking,
  rescheduleMyBooking,
  adminCancelBooking,
} from '../controllers/booking.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', createBooking);
router.get('/my-bookings', getMyBookings);

router.get('/partner-bookings', restrictTo('PARTNER'), getPartnerBookings);
router.patch('/:id/status', restrictTo('ADMIN', 'PARTNER'), updateBookingStatus);

router.get('/', restrictTo('ADMIN'), getAllBookings);
router.get('/surge-status', getSurgeStatus);
router.patch('/:id/assign', restrictTo('ADMIN'), assignPartner);
router.patch('/:id/admin-cancel', restrictTo('ADMIN'), adminCancelBooking);
router.patch('/:id/cancel', cancelMyBooking);
router.patch('/:id/reschedule', rescheduleMyBooking);
router.patch('/:id/images', restrictTo('PARTNER'), updateImages);

export default router;
