import { errorNotAllowed, errorValidationClient } from "@/api-helpers/errors";
import { DEVELOPER_PORTAL } from "@/consts";
import { OIDCResponseTypeMapping } from "@/types";
import type { NextApiRequest, NextApiResponse } from "next";

const SUPPORTED_SCOPES = ["openid", "profile", "email"];

/**
 * Receives an authorization request from a third-party app and renders the authentication page
 * @param req
 * @param res
 * @returns
 */

// FIXME: should we add a CSRF token to the request?
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ANCHOR: Verify the request is valid
  if (!["POST", "GET"].includes(req.method!)) {
    return errorNotAllowed(req.method, res);
  }

  const inputParams = { ...req.body, ...req.query };

  for (const attr of ["response_type", "client_id", "redirect_uri"]) {
    if (!inputParams[attr]) {
      return errorValidationClient(
        "invalid_request",
        "This attribute is required.",
        attr,
        res
      );
    }
  }

  const { response_type, client_id, redirect_uri, scope, state, nonce } =
    inputParams;

  let url: URL | undefined;
  try {
    url = new URL(redirect_uri);
  } catch (err) {}

  if (!url) {
    return errorValidationClient(
      "invalid_request",
      "The redirect URI provided is missing or malformed.",
      "redirect_uri",
      res
    );
  }

  // ANCHOR: Verify the client id & redirect URI are valid
  const validateResponse = await fetch(
    `${DEVELOPER_PORTAL}/api/v1/oidc/validate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_id: client_id,
        redirect_uri,
      }),
    }
  );

  if (!validateResponse.ok) {
    const errorDetails = await validateResponse.json();
    if (errorDetails.code === "not_found") {
      return errorValidationClient(
        "invalid_client_id",
        "Invalid client ID. Is your app registered in the Developer Portal? Please review and try again.",
        "client_id",
        res
      );
    }
    return errorValidationClient(
      errorDetails.code ?? "validation_error",
      errorDetails.detail ?? "Invalid request. Please review and try again.",
      errorDetails.attribute === "app_id"
        ? "client_id"
        : errorDetails.attribute,
      res
    );
  }

  if (scope) {
    const scopes = decodeURIComponent((scope as any).toString()).split(" ");
    for (const _scope of scopes) {
      if (!SUPPORTED_SCOPES.includes(_scope)) {
        return errorValidationClient(
          "invalid_scope",
          `The requested scope is invalid, unknown, or malformed. ${_scope} is not supported.`,
          "scope",
          res
        );
      }
    }
  }

  const response_types = decodeURIComponent(
    (response_type as string | string[]).toString()
  ).split(" ");

  for (const response_type of response_types) {
    if (!Object.keys(OIDCResponseTypeMapping).includes(response_type)) {
      return errorValidationClient(
        "invalid",
        `Invalid response type: ${response_type}.`,
        "response_type",
        res
      );
    }
  }

  const params = new URLSearchParams({
    response_type,
    client_id,
    redirect_uri,
    nonce: nonce || new Date().getTime().toString(), // NOTE: given the nature of our proofs, if a nonce is not passed, we generate one
    // TODO: should enforce one time use for nonces
    ready: "true", // for UX purposes, to avoid users getting to the login page without verifying their request
  });

  if (scope) {
    params.append("scope", scope.toString());
  }

  if (state) {
    params.append("state", state.toString());
  }

  res.redirect(302, `/login?${params.toString()}`);
}
