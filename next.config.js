/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  },
  // Ensure server runs on all interfaces
  async rewrites() {
    return []
  },
}

module.exports = nextConfig