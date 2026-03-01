import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/upload.controller';
import { authenticateJWT, requireSuperadmin } from '../middlewares/auth.middleware';

const router = Router();

// Configure multer to store files in memory for Cloudinary upload
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Protect upload route to require superadmin access
router.post('/', authenticateJWT, requireSuperadmin, upload.single('file'), UploadController.uploadImage);

export default router;
