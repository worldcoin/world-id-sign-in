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
  async redirects() {
    return [
      {
        source: "/",
        destination: "https://docs.worldcoin.org", // move to World ID landing page
      },
    ];
  },
};

module.exports = nextConfig;
