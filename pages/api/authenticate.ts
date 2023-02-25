import { errorNotAllowed, errorRequiredAttribute } from "@/api-helpers/errors";
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
    if (!req.body[attr]) {
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
  } = req.query;

  const response = await fetch(
    "https://developer.worldcoin.org/api/v1/oidc/authorize",
    {
      method: "POST",
      headers: new Headers({ "content-type": "application/json" }),
      body: JSON.stringify(filteredParams),
    }
  );

  // Request was valid, return the auth code to the redirect_uri
  if (response.ok) {
    const code = await response.json();
    console.log(code); // DEBUG

    res.redirect(
      302,
      `${req.body.redirect_uri}?code=${code.code}&state=${req.body.state}`
    );
  }

  // Request was invalid, re-prompt the user to authenticate
  res.status(500).json({ code: "error" });
}
