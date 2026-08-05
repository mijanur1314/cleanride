import express from 'express';
import {
  getItems,
  addItem,
  updateItem,
  requestItem,
  getMyRequests,
  getAllRequests,
  updateRequestStatus,
  deleteItem
} from '../controllers/inventory.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(protect);

// Shared
router.get('/items', getItems);

// Partner Routes
router.post('/requests', restrictTo('PARTNER'), requestItem);
router.get('/requests/me', restrictTo('PARTNER'), getMyRequests);

// Admin Routes
router.post('/items', restrictTo('ADMIN'), addItem);
router.patch('/items/:id', restrictTo('ADMIN'), updateItem);
router.delete('/items/:id', restrictTo('ADMIN'), deleteItem);
router.get('/requests', restrictTo('ADMIN'), getAllRequests);
router.patch('/requests/:id', restrictTo('ADMIN'), updateRequestStatus);

export default router;
