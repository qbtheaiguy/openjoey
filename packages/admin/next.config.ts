import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {}, // Use default Turbopack config
  webpack: (config, { dev, isServer }) => {
    // Fix Chrome extension conflicts
    if (dev && !isServer) {
      config.externals = {
        ...config.externals,
        "chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/scripts/lib/inpage.js": "null",
      };
    }

    // Ignore Chrome extension errors
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
};

export default nextConfig;
