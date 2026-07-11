import express from 'express';
import { addVehicle, getMyVehicles, deleteVehicle } from '../controllers/vehicle.controller';
import { protect } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(protect);

router.post('/', addVehicle);
router.get('/my-vehicles', getMyVehicles);
router.delete('/:id', deleteVehicle);

export default router;
