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
                // In production, proxy to the deployed AgentsProxy. In development, proxy to the local AgentsProxy.
                destination: process.env.NODE_ENV === 'production'
                    ? 'https://agents-proxy-nine.vercel.app/api/v1/:path*'
                    : 'http://localhost:8080/api/v1/:path*',
            },
        ];
    },
};

export default nextConfig;
