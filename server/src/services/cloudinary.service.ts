import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
    /**
     * Upload an image from a buffer or stream
     * This ensures no files are saved to the local disk.
     */
    static async uploadImage(fileBuffer: Buffer, folder: string = 'dfd-agency'): Promise<string> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder },
                (error, result) => {
                    if (error) return reject(error);
                    if (result) resolve(result.secure_url);
                    else reject(new Error('Cloudinary upload failed: No result returned'));
                }
            );

            uploadStream.end(fileBuffer);
        });
    }

    /**
     * Delete image is omitted here if only URL is needed and actual deletion is manual/background.
     * However, for "Absolute Perfection", we implement it.
     */
    static async deleteImage(imageUrl: string): Promise<void> {
        try {
            // Extract public ID from Cloudinary URL:
            // https://res.cloudinary.com/demo/image/upload/v1570975132/folder/image.jpg
            const parts = imageUrl.split('/');
            const publicId = parts[parts.length - 1].split('.')[0];
            const folder = parts[parts.length - 2];

            await cloudinary.uploader.destroy(`${folder}/${publicId}`);
        } catch (error) {
            console.error('Cloudinary deletion failed:', error);
        }
    }
}
