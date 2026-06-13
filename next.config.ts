import type { NextConfig } from "next";

const apiImageOrigin = (() => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return null;
  try {
    return new URL(baseUrl).origin;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "react-icons", "recharts", "motion"],
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Project-Creator",
            value: "Randhu Paksi Membumi - Creator & Lead Fullstack Developer",
          },
          {
            key: "X-Project-Team",
            value: "RBAR Team",
          },
          {
            key: "X-Project-Copyright",
            value: "Copyright 2026 RBAR Team. All rights reserved.",
          },
        ],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      ...(apiImageOrigin
        ? [
            {
              protocol: new URL(apiImageOrigin).protocol.replace(":", "") as "http" | "https",
              hostname: new URL(apiImageOrigin).hostname,
              port: new URL(apiImageOrigin).port,
              pathname: "/uploads/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
