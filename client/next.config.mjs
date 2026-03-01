/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@dfd/shared'],
    images: {
        loader: 'custom',
        loaderFile: './src/lib/cloudinaryLoader.js',
    }
};

export default nextConfig;
