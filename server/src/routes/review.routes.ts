import { Router } from 'express';
import { createReview, getReviews } from '../controllers/review.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getReviews);
router.post('/', protect, createReview);

export default router;
