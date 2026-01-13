import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
    // @ts-ignore
    outputFileTracingIncludes: {
      '/api/**/*': ['./prisma/dev.db'],
      '/login': ['./prisma/dev.db'],
    },
  },
};

export default nextConfig;
