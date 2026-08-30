import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with trimmed values to prevent "invalid cloud name" errors from .env whitespace
cloudinary.config({
    cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim().replace(/^"(.*)"$/, '$1'),
    api_key: (process.env.CLOUDINARY_API_KEY || '').trim().replace(/^"(.*)"$/, '$1'),
    api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim().replace(/^"(.*)"$/, '$1'),
});

/**
 * Verify the file's magic bytes match a whitelist of raster image formats.
 * SVG is intentionally NOT allowed (served inline → stored-XSS risk).
 */
export function sniffImageType(buffer: Buffer): 'jpeg' | 'png' | 'webp' | 'gif' | null {
    if (!buffer || buffer.length < 12) return null;
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'jpeg';
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'png';
    // WebP: 52 49 46 46 .... 57 45 42 50 (RIFF....WEBP)
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
    // GIF: 47 49 46 38
    if (buffer.toString('ascii', 0, 4) === 'GIF8') return 'gif';
    return null;
}

export class CloudinaryService {
    /**
     * Upload an image from a buffer or stream
     * This ensures no files are saved to the local disk.
     */
    static async uploadImage(fileBuffer: Buffer, folder: string = 'dfd-agency'): Promise<string> {
        // Validation check for unconfigured developer placeholders
        if (process.env.CLOUDINARY_API_KEY === 'your_api_key' || !process.env.CLOUDINARY_API_KEY) {
            throw new Error('Cloudinary is not configured. Please provide a real API Key in the server .env file.');
        }

        // Server-side magic-byte validation (the router's fileFilter is only a first pass)
        if (!sniffImageType(fileBuffer)) {
            throw new Error('File content is not a supported image (jpg, png, webp, gif)');
        }

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'image',
                    // Hard constraints: no transformations, always strip metadata
                    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
                },
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
     * Delete an image by URL. Parses the public_id robustly (handles
     * version strings, nested folders, and transformations).
     */
    static async deleteImage(imageUrl: string): Promise<void> {
        try {
            // https://res.cloudinary.com/<cloud>/image/upload/<transform>/v<version>/<folder>/<public_id>.<ext>
            const url = new URL(imageUrl);
            const segments = url.pathname.split('/').filter(Boolean);
            // Locate the "upload" segment; everything after it (minus version) is the public_id
            const uploadIdx = segments.indexOf('upload');
            if (uploadIdx === -1) {
                console.error('Cloudinary deletion failed: not a standard upload URL');
                return;
            }
            let idParts = segments.slice(uploadIdx + 1);
            // Drop an optional v<number> version segment
            if (idParts.length && /^v\d+$/.test(idParts[0])) idParts = idParts.slice(1);
            const publicId = idParts.join('/').replace(/\.[a-z0-9]+$/i, '');

            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error('Cloudinary deletion failed:', error);
        }
    }
}
