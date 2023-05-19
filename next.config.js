// NOTE: /authorize endpoint is processed in this app, so there's no routing
const OIDC_ROUTES = [
  "/token",
  "/userinfo",
  "/register",
  "/.well-known/openid-configuration",
  "/jwks.json",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      ...OIDC_ROUTES.map((route) => ({
        source: route,
        destination: "/oidc-route",
      })),
    ];
  },
  async redirects() {
    return [
      {
        source: "/",
        permanent: false,
        destination: "https://docs.worldcoin.org", // move to World ID docs
      },
    ];
  },
};

module.exports = nextConfig;
