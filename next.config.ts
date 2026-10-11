import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "http", hostname: "172.16.50.7" },
      { protocol: "http", hostname: "172.16.50.8" },
      { protocol: "http", hostname: "172.16.50.10" },
      { protocol: "http", hostname: "172.16.50.12" },
      { protocol: "http", hostname: "172.16.50.14" }
    ],
  },
  allowedDevOrigins: ["192.168.10.112", "localhost", "127.0.0.1"],
};

export default nextConfig;
