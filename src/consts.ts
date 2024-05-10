export const DEVELOPER_PORTAL =
  process.env.NEXT_PUBLIC_DEVELOPER_PORTAL ??
  process.env.NEXT_PUBLIC_ENV === "staging"
    ? "https://staging.developer.worldcoin.org"
    : "https://developer.worldcoin.org";

// ANCHOR: OIDC Base URL
export const OIDC_BASE_URL =
  process.env.NEXT_PUBLIC_URL ?? process.env.NEXT_PUBLIC_ENV === "staging"
    ? "https://staging.id.worldcoin.org"
    : "https://id.worldcoin.org";

// ANCHOR: JWT Issuer
export const JWT_ISSUER =
  process.env.NEXT_PUBLIC_JWT_ISSUER ?? "https://id.worldcoin.org";
