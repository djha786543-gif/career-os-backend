/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://career-os-portal-production.up.railway.app'}/api/:path*`
      }
    ];
  }
};
module.exports = nextConfig;
