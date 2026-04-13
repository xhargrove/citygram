import type { NextConfig } from "next";

function supabaseImagePattern() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];
  try {
    const host = new URL(raw).hostname;
    return [
      {
        protocol: "https" as const,
        hostname: host,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseImagePattern(),
  },
  // Headroom for non-create server actions; create-post media no longer goes through Server Actions.
  experimental: {
    serverActions: {
      bodySizeLimit: "55mb",
    },
  },
  // Dev-only: avoid webpack persistent-cache pack renames under `.next/cache/webpack/*` (ENOENT on
  // rename is common on macOS when the cache is busy). Memory cache is slightly less incremental I/O.
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
