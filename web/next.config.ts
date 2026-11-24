import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "6mb" }, // העלאת תמונות מוצר
  },
};

export default nextConfig;
