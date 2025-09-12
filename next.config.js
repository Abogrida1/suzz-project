/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove standalone output that might cause issues
  poweredByHeader: false,
  compress: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Force server to bind to 0.0.0.0
  async rewrites() {
    return []
  },
}

module.exports = nextConfig