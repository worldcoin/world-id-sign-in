import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEVELOPER_PORTAL } from "@/consts";

const SPECIAL_MAPPING: Record<string, string> = {
  "/jwks.json": "/api/v1/jwks",
  "/.well-known/openid-configuration": "/api/v1/oidc/openid-configuration",
};

/// Routes OIDC requests to the Developer Portal
const handler = async (req: NextRequest): Promise<NextResponse> => {
  const path = req.nextUrl.pathname;
  if (!path || path === "/oidc-route") {
    return NextResponse.json({ code: "not_found" }, { status: 404 });
  }

  const destUrl = new URL(
    path in SPECIAL_MAPPING
      ? `${DEVELOPER_PORTAL}${SPECIAL_MAPPING[path]}`
      : `${DEVELOPER_PORTAL}/api/v1/oidc${path}`
  );

  destUrl.search = req.nextUrl.searchParams.toString();

  const headers = new Headers({
    "Content-Type": req.headers.get("content-type") || "application/json",
  });

  if (req.headers.has("authorization")) {
    headers.append("Authorization", req.headers.get("authorization")!);
  }

  const body =
    req.headers.get("content-type") === "application/x-www-form-urlencoded"
      ? new URLSearchParams(await req.json())
      : JSON.stringify(req.body);

  const response = await fetch(destUrl, {
    headers,
    method: req.method,
    body: req.method === "POST" ? body : undefined,
  });

  console.log(req.method, destUrl, response.status);

  if (response.status === 404) {
    return NextResponse.json({ code: "not_found" }, { status: 404 });
  }

  if (response.status >= 500) {
    console.error(
      `Received 500+ response from Developer Portal`,
      req.url,
      response.status
    );
    console.error(await response.text());

    return NextResponse.json(
      {
        code: "server_error",
        message: "Internal server error. Please try again.",
      },
      { status: 500 }
    );
  }

  const responseHeaders = new Headers();

  // ANCHOR: Passthrough CORS headers
  const corsOrigin = response.headers.get("allow-control-allow-origin");
  const corsMethods = response.headers.get("allow-control-allow-methods");
  const corsHeaders = response.headers.get("allow-control-allow-headers");

  if (corsOrigin) {
    responseHeaders.append("Access-Control-Allow-Origin", corsOrigin);
  }
  if (corsMethods) {
    responseHeaders.append("Access-Control-Allow-Methods", corsMethods);
  }

  if (corsHeaders) {
    responseHeaders.append("Access-Control-Allow-Headers", corsHeaders);
  }

  return NextResponse.json(await response.json(), {
    headers: responseHeaders,
    status: response.status,
  });
};

export const GET = handler;
export const POST = handler;
