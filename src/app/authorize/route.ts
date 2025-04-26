import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEVELOPER_PORTAL } from "@/consts";
import { ValidationMessage, OIDCFlowType, OIDCScope } from "@/types";
import { errorValidationClient } from "@/api-helpers/errors";
import * as yup from "yup";
import { checkFlowType, validateRequestSchema } from "@/api-helpers/utils";
import { OIDCResponseModeValidation } from "@/api-helpers/validation";
import { internalRedirect } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SUPPORTED_SCOPES = [OIDCScope.OpenID, OIDCScope.Profile, OIDCScope.Email];

const schema = yup.object({
  response_type: yup
    .string()
    .strict()
    .required(ValidationMessage.Required)
    .test({
      name: "is-valid-response-type",
      message: "Invalid response type.",
      test: (value) => {
        const response_types = decodeURIComponent(value) as ResponseType;

        if (!checkFlowType(response_types)) {
          return false;
        }

        return true;
      },
    }),
  client_id: yup.string().strict().required(ValidationMessage.Required),
  redirect_uri: yup.string().strict().required(ValidationMessage.Required),
  scope: yup
    .string()
    .strict()
    .required(ValidationMessage.Required)
    .test({
      name: "is-valid-scope",
      message: "The requested scope is invalid, unknown, or malformed.",
      test: (value) => {
        if (!value.includes(OIDCScope.OpenID)) {
          return false;
        }

        const scopes = decodeURIComponent(value).split(" ") as OIDCScope[];

        for (const scope of scopes) {
          if (!SUPPORTED_SCOPES.includes(scope)) {
            return false;
          }
        }

        return true;
      },
    }),
  state: yup.string(),
  nonce: yup
    .string()
    .ensure()
    .when("response_type", {
      // NOTE: we only require a nonce for the implicit flow
      is: (value: string) =>
        checkFlowType(decodeURIComponent(value)) === OIDCFlowType.Implicit,
      then: (field) => field.required(ValidationMessage.Required),
    }),
  response_mode: OIDCResponseModeValidation,
  code_challenge: yup.string().when("code_challenge_method", {
    is: (value: string) => Boolean(value),
    then: (field) =>
      field.required(
        "This attribute is required when code_challenge_method is provided (PKCE)."
      ),
  }),
  code_challenge_method: yup.string(),
});

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  if (
    new URL(req.url).pathname === "/authorize" && // exclude authorize-web
    req.headers.get("user-agent")?.includes("Mobile") &&
    (req.headers.get("user-agent")?.includes("iPhone") ||
      req.headers.get("user-agent")?.includes("Android"))
  ) {
    return NextResponse.redirect("https://worldcoin.org/download?worldid=true");
  }

  const { parsedParams, isValid, errorResponse } = await validateRequestSchema({
    schema,
    req,
    bodySource: "query",
  });

  if (!isValid) {
    return errorResponse;
  }

  const {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    nonce,
    response_mode,
    code_challenge,
    code_challenge_method,
  } = parsedParams;

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

  if (code_challenge && code_challenge_method !== "S256") {
    return errorValidationClient(
      "invalid_request",
      `Invalid code_challenge_method: ${code_challenge_method}.`,
      "code_challenge_method",
      req.url
    );
  }

  const params = new URLSearchParams({
    response_type,
    response_mode,
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

  if (code_challenge) {
    params.append("code_challenge", code_challenge.toString());
  }

  if (code_challenge_method) {
    params.append("code_challenge_method", code_challenge_method.toString());
  }

  return internalRedirect(`/login?${params.toString()}`, req.url);
};
