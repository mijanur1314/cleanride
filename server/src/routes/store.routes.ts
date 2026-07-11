import { Router } from 'express';
import { getStores, getStoreById, createStore, updateStore, deleteStore } from '../controllers/store.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getStores);
router.get('/:id', getStoreById);

router.use(protect, restrictTo('ADMIN'));

router.post('/', createStore);
router.patch('/:id', updateStore);
router.delete('/:id', deleteStore);

export default router;
