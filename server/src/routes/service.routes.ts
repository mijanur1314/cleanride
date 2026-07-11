import { Router } from 'express';
import { getServices, getServiceById, createService, updateService, deleteService } from '../controllers/service.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Public routes or accessible by any authenticated user for booking
router.get('/', getServices);
router.get('/:id', getServiceById);

// Admin only routes
router.use(protect, restrictTo('ADMIN'));

router.post('/', createService);
router.patch('/:id', updateService);
router.delete('/:id', deleteService);

export default router;
