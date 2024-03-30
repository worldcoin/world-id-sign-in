import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEVELOPER_PORTAL } from "@/consts";

const SPECIAL_MAPPING: Record<string, string> = {
  "/jwks.json": "/api/v1/jwks",
};

/// Routes OIDC requests to the Developer Portal
const handlerOIDCRoute = async (req: NextRequest): Promise<NextResponse> => {
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

  let body: URLSearchParams | string | undefined;

  if (
    req.body &&
    req.headers
      .get("content-type")
      ?.startsWith("application/x-www-form-urlencoded")
  ) {
    body = new URLSearchParams(await req.text());
  } else if (req.headers.get("content-type") === "application/json") {
    body = JSON.stringify(await req.json());
  }

  const response = await fetch(destUrl, {
    headers,
    method: req.method,
    body: req.method === "POST" ? body : undefined,
  });

  if (response.status === 404) {
    return NextResponse.json({ code: "not_found" }, { status: 404 });
  }

  if (response.status === 429) {
    console.warn("Received 429 response from Developer Portal", req.url);
    return NextResponse.json({ code: "rate_limit" }, { status: 429 });
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

export const GET = handlerOIDCRoute;
export const POST = handlerOIDCRoute;
