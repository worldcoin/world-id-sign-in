import { errorNotAllowed, errorRequiredAttribute } from "@/api-helpers/errors";
import { DEVELOPER_PORTAL } from "@/consts";
import type { NextApiRequest, NextApiResponse } from "next";

const params = [
  "response_type",
  "client_id",
  "redirect_uri",
  "nonce",
  "merkle_root",
  "proof",
  "credential_type",
  "nullifier_hash",
];

/**
 * Receives the ZKP from the frontend, verifies with Developer Portal and redirects the user
 * @param req
 * @param res
 * @returns
 */
export default async function handleAuth(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!["GET"].includes(req.method!)) {
    return errorNotAllowed(req.method, res);
  }

  for (const attr of params) {
    if (!req.query[attr]) {
      return errorRequiredAttribute(attr, res);
    }
  }

  const {
    response_type,
    client_id,
    redirect_uri,
    nonce,
    merkle_root,
    proof,
    credential_type,
    nullifier_hash,
    state,
    scope,
  } = req.query as Record<string, string>;

  const response = await fetch(`${DEVELOPER_PORTAL}/api/v1/oidc/authorize`, {
    method: "POST",
    headers: new Headers({ "content-type": "application/json" }),
    body: JSON.stringify({
      response_type,
      app_id: client_id,
      redirect_uri,
      nonce,
      merkle_root,
      proof,
      credential_type,
      nullifier_hash,
      scope,
    }),
  });

  if (!response.ok) {
    let errorResponse;
    try {
      errorResponse = await response.json();
    } catch {
      errorResponse = await response.text();
    }

    console.error(
      `Could not authenticate OIDC user: ${response.statusText}`,
      errorResponse
    );

    const detail = Object.hasOwn(errorResponse, "detail")
      ? errorResponse.detail
      : "We could not complete your authentication. Please try again.";

    const searchParams = new URLSearchParams({
      code: "authentication_failed",
      detail,
      response_type,
      client_id,
      redirect_uri,
    });

    if (state) {
      searchParams.append("state", state.toString());
    }

    if (nonce) {
      searchParams.append("nonce", nonce.toString());
    }

    return res.redirect(`/error?${searchParams.toString()}`);
  }

  const responseAuth = await response.json();

  const url = new URL(redirect_uri!.toString());
  if (responseAuth.code) {
    url.searchParams.append("code", responseAuth.code);
  }

  if (responseAuth.token) {
    url.searchParams.append("token", responseAuth.token);
  }

  if (responseAuth.id_token) {
    url.searchParams.append("id_token", responseAuth.id_token);
  }

  if (state) {
    // FIXME: pass `state` in a secure cookie (signed) from original request to prevent tampering
    url.searchParams.append("state", state.toString());
  }

  res.redirect(302, url.toString());
}
