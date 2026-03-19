import { Request, Response, NextFunction } from 'express';
import { CloudinaryService } from '../services/cloudinary.service';
import { AuditService } from '../services/audit.service';

export class UploadController {
    /**
     * Handle single image upload to Cloudinary
     */
    static async uploadImage(req: Request, res: Response, next: NextFunction) {
        try {
            const multerReq = req as any;
            if (!multerReq.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded',
                    error: 'MISSING_FILE'
                });
            }

            // Determine folder based on request body or use default
            const allowedFolders = ['articles', 'projects', 'general', 'dfd-agency'];
            let folder = req.body.folder || 'dfd-agency';
            
            // Whitelist check (Security Hardening)
            if (!allowedFolders.includes(folder)) {
                folder = 'dfd-agency'; // Fallback to default if unauthorized folder requested
            }

            // Upload to Cloudinary using the service
            const imageUrl = await CloudinaryService.uploadImage(multerReq.file.buffer, folder);

            // Audit log (if user is authenticated)
            if ((req as any).user) {
                await AuditService.log(
                    (req as any).user.id,
                    'UPLOAD_IMAGE',
                    `Uploaded to folder: ${folder}`,
                    null,
                    req.ip
                );
            }

            // Return success with the URL format expected by the frontend
            res.status(200).json({
                success: true,
                message: 'Image uploaded successfully',
                data: { url: imageUrl }
            });
        } catch (error) {
            next(error);
        }
    }
}
