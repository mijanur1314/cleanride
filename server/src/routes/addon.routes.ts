import express from 'express';
import { getAddons, createAddon } from '../controllers/addon.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/', getAddons);

router.post('/', protect, restrictTo('ADMIN'), createAddon);

export default router;
