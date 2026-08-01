import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWAInit = require("next-pwa");

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true
});

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'bngrqgfkfvkivnuvqpsd.supabase.co',
      }
    ],
  },
  async rewrites() {
    // If BACKEND_URL is set, use it. Otherwise fallback to NEXT_PUBLIC_API_URL, or localhost for local dev.
    const destination = process.env.BACKEND_URL 
      || process.env.NEXT_PUBLIC_API_URL 
      || 'http://localhost:5000/api';
      
    // Strip trailing /api if it exists so we can append /api/:path*
    const baseUrl = destination.replace(/\/api\/?$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${baseUrl}/api/:path*`, // Proxy to Backend
      },
    ];
  },
};

export default withPWA(nextConfig);
