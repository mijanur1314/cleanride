import { Router } from 'express';
import { getMyNotifications, markAsRead, markAllAsRead, subscribeToPush } from '../controllers/notification.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);
router.get('/', getMyNotifications);
router.post('/subscribe', subscribeToPush);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

export default router;
