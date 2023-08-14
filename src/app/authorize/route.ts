import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEVELOPER_PORTAL } from "@/consts";
import { OIDCResponseMode, OIDCResponseType } from "@/types";
import { errorValidationClient } from "@/api-helpers/errors";

const SUPPORTED_SCOPES = ["openid", "profile", "email"];

// FIXME: should we add a CSRF token to the request?
export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const inputParams = Object.fromEntries(req.nextUrl.searchParams.entries());

  for (const attr of ["response_type", "client_id", "redirect_uri"]) {
    if (!inputParams[attr]) {
      return errorValidationClient(
        "invalid_request",
        "This attribute is required.",
        attr,
        req.url
      );
    }
  }

  const {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    nonce,
    response_mode,
  } = inputParams;

  let url: URL | undefined;
  try {
    url = new URL(redirect_uri);
  } catch (err) {}

  if (!url) {
    return errorValidationClient(
      "invalid_request",
      "The redirect URI provided is missing or malformed.",
      "redirect_uri",
      req.url
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
      body: JSON.stringify({ app_id: client_id, redirect_uri }),
    }
  );

  if (!validateResponse.ok) {
    let errorDetails: Record<string, any> = {};
    try {
      errorDetails = await validateResponse.json();
    } catch (e) {
      console.error(
        `Error parsing response from Developer Portal (${validateResponse.status})`,
        e
      );
    }

    if (errorDetails.code === "not_found") {
      return errorValidationClient(
        "invalid_client_id",
        "Invalid client ID. Is your app registered in the Developer Portal? Please review and try again.",
        "client_id",
        req.url
      );
    }

    return errorValidationClient(
      errorDetails.code ?? "validation_error",
      errorDetails.detail ?? "Invalid request. Please review and try again.",
      errorDetails.attribute === "app_id"
        ? "client_id"
        : errorDetails.attribute,
      req.url
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
          req.url
        );
      }
    }
  }

  const responseTypesRaw = decodeURIComponent(
    (response_type as string | string[]).toString()
  ).split(" ");

  const responseTypes = responseTypesRaw.map((responseType) => {
    if (!Object.keys(OIDCResponseType).includes(responseType)) {
      return errorValidationClient(
        "invalid_request",
        `Invalid response type: ${response_type}.`,
        "response_type",
        req.url
      );
    } else {
      return responseType as OIDCResponseType;
    }
  });

  let responseMode: OIDCResponseMode;
  if (response_mode) {
    if (!Object.keys(OIDCResponseMode).includes(response_mode as string)) {
      return errorValidationClient(
        "invalid_request",
        `Invalid response mode: ${response_mode}.`,
        "response_mode",
        req.url
      );
    } else {
      responseMode = response_mode as OIDCResponseMode;
      // Per https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#toc, section 3
      if (
        responseMode === OIDCResponseMode.Query &&
        responseTypes.includes(OIDCResponseType.IdToken)
      ) {
        return errorValidationClient(
          "invalid",
          `Invalid response mode: ${response_mode}. For response type ${response_type}, only fragment is supported.`,
          "response_mode",
          req.url
        );
      }

      //  Per https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#toc section 5, first statement
      if (
        responseMode === OIDCResponseMode.Query &&
        responseTypes.includes(OIDCResponseType.Code) &&
        responseTypes.includes(OIDCResponseType.Token)
      ) {
        return errorValidationClient(
          "invalid",
          `Invalid response mode: ${response_mode}. For response type ${response_type}, only fragment is supported.`,
          "response_mode",
          req.url
        );
      }

      // To avoid potential access token leakage, we only allow form_post response mode for id_token token response type
      if (
        responseTypes.includes(OIDCResponseType.IdToken) &&
        responseTypes.includes(OIDCResponseType.Token) &&
        response_mode !== OIDCResponseMode.FormPost
      ) {
        return errorValidationClient(
          "invalid",
          "For response type 'id_token token', only 'form_post' response mode is allowed.",
          "response_mode",
          req.url
        );
      }
    }
  } else {
    switch (response_type) {
      case OIDCResponseType.Code:
        responseMode = OIDCResponseMode.Query;
        break;
      default:
        responseMode = OIDCResponseMode.Fragment;
    }
  }

  const params = new URLSearchParams({
    response_type,
    response_mode: responseMode,
    client_id,
    redirect_uri,
    nonce: nonce || new Date().getTime().toString(), // NOTE: given the nature of our proofs, if a nonce is not passed, we generate one
    // TODO: should enforce one time use for nonces
    ready: "true", // for UX purposes, to avoid users getting to the login page without verifying their request
  });

  if (scope) params.append("scope", scope.toString());
  if (state) params.append("state", state.toString());

  return NextResponse.redirect(new URL(`/login?${params.toString()}`, req.url));
};
