"use server";
/**
 * Authenticates a user to Sign in with Worldcoin using a World ID ZKP.
 */
import * as yup from "yup";
import { ValidationMessage } from "@/types";
import { OIDCResponseModeValidation } from "@/api-helpers/validation";
import { DEVELOPER_PORTAL } from "@/consts";

export const authenticateSchema = yup.object({
  proof: yup.string().required(ValidationMessage.Required),
  nullifier_hash: yup.string().required(ValidationMessage.Required),
  merkle_root: yup.string().required(ValidationMessage.Required),
  credential_type: yup.string().required(ValidationMessage.Required),
  client_id: yup.string().required(ValidationMessage.Required),
  nonce: yup.string().required(ValidationMessage.Required), // NOTE: While technically not required by the OIDC spec, we require it as a security best practice
  scope: yup.string().required("The openid scope is always required."), // NOTE: Content verified in the Developer Portal
  state: yup.string(),
  response_type: yup.string().required(ValidationMessage.Required), // NOTE: Content verified in the Developer Portal
  response_mode: OIDCResponseModeValidation,
  redirect_uri: yup.string().required(ValidationMessage.Required), // NOTE: Content verified in the Developer Portal
  code_challenge: yup.string(), // NOTE: Content verified in the Developer Portal
  code_challenge_method: yup.string(), // NOTE: Content verified in the Developer Portal
});

interface ISuccessResponse {
  success: true;
  redirect_uri: string;
  url_params: URLSearchParams;
}

interface IErrorResponse {
  success: false;
  code: string;
  detail: string;
}

export const authenticate = async (
  params: yup.InferType<typeof authenticateSchema>
): Promise<ISuccessResponse | IErrorResponse> => {
  const {
    state,
    response_type,
    response_mode,
    client_id,
    redirect_uri,
    nonce,
    proof,
    scope,
    merkle_root,
    nullifier_hash,
    credential_type,
    code_challenge,
    code_challenge_method,
  } = params;

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

    // FIXME: Check for state & redirect_uri
    return {
      success: false,
      code: "authentication_failed",
      detail,
    };
  }

  const responseAuth = await response.json();

  let url_params = new URLSearchParams();
  if (responseAuth.code) {
    url_params.append("code", responseAuth.code);
  }

  if (responseAuth.token) {
    url_params.append("token", responseAuth.token);
  }

  if (responseAuth.id_token) {
    url_params.append("id_token", responseAuth.id_token);
  }

  if (state) {
    url_params.append("state", state.toString());
  }

  return { success: true, redirect_uri, url_params };
};
