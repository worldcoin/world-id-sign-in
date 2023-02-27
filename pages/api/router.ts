import { DEVELOPER_PORTAL } from "@/consts";
import { NextApiRequest, NextApiResponse } from "next";

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
    target === "/jwks.json"
      ? `${DEVELOPER_PORTAL}/api/v1/jwks`
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

  console.log(req.body);

  const response = await fetch(destUrl, {
    method: req.method,
    headers,
    body: req.method === "POST" ? body : undefined,
  });

  console.log(destUrl);

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
