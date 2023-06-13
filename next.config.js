// NOTE: /authorize endpoint is processed in this app, so there's no routing
const OIDC_ROUTES = ["/token", "/userinfo", "/register", "/introspect"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        "utf-8-validate": "utf-8-validate",
        bufferutil: "bufferutil",
      });
    }
    return config;
  },
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
