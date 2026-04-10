import type {NextConfig} from 'next';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from src/.env
dotenv.config({ path: path.resolve(process.cwd(), 'src/.env') });

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
      protocol: 'https',
      hostname: 'firebasestorage.googleapis.com',
      pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
