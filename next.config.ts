import type { NextConfig } from "next";

// Restart trigger: 1
const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  experimental: {
  },
};

export default nextConfig;
