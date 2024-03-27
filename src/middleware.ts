import { NextResponse, type NextRequest } from "next/server";
import { DEVELOPER_PORTAL } from "./consts";

const generateCsp = () => {
  const nonce = crypto.randomUUID();

  const csp = [
    { name: "default-src", values: ["'self'"] },
    {
      name: "script-src",
      values: ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"],
    },
    {
      name: "font-src",
      values: ["'self'", "https://world-id-assets.com"],
    },
    {
      name: "style-src",
      values: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
    },
    {
      name: "connect-src",
      values: [
        "'self'",
        "https://app.posthog.com",
        "https://docs.worldcoin.org",
        "https://status.worldcoin.org",
        "https://bridge.worldcoin.org",
        DEVELOPER_PORTAL,
      ],
    },
    {
      name: "img-src",
      values: [
        "'self'",
        "https://worldcoin.org",
        "https://world-id-assets.com",
      ],
    },
  ];

  const cspString = csp
    .map((directive) => {
      return `${directive.name} ${directive.values.join(" ")}`;
    })
    .join("; ");

  return { csp: cspString, nonce };
};

export const middleware = async (request: NextRequest) => {
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const { csp, nonce } = generateCsp();
  const headers = new Headers(request.headers);

  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers } });

  response.headers.set("content-security-policy", csp);

  return response;
};
