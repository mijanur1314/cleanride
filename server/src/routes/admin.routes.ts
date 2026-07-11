import express from 'express';
import { 
  getDashboardStats, 
  getAllUsers, 
  getAllBookings, 
  assignPartnerToBooking 
} from '../controllers/admin.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/bookings', getAllBookings);
router.patch('/bookings/:bookingId/assign', assignPartnerToBooking);

export default router;
