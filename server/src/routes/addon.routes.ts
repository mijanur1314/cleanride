import express from 'express';
import { getAddons, createAddon, updateAddon, deleteAddon } from '../controllers/addon.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/', getAddons);

router.use(protect, restrictTo('ADMIN'));

router.post('/', createAddon);
router.patch('/:id', updateAddon);
router.delete('/:id', deleteAddon);

export default router;
