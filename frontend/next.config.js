/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_API_URL: 'https://career-os-backend-production.up.railway.app/api'
  }
}
module.exports = nextConfig
