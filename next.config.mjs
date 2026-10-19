/** @type {import('next').NextConfig} */
const apiTarget =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  'https://api.lanka-offers.me'

const nextConfig = {
  // The e2e suite builds into its own directory so it never disturbs a dev build.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget.replace(/\/+$/, '')}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
