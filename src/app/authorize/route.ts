import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEVELOPER_PORTAL } from "@/consts";
import {
  OIDCResponseMode,
  OIDCResponseType,
  ValidationMessage,
  OIDCFlowType,
} from "@/types";
import { errorValidationClient } from "@/api-helpers/errors";
import * as yup from "yup";
import { validateRequestSchema } from "@/api-helpers/utils";

enum OIDCScope {
  OpenID = "openid",
  Profile = "profile",
  Email = "email",
}

const SUPPORTED_SCOPES = [OIDCScope.OpenID, OIDCScope.Profile, OIDCScope.Email];

function checkFlowType(responseType: string) {
  const params = responseType.split(" ");

  const includesAll = (requiredParams: string[]): boolean => {
    return requiredParams.every((param) => params.includes(param));
  };

  // NOTE: List of valid response types for the code flow
  // Source: https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowAuth:~:text=Authorization%20Code%20Flow%2C-,this%20value%20is%20code.,-client_id
  if (includesAll([OIDCResponseType.Code])) {
    return OIDCFlowType.AuthorizationCode;
  }

  // NOTE: List of valid response types for the implicit flow
  // Source: https://openid.net/specs/openid-connect-core-1_0.html#ImplicitFlowAuth:~:text=this%20value%20is%20id_token%C2%A0token%20or%20id_token
  if (
    includesAll([OIDCResponseType.Token]) ||
    includesAll([OIDCResponseType.IdToken]) ||
    includesAll([OIDCResponseType.IdToken, OIDCResponseType.Token])
  ) {
    return OIDCFlowType.Implicit;
  }

  // NOTE: List of valid response types for the hybrid flow
  // Source: https://openid.net/specs/openid-connect-core-1_0.html#HybridFlowAuth:~:text=this%20value%20is%20code%C2%A0id_token%2C%20code%C2%A0token%2C%20or%20code%C2%A0id_token%C2%A0token.
  if (
    includesAll([OIDCResponseType.Code, OIDCResponseType.IdToken]) ||
    includesAll([OIDCResponseType.Code, OIDCResponseType.Token]) ||
    includesAll([
      OIDCResponseType.Code,
      OIDCResponseType.IdToken,
      OIDCResponseType.Token,
    ])
  ) {
    return OIDCFlowType.Hybrid;
  }

  return null;
}

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

  nonce: yup.string().when("response_type", {
    // NOTE: we only require a nonce for the implicit flow
    is: (value: ResponseType) =>
      checkFlowType(decodeURIComponent(value)) === OIDCFlowType.Implicit,
    then: (field) => field.required(ValidationMessage.Required),
  }),

  response_mode: yup
    .string<OIDCResponseMode>()
    .when("response_type", {
      is: OIDCResponseType.Code,
      // REFERENCE: https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html
      then: (schema) => schema.default(OIDCResponseMode.Query),
      otherwise: (schema) => schema.default(OIDCResponseMode.Fragment),
    })
    .test({
      name: "is-valid-response-mode",
      message: "Invalid response mode.",
      test: (value) => {
        if (!value) {
          return true;
        }

        if (!(Object.values(OIDCResponseMode) as string[]).includes(value)) {
          return false;
        }

        return true;
      },
    }),
});

// FIXME: should we add a CSRF token to the request?
export const GET = async (req: NextRequest): Promise<NextResponse> => {
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

  const responseTypes = decodeURIComponent(
    (response_type as string | string[]).toString()
  ).split(" ") as OIDCResponseType[];

  //  REFERENCE: https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#Combinations
  //  REFERENCE: https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#id_token
  //  To prevent access token leakage we also prevent `query` mode when requesting only an access token (OAuth 2.0 flow)
  if (
    response_mode === OIDCResponseMode.Query &&
    (responseTypes.includes(OIDCResponseType.Token) ||
      responseTypes.includes(OIDCResponseType.IdToken))
  ) {
    return errorValidationClient(
      "invalid_request",
      `Invalid response mode: ${response_mode}. For response type ${response_type}, query is not supported for security reasons.`,
      "response_mode",
      req.url
    );
  }

  const params = new URLSearchParams({
    response_type,
    response_mode: response_mode as OIDCResponseMode,
    client_id,
    redirect_uri,
    nonce: nonce || new Date().getTime().toString(), // NOTE: given the nature of our proofs, if a nonce is not passed, we generate one
    // TODO: should enforce one time use for nonces
    ready: "true", // for UX purposes, to avoid users getting to the login page without verifying their request
  });

  if (scope) params.append("scope", scope.toString());
  if (state) params.append("state", state.toString());

  return NextResponse.redirect(
    new URL(`/login?${params.toString()}`, req.url),
    { status: 302 }
  );
};
