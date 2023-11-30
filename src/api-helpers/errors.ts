import "server-only";
import { NextResponse } from "next/server";

export enum OIDCErrorCodes {
  ServerError = "server_error",
  InvalidRequest = "invalid_request",
}

export function errorOIDCResponse(
  statusCode: number,
  code: string,
  detail: string = "Something went wrong",
  attribute: string | null = null
): NextResponse {
  return NextResponse.json(
    {
      code,
      detail,
      attribute,
      error: code, // OAuth 2.0 spec
      error_description: detail, // OAuth 2.0 spec
    },
    { status: statusCode }
  );
}

export function errorNotAllowed(method: string = ""): NextResponse {
  return errorOIDCResponse(
    405,
    "method_not_allowed",
    `HTTP method '${method}' is not allowed for this endpoint.`
  );
}

export function errorRequiredAttribute(attribute: string): NextResponse {
  return errorOIDCResponse(
    400,
    "required",
    `This attribute is required: ${attribute}.`,
    attribute
  );
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

  return NextResponse.redirect(
    new URL(`/error?${params.toString()}`, baseUrl),
    { status: 302 }
  );
}
