import { DEVELOPER_PORTAL } from "@/consts";
import { NextApiRequest, NextApiResponse } from "next";

const SPECIAL_MAPPING: Record<string, string> = {
  "/jwks.json": "/api/v1/jwks",
  "/.well-known/openid-configuration": "/api/v1/oidc/openid-configuration",
};

/**
 * Routes OIDC requests to the Developer Portal
 * @param req
 * @param res
 * @returns
 */
export default async function handleRouter(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const target = req.url;

  if (!target || target === "/router") {
    return res.status(404).end();
  }

  const destUrl = new URL(
    target in SPECIAL_MAPPING
      ? `${DEVELOPER_PORTAL}${SPECIAL_MAPPING[target]}`
      : `${DEVELOPER_PORTAL}/api/v1/oidc${target}`
  );

  destUrl.search = new URLSearchParams(
    req.query as Record<string, string>
  ).toString();

  const headers = new Headers({
    "Content-Type": req.headers["content-type"] || "application/json",
  });

  if (req.headers.authorization) {
    headers.append("Authorization", req.headers.authorization);
  }

  const body =
    req.headers["content-type"] === "application/x-www-form-urlencoded"
      ? new URLSearchParams(req.body)
      : JSON.stringify(req.body);

  const response = await fetch(destUrl, {
    method: req.method,
    headers,
    body: req.method === "POST" ? body : undefined,
  });

  if (response.status === 404) {
    return res.status(404).end();
  }

  if (response.status >= 500) {
    console.error(
      `Received 500+ response from Developer Portal`,
      target,
      response.status
    );
    console.error(await response.text());
    return res.status(500).json({
      code: "server_error",
      message: "Internal server error. Please try again.",
    });
  }

  const corsOrigin = response.headers.get("allow-control-allow-origin");
  const corsMethods = response.headers.get("allow-control-allow-methods");
  const corsHeaders = response.headers.get("allow-control-allow-headers");

  if (corsOrigin) {
    res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  }

  if (corsMethods) {
    res.setHeader("Access-Control-Allow-Methods", corsMethods);
  }

  if (corsHeaders) {
    res.setHeader("Access-Control-Allow-Headers", corsHeaders);
  }

  res.status(response.status).json(await response.json());
}
