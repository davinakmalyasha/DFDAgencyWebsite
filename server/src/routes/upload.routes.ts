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
    fileFilter: (_req, file, cb) => {
        // 1. Check MIME type
        const isMimeValid = file.mimetype.startsWith('image/');
        
        // 2. Check File Extension (Deep Defense against renaming .php to .jpg)
        const allowedExtensions = /\.(jpg|jpeg|png|webp|gif)$/i;
        const isExtValid = allowedExtensions.test(file.originalname);

        if (isMimeValid && isExtValid) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed'));
        }
    }
});

// Protect upload route to require superadmin access
router.post('/', authenticateJWT, requireSuperadmin, upload.single('file'), UploadController.uploadImage);

export default router;
