import { NextApiResponse } from "next";

export function errorOIDCResponse(
  res: NextApiResponse,
  statusCode: number,
  code: string,
  detail: string = "Something went wrong",
  attribute: string | null = null
): void {
  res.status(statusCode).json({
    code,
    detail,
    attribute,
    error: code, // OAuth 2.0 spec
    error_description: detail, // OAuth 2.0 spec
  });
}

export function errorNotAllowed(
  method: string = "",
  res: NextApiResponse
): void {
  return errorOIDCResponse(
    res,
    405,
    "method_not_allowed",
    `HTTP method '${method}' is not allowed for this endpoint.`
  );
}

export function errorRequiredAttribute(
  attribute: string,
  res: NextApiResponse
): void {
  return errorOIDCResponse(
    res,
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
  res: NextApiResponse
): void {
  const params = new URLSearchParams({ code, detail });
  if (attribute) {
    params.append("attribute", attribute);
  }
  res.redirect(`/error?${params.toString()}`);
}
