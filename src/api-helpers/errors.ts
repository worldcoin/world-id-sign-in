import "server-only";
import { NextResponse } from "next/server";
import { internalRedirect } from "@/lib/utils";
import { OIDCResponseMode } from "@/types";

export enum OIDCErrorCodes {
  InvalidRequest = "invalid_request",
  UnauthorizedClient = "unauthorized_client",
  AccessDenied = "access_denied",
  UnsupportedResponseType = "unsupported_response_type",
  InvalidScope = "invalid_scope",
  ServerError = "server_error",
  TemporarilyUnavailable = "temporarily_unavailable",
  InteractionRequired = "interaction_required",
  LoginRequired = "login_required",
  AccountSelectionRequired = "account_selection_required",
  ConsentRequired = "consent_required",
  RequestNotSupported = "request_not_supported",
  RequestURINotSupported = "request_uri_not_supported",
  RegistrationNotSupported = "registration_not_supported",
}

export function errorOIDCRedirect(
  redirect_uri: string,
  response_mode: OIDCResponseMode,
  error: OIDCErrorCodes,
  state?: string,
  error_description?: string
): NextResponse {
  const url = new URL(redirect_uri);

  if (response_mode === OIDCResponseMode.Query) {
    url.searchParams.append("error", error);
    error_description &&
      url.searchParams.append("error_description", error_description);
    state && url.searchParams.append("state", state);
  } else if (response_mode === OIDCResponseMode.Fragment) {
    const params = new URLSearchParams({
      error,
    });
    error_description && params.append("error_description", error_description);
    state && params.append("state", state);

    url.hash = params.toString();
  } else if (response_mode === OIDCResponseMode.FormPost) {
    // TODO: Implement FormPost response mode for errors
  }

  return NextResponse.redirect(url.toString());
}

/**
 * Sends a client side validation error (i.e. renders frontend)
 */
export function errorValidationClient(
  code: string,
  detail: string = "This attribute is invalid.",
  attribute: string | null,
  baseUrl: string
): NextResponse {
  const params = new URLSearchParams({ code, detail });

  if (attribute) {
    params.append("attribute", attribute);
  }

  return internalRedirect(`/error?${params.toString()}`, baseUrl);
}
