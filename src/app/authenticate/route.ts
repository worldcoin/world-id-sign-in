import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEVELOPER_PORTAL } from "@/consts";
import { validateRequestSchema } from "@/api-helpers/utils";
import * as yup from "yup";

const schema = yup.object({
  proof: yup.string().required("This attribute is required."),
  nullifier_hash: yup.string().required("This attribute is required."),
  merkle_root: yup.string().required("This attribute is required."),
  credential_type: yup.string().required("This attribute is required."),
  client_id: yup.string().required("This attribute is required."),
  nonce: yup.string().required("This attribute is required."), // NOTE: While technically not required by the OIDC spec, we require it as a security best practice
  scope: yup.string().required("The openid scope is always required."), // NOTE: Content verified in the Developer Portal
  state: yup.string(),
  response_type: yup.string().required("This attribute is required."), // NOTE: Content verified in the Developer Portal
  redirect_uri: yup.string().required("This attribute is required."), // NOTE: Content verified in the Developer Portal
  code_challenge: yup.string(), // NOTE: Content verified in the Developer Portal
  code_challenge_method: yup.string(), // NOTE: Content verified in the Developer Portal
});
type ParamsType = yup.InferType<typeof schema>;

/**
 * Receives the ZKP from the frontend, verifies with Developer Portal and redirects the user.
 * NOTE: This is an app internal endpoint (i.e. not called directly from other apps)
 * @param req
 * @param res
 * @returns
 */
export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const { parsedParams, isValid, errorResponse } =
    await validateRequestSchema<ParamsType>({
      schema,
      req,
    });

  if (!isValid) {
    return errorResponse;
  }

  const {
    state,
    nonce,
    proof,
    scope,
    client_id,
    merkle_root,
    redirect_uri,
    response_type,
    nullifier_hash,
    code_challenge,
    credential_type,
    code_challenge_method,
  } = parsedParams;

  const response = await fetch(`${DEVELOPER_PORTAL}/api/v1/oidc/authorize`, {
    method: "POST",
    headers: new Headers({ "content-type": "application/json" }),
    body: JSON.stringify({
      proof,
      scope,
      merkle_root,
      redirect_uri,
      response_type,
      signal: nonce,
      nullifier_hash,
      code_challenge,
      credential_type,
      app_id: client_id,
      code_challenge_method,
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
      scope,
      detail,
      client_id,
      redirect_uri,
      response_type,
      code: "authentication_failed",
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
