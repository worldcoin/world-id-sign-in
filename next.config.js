// NOTE: /authorize endpoint is processed in this app, so there's no routing
const OIDC_ROUTES = [
  "/token",
  "/userinfo",
  "/introspect",
  "/.well-known/openid-configuration",
  "/jwks.json",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        "utf-8-validate": "utf-8-validate",
        bufferutil: "bufferutil",
      });
      // NOTE: enables server-side source maps for debugging
      config.devtool = "source-map";
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
