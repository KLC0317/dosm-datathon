/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    const apiBase = process.env.API_INTERNAL_URL || 'http://127.0.0.1:8000'
    return [{ source: '/api/:path*', destination: `${apiBase}/api/:path*` }]
  },
}

export default nextConfig
