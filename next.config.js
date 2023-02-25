/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/authorize",
        destination: "/api/authorize",
      },
    ];
  },
};

module.exports = nextConfig;
