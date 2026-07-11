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
import { upload } from '../middlewares/upload.middleware';

router.patch('/:id/images', restrictTo('PARTNER'), upload.fields([
  { name: 'beforeImage', maxCount: 1 },
  { name: 'afterImage', maxCount: 1 }
]), updateImages);

export default router;
