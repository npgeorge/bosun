import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false, // Remove X-Powered-By header for security
  compress: true,

  // Image optimization (if needed in future)
  images: {
    domains: [], // Add allowed image domains here
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
