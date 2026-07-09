// D:/socialadify/frontend/next.config.ts
import { NextConfig } from 'next';
import { Configuration } from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // This configuration is necessary to allow the Next.js Image component
  // to load images from your external backend server.
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/static/**', // Allows any image path under /static/
      },
      // This pattern is for placeholder images, which is good practice.
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // This webpack configuration is essential for packages that have
  // server-side dependencies (like 'canvas') to work correctly in a client-side environment.
  webpack: (config: Configuration, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      // This tells Next.js not to bundle the 'canvas' library on the client-side,
      // preventing potential browser-related errors.
      if (!config.externals) {
        config.externals = [];
      }
      config.externals.push('canvas');
    }
    return config;
  },
};

export default nextConfig;

