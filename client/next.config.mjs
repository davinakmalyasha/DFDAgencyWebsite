/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@dfd/shared'],
    images: {
        loader: 'custom',
        loaderFile: './src/lib/cloudinaryLoader.js',
    },
    async rewrites() {
        return [
            {
                source: '/api/v1/:path*',
                // In production, proxy to Railway. In development, proxy to local Express.
                destination: process.env.NODE_ENV === 'production' 
                    ? 'https://dfdagencywebsite-production.up.railway.app/api/v1/:path*'
                    : 'http://localhost:5000/api/v1/:path*',
            },
        ];
    },
};

export default nextConfig;
