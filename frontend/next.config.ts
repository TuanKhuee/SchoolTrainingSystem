import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL ||
      (process.env.NODE_ENV === 'production' ? 'http://backend:8080/api' : 'http://localhost:5000/api');

    console.log(`[Next.js] Rewrite rule detected. Backend URL: ${backendUrl}`);
    console.log(`[Next.js] Env NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`[Next.js] Env BACKEND_INTERNAL_URL: ${process.env.BACKEND_INTERNAL_URL}`);

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
