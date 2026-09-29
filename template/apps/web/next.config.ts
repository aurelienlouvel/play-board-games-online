import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@game/engine"],
  async redirects() {
    return [{ source: "/to-do", destination: "/setup?tab=todo", permanent: false }]
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
}

export default nextConfig
