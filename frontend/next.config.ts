import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  async rewrites() {
    // When BACKEND_URL is set (real deployment), proxy to Go backend.
    // When not set, requests fall through to the Next.js mock API routes.
    if (!process.env.BACKEND_URL) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
