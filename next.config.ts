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
