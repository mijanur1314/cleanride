import { Router } from 'express';
import { uploadFile, uploadMiddleware } from '../controllers/upload.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Only authenticated users can upload files
router.post('/', protect, uploadMiddleware.single('file'), uploadFile);

export default router;
