export default function cloudinaryLoader({ src, width, quality }) {
    // If it's already a full URL, we extract the public ID part to apply transformations
    // or just return it if it's not a Cloudinary URL we can handle easily.
    let publicId = src;
    if (src.includes('res.cloudinary.com')) {
        const parts = src.split('/');
        // Cloudinary URL format: .../upload/v12345/folder/public_id.jpg
        // We want everything after /upload/ (excluding the version part if possible)
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex !== -1) {
            // Join everything after /upload/, but strip the version (v123456) if present
            publicId = parts.slice(uploadIndex + 1).filter(p => !p.startsWith('v')).join('/');
        }
    }

    const params = ['f_auto', 'c_limit', `w_${width}`, `q_${quality || 'auto'}`];
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'db0u0ul3e';
    
    return `https://res.cloudinary.com/${cloudName}/image/upload/${params.join(',')}/${publicId}`;
}
