import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEVELOPER_PORTAL } from "@/consts";
import * as yup from "yup";
import { validateRequestSchema } from "@/api-helpers/utils";
import { ValidationMessage } from "@/types";

const schema = yup.object({
  proof: yup.string().required(ValidationMessage.Required),
  nullifier_hash: yup.string().required(ValidationMessage.Required),
  merkle_root: yup.string().required(ValidationMessage.Required),
  credential_type: yup.string().required(ValidationMessage.Required),
  client_id: yup.string().required(ValidationMessage.Required),
  nonce: yup.string().required(ValidationMessage.Required), // NOTE: While technically not required by the OIDC spec, we require it as a security best practice
  scope: yup.string().required("The openid scope is always required."), // NOTE: Content verified in the Developer Portal
  state: yup.string(),
  response_type: yup.string().required(ValidationMessage.Required), // NOTE: Content verified in the Developer Portal
  redirect_uri: yup.string().required(ValidationMessage.Required), // NOTE: Content verified in the Developer Portal
});

/**
 * Receives the ZKP from the frontend, verifies with Developer Portal and redirects the user.
 * NOTE: This is an app internal endpoint (i.e. not called directly from other apps)
 * @param req
 * @param res
 * @returns
 */
export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const { parsedParams, isValid, errorResponse } = await validateRequestSchema({
    schema,
    req,
    bodySource: "formData",
  });

  if (!isValid) {
    return errorResponse;
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
  } = parsedParams;

  const response = await fetch(`${DEVELOPER_PORTAL}/api/v1/oidc/authorize`, {
    method: "POST",
    headers: new Headers({ "content-type": "application/json" }),
    body: JSON.stringify({
      response_type,
      app_id: client_id,
      redirect_uri,
      signal: nonce,
      merkle_root,
      proof,
      credential_type,
      nullifier_hash,
      scope,
    }),
  });

  if (!response.ok) {
    let errorResponse;
    let responseClone = response.clone();
    try {
      errorResponse = await response.json();
    } catch {
      errorResponse = await responseClone.text();
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
      scope,
    });

    if (state) searchParams.append("state", state.toString());
    if (nonce) searchParams.append("nonce", nonce.toString());

    return NextResponse.redirect(
      new URL(`/error?${searchParams.toString()}`, req.url),
      { status: 302 }
    );
  }

  const responseAuth = await response.json();

  const url = new URL(redirect_uri!.toString());
  if (responseAuth.code) url.searchParams.append("code", responseAuth.code);
  if (responseAuth.token) url.searchParams.append("token", responseAuth.token);
  if (responseAuth.id_token)
    url.searchParams.append("id_token", responseAuth.id_token);

  // FIXME: pass `state` in a secure cookie (signed) from original request to prevent tampering
  if (state) url.searchParams.append("state", state.toString());

  return NextResponse.redirect(url, { status: 302 });
};
