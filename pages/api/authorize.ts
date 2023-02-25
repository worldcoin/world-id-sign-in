import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorValidation,
} from "@/api-helpers/errors";
import { OIDCResponseTypeMapping } from "@/types";
import type { NextApiRequest, NextApiResponse } from "next";

const SUPPORTED_SCOPES = ["openid"];

/**
 * Receives an authorization request from a third-party app and renders the authentication page
 * @param req
 * @param res
 * @returns
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ANCHOR: Verify the request is valid
  if (!["POST", "GET"].includes(req.method!)) {
    return errorNotAllowed(req.method, res);
  }

  for (const attr of ["response_type", "client_id", "redirect_uri"]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res);
    }
  }

  const { response_type, client_id, redirect_uri, scope, state, nonce } =
    req.body;

  // FIXME: Verify the client_id & redirect_uri

  try {
    const url = new URL(redirect_uri);
    if (url.protocol !== "https:") {
      return errorValidation(
        "invalid_request",
        "The redirect URI must be served over HTTPs.",
        "redirect_uri",
        res
      );
    }
  } catch (err) {
    return errorValidation(
      "invalid_request",
      "The redirect URI provided is missing or malformed.",
      "redirect_uri",
      res
    );
  }

  if (scope) {
    const scopes = decodeURIComponent((scope as any).toString()).split(" ");
    for (const _scope of scopes) {
      if (!SUPPORTED_SCOPES.includes(_scope)) {
        return errorValidation(
          "invalid_scope",
          "The requested scope is invalid, unknown, or malformed",
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
      return errorValidation(
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
    scope,
    state,
    nonce: nonce || new Date().getTime().toString(), // NOTE: given the nature of our proofs, if a nonce is not passed, we generate one
    // TODO: should enforce one time use for nonces
    ready: "true", // for UX purposes, to avoid users getting to the login page without verifying their request
  });

  res.redirect(`/login?${params.toString()}`);
}
