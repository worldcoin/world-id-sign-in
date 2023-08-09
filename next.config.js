/** @type {import('next-safe').nextSafe} */
const nextSafe = require("next-safe");

const isDev = process.env.NODE_ENV !== "production";

// NOTE: /authorize endpoint is processed in this app, so there's no routing
const OIDC_ROUTES = [
  "/token",
  "/userinfo",
  "/introspect",
  "/register",
  "/.well-known/openid-configuration",
  "/jwks.json",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: nextSafe({
          isDev,
          contentSecurityPolicy: {
            mergeDefaultDirectives: true,
            "img-src": [
              "'self'",
              "https://world-id-public.s3.amazonaws.com",
              "https://worldcoin.org",
            ],
            "style-src": ["'self'", "'unsafe-inline'"],
            "prefetch-src": false,
            "connect-src": ["'self'", "https://app.posthog.com"],

            "script-src": ["'self'", "'unsafe-hashes'", "'unsafe-inline'"],
            "font-src": ["'self'", "https://world-id-public.s3.amazonaws.com"],
          },
        }),
      },
    ];
  },

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
